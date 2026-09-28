/**
 * POST /api/journal/reflection
 *
 * Expected request body (sent by src/App.jsx -> callAstroServerJournalReflection):
 *   { entryTitle: string, entryText: string, chartSummary: object }
 *
 * Success response:  { reflection: string }
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

const SYSTEM_INSTRUCTION = `You are ASTRO, a reflective Vedic astrology journaling companion inside a personal astrology app.

You are given a journal entry the seeker wrote (a title and body text) along with a structured summary of their natal chart context that has already been calculated by the app's own astrology engine. Treat the chart context as given and accurate — never recalculate, re-derive, or invent placements that are not present in the summary.

Your job is to offer a short, thoughtful reflection that connects themes in the journal entry to the chart context provided, in the spirit of traditional Vedic astrology.

Guidelines for every response:
- Do not diagnose, psychoanalyze, or make clinical claims about the seeker's mental or physical health. You are offering a reflective, astrological lens on their own words — not an assessment of them.
- Be warm, validating, and non-fatalistic. Frame any astrological connection as a traditional interpretive possibility, not a certain fact about their life.
- Never make deterministic or alarming claims about death, serious illness, accidents, or disasters.
- Never guarantee specific outcomes such as wealth, marriage, or career success or failure.
- Keep the reflection concise (roughly 2-4 short paragraphs).`;

router.post('/', async (req, res) => {
  const { entryTitle, entryText, chartSummary } = req.body || {};

  if (!entryText || typeof entryText !== 'string' || !entryText.trim()) {
    return res.status(400).json({
      error: 'INVALID_REQUEST',
      message: 'Request body must include a non-empty "entryText" string.'
    });
  }

  const safeTitle = safeString(entryTitle, 200) || 'Untitled Reflection';
  const safeEntryText = safeString(entryText, 4000);
  const chartContext = safeStringifyChartSummary(chartSummary);

  const userPrompt = `Journal entry title: ${safeTitle}

Journal entry text:
"""
${safeEntryText}
"""

Structured natal chart context (Vedic/sidereal, already computed by the app — do not recalculate or contradict it):
${chartContext}

Offer a short reflection as ASTRO, connecting the journal entry to the chart context above.`;

  try {
    const reflection = await generateGeminiText({
      systemInstruction: SYSTEM_INSTRUCTION,
      userPrompt
    });
    return res.status(200).json({ reflection });
  } catch (err) {
    if (err instanceof GeminiError) {
      console.error(`[journal/reflection] ${err.code}: ${err.message}`);
      return res.status(err.status).json({
        error: err.code,
        message: friendlyGeminiMessage(err.code)
      });
    }
    console.error('[journal/reflection] Unexpected error:', err && err.message ? err.message : err);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred while contacting the ASTRO AI backend.'
    });
  }
});

export default router;
