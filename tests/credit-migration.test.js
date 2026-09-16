const assert = require('assert');
const migration = require('../apps-script/CreditMigration.gs');

const legacy = [
  { toolId: 'lesson', successfulGenerations: 3, allowance: 7 },
  { toolId: 'worksheet', successfulGenerations: 3, allowance: 6 },
  { toolId: 'quiz', successfulGenerations: 1, allowance: 6 },
  { toolId: 'differentiate', successfulGenerations: 1, allowance: 6 },
  { toolId: 'curriculum', successfulGenerations: 1, allowance: 6 },
  { toolId: 'revision', successfulGenerations: 1, allowance: 6 }
];

const result = migration.calculateMigration('member-1', legacy, null, { migratedAt: '2026-09-16T08:00:00Z' });
assert.strictEqual(result.shouldMigrate, true);
assert.strictEqual(result.record.balance, 27, 'Screenshot-equivalent member must retain 27 available generations as Credits');
assert.strictEqual(result.record.totalConsumed, 10);
assert.strictEqual(result.record.totalGranted, 19, 'Admin allowance above the original 18 must be preserved');
assert.strictEqual(result.record.migrated, true);
assert.strictEqual(result.record.migrationVersion, 1);
assert.strictEqual(result.ledgerEntry.amount, 27);

const secondRun = migration.calculateMigration('member-1', legacy, result.record);
assert.strictEqual(secondRun.shouldMigrate, false, 'Migration must be idempotent');
assert.strictEqual(secondRun.reason, 'already-migrated');
assert.strictEqual(secondRun.record.balance, 27, 'A second run must not duplicate Credits');

const unusedNewMember = migration.calculateMigration('member-2', [], null);
assert.strictEqual(unusedNewMember.record.balance, 18, 'Missing legacy documents default to the original 3 x 6 allowance');
assert.strictEqual(unusedNewMember.record.totalGranted, 0);
assert.strictEqual(unusedNewMember.record.totalConsumed, 0);

assert.strictEqual(migration.migrationDocumentPath('abc'), 'users/abc/creditMigrations/v1');
console.log('credit-migration tests passed');
