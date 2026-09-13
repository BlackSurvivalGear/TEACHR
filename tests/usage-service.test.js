const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'usage-service.js'), 'utf8');
const page = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

assert.match(source, /getDocs\(collection\(/, 'usage service must read the usage collection');
assert.match(source, /'users', account\.uid, 'usage'/, 'reads must be scoped to the signed-in user');
assert.doesNotMatch(source, /\b(?:addDoc|deleteDoc|setDoc|updateDoc|writeBatch)\b/, 'the Stage 4 service must remain read-only');
assert.match(source, /teachr:authchange/, 'usage must refresh when authentication state changes');
assert.match(source, /teachr:usagechange/, 'usage state must be published for later UI stages');
assert.match(source, /createState\('error'/, 'read failures must publish an explicit error state');

const modelPosition = page.indexOf('src="generation-usage.js"');
const authPosition = page.indexOf('src="teachr-auth.js"');
const servicePosition = page.indexOf('src="usage-service.js"');
assert.ok(modelPosition >= 0 && modelPosition < authPosition, 'the usage model must load before authentication');
assert.ok(authPosition < servicePosition, 'authentication must load before the usage service');

console.log('Frontend usage service contract checks passed.');
