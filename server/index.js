/**
 * server/index.js
 *
 * Express backend for the ASTRO app. Mounts the two routes the frontend
 * calls (POST /api/ask-astro, POST /api/journal/reflection), each of
 * which validates its request and then calls Gemini server-side via
 * server/lib/geminiClient.js (native fetch, GEMINI_API_KEY read from
 * the server environment only).
 *
 * Also serves the built frontend (Vite's `dist/`) as static files, so a
 * single web service (e.g. one Render web service) can host both the
 * UI and the API — no separate frontend host needed. If `dist/` hasn't
 * been built yet (e.g. running `node server/index.js` directly in local
 * dev without `npm run build`), this degrades gracefully: the API
 * routes still work, and a plain message is shown at `/` instead of a
 * crash. In local dev, Vite's own dev server (`npm run dev`) is what
 * you use for the UI — this static serving is for production only.
 */
import 'dotenv/config';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';

import askAstroRouter from './routes/askAstro.js';
import journalReflectionRouter from './routes/journalReflection.js';
import contactRouter from './routes/contact.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, '..', 'dist');
const DIST_EXISTS = fs.existsSync(path.join(DIST_DIR, 'index.html'));

const app = express();
const PORT = process.env.PORT || 8787;

// Render (and most PaaS) terminate TLS at a reverse proxy in front of
// this process; without this, req.ip would be the proxy's address for
// every request, making the contact form's per-IP rate limit useless.
app.set('trust proxy', true);

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'astro-backend' });
});

app.use('/api/ask-astro', askAstroRouter);
app.use('/api/journal/reflection', journalReflectionRouter);
app.use('/api/contact', contactRouter);

if (DIST_EXISTS) {
  app.use(express.static(DIST_DIR));
  // This app has no client-side router (tabs are React state, not URL
  // routes), so a plain catch-all serving index.html for any remaining
  // GET request is correct and sufficient — it only needs to handle a
  // fresh load or a refresh, both of which just need the same shell.
  app.get('*', (req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res
      .status(200)
      .send('ASTRO backend is running, but the frontend has not been built yet. Run "npm run build" to generate dist/, then restart this server.');
  });
}

app.listen(PORT, () => {
  console.log(`ASTRO backend listening on http://localhost:${PORT}${DIST_EXISTS ? ' (serving built frontend from dist/)' : ' (dist/ not found — API only)'}`);
});

