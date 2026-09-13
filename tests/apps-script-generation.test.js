const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const model = fs.readFileSync('generation-usage.js', 'utf8');
assert.equal(fs.readFileSync('apps-script/GenerationUsage.gs', 'utf8'), model, 'Apps Script must use the canonical usage policy');
const wrap = (status, data) => ({ getResponseCode: () => status, getContentText: () => typeof data === 'string' ? data : JSON.stringify(data) });
const fields = value => Object.fromEntries(Object.entries(value).map(([key,v]) => [key, typeof v === 'number' ? { integerValue: String(v) } : typeof v === 'boolean' ? { booleanValue: v } : { stringValue: v }]));
function fixture(profile = { role: 'member' }) {
  const records = new Map([['users/u1', { fields: fields(profile) }]]);
  let calls = 0, commits = 0, conflict = null, duringProvider = null;
  let provider = wrap(200, { choices: [{ message: { content: 'Resource content' } }] });
  let verified = true;
  const sandbox = {
    CONFIG: { FIREBASE_PROJECT_ID: 'teachr-bf740' },
    PropertiesService: { getScriptProperties: () => ({ getProperty: key => ({ AI_API_KEY: 'server-only-key', AI_MODEL: 'server-model' })[key] }) },
    ScriptApp: { getOAuthToken: () => 'google-oauth' },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: text => ({ setMimeType: () => JSON.parse(text) }) },
    UrlFetchApp: { fetch(url, options) {
      const body = options.payload ? JSON.parse(options.payload) : {};
      if (url.includes('accounts:lookup')) return body.idToken === 'valid' ? wrap(200, { users: [{ localId: 'u1', emailVerified: verified }] }) : wrap(400, { error: 'bad token' });
      if (url.includes('api.openai.com')) {
        calls++; assert.equal(options.headers.Authorization, 'Bearer server-only-key'); assert.equal(body.model, 'server-model');
        if (duringProvider) duringProvider();
        if (provider instanceof Error) throw provider;
        return provider;
      }
      assert.equal(options.headers.Authorization, 'Bearer google-oauth');
      if (url.endsWith(':beginTransaction')) return wrap(200, { transaction: 'transaction' });
      if (url.endsWith(':rollback')) return wrap(200, {});
      if (url.endsWith(':commit')) {
        assert.equal(body.transaction, 'transaction');
        if (conflict) { const update = conflict; conflict = null; update(); return wrap(409, {}); }
        commits++;
        for (const write of body.writes) {
          const key = write.update.name.split('/documents/')[1];
          assert.deepEqual(Array.from(write.updateMask.fieldPaths), ['toolId', 'successfulGenerations', 'allowance']);
          records.set(key, { fields: { ...records.get(key)?.fields, ...write.update.fields } });
        }
        return wrap(200, {});
      }
      const key = decodeURIComponent(url.split('/documents/')[1].split('?')[0]);
      return records.has(key) ? wrap(200, records.get(key)) : wrap(404, {});
    } }
  };
  vm.createContext(sandbox);
  vm.runInContext(model + '\n' + fs.readFileSync('apps-script/Generation.gs', 'utf8'), sandbox);
  const request = (changes = {}) => sandbox.doPost({ postData: { contents: JSON.stringify({ action: 'generate', idToken: 'valid', prompt: 'Create a lesson', tool: 'lesson', role: 'superadmin', model: 'untrusted', ...changes }) } });
  return { sandbox, records, request, calls: () => calls, commits: () => commits, provider: value => { provider = value; }, conflict: fn => { conflict = fn; }, duringProvider: fn => { duringProvider = fn; }, unverified: () => { verified = false; } };
}
let f = fixture();
assert.equal(f.sandbox.doPost({ postData: { contents: '{' } }).code, 'INVALID_JSON');
for (const change of [{ idToken: '' }, { idToken: 'bad' }, { prompt: '' }, { prompt: 'a'.repeat(12001) }, { tool: 'library' }, { tool: '../lesson' }, { action: 'other' }]) assert.equal(f.request(change).ok, false);
assert.equal(f.calls(), 0);
for (let remaining = 2; remaining >= 0; remaining--) assert.equal(f.request().usage.remaining, remaining);
assert.equal(f.request().code, 'FREE_LIMIT_REACHED');
assert.equal(f.calls(), 3);
for (const tool of ['worksheet', 'quiz', 'differentiate', 'curriculum', 'revision']) assert.equal(f.request({ tool }).usage.remaining, 2);
for (const profile of [{ role: 'pro' }, { role: 'admin' }, { role: 'superadmin' }, { role: 'member', plan: 'pro' }]) {
  f = fixture(profile);
  for (let i = 0; i < 4; i++) assert.equal(f.request().usage.unlimited, true);
  assert.equal(f.records.has('users/u1/usage/lesson'), false);
}
f = fixture(); f.unverified(); assert.equal(f.request().code, 'EMAIL_NOT_VERIFIED'); assert.equal(f.calls(), 0);
f = fixture({ role: 'member', suspended: true }); assert.equal(f.request().code, 'ACCOUNT_SUSPENDED'); assert.equal(f.calls(), 0);
f = fixture(); f.records.delete('users/u1'); assert.equal(f.request().code, 'PROFILE_REQUIRED');
for (const failure of [new Error('network timeout'), wrap(401, 'private key error'), wrap(200, 'bad JSON'), ...['', ' ', {}, null].map(content => wrap(200, { choices: [{ message: { content } }] }))]) {
  f = fixture(); f.provider(failure); const result = f.request(); assert.equal(result.status, 502); assert.equal(f.commits(), 0); assert.equal(f.records.has('users/u1/usage/lesson'), false); assert.ok(!JSON.stringify(result).includes('private key'));
}
// A concurrent success takes the last slot between transaction read and commit.
f = fixture(); f.records.set('users/u1/usage/lesson', { fields: fields({ successfulGenerations: 2, allowance: 3 }) });
f.conflict(() => f.records.set('users/u1/usage/lesson', { fields: fields({ successfulGenerations: 3, allowance: 3 }) }));
assert.equal(f.request().code, 'FREE_LIMIT_REACHED'); assert.equal(f.commits(), 0); assert.equal(f.calls(), 1);
// Admin allowance change is re-read on retry, retaining audit fields.
f = fixture(); f.conflict(() => f.records.set('users/u1/usage/lesson', { fields: fields({ successfulGenerations: 0, allowance: 6, audit: 'keep' }) }));
assert.equal(f.request().usage.remaining, 5); assert.equal(f.records.get('users/u1/usage/lesson').fields.audit.stringValue, 'keep');
// Subscription revocation during the provider request must restore enforcement.
f = fixture({ role: 'pro' }); f.records.set('users/u1/usage/lesson', { fields: fields({ successfulGenerations: 3, allowance: 3 }) });
f.duringProvider(() => f.records.set('users/u1', { fields: fields({ role: 'member', plan: 'free' }) }));
assert.equal(f.request().code, 'FREE_LIMIT_REACHED'); assert.equal(f.commits(), 0);
console.log('Apps Script generation authentication, failures, roles and transaction tests passed');
