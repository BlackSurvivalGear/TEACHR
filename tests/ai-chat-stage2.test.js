const fs = require('fs');
const assert = require('assert');

const chat = fs.readFileSync('ai-chat-panel.js', 'utf8');
const transport = fs.readFileSync('generation-client.js', 'utf8');
const apps = fs.readFileSync('apps-script/Generation.gs', 'utf8');
const css = fs.readFileSync('ai-chat-panel.css', 'utf8');

assert(chat.includes("tool: 'chat'"), 'chat panel must call the dedicated chat tool');
assert(chat.includes('TEACHR_AUTH.getIdToken'), 'chat must use the signed-in Firebase token');
assert(chat.includes('TEACHR_AI.generate'), 'chat must reuse the shared TEACHR AI transport');
assert(chat.includes('includeCurriculum: false'), 'Stage 2 chat must not silently add transport-level curriculum context');
assert(chat.includes('new AbortController()'), 'chat must support stopping a request');
assert(chat.includes("send.textContent = 'Stop'"), 'send control must become Stop while generating');
assert(chat.includes('history.slice(-8)'), 'chat should preserve bounded in-panel conversational context');
assert(chat.includes("document.documentElement.dataset.auth !== 'signed-in'"), 'chat panel must refuse to open signed out');
assert(css.includes('html:not([data-auth="signed-in"]) .teachr-chat-panel'), 'chat panel must be hidden on public home');
assert(transport.includes("tool === 'lesson' || tool === 'chat'"), 'shared transport must recognise chat without lesson stripping');
assert(transport.includes("includeCurriculum = tool !== 'chat'"), 'chat must default to no duplicate transport-level curriculum injection');
assert(apps.includes("const isChat=body.tool==='chat'"), 'Apps Script must recognise the dedicated chat route');
assert(apps.includes('generationProfile_(uid'), 'chat usage enforcement must still resolve an active TEACHR member profile');
assert(apps.includes('if(isChat)chatUsageAccess_(uid);else generationAccess_(uid,body.tool)'), 'chat must use its independent access path instead of a six-tool allowance');
assert(apps.includes('const usage=isChat?recordChatSuccess_(uid):recordGenerationSuccess_(uid,body.tool)'), 'successful chat must record only its independent chat usage');
assert(apps.includes('You are TEACHR AI, a concise teacher-first conversational assistant.'), 'chat must use its dedicated system prompt');

console.log('AI chat Stage 2 connection tests passed');