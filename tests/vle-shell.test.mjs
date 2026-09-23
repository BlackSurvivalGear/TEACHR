import assert from 'node:assert/strict';
import fs from 'node:fs';

const index = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const vle = fs.readFileSync(new URL('../vle.html', import.meta.url), 'utf8');
const logic = fs.readFileSync(new URL('../vle.js', import.meta.url), 'utf8');

assert.match(index, /href="vle\.html"/);
assert.match(index, /TEACHR VLE/);
assert.match(index, /<strong>7<\/strong><small>Generating workflows<\/small>/);

for (const label of ['England — National Curriculum','Wales — Coming soon','Scotland — Coming soon','Northern Ireland — Coming soon']) assert.ok(vle.includes(label));
for (const stage of ['Early Years / Reception','Key Stage 1','Key Stage 2','Key Stage 3','Key Stage 4']) assert.ok(vle.includes(stage));
for (const moduleName of ['Visual Maths Lab','English &amp; Literacy','Visual Science Lab','Geography Explorer','History &amp; Timelines','Computing &amp; Coding']) assert.ok(vle.includes(moduleName));
for (let year = 1; year <= 11; year += 1) assert.ok(logic.includes(`Year ${year}`));
assert.ok(logic.includes("['Reception']"));
assert.doesNotMatch(vle, /generation-client\.js|generation-usage\.js|usage-service\.js|pro-paywall\.js/);

console.log('VLE shell regression checks passed.');