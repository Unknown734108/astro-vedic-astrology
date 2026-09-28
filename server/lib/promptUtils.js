/**
 * server/lib/promptUtils.js
 *
 * Small, dependency-free helpers used by the API routes to safely turn
 * client-supplied fields into text that can go into a Gemini prompt —
 * without trusting the shape or size of what the client sent.
 */

/**
 * Coerce a value to a trimmed string, capped at maxLength. Returns ''
 * for anything that isn't a non-empty string (never throws).
 */
export function safeString(value, maxLength = 500) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (trimmed.length === 0) return '';
  return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
}

/**
 * Turn the client-supplied chartSummary (expected to be a plain object
 * produced by the frontend's own chart computation, but not trusted to
 * be well-formed) into a bounded text block for the prompt. Never
 * throws — falls back to a safe placeholder string instead.
 */
export function safeStringifyChartSummary(chartSummary, maxLength = 4000) {
  if (chartSummary === null || chartSummary === undefined) {
    return '(no chart summary was provided)';
  }
  if (typeof chartSummary === 'string') {
    const trimmed = chartSummary.trim();
    return trimmed.length > 0 ? trimmed.slice(0, maxLength) : '(no chart summary was provided)';
  }
  if (typeof chartSummary !== 'object') {
    return '(no chart summary was provided)';
  }
  try {
    const json = JSON.stringify(chartSummary);
    if (!json || json === '{}') return '(no chart summary was provided)';
    return json.length > maxLength ? `${json.slice(0, maxLength)}…` : json;
  } catch (err) {
    // e.g. circular reference — never let this crash the request
    return '(chart summary could not be read)';
  }
}
