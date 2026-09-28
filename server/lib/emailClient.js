/**
 * server/lib/emailClient.js
 *
 * Real server-side client for the Resend REST API, using Node's native
 * fetch() — no SDK dependency, mirroring geminiClient.js's pattern.
 * This module is the ONLY place in the project that reads
 * RESEND_API_KEY or CONTACT_RECEIVER_EMAIL, or talks to Resend.
 *
 * Do not import this from any frontend (src/) code.
 */

const RESEND_API_URL = 'https://api.resend.com/emails';
const DEFAULT_TIMEOUT_MS = 15000;

export class EmailError extends Error {
  constructor(code, message, status = 502) {
    super(message);
    this.name = 'EmailError';
    this.code = code;
    this.status = status;
  }
}

export function friendlyEmailMessage(code) {
  switch (code) {
    case 'MISSING_API_KEY':
      return 'The contact form is not configured yet.';
    case 'TIMEOUT':
      return 'Sending your message timed out. Please try again.';
    case 'NETWORK_ERROR':
      return 'Could not reach the email service. Please try again shortly.';
    case 'EMAIL_HTTP_ERROR':
      return 'The email service returned an error. Please try again shortly.';
    case 'MALFORMED_RESPONSE':
      return 'The email service returned an unexpected response. Please try again.';
    default:
      return 'Your message could not be sent right now.';
  }
}

/**
 * Send the Contact ASTRO message via Resend. Throws EmailError for every
 * failure mode so the route can map it to a structured HTTP response.
 */
export async function sendContactEmail({ name, email, message, submittedAt }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new EmailError('MISSING_API_KEY', 'RESEND_API_KEY is not set on the server.', 500);
  }

  const receiver = process.env.CONTACT_RECEIVER_EMAIL;
  if (!receiver) {
    throw new EmailError('MISSING_API_KEY', 'CONTACT_RECEIVER_EMAIL is not set on the server.', 500);
  }

  // Resend requires the "from" address to be on a domain verified with
  // Resend. onboarding@resend.dev is Resend's own shared sandbox sender,
  // which works without verifying a custom domain — the visitor's real
  // address goes in reply_to instead, so replies still reach them.
  const fromAddress = process.env.CONTACT_FROM_EMAIL || 'ASTRO Contact Form <onboarding@resend.dev>';

  const escapeHtml = (s) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const textBody = `New Contact ASTRO message\n\nName: ${name}\nEmail: ${email}\nSubmitted: ${submittedAt}\n\nMessage:\n${message}`;
  const htmlBody = `<div style="font-family:sans-serif;line-height:1.5">
    <h2>New Contact ASTRO message</h2>
    <p><strong>Name:</strong> ${escapeHtml(name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    <p><strong>Submitted:</strong> ${escapeHtml(submittedAt)}</p>
    <p><strong>Message:</strong></p>
    <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
  </div>`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  let res;
  try {
    res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [receiver],
        reply_to: email,
        subject: `Contact ASTRO: message from ${name}`,
        text: textBody,
        html: htmlBody
      }),
      signal: controller.signal
    });
  } catch (err) {
    if (err && err.name === 'AbortError') {
      throw new EmailError('TIMEOUT', `Resend did not respond within ${DEFAULT_TIMEOUT_MS}ms.`, 504);
    }
    throw new EmailError('NETWORK_ERROR', 'Failed to reach the Resend API.', 502);
  } finally {
    clearTimeout(timeoutId);
  }

  const rawText = await res.text();
  let payload = null;
  try {
    payload = rawText ? JSON.parse(rawText) : {};
  } catch (err) {
    throw new EmailError('MALFORMED_RESPONSE', 'Resend returned a response that was not valid JSON.', 502);
  }

  if (!res.ok) {
    const upstreamMessage = payload && typeof payload.message === 'string' ? payload.message : '(no error body)';
    console.error(`[emailClient] Resend HTTP ${res.status}: ${upstreamMessage}`);
    throw new EmailError('EMAIL_HTTP_ERROR', `Resend API returned HTTP ${res.status}.`, 502);
  }

  if (!payload || !payload.id) {
    throw new EmailError('MALFORMED_RESPONSE', 'Resend did not return a message id.', 502);
  }

  return payload.id;
}
