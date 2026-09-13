const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const source = fs.readFileSync('curriculum-precision.js', 'utf8');

const baseResolve = selection => ({
  jurisdiction: 'England',
  framework: 'National Curriculum',
  subject: selection.subject,
  year: selection.year,
  keyStage: selection.keyStage || 'KS3',
  topic: selection.topic,
  status: selection.status || 'verified-source-structure',
  domains: ['Human and physical geography'],
  objectives: selection.objectives || []
});

const registry = { resolve: baseResolve };
const context = { window: { TEACHR_CURRICULUM: registry } };
vm.createContext(context);
vm.runInContext(source, context);

const precision = context.window.TEACHR_CURRICULUM_PRECISION;
assert(precision, 'precision module must expose metadata');
assert.strictEqual(precision.version, 2);

const expectedSubjects = [
  'English','Mathematics','Science','Art and design','Citizenship','Computing','Design and technology',
  'Geography','History','Languages','Music','Physical education','Religious education (RE)'
];
expectedSubjects.forEach(subject => assert(precision.subjects.includes(subject), `precision coverage must include ${subject}`));

const climate = registry.resolve({
  subject: 'Geography', year: 'Year 9', keyStage: 'KS3', topic: 'Climate change',
  objectives: [
    { id: 'GEO-KS3-01', domain: 'Locational knowledge', summary: 'Extend locational knowledge by studying Africa, Russia and Asia.' },
    { id: 'GEO-KS3-03', domain: 'Human and physical geography', summary: 'Understand physical geography processes including weather and climate change from the Ice Age to the present.' },
    { id: 'GEO-KS3-04', domain: 'Human and physical geography', summary: 'Understand human geography processes including population and urbanisation.' }
  ]
});
assert.strictEqual(climate.alignmentLevel, 'verified-objective');
assert.strictEqual(climate.objectives[0].id, 'GEO-KS3-03', 'topic-specific objective must rank first');
assert(!climate.objectives.some(item => item.id === 'GEO-KS3-04'), 'unrelated broad-domain objective must be filtered out');

const unmatched = registry.resolve({
  subject: 'Science', year: 'Year 8', keyStage: 'KS3', topic: 'Completely unrelated custom topic',
  objectives: [{ id: 'SCI-KS3-01', domain: 'Biology', summary: 'Understand cells and organisation.' }]
});
assert.strictEqual(unmatched.alignmentLevel, 'key-stage-aligned');
assert.strictEqual(unmatched.objectives.length, 0, 'unmatched topics must not receive a false verified objective');

const notApplicable = registry.resolve({
  subject: 'Geography', year: 'Year 11', keyStage: 'KS4', topic: 'Climate change', status: 'not-applicable-at-key-stage',
  objectives: [{ id: 'GEO-KS3-03', domain: 'Human and physical geography', summary: 'Understand climate change.' }]
});
assert.strictEqual(notApplicable.alignmentLevel, 'not-applicable');
assert.strictEqual(notApplicable.objectives.length, 0, 'non-applicable stages must never retain objectives');

const client = fs.readFileSync('generation-client.js', 'utf8');
assert(client.includes('VERIFIED CURRICULUM OBJECTIVES'), 'generation prompt must separate verified objectives');
assert(client.includes('TEACHER LESSON OBJECTIVE'), 'generation prompt must label the teacher objective separately');
assert(client.includes('Only claim objective-level curriculum alignment'), 'generation prompt must forbid false objective-level claims');

const ui = fs.readFileSync('curriculum-objective-ui.js', 'utf8');
assert(ui.includes('CURRICULUM PRECISION V2'), 'UI must surface Curriculum Precision V2');
assert(ui.includes('controlled paraphrases'), 'UI must disclose controlled paraphrase status');

console.log('Curriculum Precision V2 checks passed.');
