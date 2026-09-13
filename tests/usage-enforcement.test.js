const assert = require('node:assert/strict');
const { GenerationAccessError, createUsageEnforcer } = require('../server/usage-enforcement.js');

function snapshot(value) {
  return { exists: value !== undefined, data: () => value };
}

function fakeFirebase(seed = {}) {
  const records = new Map(Object.entries(seed));
  const writes = [];
  const ref = path => ({ path, get: async () => snapshot(records.get(path)) });
  const db = {
    doc: ref,
    runTransaction: async callback => callback({
      get: async document => snapshot(records.get(document.path)),
      set: (document, value, options) => {
        const next = options?.merge ? { ...(records.get(document.path) || {}), ...value } : value;
        records.set(document.path, next);
        writes.push({ path: document.path, value: next });
      }
    })
  };
  const auth = {
    verifyIdToken: async token => {
      if (token === 'valid-token') return { uid: 'user-1' };
      throw new Error('invalid token');
    }
  };
  return { auth, db, records, writes, serverTimestamp: () => 'SERVER_TIMESTAMP' };
}

function request(token) {
  return { headers: token ? { authorization: `Bearer ${token}` } : {} };
}

async function expectAccessError(promise, status, code) {
  await assert.rejects(promise, error => {
    assert.ok(error instanceof GenerationAccessError);
    assert.equal(error.status, status);
    assert.equal(error.code, code);
    return true;
  });
}

(async () => {
  const memberFirebase = fakeFirebase({
    'users/user-1': { role: 'member', plan: 'free', accountStatus: 'active' }
  });
  const member = createUsageEnforcer(memberFirebase);

  await expectAccessError(member.authorise(request(), 'lesson'), 401, 'AUTH_REQUIRED');
  await expectAccessError(member.authorise(request('bad-token'), 'lesson'), 401, 'INVALID_TOKEN');
  await expectAccessError(member.authorise(request('valid-token'), 'library'), 400, 'INVALID_TOOL');

  const access = await member.authorise(request('valid-token'), 'lesson');
  assert.deepEqual(access, { uid: 'user-1', toolId: 'lesson', unlimited: false, remaining: 3 });
  assert.equal(memberFirebase.writes.length, 0, 'authorisation alone must not consume usage');
  const usage = await member.recordSuccess(access);
  assert.deepEqual(usage, { unlimited: false, remaining: 2 });
  assert.deepEqual(memberFirebase.records.get('users/user-1/usage/lesson'), {
    toolId: 'lesson', successfulGenerations: 1, allowance: 3, updatedAt: 'SERVER_TIMESTAMP'
  });

  memberFirebase.records.set('users/user-1/usage/lesson', { successfulGenerations: 3, allowance: 3 });
  await expectAccessError(member.authorise(request('valid-token'), 'lesson'), 429, 'FREE_LIMIT_REACHED');
  await expectAccessError(member.recordSuccess(access), 429, 'FREE_LIMIT_REACHED');

  const proFirebase = fakeFirebase({
    'users/user-1': { role: 'member', plan: 'pro', accountStatus: 'active' }
  });
  const pro = createUsageEnforcer(proFirebase);
  const proAccess = await pro.authorise(request('valid-token'), 'quiz');
  assert.equal(proAccess.unlimited, true);
  assert.deepEqual(await pro.recordSuccess(proAccess), { unlimited: true, remaining: null });
  assert.equal(proFirebase.writes.length, 0);

  const suspendedFirebase = fakeFirebase({
    'users/user-1': { role: 'member', plan: 'free', suspended: true }
  });
  const suspended = createUsageEnforcer(suspendedFirebase);
  await expectAccessError(suspended.authorise(request('valid-token'), 'revision'), 403, 'ACCOUNT_SUSPENDED');

  console.log('Server usage enforcement checks passed.');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
