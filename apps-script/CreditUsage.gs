/* Universal TEACHR Credit model. Stage 7B bucketed entitlement foundation. */
(function initialiseCreditUsage(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.TEACHR_CREDIT_USAGE = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createCreditUsageModel() {
  const INITIAL_FREE_CREDITS = 18;
  const CREDIT_SCHEMA_VERSION = 2;
  const GENERATING_TOOL_IDS = Object.freeze(['lesson','worksheet','quiz','differentiate','curriculum','revision','presentation']);
  const LEGACY_GENERATING_TOOL_IDS = Object.freeze(['lesson','worksheet','quiz','differentiate','curriculum','revision']);
  const UNLIMITED_ROLES = Object.freeze(['admin','superadmin']);
  const MONTHLY_PLAN_CREDITS = Object.freeze({ standard: 25, pro: 55, premium: 135 });
  const CONSUMPTION_ORDER = Object.freeze(['monthly', 'starter', 'purchased']);

  const nonNegativeInteger = (value, fallback = 0) => {
    const n = Number(value);
    return Number.isInteger(n) && n >= 0 ? n : fallback;
  };

  function hasUnlimitedCredits(profile = {}) {
    return UNLIMITED_ROLES.includes(profile.role);
  }

  function creditDocumentPath(uid) {
    if (!uid || typeof uid !== 'string') throw new TypeError('A user ID is required');
    return `users/${uid}/credits/balance`;
  }

  function creditLedgerPath(uid) {
    if (!uid || typeof uid !== 'string') throw new TypeError('A user ID is required');
    return `users/${uid}/creditLedger`;
  }

  function createCreditRecord(balance = INITIAL_FREE_CREDITS, options = {}) {
    const hasBuckets = ['monthlyCredits', 'starterCredits', 'purchasedCredits'].some(key => options[key] !== undefined);
    const starterCredits = hasBuckets
      ? nonNegativeInteger(options.starterCredits)
      : nonNegativeInteger(balance, INITIAL_FREE_CREDITS);
    const monthlyCredits = nonNegativeInteger(options.monthlyCredits);
    const purchasedCredits = nonNegativeInteger(options.purchasedCredits);
    const total = monthlyCredits + starterCredits + purchasedCredits;
    return {
      balance: total,
      monthlyCredits,
      starterCredits,
      purchasedCredits,
      initialAllocation: nonNegativeInteger(options.initialAllocation, INITIAL_FREE_CREDITS),
      totalGranted: nonNegativeInteger(options.totalGranted),
      totalConsumed: nonNegativeInteger(options.totalConsumed),
      schemaVersion: CREDIT_SCHEMA_VERSION,
      migrated: options.migrated === true,
      updatedAt: options.updatedAt ?? null
    };
  }

  function normaliseCreditRecord(record) {
    if (!record || typeof record !== 'object') return createCreditRecord();
    const hasBuckets = ['monthlyCredits', 'starterCredits', 'purchasedCredits'].some(key => record[key] !== undefined);
    if (hasBuckets) return createCreditRecord(0, record);
    return createCreditRecord(record.balance, record);
  }

  function remainingFromLegacyUsage(records = []) {
    const byTool = new Map((Array.isArray(records) ? records : [])
      .filter(record => GENERATING_TOOL_IDS.includes(record?.toolId))
      .map(record => [record.toolId, record]));
    return LEGACY_GENERATING_TOOL_IDS.reduce((total, toolId) => {
      const record = byTool.get(toolId) || {};
      const used = nonNegativeInteger(record.successfulGenerations);
      const allowance = nonNegativeInteger(record.allowance, 3);
      return total + Math.max(0, allowance - used);
    }, 0);
  }

  function canGenerate(profile = {}, record = null) {
    return hasUnlimitedCredits(profile) || normaliseCreditRecord(record).balance > 0;
  }

  function afterSuccessfulGeneration(profile = {}, record = null) {
    const credits = normaliseCreditRecord(record);
    if (hasUnlimitedCredits(profile)) return { unlimited: true, balance: null, consumedFrom: null, record: credits };
    if (credits.balance < 1) throw new RangeError('No TEACHR Credits remaining');

    const next = { ...credits };
    const bucket = CONSUMPTION_ORDER.find(name => next[`${name}Credits`] > 0);
    if (!bucket) throw new RangeError('No TEACHR Credits remaining');
    next[`${bucket}Credits`] -= 1;
    next.balance -= 1;
    next.totalConsumed += 1;
    return { unlimited: false, balance: next.balance, consumedFrom: bucket, record: next };
  }

  function applyMonthlyRenewal(profile = {}, record = null, plan = profile.plan) {
    const credits = normaliseCreditRecord(record);
    const allowance = MONTHLY_PLAN_CREDITS[plan];
    if (!allowance) throw new RangeError('A monthly Standard, Pro or Premium plan is required');
    return {
      ...credits,
      monthlyCredits: allowance,
      balance: allowance + credits.starterCredits + credits.purchasedCredits
    };
  }

  function addPurchasedCredits(record = null, amount = 10) {
    const credits = normaliseCreditRecord(record);
    const safeAmount = nonNegativeInteger(amount);
    if (safeAmount < 1) throw new RangeError('Purchased Credit amount must be at least 1');
    return {
      ...credits,
      purchasedCredits: credits.purchasedCredits + safeAmount,
      balance: credits.balance + safeAmount,
      totalGranted: credits.totalGranted + safeAmount
    };
  }

  return Object.freeze({
    INITIAL_FREE_CREDITS,
    CREDIT_SCHEMA_VERSION,
    GENERATING_TOOL_IDS,
    UNLIMITED_ROLES,
    MONTHLY_PLAN_CREDITS,
    CONSUMPTION_ORDER,
    hasUnlimitedCredits,
    creditDocumentPath,
    creditLedgerPath,
    createCreditRecord,
    normaliseCreditRecord,
    remainingFromLegacyUsage,
    canGenerate,
    afterSuccessfulGeneration,
    applyMonthlyRenewal,
    addPurchasedCredits
  });
});
