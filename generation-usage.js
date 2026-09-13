/* Canonical TEACHR generation-usage model shared by backend and UI. */
(function initialiseGenerationUsage(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.TEACHR_GENERATION_USAGE = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createGenerationUsageModel() {
  const FREE_GENERATIONS_PER_TOOL = 3;
  const GENERATING_TOOL_IDS = Object.freeze(['lesson','worksheet','quiz','differentiate','curriculum','revision','parent']);
  const UNLIMITED_ROLES = Object.freeze(['pro', 'admin', 'superadmin']);
  const nonNegativeInteger = (value, fallback = 0) => { const n = Number(value); return Number.isInteger(n) && n >= 0 ? n : fallback; };
  function isGeneratingTool(toolId) { return GENERATING_TOOL_IDS.includes(toolId); }
  function assertGeneratingTool(toolId) { if (!isGeneratingTool(toolId)) throw new TypeError(`Unknown generating tool: ${toolId}`); }
  function createUsageRecord(toolId, successfulGenerations = 0, updatedAt = null, allowance = FREE_GENERATIONS_PER_TOOL) {
    assertGeneratingTool(toolId);
    return { toolId, successfulGenerations: nonNegativeInteger(successfulGenerations), allowance: nonNegativeInteger(allowance, FREE_GENERATIONS_PER_TOOL), updatedAt };
  }
  function normaliseUsageRecord(toolId, record) { return createUsageRecord(toolId, record?.successfulGenerations, record?.updatedAt ?? null, record?.allowance); }
  function remainingGenerations(toolId, record) { const usage = normaliseUsageRecord(toolId, record); return Math.max(0, usage.allowance - usage.successfulGenerations); }
  function hasUnlimitedGenerations(profile = {}) { return profile.plan === 'pro' || UNLIMITED_ROLES.includes(profile.role); }
  function usageDocumentPath(uid, toolId) { if (!uid || typeof uid !== 'string') throw new TypeError('A user ID is required'); assertGeneratingTool(toolId); return `users/${uid}/usage/${toolId}`; }
  function createUsageSnapshot(profile = {}, records = []) {
    const unlimited = hasUnlimitedGenerations(profile);
    const recordsByTool = new Map((Array.isArray(records) ? records : []).filter(record => isGeneratingTool(record?.toolId)).map(record => [record.toolId, record]));
    const tools = Object.fromEntries(GENERATING_TOOL_IDS.map(toolId => { const record = normaliseUsageRecord(toolId, recordsByTool.get(toolId)); return [toolId, { successfulGenerations: record.successfulGenerations, allowance: record.allowance, remaining: unlimited ? null : remainingGenerations(toolId, record) }]; }));
    return { unlimited, tools };
  }
  return Object.freeze({ FREE_GENERATIONS_PER_TOOL, GENERATING_TOOL_IDS, UNLIMITED_ROLES, createUsageRecord, createUsageSnapshot, hasUnlimitedGenerations, isGeneratingTool, normaliseUsageRecord, remainingGenerations, usageDocumentPath });
});
