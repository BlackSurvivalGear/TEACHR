const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || '127.0.0.1';
const AI_API_KEY = process.env.AI_API_KEY;
const AI_MODEL = process.env.AI_MODEL || 'gpt-5.6-luna';
const ROOT = path.resolve(__dirname, '..');
const MAX_BODY = 100000;

const PROVIDERS = {
  openai: {
    name: 'OpenAI',
    modelsUrl: 'https://api.openai.com/v1/models',
    chatUrl: 'https://api.openai.com/v1/chat/completions'
  },
  google: { name: 'Google Gemini' },
  anthropic: { name: 'Anthropic Claude' }
};

function send(res, status, data, type = 'application/json') {
  res.writeHead(status, { 'Content-Type': `${type}; charset=utf-8`, 'Cache-Control': 'no-store' });
  res.end(type === 'application/json' ? JSON.stringify(data) : data);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > MAX_BODY) {
        reject(new Error('Request too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try { resolve(JSON.parse(body || '{}')); }
      catch { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

async function testProvider(req, res) {
  const body = await readBody(req);
  const provider = PROVIDERS[body.provider];
  if (!provider) return send(res, 400, { error: 'Unknown AI provider' });
  if (body.provider !== 'openai') return send(res, 501, { error: `${provider.name} provider is not implemented yet` });

  const apiKey = typeof body.apiKey === 'string' && body.apiKey.trim() ? body.apiKey.trim() : AI_API_KEY;
  if (!apiKey) return send(res, 400, { error: 'API key is required' });

  const upstream = await fetch(provider.modelsUrl, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });
  const raw = await upstream.text();
  if (!upstream.ok) {
    return send(res, upstream.status, { error: 'OpenAI authentication or model request failed', detail: raw.slice(0, 300) });
  }

  let payload;
  try { payload = JSON.parse(raw); }
  catch { return send(res, 502, { error: 'AI provider returned invalid JSON' }); }

  const models = Array.isArray(payload.data) ? payload.data.map(item => item.id).filter(Boolean) : [];
  const requestedModel = typeof body.model === 'string' ? body.model.trim() : '';
  const modelAvailable = !requestedModel || models.includes(requestedModel);
  if (requestedModel && !modelAvailable) {
    return send(res, 400, { error: `Model ${requestedModel} is not available to this API key` });
  }

  return send(res, 200, {
    ok: true,
    provider: provider.name,
    model: requestedModel || null,
    modelAvailable,
    availableModels: models.filter(id => /^gpt-/i.test(id)).slice(0, 100)
  });
}

async function generate(req, res) {
  const body = await readBody(req);
  if (typeof body.prompt !== 'string' || !body.prompt.trim()) return send(res, 400, { error: 'prompt is required' });
  if (body.prompt.length > 12000) return send(res, 400, { error: 'prompt is too long' });

  const apiKey = AI_API_KEY;
  if (!apiKey) return send(res, 503, { error: 'AI backend is not configured. Set AI_API_KEY on the server.' });

  const model = body.model || AI_MODEL;
  const upstream = await fetch(PROVIDERS.openai.chatUrl, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      messages: [
        { role: 'system', content: 'You are TEACHR, a teacher-first educational planning assistant. Produce accurate, age-appropriate, teacher-ready material. Never invent student personal data, school policy, safeguarding decisions, grades or curriculum requirements. Use clear headings and concise sections. A teacher remains responsible for final review.' },
        { role: 'user', content: body.prompt }
      ]
    })
  });
  const raw = await upstream.text();
  if (!upstream.ok) return send(res, upstream.status, { error: 'AI provider request failed', detail: raw.slice(0, 500) });
  let payload;
  try { payload = JSON.parse(raw); }
  catch { return send(res, 502, { error: 'AI provider returned invalid JSON' }); }
  const content = payload?.choices?.[0]?.message?.content;
  if (!content) return send(res, 502, { error: 'AI provider returned no content' });
  return send(res, 200, { content, model });
}

const server = http.createServer(async (req, res) => {
  try {
    const route = (req.url || '').split('?')[0];
    if (req.method === 'POST' && route === '/api/ai/test') return await testProvider(req, res);
    if (req.method === 'POST' && route === '/api/generate') return await generate(req, res);
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { error: 'Method not allowed' });

    const requested = decodeURIComponent(route || '/');
    const relative = requested === '/' ? 'index.html' : requested.replace(/^\/+/, '');
    const filePath = path.resolve(ROOT, relative);
    if (!filePath.startsWith(ROOT + path.sep)) return send(res, 403, { error: 'Forbidden' });
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) return send(res, 404, { error: 'Not found' });

    const ext = path.extname(filePath).toLowerCase();
    const types = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml', '.ico':'image/x-icon' };
    res.writeHead(200, { 'Content-Type': `${types[ext] || 'application/octet-stream'}; charset=utf-8`, 'Cache-Control': 'no-store' });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    send(res, 500, { error: error.message || 'Server error' });
  }
});

server.listen(PORT, HOST, () => console.log(`TEACHR running at http://${HOST}:${PORT}`));
