const assert = require('node:assert/strict');
const fs = require('node:fs');

const ui = fs.readFileSync('usage-ui.js', 'utf8');
const gate = fs.readFileSync('pro-paywall.js', 'utf8');
const upgrade = fs.readFileSync('upgrade.js', 'utf8');

assert.match(ui, /Upgrade to continue/, 'exhausted generate action must become Upgrade to continue');
assert.match(ui, /Pro unlocks unlimited generations across every TEACHR tool/, 'limit message must explain the Pro benefit');
assert.match(ui, /sessionStorage\.setItem\(DRAFT_KEY/, 'completed form must be preserved before upgrade');
assert.match(ui, /sessionStorage\.getItem\(DRAFT_KEY/, 'preserved form must be restored after returning');
assert.match(ui, /Object\.entries\(draft\.values\)/, 'all named form values must be restored');
assert.match(gate, /upgrade\.html\?return=/, 'exhausted tool must carry a safe return target into upgrade');
assert.match(upgrade, /watchForActivation/, 'upgrade page must watch for confirmed subscription activation');
assert.match(upgrade, /getDoc\(doc\(db, 'users', user\.uid\)\)/, 'activation must be confirmed from the authoritative user profile');
assert.match(upgrade, /location\.replace\(returnTo\)/, 'confirmed activation must restore the prior workspace automatically');
assert.match(upgrade, /\^index\\\.html/, 'upgrade return targets must be restricted to TEACHR local index routes');

console.log('Stage 7 upgrade experience checks passed.');
