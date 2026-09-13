const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const usage = require('../generation-usage.js');

const adjusted = usage.normaliseUsageRecord('lesson', { successfulGenerations: 3, allowance: 8 });
assert.equal(adjusted.successfulGenerations, 3, 'historical successful generations must be preserved');
assert.equal(adjusted.allowance, 8, 'admin-adjusted allowance must be preserved');
assert.equal(usage.remainingGenerations('lesson', adjusted), 5, 'remaining uses must respect adjusted allowance');

const resetAllowance = adjusted.successfulGenerations + usage.FREE_GENERATIONS_PER_TOOL;
assert.equal(resetAllowance, 6, 'reset should grant three fresh uses without deleting history');
assert.equal(resetAllowance - adjusted.successfulGenerations, 3);

const all = usage.GENERATING_TOOL_IDS;
assert.equal(all.length, 7);
assert.deepEqual(all, ['lesson','worksheet','quiz','differentiate','curriculum','revision','parent']);

const service = fs.readFileSync(path.join(__dirname, '../server/admin-usage.js'), 'utf8');
assert.match(service, /\['admin', 'superadmin'\]\.includes\(role\)/, 'quota changes must require admin authority');
assert.match(service, /tool === 'all'/, 'service must support one shared all-tools action');
assert.match(service, /record\.allowance \+ amount/, 'add must increase allowance rather than rewrite successful history');
assert.match(service, /record\.successfulGenerations \+ FREE_GENERATIONS_PER_TOOL/, 'reset must preserve successful history and grant three fresh uses');
assert.match(service, /lastAdminAdjustment/, 'adjustments must retain audit metadata');
assert.match(service, /amount < 1 \|\| amount > 1000/, 'bulk additions must be bounded');
assert.doesNotMatch(service, /successfulGenerations:\s*0/, 'admin reset must not erase generation history');

const enforcement = fs.readFileSync(path.join(__dirname, '../server/usage-enforcement.js'), 'utf8');
assert.match(enforcement, /record\.successfulGenerations\+1/, 'successful generations must increment from history');
assert.match(enforcement, /record\.allowance-successfulGenerations/, 'remaining quota must use the adjusted allowance');

console.log('Admin usage controls Stage 1 tests passed.');
