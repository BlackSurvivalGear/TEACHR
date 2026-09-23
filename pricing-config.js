(function initialiseTeachrPricing(root) {
  const plans = Object.freeze({
    free: Object.freeze({
      id: 'free',
      name: 'Free',
      pricePence: 0,
      billing: 'one-time',
      credits: 18,
      creditType: 'starter',
      rollover: false,
      chats: 10,
      chatBilling: 'lifetime'
    }),
    payg: Object.freeze({
      id: 'payg',
      name: 'Pay As You Go',
      pricePence: 250,
      billing: 'one-time',
      credits: 10,
      creditType: 'purchased',
      rollover: true,
      chats: 20,
      chatBilling: 'top-up'
    }),
    standard: Object.freeze({
      id: 'standard',
      name: 'Standard',
      pricePence: 499,
      billing: 'month',
      credits: 25,
      creditType: 'monthly',
      rollover: false,
      chats: 50,
      chatBilling: 'month'
    }),
    pro: Object.freeze({
      id: 'pro',
      name: 'Pro',
      pricePence: 999,
      billing: 'month',
      credits: 55,
      creditType: 'monthly',
      rollover: false,
      chats: 100,
      chatBilling: 'month'
    }),
    premium: Object.freeze({
      id: 'premium',
      name: 'Premium',
      pricePence: 1999,
      billing: 'month',
      credits: 135,
      creditType: 'monthly',
      rollover: false,
      chats: null,
      chatBilling: 'unlimited'
    })
  });

  const generatingTools = Object.freeze(['lesson', 'worksheet', 'quiz', 'differentiate', 'curriculum', 'revision', 'presentation']);
  const unlimitedRoles = Object.freeze(['admin', 'superadmin']);
  const chatFreeLifetimeMessages = 10;

  const api = Object.freeze({
    currency: 'GBP',
    plans,
    generatingTools,
    unlimitedRoles,
    chatFreeLifetimeMessages,
    consumptionOrder: Object.freeze(['monthly', 'starter', 'purchased'])
  });

  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.TEACHR_PRICING = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
