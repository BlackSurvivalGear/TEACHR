const { FREE_GENERATIONS_PER_TOOL, GENERATING_TOOL_IDS, isGeneratingTool, normaliseUsageRecord } = require('../generation-usage.js');

class AdminUsageError extends Error {
  constructor(status, code, message) { super(message); this.name = 'AdminUsageError'; this.status = status; this.code = code; }
}

function bearerToken(req) {
  const match = (req.headers?.authorization || '').match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || '';
}

function createAdminUsageService({ auth, db, serverTimestamp }) {
  if (!auth || !db || typeof serverTimestamp !== 'function') throw new TypeError('Firebase Admin services are required');

  async function requireAdmin(req) {
    const token = bearerToken(req);
    if (!token) throw new AdminUsageError(401, 'AUTH_REQUIRED', 'Administrator sign-in is required');
    let identity;
    try { identity = await auth.verifyIdToken(token); }
    catch { throw new AdminUsageError(401, 'INVALID_TOKEN', 'Administrator session is invalid or expired'); }
    const snapshot = await db.doc(`users/${identity.uid}`).get();
    const profile = snapshot.exists ? snapshot.data() || {} : {};
    const email = String(identity.email || profile.email || '').toLowerCase();
    const role = email === 'admin@lawal.org' ? 'superadmin' : profile.role;
    if (!['admin', 'superadmin'].includes(role)) throw new AdminUsageError(403, 'ADMIN_REQUIRED', 'Administrator access is required');
    return { uid: identity.uid, email, role };
  }

  function selectedTools(tool) {
    if (tool === 'all') return GENERATING_TOOL_IDS;
    if (!isGeneratingTool(tool)) throw new AdminUsageError(400, 'INVALID_TOOL', 'Select a valid generating tool or all tools');
    return [tool];
  }

  async function adjust(req, input = {}) {
    const admin = await requireAdmin(req);
    const targetUid = typeof input.uid === 'string' ? input.uid.trim() : '';
    if (!targetUid) throw new AdminUsageError(400, 'TARGET_REQUIRED', 'A target user is required');
    const action = input.action;
    if (!['add', 'reset'].includes(action)) throw new AdminUsageError(400, 'INVALID_ACTION', 'Action must be add or reset');
    const amount = action === 'add' ? Number(input.amount) : FREE_GENERATIONS_PER_TOOL;
    if (action === 'add' && (!Number.isInteger(amount) || amount < 1 || amount > 1000)) throw new AdminUsageError(400, 'INVALID_AMOUNT', 'Added generations must be an integer from 1 to 1000');
    const tools = selectedTools(input.tool);
    const reason = typeof input.reason === 'string' ? input.reason.trim().slice(0, 240) : '';
    const targetSnapshot = await db.doc(`users/${targetUid}`).get();
    if (!targetSnapshot.exists) throw new AdminUsageError(404, 'TARGET_NOT_FOUND', 'Target user profile was not found');

    const results = {};
    for (const toolId of tools) {
      const usageRef = db.doc(`users/${targetUid}/usage/${toolId}`);
      results[toolId] = await db.runTransaction(async transaction => {
        const snapshot = await transaction.get(usageRef);
        const record = normaliseUsageRecord(toolId, snapshot.exists ? snapshot.data() : null);
        const allowance = action === 'reset' ? record.successfulGenerations + FREE_GENERATIONS_PER_TOOL : record.allowance + amount;
        const audit = { action, amount: action === 'reset' ? FREE_GENERATIONS_PER_TOOL : amount, adminUid: admin.uid, adminEmail: admin.email, reason, at: serverTimestamp() };
        transaction.set(usageRef, { toolId, successfulGenerations: record.successfulGenerations, allowance, updatedAt: serverTimestamp(), lastAdminAdjustment: audit }, { merge: true });
        return { successfulGenerations: record.successfulGenerations, allowance, remaining: Math.max(0, allowance - record.successfulGenerations) };
      });
    }
    return { uid: targetUid, action, tool: input.tool, results };
  }

  return Object.freeze({ requireAdmin, adjust });
}

module.exports = { AdminUsageError, createAdminUsageService };
