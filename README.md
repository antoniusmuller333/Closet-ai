# Closet

Scan your wardrobe with your phone camera, then get three outfit picks for today (or tomorrow) built around your local hour-by-hour forecast.

- **Scan**: photograph one piece, a flat lay or an open rail. The AI picks out each item, crops it and tags category, colours, material, warmth (1–5), rain-proofing, dress code and seasons.
- **Today**: live weather (Open-Meteo, no key needed), choose the occasion, add a note, tap *Style me*. Pick a look and log it.
- **Diary**: what you wore. Recently worn pieces are rotated out of suggestions.
- **Settings**: style notes the stylist always reads, °C/°F, backup export/import.

Your closet is stored in the browser on your device (IndexedDB). Add it to your home screen to use it like an app.

## Stack

Next.js 16 · AI SDK 7 via Vercel AI Gateway (`google/gemini-3-flash` by default) · Tailwind 4 · Open-Meteo.

## Environment variables (all optional)

| Name | What it does |
| --- | --- |
| `AI_MODEL` | Any vision-capable AI Gateway model id, e.g. `openai/gpt-5-mini` |
| `APP_PASSCODE` | Locks the AI endpoints. Enter the same code in the app's Settings |
| `AI_GATEWAY_API_KEY` | Only needed outside Vercel (on Vercel, auth is automatic) |

## Run locally

```bash
npm install
vercel env pull   # or set AI_GATEWAY_API_KEY in .env.local
npm run dev
```
