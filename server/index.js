const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || '127.0.0.1';
const AI_BASE_URL = (process.env.AI_BASE_URL || 'https://api.openai.com/v1/chat/completions').replace(/\/$/, '');
const AI_API_KEY = process.env.AI_API_KEY;
const AI_MODEL = process.env.AI_MODEL || 'gpt-4o-mini';
const ROOT = path.resolve(__dirname, '..');
const MAX_BODY = 100000;

function send(res, status, data, type = 'application/json') {
  res.writeHead(status, { 'Content-Type': `${type}; charset=utf-8`, 'Cache-Control': 'no-store' });
  res.end(type === 'application/json' ? JSON.stringify(data) : data);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; if (body.length > MAX_BODY) { reject(new Error('Request too large')); req.destroy(); } });
    req.on('end', () => { try { resolve(JSON.parse(body || '{}')); } catch { reject(new Error('Invalid JSON')); } });
    req.on('error', reject);
  });
}

async function generate(req, res) {
  if (!AI_API_KEY) return send(res, 503, { error: 'AI backend is not configured. Set AI_API_KEY on the server.' });
  const body = await readBody(req);
  if (typeof body.prompt !== 'string' || !body.prompt.trim()) return send(res, 400, { error: 'prompt is required' });
  if (body.prompt.length > 12000) return send(res, 400, { error: 'prompt is too long' });

  const upstream = await fetch(AI_BASE_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${AI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: AI_MODEL,
      temperature: 0.4,
      messages: [
        { role: 'system', content: 'You are TEACHR, a teacher-first educational planning assistant. Produce accurate, age-appropriate, teacher-ready material. Never invent student personal data, school policy, safeguarding decisions, grades or curriculum requirements. Use clear headings and concise sections. A teacher remains responsible for final review.' },
        { role: 'user', content: body.prompt }
      ]
    })
  });

  const raw = await upstream.text();
  if (!upstream.ok) return send(res, upstream.status, { error: 'AI provider request failed', detail: raw.slice(0, 500) });
  let payload; try { payload = JSON.parse(raw); } catch { return send(res, 502, { error: 'AI provider returned invalid JSON' }); }
  const content = payload?.choices?.[0]?.message?.content;
  if (!content) return send(res, 502, { error: 'AI provider returned no content' });
  return send(res, 200, { content, model: AI_MODEL });
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'POST' && req.url === '/api/generate') return await generate(req, res);
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { error: 'Method not allowed' });

    const requested = decodeURIComponent((req.url || '/').split('?')[0]);
    const relative = requested === '/' ? 'index.html' : requested.replace(/^\/+/, '');
    const filePath = path.resolve(ROOT, relative);
    if (!filePath.startsWith(ROOT + path.sep)) return send(res, 403, { error: 'Forbidden' });
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) return send(res, 404, { error: 'Not found' });
    const ext = path.extname(filePath).toLowerCase();
    const types = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml', '.ico':'image/x-icon' };
    res.writeHead(200, { 'Content-Type': `${types[ext] || 'application/octet-stream'}; charset=utf-8'` });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(filePath).pipe(res);
  } catch (error) { send(res, 500, { error: error.message || 'Server error' }); }
});

server.listen(PORT, HOST, () => console.log(`TEACHR running at http://${HOST}:${PORT}`));
