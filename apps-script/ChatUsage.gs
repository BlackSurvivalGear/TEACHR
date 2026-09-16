/* TEACHR AI Chat is separate from universal TEACHR Credits. Free members receive a 10-message account cap; it does not reset daily. */
const TEACHR_CHAT_FREE_MESSAGES = 10;

function chatUsageAccess_(uid, transaction) {
  const suffix = transaction ? '?transaction=' + encodeURIComponent(transaction) : '';
  const profile = generationProfile_(uid, transaction);
  const unlimited = TEACHR_CREDIT_USAGE.hasUnlimitedCredits(profile);
  const usageDoc = generationFirestore_('/users/' + encodeURIComponent(uid) + '/usage/chat' + suffix, 'get', undefined, true);
  const fields = generationFields_(usageDoc);
  const successfulMessages = Number.isInteger(fields.successfulMessages) && fields.successfulMessages >= 0 ? fields.successfulMessages : 0;
  const allowance = Number.isInteger(fields.allowance) && fields.allowance >= 0 ? fields.allowance : TEACHR_CHAT_FREE_MESSAGES;
  const remaining = Math.max(0, allowance - successfulMessages);
  if (!unlimited && remaining === 0) throw generationError_(429, 'CHAT_LIMIT_REACHED', 'Your 10 free TEACHR AI messages are used. Upgrade to Pro to continue.');
  return { unlimited, remaining: unlimited ? null : remaining, successfulMessages, allowance };
}

function recordChatSuccess_(uid) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const transaction = generationFirestore_(':beginTransaction', 'post', {}).transaction;
    if (!transaction) throw generationError_(503, 'USAGE_UNAVAILABLE', 'AI Chat usage could not be recorded.');
    let committed = false;
    try {
      const access = chatUsageAccess_(uid, transaction);
      const writes = access.unlimited ? [] : [{
        update: {
          name: 'projects/' + CONFIG.FIREBASE_PROJECT_ID + '/databases/(default)/documents/users/' + uid + '/usage/chat',
          fields: {
            toolId: { stringValue: 'chat' },
            successfulMessages: { integerValue: String(access.successfulMessages + 1) },
            allowance: { integerValue: String(access.allowance) }
          }
        },
        updateMask: { fieldPaths: ['toolId', 'successfulMessages', 'allowance'] },
        updateTransforms: [{ fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' }]
      }];
      generationFirestore_(':commit', 'post', { transaction, writes });
      committed = true;
      return { unlimited: access.unlimited, allowance: access.unlimited ? null : access.allowance, remaining: access.unlimited ? null : access.remaining - 1 };
    } catch (error) {
      if (!error.retryable || attempt === 2) throw error;
    } finally {
      if (!committed) { try { generationFirestore_(':rollback', 'post', { transaction }); } catch (_) { /* best effort */ } }
    }
  }
}