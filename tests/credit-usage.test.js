const assert = require('assert');
const credits = require('../apps-script/CreditUsage.gs');

assert.strictEqual(credits.INITIAL_FREE_CREDITS, 18);
assert.strictEqual(credits.createCreditRecord().balance, 18);
assert.strictEqual(credits.canGenerate({ role: 'member', plan: 'free' }, { balance: 1 }), true);
assert.strictEqual(credits.canGenerate({ role: 'member', plan: 'free' }, { balance: 0 }), false);
assert.strictEqual(credits.hasUnlimitedCredits({ role: 'admin', plan: 'free' }), true);
assert.strictEqual(credits.hasUnlimitedCredits({ role: 'superadmin', plan: 'free' }), true);
assert.strictEqual(credits.hasUnlimitedCredits({ role: 'member', plan: 'pro' }), true);

const spent = credits.afterSuccessfulGeneration(
  { role: 'member', plan: 'free' },
  { balance: 5, initialAllocation: 18, totalGranted: 2, totalConsumed: 4 }
);
assert.strictEqual(spent.balance, 4);
assert.strictEqual(spent.record.totalConsumed, 5);
assert.strictEqual(spent.record.totalGranted, 2);

const unlimited = credits.afterSuccessfulGeneration({ role: 'pro', plan: 'pro' }, { balance: 7, totalConsumed: 11 });
assert.strictEqual(unlimited.unlimited, true);
assert.strictEqual(unlimited.balance, null);
assert.strictEqual(unlimited.record.balance, 7, 'Pro generation must preserve stored credits');
assert.strictEqual(unlimited.record.totalConsumed, 11, 'Pro generation must not consume stored credits');

assert.throws(
  () => credits.afterSuccessfulGeneration({ role: 'member', plan: 'free' }, { balance: 0 }),
  /No TEACHR Credits remaining/
);

const legacy = [
  { toolId: 'lesson', successfulGenerations: 2, allowance: 3 },
  { toolId: 'worksheet', successfulGenerations: 1, allowance: 3 },
  { toolId: 'quiz', successfulGenerations: 0, allowance: 3 },
  { toolId: 'differentiate', successfulGenerations: 0, allowance: 3 },
  { toolId: 'curriculum', successfulGenerations: 1, allowance: 3 },
  { toolId: 'revision', successfulGenerations: 0, allowance: 3 }
];
assert.strictEqual(credits.remainingFromLegacyUsage(legacy), 14);

const withAdminGrant = legacy.map(record => record.toolId === 'lesson' ? { ...record, allowance: 13 } : record);
assert.strictEqual(credits.remainingFromLegacyUsage(withAdminGrant), 24, 'Legacy admin-granted allowance must survive migration');

assert.strictEqual(credits.creditDocumentPath('abc'), 'users/abc/credits/balance');
assert.strictEqual(credits.creditLedgerPath('abc'), 'users/abc/creditLedger');

console.log('credit-usage tests passed');
