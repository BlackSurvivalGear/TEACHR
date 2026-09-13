const assert = require('node:assert/strict');
const usage = require('../generation-usage.js');

assert.equal(usage.FREE_GENERATIONS_PER_TOOL, 3);
assert.deepEqual(usage.GENERATING_TOOL_IDS, [
  'lesson', 'worksheet', 'quiz', 'differentiate', 'curriculum', 'revision', 'parent'
]);
assert.equal(usage.GENERATING_TOOL_IDS.includes('library'), false);

assert.deepEqual(usage.normaliseUsageRecord('lesson'), {
  toolId: 'lesson', successfulGenerations: 0, allowance: 3, updatedAt: null
});
assert.equal(usage.remainingGenerations('lesson'), 3);
assert.equal(usage.remainingGenerations('lesson', { successfulGenerations: 1 }), 2);
assert.equal(usage.remainingGenerations('lesson', { successfulGenerations: 3 }), 0);
assert.equal(usage.remainingGenerations('lesson', { successfulGenerations: 99 }), 0);

assert.equal(usage.hasUnlimitedGenerations({ role: 'member', plan: 'free' }), false);
assert.equal(usage.hasUnlimitedGenerations({ role: 'member', plan: 'pro' }), true);
assert.equal(usage.hasUnlimitedGenerations({ role: 'pro', plan: 'free' }), true);
assert.equal(usage.hasUnlimitedGenerations({ role: 'admin', plan: 'free' }), true);
assert.equal(usage.hasUnlimitedGenerations({ role: 'superadmin', plan: 'free' }), true);

assert.equal(usage.usageDocumentPath('user-123', 'quiz'), 'users/user-123/usage/quiz');
assert.throws(() => usage.createUsageRecord('library'), /Unknown generating tool/);
assert.throws(() => usage.usageDocumentPath('', 'lesson'), /user ID is required/);

console.log('Generation usage model checks passed.');
