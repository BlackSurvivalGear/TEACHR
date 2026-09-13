const fs = require('fs');
const assert = require('assert');

const source = fs.readFileSync('lesson-design-smart-defaults.js', 'utf8');

assert(source.includes("const topicPhrase = cleanTopic(contextTopic()).toLowerCase();"), 'topic must be preserved as a complete phrase');
assert(source.includes('if (topicPhrase) terms.push(topicPhrase);'), 'complete topic phrase must be the first vocabulary term');
assert(source.includes("topicPhrase.split(/\\s+/).includes(word)"), 'objective words already contained in the topic phrase must not be duplicated');
assert(!source.includes('`${cleanTopic(contextTopic())} ${objective.value}`'), 'legacy combined word-tokenisation must not return');

console.log('multi-word-topic-vocabulary tests passed');