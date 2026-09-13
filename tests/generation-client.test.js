const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const auth = fs.readFileSync(path.join(root, 'teachr-auth.js'), 'utf8');
const usage = fs.readFileSync(path.join(root, 'usage-service.js'), 'utf8');
const page = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

assert.match(auth, /getIdToken: \(forceRefresh = false\)/, 'auth must expose Firebase ID tokens');
assert.match(app, /Authorization': `Bearer \$\{token\}`/, 'generation requests must authenticate with a bearer token');
assert.match(app, /payload\.usage/, 'the client must consume authoritative server usage');
assert.match(app, /applyGenerationResult/, 'successful generation must update the visible allowance');
assert.match(app, /TEACHR_USAGE\?\.refresh/, 'successful generation must reconcile usage with Firestore');
assert.match(app, /FREE_LIMIT_REACHED/, 'server exhaustion must have a dedicated client path');
assert.doesNotMatch(app, /renderResult\(demoOutput\(data\)/, 'generation failures must not create untracked demo output');
assert.match(usage, /function applyGenerationResult/, 'usage service must accept successful server results');
assert.doesNotMatch(page, /TEACHR_DIRECT_OPENAI_TEST|src="direct-openai\.js"|src="ai-provider\.js"/, 'production page must not enable direct browser AI calls');

console.log('Authenticated generation client checks passed.');
