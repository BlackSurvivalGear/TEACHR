const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const page = fs.readFileSync('index.html', 'utf8');
assert.ok(!page.includes('src="lesson-builder-v3.js"'), 'legacy demo interceptor must not load');
const nodes = new Map();
function node(id) {
  if (!nodes.has(id)) nodes.set(id, { value: '', innerHTML: '', textContent: '', dataset: {}, listeners: {}, classList: { add() {}, remove() {}, toggle() {} }, addEventListener(type, fn) { this.listeners[type] = fn; }, querySelector() { return null; }, querySelectorAll() { return []; }, scrollIntoView() {} });
  return nodes.get(id);
}
let tool = 'lesson', calls = [], usage = [], fail = false;
const data = { topic: 'Programming', year: 'Year 11', subject: 'Computing', duration: '60 minutes', level: 'Mixed', curriculum: 'England', questionCount: '10', extraInstruction: 'Use Python\n[TEACHR LESSON DESIGN]\nTeacher reflection: LESSON_ONLY' };
node('builderForm').querySelector = () => node('submit');
node('v2Reflection').value = 'PREFILL_MUST_NOT_APPEAR';
const context = { document: { getElementById: node, querySelector: () => ({ dataset: { tool } }), querySelectorAll: () => [] }, localStorage: { getItem: () => null }, setTimeout() {}, clearTimeout() {}, FormData: class { entries() { return Object.entries(data); } }, TEACHR_AUTH: { getIdToken: async () => 'token' }, TEACHR_AI: { generate: async request => { calls.push(request); if (fail) throw new Error('Provider unavailable'); return { content: '# AI answer\nGenerated ' + request.tool, usage: { remaining: 2 } }; } }, TEACHR_USAGE: { applyGenerationResult: (...args) => usage.push(args), refresh() {} } };
context.window = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync('app.js', 'utf8'), context);
vm.runInContext(fs.readFileSync('phase1-output-fixes.js', 'utf8'), context);
(async () => {
  for (tool of ['lesson','worksheet','quiz','differentiate','curriculum','revision']) {
    vm.runInContext(`activeTool = '${tool}'`, context);
    const before = calls.length;
    await node('builderForm').listeners.submit({ preventDefault() {} });
    assert.equal(calls.length, before + 1);
    assert.equal(calls.at(-1).tool, tool);
    assert.equal(calls.at(-1).token, 'token');
    assert.ok(calls.at(-1).prompt.includes('Use Python'));
    assert.equal(calls.at(-1).prompt.includes('Produce a complete teacher-facing lesson'), tool === 'lesson');
    assert.equal(calls.at(-1).prompt.includes('LESSON_ONLY'), tool === 'lesson');
    assert.ok(node('result').innerHTML.includes('AI GENERATED'));
    assert.ok(node('result').innerHTML.includes('Generated ' + tool));
    assert.ok(!node('result').innerHTML.includes('PREFILL_MUST_NOT_APPEAR'));
    assert.equal(usage.at(-1)[0], tool);
    const previous = node('result').innerHTML, usageCount = usage.length;
    fail = true;
    await node('builderForm').listeners.submit({ preventDefault() {} });
    assert.equal(node('result').innerHTML, previous, 'failure must not replace AI output with a demo');
    assert.equal(usage.length, usageCount);
    assert.equal(node('submit').disabled, false);
    fail = false;
  }
  vm.runInContext("activeTool = 'library'", context);
  const before = calls.length;
  await node('builderForm').listeners.submit({ preventDefault() {} });
  assert.equal(calls.length, before);
  console.log('All six Generate paths use AI; failures do not produce examples; Library is non-generating');
})().catch(error => { console.error(error); process.exitCode = 1; });
