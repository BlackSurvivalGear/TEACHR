const fs = require('fs');
const assert = require('assert');

const chat = fs.readFileSync('ai-chat-panel.js', 'utf8');
const css = fs.readFileSync('ai-chat-panel.css', 'utf8');

assert(chat.includes("value('curriculum')"), 'chat context must read live curriculum selection');
assert(chat.includes("value('subject')"), 'chat context must read live subject selection');
assert(chat.includes("value('year')"), 'chat context must read live year selection');
assert(chat.includes("value('topic')"), 'chat context must read live topic selection');
assert(chat.includes("value('lessonObjective')"), 'chat context must read the teacher lesson objective');
assert(chat.includes('TEACHR_CURRICULUM?.resolve?.(selection)'), 'chat must resolve context through Curriculum Precision');
assert(chat.includes("'Verified curriculum objective'"), 'chat must distinguish verified curriculum objectives');
assert(chat.includes("'Key-stage aligned'"), 'chat must distinguish key-stage alignment');
assert(chat.includes("'Not applicable'"), 'chat must distinguish not-applicable alignment');
assert(chat.includes("'Teacher-defined objective'"), 'chat must distinguish teacher-defined objectives');
assert(chat.includes('Controlled paraphrases are not statutory quotations.'), 'chat context must preserve curriculum precision wording safeguards');
assert(chat.includes('Never present an AI-created objective as an official curriculum statement.'), 'chat must prohibit fabricated official objectives');
assert(chat.includes('contextEnabled'), 'chat must allow contextual assistance to be disabled');
assert(chat.includes('Using context:'), 'chat must visibly report the current context');
assert(chat.includes('includeCurriculum: false'), 'chat must avoid duplicate transport-level curriculum injection');
assert(chat.includes('stage: 3'), 'chat API must report Stage 3');
assert(css.includes('.teachr-chat-context'), 'chat context indicator must be styled');

console.log('AI chat Stage 3 context awareness tests passed');