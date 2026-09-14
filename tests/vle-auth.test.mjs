import assert from 'node:assert/strict';
import fs from 'node:fs';
const auth = fs.readFileSync(new URL('../vle-auth.js', import.meta.url), 'utf8');
assert.match(auth, /onAuthStateChanged/);
assert.match(auth, /providerId === 'password'/);
assert.match(auth, /!user\.emailVerified/);
assert.match(auth, /content\.hidden = true/);
assert.match(auth, /content\.hidden = false/);
console.log('VLE auth source checks passed.');