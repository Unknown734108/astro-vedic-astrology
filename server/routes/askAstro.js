/**
 * POST /api/ask-astro
 *
 * Expected request body (sent by src/App.jsx -> callAstroServerAsk):
 *   { question: string, chartSummary: object, profileName: string }
 *
 * Success response:  { answer: string }
 * Failure response:  non-2xx status + { error: string, message: string }
 *
 * This route validates the request, then calls Gemini server-side via
 * server/lib/geminiClient.js. The chart data in `chartSummary` was
 * already computed by the frontend's astrology engine — this route (and
 * the model) only interpret it; nothing here recalculates positions.
 */
import express from 'express';
import { generateGeminiText, GeminiError, friendlyGeminiMessage } from '../lib/geminiClient.js';
import { safeString, safeStringifyChartSummary } from '../lib/promptUtils.js';

const router = express.Router();

const SYSTEM_INSTRUCTION = `You are ASTRO, a warm, knowledgeable Vedic (Jyotish) astrology companion inside a personal astrology app.

You are given a structured summary of the seeker's natal chart that has already been calculated by the app's own astrology engine (Lagna, Moon, Sun, nakshatra, current Dasha period, and any yogas). Treat these placements as given and accurate. Never recalculate, re-derive, second-guess, or contradict them, and never invent additional planetary positions that are not present in the summary you were given.

Your job is to interpret this chart data in response to the seeker's question, drawing on traditional Vedic astrological principles (signs, nakshatras, houses, dashas, yogas).

Guidelines for every response:
- Be personal and specific to the chart details you were given — reference the actual placements, nakshatra, or dasha period where relevant.
- Write in clear, accessible language a newcomer to Vedic astrology could follow; briefly explain any Sanskrit term you use.
- Be warm, encouraging, and non-fatalistic. Present interpretations as traditional astrological perspectives and possibilities to reflect on — never as guaranteed facts, predictions, or certainties about the seeker's life.
- Never make deterministic or alarming claims about death, serious illness, accidents, or disasters.
- Never guarantee specific outcomes such as wealth, marriage, or career success or failure — describe traditional tendencies or themes instead, and note that real outcomes depend on free will, effort, and many life factors.
- Keep the response focused and conversational (roughly 2-5 short paragraphs), not an exhaustive report.`;

router.post('/', async (req, res) => {
  const { question, chartSummary, profileName } = req.body || {};

  if (!question || typeof question !== 'string' || !question.trim()) {
    return res.status(400).json({
      error: 'INVALID_REQUEST',
      message: 'Request body must include a non-empty "question" string.'
    });
  }

  const safeQuestion = safeString(question, 1000);
  const safeProfileName = safeString(profileName, 100) || 'Seeker';
  const chartContext = safeStringifyChartSummary(chartSummary);

  const userPrompt = `Seeker's name: ${safeProfileName}

Structured natal chart summary (Vedic/sidereal, already computed by the app — do not recalculate or contradict it):
${chartContext}

The seeker asks: "${safeQuestion}"

Respond as ASTRO, grounding your answer in the chart summary above.`;

  try {
    const answer = await generateGeminiText({
      systemInstruction: SYSTEM_INSTRUCTION,
      userPrompt
    });
    return res.status(200).json({ answer });
  } catch (err) {
    if (err instanceof GeminiError) {
      console.error(`[ask-astro] ${err.code}: ${err.message}`);
      return res.status(err.status).json({
        error: err.code,
        message: friendlyGeminiMessage(err.code)
      });
    }
    console.error('[ask-astro] Unexpected error:', err && err.message ? err.message : err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred while contacting the ASTRO AI backend.'
    });
  }
});

export default router;
