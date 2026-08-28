# TEACHR

**Your AI Teaching Assistant**

TEACHR is a teacher-first workspace for planning lessons, creating differentiated resources, generating assessments and organising teaching materials.

## V1.1 — Real AI Teaching Engine

V1.1 upgrades the V1 product shell with a reusable teacher profile, richer lesson/worksheet/assessment inputs, AI-provider integration, local resource management and printable output.

### Teacher features

- Teacher profile: name, subject, year/grade, curriculum and teaching preferences
- Lesson Builder with curriculum and class-profile inputs
- Worksheet Generator with scaffold/challenge intent
- Assessment Generator with configurable question count
- AI generation through a server-side `/api/generate` endpoint
- Safe local demo fallback when the backend is unavailable
- Resource search, duplicate, delete and reload
- Browser-local persistence via `localStorage`
- Print / PDF workflow through the browser print dialog
- Responsive TEACHR 3D-branded interface

### Security boundary

**Never put an AI API key in the GitHub Pages frontend.** The browser calls `/api/generate`; the server holds the provider credential in an environment variable. The included backend is provider-compatible and defaults to an OpenAI-compatible Chat Completions endpoint.

No student personal data should be sent to the demo or development endpoint. Production deployment must add authentication, rate limiting, logging controls and an appropriate data-processing/privacy review before handling sensitive school data.

## Run the static V1.1 UI

Open `index.html` in a modern browser, or use any static HTTP server. GitHub Pages continues to work because the frontend has a deterministic fallback.

## Run the AI backend locally

Requires Node.js 18+.

PowerShell:

```powershell
$env:AI_API_KEY="YOUR_KEY"
$env:AI_MODEL="YOUR_MODEL"
node server/index.js
```

Then open `http://127.0.0.1:8787`.

Optional environment variables:

- `PORT` — default `8787`
- `HOST` — default `127.0.0.1`
- `AI_API_KEY` — provider secret
- `AI_MODEL` — provider model identifier
- `AI_BASE_URL` — OpenAI-compatible chat-completions endpoint

## V1.1 boundary

This phase does **not** yet include student accounts, AI-assisted marking, school-wide knowledge bases, external curriculum APIs, payments or multi-tenant school administration. Those remain later phases so the core generation workflow can be validated first.

## Repository

The production static site is deployed through GitHub Pages from `main`.
