// Lightweight static smoke checks for the lesson-builder enhancement.
const fs = require('fs');
const index = fs.readFileSync('index.html', 'utf8');
const builder = fs.readFileSync('lesson-builder.js', 'utf8');

for (const id of ['builderForm', 'topic', 'notes', 'extraInstruction']) {
  if (!index.includes(`id="${id}"`)) throw new Error(`Missing ${id}`);
}
for (const id of ['lessonObjective', 'priorKnowledge', 'lessonStyle', 'assessmentMethod', 'supportNeeds', 'resourcesNeeded', 'successCriteria']) {
  if (!builder.includes(`id="${id}"`)) throw new Error(`Missing ${id}`);
}
if (!index.includes('lesson-builder.js')) throw new Error('Lesson builder script is not loaded');
console.log('Lesson Builder smoke checks passed.');
