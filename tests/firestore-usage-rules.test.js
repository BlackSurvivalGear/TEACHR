const assert = require('node:assert/strict');
const fs = require('node:fs');

const rules = fs.readFileSync('firestore.rules', 'utf8');
const usageMatch = rules.match(/match \/usage\/\{toolId\} \{([\s\S]*?)\n\s*\}/);

assert.ok(usageMatch, 'usage subcollection rules must exist');
const usageRules = usageMatch[1];
assert.match(usageRules,/allow read: if signedIn\(\) && \(request\.auth\.uid == uid \|\| isAdmin\(\)\);/,'owners and authorised administrators must be able to read usage');
assert.match(usageRules,/allow create: if isAdmin\(\)/,'only administrators may create production quota records');
assert.match(usageRules,/allow update: if isAdmin\(\)/,'only administrators may adjust production quota records');
assert.match(usageRules,/request\.resource\.data\.successfulGenerations == resource\.data\.successfulGenerations/,'admin adjustments must preserve successful-generation history');
assert.match(usageRules,/request\.resource\.data\.allowance == resource\.data\.successfulGenerations \+ 3/,'reset must grant exactly three fresh generations');
assert.match(usageRules,/request\.resource\.data\.allowance <= resource\.data\.allowance \+ 1000/,'grants must be bounded');
assert.match(rules,/data\.lastAdminAdjustment\.adminUid == request\.auth\.uid/,'audit actor must match the authenticated administrator');
assert.match(rules,/data\.lastAdminAdjustment\.adminEmail == request\.auth\.token\.email/,'audit email must match the authenticated administrator');
assert.match(usageRules,/allow delete: if false;/,'usage records must never be client-deletable');
assert.doesNotMatch(usageRules,/allow (?:create|update): if signedIn\(\) && request\.auth\.uid == uid/,'members must not be able to change their own quota');

console.log('Firestore usage security-rule checks passed.');
