const assert = require('assert');
const pricing = require('../pricing-config.js');

assert.strictEqual(pricing.currency, 'GBP');
assert.deepStrictEqual(pricing.generatingTools, ['lesson','worksheet','quiz','differentiate','curriculum','revision']);
assert.deepStrictEqual(pricing.unlimitedRoles, ['admin','superadmin']);
assert.strictEqual(pricing.chatFreeLifetimeMessages, 10);
assert.deepStrictEqual(pricing.consumptionOrder, ['monthly','starter','purchased']);

const expected = {
  free: [0, 18, 'one-time', 'starter', false, 10, 'lifetime'],
  payg: [250, 10, 'one-time', 'purchased', true, 20, 'top-up'],
  standard: [499, 25, 'month', 'monthly', false, 50, 'month'],
  pro: [999, 55, 'month', 'monthly', false, 100, 'month'],
  premium: [1999, 135, 'month', 'monthly', false, null, 'unlimited']
};

for (const [id, values] of Object.entries(expected)) {
  const plan = pricing.plans[id];
  assert(plan, `missing ${id} plan`);
  assert.deepStrictEqual(
    [plan.pricePence, plan.credits, plan.billing, plan.creditType, plan.rollover, plan.chats, plan.chatBilling],
    values,
    `${id} pricing mismatch`
  );
}

assert(!pricing.unlimitedRoles.includes('pro'), 'Pro must be credit-limited in the new pricing model');
assert(!pricing.unlimitedRoles.includes('standard'), 'Standard must be credit-limited');
assert(!pricing.unlimitedRoles.includes('premium'), 'Premium generation must be credit-limited');
assert.strictEqual(pricing.plans.premium.chatBilling, 'unlimited', 'Premium Ask TEACHR chat must be unlimited');

console.log('TEACHR pricing configuration tests passed.');
