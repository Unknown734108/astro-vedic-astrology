/**
 * POST /api/contact
 *
 * Expected request body (sent by src/App.jsx's Contact ASTRO form):
 *   { name: string, email: string, message: string, company?: string }
 *
 * `company` is a honeypot field: it's hidden from real visitors via CSS
 * and has no legitimate purpose, so any non-empty value strongly
 * indicates a bot filling every field it can see in the raw HTML.
 *
 * Success response:  { ok: true }
 * Failure response:  non-2xx status + { error: string, message: string }
 */
import express from 'express';
import { sendContactEmail, EmailError, friendlyEmailMessage } from '../lib/emailClient.js';

const router = express.Router();

const NAME_MAX = 100;
const EMAIL_MAX = 254;
const MESSAGE_MAX = 5000;
const MESSAGE_MIN = 10;

// Simple in-memory per-IP rate limit: at most 5 submissions per hour.
// No new dependency, no persistence needed for this scale — resets on
// server restart, which is an acceptable tradeoff for a contact form.
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const submissionLog = new Map(); // ip -> array of timestamps

function isRateLimited(ip) {
  const now = Date.now();
  const timestamps = (submissionLog.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  submissionLog.set(ip, timestamps);
  return timestamps.length >= RATE_LIMIT_MAX;
}
function recordSubmission(ip) {
  const timestamps = submissionLog.get(ip) || [];
  timestamps.push(Date.now());
  submissionLog.set(ip, timestamps);
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/', async (req, res) => {
  const { name, email, message, company } = req.body || {};

  // Honeypot: silently report success to avoid teaching bots the field
  // is being checked, without actually sending anything.
  if (typeof company === 'string' && company.trim().length > 0) {
    return res.status(200).json({ ok: true });
  }

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'INVALID_REQUEST', message: 'Please enter your name.' });
  }
  if (name.trim().length > NAME_MAX) {
    return res.status(400).json({ error: 'INVALID_REQUEST', message: `Name must be ${NAME_MAX} characters or fewer.` });
  }
  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim()) || email.trim().length > EMAIL_MAX) {
    return res.status(400).json({ error: 'INVALID_REQUEST', message: 'Please enter a valid email address.' });
  }
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'INVALID_REQUEST', message: 'Please enter a message.' });
  }
  if (message.trim().length < MESSAGE_MIN) {
    return res.status(400).json({ error: 'INVALID_REQUEST', message: `Message must be at least ${MESSAGE_MIN} characters.` });
  }
  if (message.trim().length > MESSAGE_MAX) {
    return res.status(400).json({ error: 'INVALID_REQUEST', message: `Message must be ${MESSAGE_MAX} characters or fewer.` });
  }

  const ip = req.ip || (req.headers && req.headers['x-forwarded-for']) || 'unknown';
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'RATE_LIMITED', message: 'Too many messages sent recently. Please try again later.' });
  }

  try {
    await sendContactEmail({
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
      submittedAt: new Date().toISOString()
    });
    recordSubmission(ip);
    return res.status(200).json({ ok: true });
  } catch (err) {
    if (err instanceof EmailError) {
      console.error(`[contact] ${err.code}: ${err.message}`);
      return res.status(err.status).json({ error: err.code, message: friendlyEmailMessage(err.code) });
    }
    console.error('[contact] Unexpected error:', err && err.message ? err.message : err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'An unexpected error occurred while sending your message.' });
  }
});

export default router;
