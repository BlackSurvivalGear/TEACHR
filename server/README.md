# TEACHR AI Backend

The backend keeps the provider API key off the client and exposes one endpoint:

`POST /api/generate`

Body:

```json
{"prompt":"Create a Year 8 lesson on fractions."}
```

Response:

```json
{"content":"...","model":"..."}
```

## Start

Node.js 18+ is required.

```bash
AI_API_KEY=replace-me AI_MODEL=your-model node server/index.js
```

On PowerShell:

```powershell
$env:AI_API_KEY="replace-me"
$env:AI_MODEL="your-model"
node server/index.js
```

The backend uses an OpenAI-compatible chat-completions contract by default. Override `AI_BASE_URL` for another compatible provider. Never commit credentials.
