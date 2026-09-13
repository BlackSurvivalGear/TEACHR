const assert = require('node:assert/strict');
const fs = require('node:fs');

const rules = fs.readFileSync('firestore.rules', 'utf8');
const usageMatch = rules.match(/match \/usage\/\{toolId\} \{([\s\S]*?)\n\s*\}/);

assert.ok(usageMatch, 'usage subcollection rules must exist');
const usageRules = usageMatch[1];
assert.match(
  usageRules,
  /allow read: if signedIn\(\) && \(request\.auth\.uid == uid \|\| isAdmin\(\)\);/,
  'owners and authorised administrators must be able to read usage'
);
assert.match(
  usageRules,
  /allow create, update, delete: if false;/,
  'all client writes to usage must be denied'
);
assert.doesNotMatch(usageRules, /allow (?:write|create|update|delete): if (?!false)/);

console.log('Firestore usage security-rule checks passed.');
