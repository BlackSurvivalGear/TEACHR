# Backend health

The V1.1 backend intentionally has no public health endpoint yet. Validate locally with:

```bash
npm run check
npm start
```

Then open `http://127.0.0.1:8787` and use the AI generator. If no `AI_API_KEY` is configured, TEACHR returns a controlled 503 and the browser uses its deterministic demo fallback.
