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
  // Legacy server quota coverage remains until the old Node enforcement path is retired.
  const blank = usageModel.createUsageSnapshot({ role: 'member', plan: 'free' }, []);
  for (const toolId of usageModel.GENERATING_TOOL_IDS) {
    assert.equal(blank.tools[toolId].remaining, 3, `${toolId} must start with three legacy free uses`);
  }

  const firebase = serialFirebase({
    'users/user-1': { role: 'member', plan: 'free', accountStatus: 'active' }
  });
  const enforcer = createUsageEnforcer(firebase);

  for (let expectedRemaining = 2; expectedRemaining >= 0; expectedRemaining--) {
    const access = await enforcer.authorise(request(), 'lesson');
    const result = await enforcer.recordSuccess(access);
    assert.deepEqual(result, { unlimited: false, remaining: expectedRemaining });
  }
  await expectCode(enforcer.authorise(request(), 'lesson'), 'FREE_LIMIT_REACHED');
  assert.equal(firebase.records.get('users/user-1/usage/lesson').successfulGenerations, 3);

  const quizAccess = await enforcer.authorise(request(), 'quiz');
  assert.equal(quizAccess.remaining, 3);
  assert.equal(firebase.records.has('users/user-1/usage/quiz'), false);

  const beforeFailureWrites = firebase.writes.length;
  const worksheetAccess = await enforcer.authorise(request(), 'worksheet');
  assert.equal(worksheetAccess.remaining, 3);
  assert.equal(firebase.writes.length, beforeFailureWrites);
  assert.equal(firebase.records.has('users/user-1/usage/worksheet'), false);

  const enforcementSource = fs.readFileSync('server/usage-enforcement.js', 'utf8');
  const serverSource = fs.readFileSync('server/index.js', 'utf8');
  assert.doesNotMatch(enforcementSource, /localStorage|sessionStorage/);
  assert.match(enforcementSource, /users\/\$\{uid\}\/usage\/\$\{toolId\}/);
  assert.match(enforcementSource, /users\/\$\{context\.uid\}\/usage\/\$\{context\.toolId\}/);
  assert.ok(serverSource.indexOf('if(!content)return send') < serverSource.indexOf('usageEnforcer.recordSuccess(access)'));

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

  // Stage 7B production billing model: paid tiers are plans, not privileged roles.
  const billingSource = fs.readFileSync('apps-script/Billing.gs', 'utf8');
  const creditSource = fs.readFileSync('apps-script/CreditUsage.gs', 'utf8');
  assert.match(billingSource, /standard:\{mode:'subscription',pricePence:499,credits:25,chat:50/);
  assert.match(billingSource, /pro:\{mode:'subscription',pricePence:999,credits:55,chat:100/);
  assert.match(billingSource, /premium:\{mode:'subscription',pricePence:1999,credits:135,chat:null/);
  assert.match(billingSource, /role:\{stringValue:'member'\},plan:\{stringValue:plan\}/, 'paid subscriptions must remain member roles and store entitlement in plan');
  assert.match(billingSource, /setBillingProfile_\(record\.uid,'free'/, 'inactive subscriptions must return the billing plan to free');
  assert.match(billingSource, /applyMonthlyRenewal\(record,plan\)/, 'subscription renewal must reset the monthly Credit bucket');
  assert.match(creditSource, /UNLIMITED_ROLES = Object\.freeze\(\['admin', 'superadmin'\]\)/, 'only Admin and Superadmin may bypass generation Credits');
  assert.doesNotMatch(billingSource, /role:\{stringValue:'pro'\}/, 'Pro must not be restored as an unlimited role');

  console.log('Stage 8 quota matrix checks passed.');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
