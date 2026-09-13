const fs = require('fs');
const assert = require('assert');

const client = fs.readFileSync('generation-client.js', 'utf8');
const objectiveUi = fs.readFileSync('curriculum-objective-ui.js', 'utf8');

assert(client.includes("const context = includeCurriculum ? curriculumContext(currentInputs()) : ''"), 'generation must resolve curriculum context from the current form selection when curriculum context is enabled');
assert(client.includes('includeCurriculum = tool !== \'chat\''), 'chat must remain excluded from curriculum context until Stage 3');
assert(client.includes('The selected subject, year and topic override unrelated profile defaults or stale form context.'), 'prompt must prioritize current curriculum selection');
assert(client.includes("if (tool === 'lesson' || tool === 'chat') return String(prompt || '').trim();"), 'lesson and chat prompts must not inherit unrelated lesson-design stripping');
assert(client.includes("replace(/\\n?\\[TEACHR LESSON DESIGN\\]"), 'non-lesson tools must strip lesson-design context');
assert(objectiveUi.includes('if (selectionKey && nextKey !== selectionKey) clearAutoObjective()'), 'changing curriculum selection must clear the prior auto objective');
assert(objectiveUi.includes("resolved.alignmentLevel === 'verified-objective'"), 'auto objective must be limited to verified objective matches');
assert(objectiveUi.includes('setAutoObjective(objectives[0].summary)'), 'verified curriculum objective may populate an empty teacher objective');

console.log('curriculum-context-isolation tests passed');
