# TEACHR AI Backend

The backend keeps the provider API key off the client and exposes one endpoint:

`POST /api/generate`

Body:

```json
{"prompt":"Create a Year 8 lesson on fractions.","tool":"lesson"}
```

Response:

```json
{"content":"...","model":"...","usage":{"unlimited":false,"remaining":2}}
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

Every request must include `Authorization: Bearer <Firebase ID token>`. The backend verifies the token with Firebase Admin, reads the member profile, and atomically records successful free usage at `users/{uid}/usage/{toolId}`. Free Members receive three successful generations per generating tool. Pro, Admin and Superadmin accounts are unlimited.

Use Application Default Credentials in managed hosting. For other environments, set `FIREBASE_SERVICE_ACCOUNT_JSON` to the service-account JSON encoded on one line. Never commit credentials.

The backend uses an OpenAI-compatible chat-completions contract by default. Override `AI_BASE_URL` for another compatible provider.
