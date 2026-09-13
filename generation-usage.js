/* Canonical TEACHR generation-usage model shared by later backend and UI stages. */
(function initialiseGenerationUsage(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.TEACHR_GENERATION_USAGE = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createGenerationUsageModel() {
  const FREE_GENERATIONS_PER_TOOL = 3;
  const GENERATING_TOOL_IDS = Object.freeze([
    'lesson',
    'worksheet',
    'quiz',
    'differentiate',
    'curriculum',
    'revision',
    'parent'
  ]);
  const UNLIMITED_ROLES = Object.freeze(['pro', 'admin', 'superadmin']);

  function isGeneratingTool(toolId) {
    return GENERATING_TOOL_IDS.includes(toolId);
  }

  function assertGeneratingTool(toolId) {
    if (!isGeneratingTool(toolId)) throw new TypeError(`Unknown generating tool: ${toolId}`);
  }

  function successfulGenerationCount(value) {
    const count = Number(value);
    return Number.isInteger(count) && count > 0 ? count : 0;
  }

  function createUsageRecord(toolId, successfulGenerations = 0, updatedAt = null) {
    assertGeneratingTool(toolId);
    return {
      toolId,
      successfulGenerations: successfulGenerationCount(successfulGenerations),
      allowance: FREE_GENERATIONS_PER_TOOL,
      updatedAt
    };
  }

  function normaliseUsageRecord(toolId, record) {
    return createUsageRecord(toolId, record?.successfulGenerations, record?.updatedAt ?? null);
  }

  function remainingGenerations(toolId, record) {
    const usage = normaliseUsageRecord(toolId, record);
    return Math.max(0, usage.allowance - usage.successfulGenerations);
  }

  function hasUnlimitedGenerations(profile = {}) {
    return profile.plan === 'pro' || UNLIMITED_ROLES.includes(profile.role);
  }

  function usageDocumentPath(uid, toolId) {
    if (!uid || typeof uid !== 'string') throw new TypeError('A user ID is required');
    assertGeneratingTool(toolId);
    return `users/${uid}/usage/${toolId}`;
  }

  return Object.freeze({
    FREE_GENERATIONS_PER_TOOL,
    GENERATING_TOOL_IDS,
    UNLIMITED_ROLES,
    createUsageRecord,
    hasUnlimitedGenerations,
    isGeneratingTool,
    normaliseUsageRecord,
    remainingGenerations,
    usageDocumentPath
  });
});
