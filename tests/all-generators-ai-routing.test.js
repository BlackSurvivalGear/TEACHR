const fs = require('fs');
const assert = require('assert');

const app = fs.readFileSync('app.js', 'utf8');
const legacyLesson = fs.readFileSync('lesson-builder-v3.js', 'utf8');

const tools = ['lesson', 'worksheet', 'quiz', 'differentiate', 'curriculum', 'revision', 'presentation'];
for (const tool of tools) {
  assert(app.includes(`${tool}: {`), `toolConfig must contain ${tool}`);
  assert(app.includes(`${tool}: '`), `buildPrompt descriptions must contain ${tool}`);
}

assert(app.includes("window.TEACHR_AI.generate({ token, prompt: buildPrompt(data), tool: activeTool })"), 'shared submit path must call TEACHR_AI.generate with activeTool');
assert(app.includes("els.form.addEventListener('submit', handleSubmit)"), 'builder form must use the shared AI submit handler');
assert(!legacyLesson.includes("addEventListener('submit'"), 'lesson V3 must not intercept form submission');
assert(!/['"`]DEMO MODE(?: · LESSON BUILDER V3)?['"`]/.test(legacyLesson), 'lesson V3 must not contain a demo-mode output label');
assert(legacyLesson.includes("submitOwner: 'app.js'"), 'lesson compatibility shim must identify app.js as submit owner');

console.log('all-generators-ai-routing tests passed');