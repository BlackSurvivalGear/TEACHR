const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const ui = fs.readFileSync(path.join(root, 'usage-ui.js'), 'utf8');
const gate = fs.readFileSync(path.join(root, 'pro-paywall.js'), 'utf8');
const page = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

assert.match(ui, /teachr:usagechange/, 'UI must respond to usage service updates');
assert.match(ui, /of \$\{usage\.allowance\} free left/, 'tool cards must display remaining allowance');
assert.match(ui, /Unlimited generations with Pro TEACHR/, 'Pro accounts must display unlimited status');
assert.match(ui, /usage-exhausted/, 'exhausted tools must receive a distinct state');
assert.match(ui, /aria-live/, 'usage status updates must be announced accessibly');
assert.match(gate, /remaining > 0/, 'free members with allowance must be permitted to submit');
assert.match(gate, /upgrade\.html/, 'exhausted members must be guided to upgrade');

const modelPosition = page.indexOf('src="generation-usage.js"');
const uiPosition = page.indexOf('src="usage-ui.js"');
assert.ok(modelPosition >= 0 && modelPosition < uiPosition, 'the canonical usage model must load before the UI');

console.log('Generation usage UI contract checks passed.');
