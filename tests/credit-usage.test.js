const assert = require('assert');
const credits = require('../apps-script/CreditUsage.gs');

assert.strictEqual(credits.INITIAL_FREE_CREDITS, 18);
assert.strictEqual(credits.CREDIT_SCHEMA_VERSION, 2);
assert.deepStrictEqual(credits.UNLIMITED_ROLES, ['admin','superadmin']);
assert.deepStrictEqual(credits.MONTHLY_PLAN_CREDITS, { standard: 25, pro: 55, premium: 135 });
assert.deepStrictEqual(credits.CONSUMPTION_ORDER, ['monthly','starter','purchased']);

const fresh = credits.createCreditRecord();
assert.strictEqual(fresh.balance, 18);
assert.strictEqual(fresh.monthlyCredits, 0);
assert.strictEqual(fresh.starterCredits, 18);
assert.strictEqual(fresh.purchasedCredits, 0);

assert.strictEqual(credits.canGenerate({ role: 'member', plan: 'free' }, { balance: 1 }), true);
assert.strictEqual(credits.canGenerate({ role: 'member', plan: 'free' }, { balance: 0 }), false);
assert.strictEqual(credits.hasUnlimitedCredits({ role: 'admin', plan: 'free' }), true);
assert.strictEqual(credits.hasUnlimitedCredits({ role: 'superadmin', plan: 'free' }), true);
assert.strictEqual(credits.hasUnlimitedCredits({ role: 'member', plan: 'pro' }), false);

const monthlyFirst = credits.afterSuccessfulGeneration(
  { role: 'member', plan: 'pro' },
  { monthlyCredits: 2, starterCredits: 3, purchasedCredits: 4, totalConsumed: 0 }
);
assert.strictEqual(monthlyFirst.consumedFrom, 'monthly');
assert.deepStrictEqual(
  [monthlyFirst.record.monthlyCredits, monthlyFirst.record.starterCredits, monthlyFirst.record.purchasedCredits, monthlyFirst.balance],
  [1, 3, 4, 8]
);

const starterSecond = credits.afterSuccessfulGeneration(
  { role: 'member', plan: 'standard' },
  { monthlyCredits: 0, starterCredits: 3, purchasedCredits: 4, totalConsumed: 2 }
);
assert.strictEqual(starterSecond.consumedFrom, 'starter');
assert.deepStrictEqual(
  [starterSecond.record.monthlyCredits, starterSecond.record.starterCredits, starterSecond.record.purchasedCredits, starterSecond.balance],
  [0, 2, 4, 6]
);

const purchasedLast = credits.afterSuccessfulGeneration(
  { role: 'member', plan: 'free' },
  { monthlyCredits: 0, starterCredits: 0, purchasedCredits: 4, totalConsumed: 3 }
);
assert.strictEqual(purchasedLast.consumedFrom, 'purchased');
assert.strictEqual(purchasedLast.record.purchasedCredits, 3);
assert.strictEqual(purchasedLast.balance, 3);

const unlimited = credits.afterSuccessfulGeneration({ role: 'admin', plan: 'free' }, { monthlyCredits: 7, starterCredits: 2, purchasedCredits: 1, totalConsumed: 11 });
assert.strictEqual(unlimited.unlimited, true);
assert.strictEqual(unlimited.balance, null);
assert.strictEqual(unlimited.record.balance, 10);
assert.strictEqual(unlimited.record.totalConsumed, 11);

const standardRenewal = credits.applyMonthlyRenewal(
  { role: 'member', plan: 'standard' },
  { monthlyCredits: 4, starterCredits: 7, purchasedCredits: 10, totalConsumed: 9 }
);
assert.strictEqual(standardRenewal.monthlyCredits, 25, 'Standard renewal resets monthly Credits to 25');
assert.strictEqual(standardRenewal.starterCredits, 7, 'Starter Credits survive monthly renewal');
assert.strictEqual(standardRenewal.purchasedCredits, 10, 'Purchased Credits survive monthly renewal');
assert.strictEqual(standardRenewal.balance, 42);

const proRenewal = credits.applyMonthlyRenewal({ plan: 'pro' }, { monthlyCredits: 1, starterCredits: 0, purchasedCredits: 2 });
assert.strictEqual(proRenewal.monthlyCredits, 55);
assert.strictEqual(proRenewal.balance, 57);

const premiumRenewal = credits.applyMonthlyRenewal({ plan: 'premium' }, { monthlyCredits: 99, starterCredits: 0, purchasedCredits: 0 });
assert.strictEqual(premiumRenewal.monthlyCredits, 135);
assert.strictEqual(premiumRenewal.balance, 135);

const toppedUp = credits.addPurchasedCredits({ monthlyCredits: 5, starterCredits: 2, purchasedCredits: 3, totalGranted: 4 }, 10);
assert.strictEqual(toppedUp.monthlyCredits, 5);
assert.strictEqual(toppedUp.starterCredits, 2);
assert.strictEqual(toppedUp.purchasedCredits, 13);
assert.strictEqual(toppedUp.balance, 20);
assert.strictEqual(toppedUp.totalGranted, 14);

assert.throws(
  () => credits.afterSuccessfulGeneration({ role: 'member', plan: 'free' }, { monthlyCredits: 0, starterCredits: 0, purchasedCredits: 0 }),
  /No TEACHR Credits remaining/
);
assert.throws(() => credits.applyMonthlyRenewal({ plan: 'free' }, fresh), /monthly Standard, Pro or Premium/);
assert.throws(() => credits.addPurchasedCredits(fresh, 0), /at least 1/);

const legacy = [
  { toolId: 'lesson', successfulGenerations: 2, allowance: 3 },
  { toolId: 'worksheet', successfulGenerations: 1, allowance: 3 },
  { toolId: 'quiz', successfulGenerations: 0, allowance: 3 },
  { toolId: 'differentiate', successfulGenerations: 0, allowance: 3 },
  { toolId: 'curriculum', successfulGenerations: 1, allowance: 3 },
  { toolId: 'revision', successfulGenerations: 0, allowance: 3 }
];
assert.strictEqual(credits.remainingFromLegacyUsage(legacy), 14);
assert.strictEqual(credits.creditDocumentPath('abc'), 'users/abc/credits/balance');
assert.strictEqual(credits.creditLedgerPath('abc'), 'users/abc/creditLedger');

console.log('credit-usage tests passed');
