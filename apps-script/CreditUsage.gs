/* Universal TEACHR Credit model. Stage 2 foundation: not yet wired into live generation enforcement. */
(function initialiseCreditUsage(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.TEACHR_CREDIT_USAGE = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createCreditUsageModel() {
  const INITIAL_FREE_CREDITS = 18;
  const CREDIT_SCHEMA_VERSION = 1;
  const GENERATING_TOOL_IDS = Object.freeze(['lesson','worksheet','quiz','differentiate','curriculum','revision']);
  const UNLIMITED_ROLES = Object.freeze(['pro','admin','superadmin']);

  const nonNegativeInteger = (value, fallback = 0) => {
    const n = Number(value);
    return Number.isInteger(n) && n >= 0 ? n : fallback;
  };

  function hasUnlimitedCredits(profile = {}) {
    return profile.plan === 'pro' || UNLIMITED_ROLES.includes(profile.role);
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
    const safeBalance = nonNegativeInteger(balance, INITIAL_FREE_CREDITS);
    return {
      balance: safeBalance,
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
    return createCreditRecord(record.balance, record);
  }

  function remainingFromLegacyUsage(records = []) {
    const byTool = new Map((Array.isArray(records) ? records : [])
      .filter(record => GENERATING_TOOL_IDS.includes(record?.toolId))
      .map(record => [record.toolId, record]));
    return GENERATING_TOOL_IDS.reduce((total, toolId) => {
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
    if (hasUnlimitedCredits(profile)) return { unlimited: true, balance: null, record: credits };
    if (credits.balance < 1) throw new RangeError('No TEACHR Credits remaining');
    return {
      unlimited: false,
      balance: credits.balance - 1,
      record: { ...credits, balance: credits.balance - 1, totalConsumed: credits.totalConsumed + 1 }
    };
  }

  return Object.freeze({
    INITIAL_FREE_CREDITS,
    CREDIT_SCHEMA_VERSION,
    GENERATING_TOOL_IDS,
    UNLIMITED_ROLES,
    hasUnlimitedCredits,
    creditDocumentPath,
    creditLedgerPath,
    createCreditRecord,
    normaliseCreditRecord,
    remainingFromLegacyUsage,
    canGenerate,
    afterSuccessfulGeneration
  });
});
