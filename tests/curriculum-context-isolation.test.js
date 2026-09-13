const fs = require('fs');
const assert = require('assert');

const client = fs.readFileSync('generation-client.js', 'utf8');
const objectiveUi = fs.readFileSync('curriculum-objective-ui.js', 'utf8');

assert(client.includes('const context = curriculumContext(currentInputs())'), 'generation must resolve curriculum context from the current form selection');
assert(client.includes('The selected subject, year and topic override unrelated profile defaults or stale form context.'), 'prompt must prioritize current curriculum selection');
assert(client.includes("if (tool === 'lesson') return prompt"), 'lesson design context may remain for Lesson Builder');
assert(client.includes("replace(/\\n?\\[TEACHR LESSON DESIGN\\]"), 'non-lesson tools must strip lesson-design context');
assert(objectiveUi.includes('if (selectionKey && nextKey !== selectionKey) clearAutoObjective()'), 'changing curriculum selection must clear the prior auto objective');
assert(objectiveUi.includes("resolved.alignmentLevel === 'verified-objective'"), 'auto objective must be limited to verified objective matches');
assert(objectiveUi.includes('setAutoObjective(objectives[0].summary)'), 'verified curriculum objective may populate an empty teacher objective');

console.log('curriculum-context-isolation tests passed');
