/**
 * server/lib/geminiClient.js
 *
 * Real server-side client for the Gemini REST API, using Node's native
 * fetch() — no SDK dependency. This module is the ONLY place in the
 * project that reads GEMINI_API_KEY or talks to Gemini.
 *
 * Do not import this from any frontend (src/) code.
 */

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

// Current (2026) fast general-purpose Gemini text model, per Google's
// official Gemini API reference (generateContent endpoint remains fully
// supported; the newer Interactions API is optional and not required
// for this single-turn, stateless use case).
const DEFAULT_MODEL = 'gemini-3.5-flash';

const DEFAULT_TIMEOUT_MS = 20000;

export class GeminiError extends Error {
  constructor(code, message, status = 502) {
    super(message);
    this.name = 'GeminiError';
    this.code = code;
    this.status = status;
  }
}

/**
 * Map an internal GeminiError code to a message that is safe to send to
 * the browser (never includes upstream error bodies, headers, or the
 * API key).
 */
export function friendlyGeminiMessage(code) {
  switch (code) {
    case 'MISSING_API_KEY':
      return 'The ASTRO AI backend is not configured yet.';
    case 'TIMEOUT':
      return 'The ASTRO AI backend timed out. Please try again.';
    case 'NETWORK_ERROR':
      return 'Could not reach the ASTRO AI backend. Please try again shortly.';
    case 'GEMINI_HTTP_ERROR':
      return 'The ASTRO AI backend returned an error. Please try again shortly.';
    case 'MALFORMED_RESPONSE':
      return 'The ASTRO AI backend returned an unexpected response. Please try again.';
    case 'BLOCKED':
      return 'The ASTRO AI backend could not generate a response for this request.';
    default:
      return 'The ASTRO AI backend could not produce a response right now.';
  }
}

/**
 * Call Gemini's generateContent endpoint with a system instruction + a
 * single user turn, and return the plain-text answer.
 *
 * Throws GeminiError for every failure mode (missing key, timeout,
 * network error, non-2xx HTTP response, malformed/blocked response) so
 * callers can map it to a structured { error, message } HTTP response.
 */
export async function generateGeminiText({ systemInstruction, userPrompt, timeoutMs = DEFAULT_TIMEOUT_MS, model = DEFAULT_MODEL }) {
  // Read the key from the server environment ONLY. Never accepted as a
  // function argument from a route, and never sourced from req.body.
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new GeminiError('MISSING_API_KEY', 'GEMINI_API_KEY is not set on the server.', 500);
  }

  if (!userPrompt || typeof userPrompt !== 'string') {
    throw new GeminiError('INVALID_PROMPT', 'A non-empty user prompt is required.', 500);
  }

  const url = `${GEMINI_API_BASE}/${encodeURIComponent(model)}:generateContent`;

  const requestBody = {
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }]
  };
  if (systemInstruction) {
    requestBody.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Header-based auth (not a ?key= query param) so the key never
        // ends up in access logs or the request URL.
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });
  } catch (err) {
    if (err && err.name === 'AbortError') {
      throw new GeminiError('TIMEOUT', `Gemini API did not respond within ${timeoutMs}ms.`, 504);
    }
    throw new GeminiError('NETWORK_ERROR', 'Failed to reach the Gemini API.', 502);
  } finally {
    clearTimeout(timeoutId);
  }

  const rawText = await res.text();
  let payload = null;
  try {
    payload = rawText ? JSON.parse(rawText) : {};
  } catch (err) {
    throw new GeminiError('MALFORMED_RESPONSE', 'Gemini returned a response that was not valid JSON.', 502);
  }

  if (!res.ok) {
    // Log only status + upstream error code/message text (never headers,
    // never the request we sent, never the API key).
    const upstreamMessage = payload && payload.error && typeof payload.error.message === 'string'
      ? payload.error.message
      : '(no error body)';
    console.error(`[geminiClient] Gemini HTTP ${res.status}: ${upstreamMessage}`);
    throw new GeminiError('GEMINI_HTTP_ERROR', `Gemini API returned HTTP ${res.status}.`, 502);
  }

  if (payload && payload.promptFeedback && payload.promptFeedback.blockReason) {
    throw new GeminiError('BLOCKED', `Gemini blocked the request (${payload.promptFeedback.blockReason}).`, 502);
  }

  const candidate = payload && Array.isArray(payload.candidates) ? payload.candidates[0] : null;
  if (!candidate || candidate.finishReason === 'SAFETY') {
    throw new GeminiError('BLOCKED', 'Gemini did not return a usable candidate for this request.', 502);
  }

  const parts = candidate.content && Array.isArray(candidate.content.parts) ? candidate.content.parts : null;
  const text = parts
    ? parts.map((p) => (p && typeof p.text === 'string' ? p.text : '')).join('').trim()
    : '';

  if (!text) {
    throw new GeminiError('MALFORMED_RESPONSE', 'Gemini returned an empty response.', 502);
  }

  return text;
}
