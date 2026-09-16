const assert = require('assert');
const pricing = require('../pricing-config.js');

assert.strictEqual(pricing.currency, 'GBP');
assert.deepStrictEqual(pricing.generatingTools, ['lesson','worksheet','quiz','differentiate','curriculum','revision']);
assert.deepStrictEqual(pricing.unlimitedRoles, ['admin','superadmin']);
assert.strictEqual(pricing.chatFreeLifetimeMessages, 10);
assert.deepStrictEqual(pricing.consumptionOrder, ['monthly','starter','purchased']);

const expected = {
  free: [0, 18, 'one-time', 'starter', false],
  payg: [250, 10, 'one-time', 'purchased', true],
  standard: [499, 25, 'month', 'monthly', false],
  pro: [999, 55, 'month', 'monthly', false],
  premium: [1999, 135, 'month', 'monthly', false]
};

for (const [id, values] of Object.entries(expected)) {
  const plan = pricing.plans[id];
  assert(plan, `missing ${id} plan`);
  assert.deepStrictEqual(
    [plan.pricePence, plan.credits, plan.billing, plan.creditType, plan.rollover],
    values,
    `${id} pricing mismatch`
  );
}

assert(!pricing.unlimitedRoles.includes('pro'), 'Pro must be credit-limited in the new pricing model');
assert(!pricing.unlimitedRoles.includes('standard'), 'Standard must be credit-limited');
assert(!pricing.unlimitedRoles.includes('premium'), 'Premium must be credit-limited');

console.log('TEACHR pricing configuration tests passed.');
