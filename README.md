# ASTRO — Vedic Astrology App

## Structure
- `src/App.jsx` — main app (UI, state, tabs) — unchanged from the original source
- `src/components/NorthIndianChart.jsx` — birth chart SVG component
- `src/lib/astroEngine.js` — all astrology calculation logic (Dasha, Yogas, Ashtakoota, chart computation, geocoding)
- `server/` — Express backend; `/api/ask-astro` and `/api/journal/reflection` call Gemini server-side via `server/lib/geminiClient.js` (native `fetch`, no SDK)

## Run locally

Install dependencies once:
```
npm install
```

Run frontend + backend together (frontend on :5173, proxies `/api/*` to backend on :8787):
```
npm run dev:all
```

Or run them separately:
```
npm run dev      # Vite dev server (frontend)
npm run server   # Express backend
```

Production build:
```
npm run build
npm start
```
`npm start` runs the real Express server (`server/index.js`), which now also serves the built frontend (`dist/`) as static files — one process serves both the UI and `/api/*`. `npm run preview` (Vite's own preview server) still works for previewing the frontend build alone, but does not serve the API.

## Deployment (Render)
This is a single Node web service — no separate frontend/backend hosts needed.
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Environment variables**: set `GEMINI_API_KEY` in the platform's environment variable settings (never commit it, never put it in frontend code). `PORT` is provided automatically by Render.

## Backend
Copy `.env.example` to `.env` and set `GEMINI_API_KEY` before running the server locally. The key is read only in `server/lib/geminiClient.js` and must never be read from frontend code.
