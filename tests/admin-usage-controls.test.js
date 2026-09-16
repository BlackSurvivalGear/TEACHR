const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const admin = fs.readFileSync(path.join(__dirname, '../admin.js'), 'utf8');
const production = fs.readFileSync(path.join(__dirname, '../admin-production-api.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '../admin.html'), 'utf8');

// Admin UI uses the universal TEACHR Credit balance rather than per-tool quotas.
assert.match(admin, /\/api\/admin\/credits\?uid=/, 'admin must read the universal Credit balance and ledger');
assert.match(admin, /\/api\/admin\/credits\/add/, 'admin must use the add-only Credit endpoint');
assert.match(admin, /amount<1\|\|amount>1000/, 'admin must restrict custom grants to 1–1000 Credits');
assert.match(admin, /reason=.*\.trim\(\)/, 'admin must require a free-text grant reason');
assert.match(admin, /confirm\(/, 'Credit grants must require confirmation');
assert.match(admin, /getIdToken\(\)/, 'admin Credit requests must authenticate with a Firebase ID token');
assert.doesNotMatch(admin, /usage-adjustment|grantAll|resetAll|adjustUsage/, 'legacy per-tool grant/reset controls must be retired');

// Production adapter reads/writes the universal balance and immutable grant ledger.
assert.match(production, /\/api\/admin\/credits/, 'production adapter must expose universal Credit reads');
assert.match(production, /\/api\/admin\/credits\/add/, 'production adapter must expose add-only Credit grants');
assert.match(production, /amount<1\|\|amount>1000/, 'production adapter must enforce the 1–1000 Credit grant range');
assert.match(production, /reason\.length>240/, 'production adapter must enforce the reason length limit');
assert.match(production, /creditLedger/, 'production adapter must write Credit grant history');
assert.match(production, /adminUid/, 'ledger entries must carry administrator identity');
assert.match(production, /adminEmail/, 'ledger entries must carry administrator email when available');
assert.match(production, /balanceAfter/, 'ledger entries must record the resulting balance');
assert.match(production, /documents:commit/, 'balance and ledger writes must use an atomic Firestore commit');
assert.match(production, /Authorization:token/, 'Firestore writes must use the authenticated Firebase ID token');
assert.doesNotMatch(production, /usage-adjustment|action==='reset'|successfulGenerations/, 'legacy per-tool quota mutations must not be exposed');

// Stage 5 admin panel is custom-amount, reason-required, add-only.
assert.match(html, /id="creditAmount"[^>]*min="1"[^>]*max="1000"/, 'Credit amount input must allow custom 1–1000 grants');
assert.match(html, /id="creditReason"[^>]*maxlength="240"[^>]*required/, 'grant reason must be mandatory and capped at 240 characters');
assert.match(html, /id="addCredits"/, 'admin panel must expose Add Credits');
assert.match(html, /\+ Add Credits/, 'add-only action must be clearly labelled');
assert.match(html, /Credits cannot be removed from this panel\./, 'admin panel must state that Credits cannot be removed');
assert.doesNotMatch(html, /id="grantAll"|id="resetAll"|id="bulkAmount"/, 'legacy per-tool/bulk quota controls must be absent');

console.log('Admin universal Credit controls Stage 5 tests passed.');
