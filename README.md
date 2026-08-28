# TEACHR

**Your AI Teaching Assistant**

TEACHR is a teacher-first workspace for planning lessons, creating differentiated resources, generating quizzes and organising teaching materials.

## V1 MVP

The first vertical slice is intentionally lightweight and GitHub Pages compatible:

- Lesson Builder
- Worksheet Generator
- Quiz Generator
- Local Resource Library
- Responsive teacher workspace
- TEACHR 3D visual identity using `LOGO.png`
- Browser-local persistence via `localStorage`

The current generators are **MVP demonstrations** using deterministic templates. No external AI API key or student data is required. The architecture is intentionally simple so the real AI orchestration layer can be introduced without replacing the teacher-facing workflow.

## Run locally

Open `index.html` in a modern browser, or serve the repository with any static HTTP server.

Example:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Product direction

Planned expansion includes curriculum-aware lesson planning, differentiation, assessment generation, AI-assisted marking, revision packs, controlled student tutoring, school knowledge bases and school-level administration.

## Repository

The production site is deployed through GitHub Pages from `main`.
