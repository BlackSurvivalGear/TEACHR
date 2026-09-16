/* Stage 3 — migration from legacy per-tool allowances to universal TEACHR Credits. */
(function initialiseCreditMigration(root, factory) {
  const api = factory(
    typeof module === 'object' && module.exports ? require('./CreditUsage.gs') : root.TEACHR_CREDIT_USAGE
  );
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.TEACHR_CREDIT_MIGRATION = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createCreditMigration(credits) {
  if (!credits) throw new Error('TEACHR CreditUsage model is required');

  const MIGRATION_VERSION = 1;

  function migrationDocumentPath(uid) {
    if (!uid || typeof uid !== 'string') throw new TypeError('A user ID is required');
    return `users/${uid}/creditMigrations/v${MIGRATION_VERSION}`;
  }

  function calculateMigration(uid, legacyUsage = [], existingCreditRecord = null, options = {}) {
    if (!uid || typeof uid !== 'string') throw new TypeError('A user ID is required');
    if (existingCreditRecord?.migrated === true || existingCreditRecord?.migrationVersion >= MIGRATION_VERSION) {
      return { shouldMigrate: false, reason: 'already-migrated', record: credits.normaliseCreditRecord(existingCreditRecord) };
    }

    const balance = credits.remainingFromLegacyUsage(legacyUsage);
    const successfulGenerations = (Array.isArray(legacyUsage) ? legacyUsage : []).reduce((total, record) => {
      if (!credits.GENERATING_TOOL_IDS.includes(record?.toolId)) return total;
      const used = Number(record.successfulGenerations);
      return total + (Number.isInteger(used) && used > 0 ? used : 0);
    }, 0);
    const totalLegacyAllowance = balance + successfulGenerations;
    const grantedAboveBaseline = Math.max(0, totalLegacyAllowance - credits.INITIAL_FREE_CREDITS);

    return {
      shouldMigrate: true,
      reason: 'legacy-usage',
      record: {
        ...credits.createCreditRecord(balance, {
          initialAllocation: credits.INITIAL_FREE_CREDITS,
          totalGranted: grantedAboveBaseline,
          totalConsumed: successfulGenerations,
          migrated: true,
          updatedAt: options.updatedAt ?? null
        }),
        migrationVersion: MIGRATION_VERSION,
        migratedAt: options.migratedAt ?? null,
        legacyAllowanceTotal: totalLegacyAllowance
      },
      ledgerEntry: {
        type: 'migration',
        amount: balance,
        reason: 'Migrated remaining legacy generation allowance to universal TEACHR Credits',
        migrationVersion: MIGRATION_VERSION,
        createdAt: options.migratedAt ?? null
      }
    };
  }

  return Object.freeze({ MIGRATION_VERSION, migrationDocumentPath, calculateMigration });
});
