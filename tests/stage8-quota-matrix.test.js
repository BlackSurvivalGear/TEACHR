const assert = require('node:assert/strict');
const fs = require('node:fs');
const { GenerationAccessError, createUsageEnforcer } = require('../server/usage-enforcement.js');

function snapshot(value) {
  return { exists: value !== undefined, data: () => value };
}

function serialFirebase(seed = {}) {
  const records = new Map(Object.entries(seed));
  const writes = [];
  const ref = path => ({ path, get: async () => snapshot(records.get(path)) });
  let queue = Promise.resolve();
  const db = {
    doc: ref,
    runTransaction: callback => {
      const operation = queue.then(async () => callback({
        get: async document => snapshot(records.get(document.path)),
        set: (document, value, options) => {
          const next = options?.merge ? { ...(records.get(document.path) || {}), ...value } : value;
          records.set(document.path, next);
          writes.push({ path: document.path, value: next });
        }
      }));
      queue = operation.catch(() => {});
      return operation;
    }
  };
  const auth = { verifyIdToken: async token => token === 'valid-token' ? { uid: 'user-1' } : Promise.reject(new Error('invalid token')) };
  return { auth, db, records, writes, serverTimestamp: () => 'SERVER_TIMESTAMP' };
}

function request() { return { headers: { authorization: 'Bearer valid-token' } }; }

async function expectLimit(promise) {
  await assert.rejects(promise, error => error instanceof GenerationAccessError && error.status === 429 && error.code === 'FREE_LIMIT_REACHED');
}

(async () => {
  // New Member starts with three independent uses per generating tool.
  const firebase = serialFirebase({ 'users/user-1': { role: 'member', plan: 'free', accountStatus: 'active' } });
  const enforcer = createUsageEnforcer(firebase);
  const lesson = await enforcer.authorise(request(), 'lesson');
  const worksheet = await enforcer.authorise(request(), 'worksheet');
  assert.equal(lesson.remaining, 3);
  assert.equal(worksheet.remaining, 3);

  // Each successful result consumes exactly one use and the fourth is blocked.
  for (let i = 0; i < 3; i += 1) {
    const access = await enforcer.authorise(request(), 'lesson');
    const usage = await enforcer.recordSuccess(access);
    assert.equal(usage.remaining, 2 - i);
  }
  await expectLimit(enforcer.authorise(request(), 'lesson'));

  // One tool does not reduce another tool's allowance.
  assert.equal((await enforcer.authorise(request(), 'worksheet')).remaining, 3);

  // A failed generation consumes nothing because only recordSuccess mutates usage.
  const beforeFailure = await enforcer.authorise(request(), 'worksheet');
  assert.equal(beforeFailure.remaining, 3);
  const afterFailure = await enforcer.authorise(request(), 'worksheet');
  assert.equal(afterFailure.remaining, 3);

  // Authoritative state is persisted server-side, so another enforcer/device sees the same count.
  const secondDevice = createUsageEnforcer(firebase);
  assert.equal((await secondDevice.authorise(request(), 'lesson')).code, undefined);
  await expectLimit(secondDevice.authorise(request(), 'lesson'));

  // Concurrent requests cannot consume more than the remaining allowance.
  const concurrentFirebase = serialFirebase({
    'users/user-1': { role: 'member', plan: 'free', accountStatus: 'active' },
    'users/user-1/usage/revision': { toolId: 'revision', successfulGenerations: 2, allowance: 3 }
  });
  const concurrent = createUsageEnforcer(concurrentFirebase);
  const [accessA, accessB] = await Promise.all([
    concurrent.authorise(request(), 'revision'),
    concurrent.authorise(request(), 'revision')
  ]);
  const outcomes = await Promise.allSettled([
    concurrent.recordSuccess(accessA),
    concurrent.recordSuccess(accessB)
  ]);
  assert.equal(outcomes.filter(item => item.status === 'fulfilled').length, 1);
  assert.equal(outcomes.filter(item => item.status === 'rejected' && item.reason?.code === 'FREE_LIMIT_REACHED').length, 1);
  assert.equal(concurrentFirebase.records.get('users/user-1/usage/revision').successfulGenerations, 3);

  // Pro, Admin and Superadmin are unlimited and do not mutate usage counters.
  const unlimitedProfiles = [
    { role: 'member', plan: 'pro' },
    { role: 'pro', plan: 'free' },
    { role: 'admin', plan: 'free' },
    { role: 'superadmin', plan: 'free' }
  ];
  for (const profile of unlimitedProfiles) {
    const unlimitedFirebase = serialFirebase({ 'users/user-1': { ...profile, accountStatus: 'active' } });
    const unlimited = createUsageEnforcer(unlimitedFirebase);
    const access = await unlimited.authorise(request(), 'revision');
    assert.equal(access.unlimited, true);
    assert.deepEqual(await unlimited.recordSuccess(access), { unlimited: true, remaining: null });
    assert.equal(unlimitedFirebase.writes.length, 0);
  }

  // Losing Pro access restores free enforcement while preserving historical usage.
  const downgradeFirebase = serialFirebase({
    'users/user-1': { role: 'pro', plan: 'pro', accountStatus: 'active' },
    'users/user-1/usage/curriculum': { toolId: 'curriculum', successfulGenerations: 2, allowance: 3 }
  });
  const downgrade = createUsageEnforcer(downgradeFirebase);
  assert.equal((await downgrade.authorise(request(), 'curriculum')).unlimited, true);
  downgradeFirebase.records.set('users/user-1', { role: 'member', plan: 'free', accountStatus: 'active' });
  const downgradedAccess = await downgrade.authorise(request(), 'curriculum');
  assert.equal(downgradedAccess.unlimited, false);
  assert.equal(downgradedAccess.remaining, 1);
  assert.equal(downgradeFirebase.records.get('users/user-1/usage/curriculum').successfulGenerations, 2);

  // Subscription reconciliation must downgrade both role and plan, without touching usage history.
  const checkoutSource = fs.readFileSync('apps-script/Code.gs', 'utf8');
  assert.match(checkoutSource, /role: \{stringValue: active \? 'pro' : 'member'\}/);
  assert.match(checkoutSource, /plan: \{stringValue: active \? 'pro' : 'free'\}/);
  assert.doesNotMatch(checkoutSource, /usage\/\{toolId\}|successfulGenerations\s*:/);

  console.log('Stage 8 quota matrix checks passed.');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
