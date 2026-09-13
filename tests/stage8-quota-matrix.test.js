const assert = require('node:assert/strict');
const fs = require('node:fs');
const usageModel = require('../generation-usage.js');
const { GenerationAccessError, createUsageEnforcer } = require('../server/usage-enforcement.js');

function snapshot(value) {
  return { exists: value !== undefined, data: () => value };
}

function serialFirebase(seed = {}) {
  const records = new Map(Object.entries(seed));
  const writes = [];
  let chain = Promise.resolve();
  const ref = path => ({ path, get: async () => snapshot(records.get(path)) });
  const db = {
    doc: ref,
    runTransaction(callback) {
      const run = chain.then(async () => {
        const pending = [];
        const result = await callback({
          get: async document => snapshot(records.get(document.path)),
          set(document, value, options) {
            pending.push({ document, value, options });
          }
        });
        for (const { document, value, options } of pending) {
          const next = options?.merge ? { ...(records.get(document.path) || {}), ...value } : value;
          records.set(document.path, next);
          writes.push({ path: document.path, value: next });
        }
        return result;
      });
      chain = run.catch(() => {});
      return run;
    }
  };
  const auth = {
    verifyIdToken: async token => {
      if (token === 'valid-token') return { uid: 'user-1' };
      throw new Error('invalid token');
    }
  };
  return { auth, db, records, writes, serverTimestamp: () => 'SERVER_TIMESTAMP' };
}

function request() {
  return { headers: { authorization: 'Bearer valid-token' } };
}

async function expectCode(promise, code) {
  await assert.rejects(promise, error => error instanceof GenerationAccessError && error.code === code);
}

(async () => {
  // New Member: three independent uses per generating tool.
  const blank = usageModel.createUsageSnapshot({ role: 'member', plan: 'free' }, []);
  for (const toolId of usageModel.GENERATING_TOOL_IDS) {
    assert.equal(blank.tools[toolId].remaining, 3, `${toolId} must start with three free uses`);
  }

  const firebase = serialFirebase({
    'users/user-1': { role: 'member', plan: 'free', accountStatus: 'active' }
  });
  const enforcer = createUsageEnforcer(firebase);

  // Each successful result consumes one use; the fourth is blocked.
  for (let expectedRemaining = 2; expectedRemaining >= 0; expectedRemaining--) {
    const access = await enforcer.authorise(request(), 'lesson');
    const result = await enforcer.recordSuccess(access);
    assert.deepEqual(result, { unlimited: false, remaining: expectedRemaining });
  }
  await expectCode(enforcer.authorise(request(), 'lesson'), 'FREE_LIMIT_REACHED');
  assert.equal(firebase.records.get('users/user-1/usage/lesson').successfulGenerations, 3);

  // Using one tool must not reduce another tool's allowance.
  const quizAccess = await enforcer.authorise(request(), 'quiz');
  assert.equal(quizAccess.remaining, 3);
  assert.equal(firebase.records.has('users/user-1/usage/quiz'), false);

  // Failures consume nothing: authorisation without recordSuccess performs no write.
  const beforeFailureWrites = firebase.writes.length;
  const worksheetAccess = await enforcer.authorise(request(), 'worksheet');
  assert.equal(worksheetAccess.remaining, 3);
  assert.equal(firebase.writes.length, beforeFailureWrites);
  assert.equal(firebase.records.has('users/user-1/usage/worksheet'), false);

  // Quotas are server/Firestore based, not browser-storage based.
  const enforcementSource = fs.readFileSync('server/usage-enforcement.js', 'utf8');
  const serverSource = fs.readFileSync('server/index.js', 'utf8');
  assert.doesNotMatch(enforcementSource, /localStorage|sessionStorage/);
  assert.match(enforcementSource, /users\/\$\{identity\.uid\}\/usage\/\$\{toolId\}/);
  assert.ok(
    serverSource.indexOf('if (!content) return send') < serverSource.indexOf('usageEnforcer.recordSuccess(access)'),
    'usage must only be recorded after valid provider content exists'
  );

  // Concurrent successes cannot exceed the remaining allowance.
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
