const {
  FREE_GENERATIONS_PER_TOOL,
  hasUnlimitedGenerations,
  isGeneratingTool,
  remainingGenerations
} = require('../generation-usage.js');

class GenerationAccessError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'GenerationAccessError';
    this.status = status;
    this.code = code;
  }
}

function bearerToken(req) {
  const header = req.headers?.authorization || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || '';
}

function assertTool(toolId) {
  if (!isGeneratingTool(toolId)) {
    throw new GenerationAccessError(400, 'INVALID_TOOL', 'A valid generating tool is required');
  }
}

function profileFromSnapshot(snapshot) {
  if (!snapshot.exists) {
    throw new GenerationAccessError(403, 'PROFILE_REQUIRED', 'A TEACHR member profile is required');
  }
  const profile = snapshot.data() || {};
  if (profile.suspended || profile.accountStatus === 'suspended') {
    throw new GenerationAccessError(403, 'ACCOUNT_SUSPENDED', 'This TEACHR account is suspended');
  }
  return profile;
}

function createUsageEnforcer({ auth, db, serverTimestamp }) {
  if (!auth || !db || typeof serverTimestamp !== 'function') {
    throw new TypeError('Firebase Admin auth, Firestore and serverTimestamp are required');
  }

  async function authenticate(req) {
    const token = bearerToken(req);
    if (!token) throw new GenerationAccessError(401, 'AUTH_REQUIRED', 'Sign in to generate resources');
    try { return await auth.verifyIdToken(token); }
    catch { throw new GenerationAccessError(401, 'INVALID_TOKEN', 'Your sign-in session is invalid or expired'); }
  }

  async function authorise(req, toolId) {
    assertTool(toolId);
    const identity = await authenticate(req);
    const userRef = db.doc(`users/${identity.uid}`);
    const usageRef = db.doc(`users/${identity.uid}/usage/${toolId}`);
    const [profileSnapshot, usageSnapshot] = await Promise.all([userRef.get(), usageRef.get()]);
    const profile = profileFromSnapshot(profileSnapshot);
    const unlimited = hasUnlimitedGenerations(profile);
    const usageRecord = usageSnapshot.exists ? usageSnapshot.data() : null;
    const remaining = unlimited ? null : remainingGenerations(toolId, usageRecord);
    if (!unlimited && remaining === 0) {
      throw new GenerationAccessError(429, 'FREE_LIMIT_REACHED', `Free ${toolId} generation limit reached`);
    }
    return { uid: identity.uid, toolId, unlimited, remaining };
  }

  async function recordSuccess(context) {
    if (context.unlimited) return { unlimited: true, remaining: null };
    const userRef = db.doc(`users/${context.uid}`);
    const usageRef = db.doc(`users/${context.uid}/usage/${context.toolId}`);
    return db.runTransaction(async transaction => {
      const profileSnapshot = await transaction.get(userRef);
      const usageSnapshot = await transaction.get(usageRef);
      const profile = profileFromSnapshot(profileSnapshot);
      if (hasUnlimitedGenerations(profile)) return { unlimited: true, remaining: null };
      const record = usageSnapshot.exists ? usageSnapshot.data() : null;
      const before = remainingGenerations(context.toolId, record);
      if (before === 0) {
        throw new GenerationAccessError(429, 'FREE_LIMIT_REACHED', `Free ${context.toolId} generation limit reached`);
      }
      const successfulGenerations = FREE_GENERATIONS_PER_TOOL - before + 1;
      transaction.set(usageRef, {
        toolId: context.toolId,
        successfulGenerations,
        allowance: FREE_GENERATIONS_PER_TOOL,
        updatedAt: serverTimestamp()
      }, { merge: true });
      return { unlimited: false, remaining: FREE_GENERATIONS_PER_TOOL - successfulGenerations };
    });
  }

  return Object.freeze({ authenticate, authorise, recordSuccess });
}

module.exports = { GenerationAccessError, bearerToken, createUsageEnforcer };
