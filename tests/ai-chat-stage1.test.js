const fs = require('fs');
const assert = require('assert');

const html = fs.readFileSync('index.html', 'utf8');
const js = fs.readFileSync('ai-chat-panel.js', 'utf8');
const css = fs.readFileSync('ai-chat-panel.css', 'utf8');

assert(html.includes('id="teachrChatLauncher"'), 'floating Ask TEACHR launcher must exist');
assert(html.includes('id="teachrChatPanel"'), 'AI chat side panel must exist');
assert(html.includes('id="teachrChatNew"'), 'New Chat control must exist');
assert(html.includes('id="teachrChatMinimise"'), 'minimise control must exist');
assert(html.includes('id="teachrChatClose"'), 'close control must exist');
assert(html.includes('id="teachrChatForm"'), 'chat composer must exist');
assert((html.match(/data-chat-prompt=/g) || []).length >= 4, 'chat must open with a short set of suggested prompts');
assert(html.includes('Explain this topic simply'), 'suggested explain prompt must exist');
assert(html.includes('Create 5 starter questions'), 'suggested starter-question prompt must exist');
assert(js.includes('Stage 1 intentionally provides UI only'), 'Stage 1 must not accidentally connect to generation backend');
assert(js.includes("event.key === 'Enter' && !event.shiftKey"), 'Enter should submit while Shift+Enter remains available');
assert(js.includes("event.key === 'Escape'"), 'Escape should close the panel');
assert(css.includes('@media(max-width:640px)'), 'chat panel must include mobile responsive behaviour');
assert(css.includes('width:100vw'), 'mobile chat must use the full viewport width');
assert(html.includes('public-app-content" id="teachrChatLauncher"'), 'launcher must follow authenticated workspace visibility rules');

console.log('AI chat Stage 1 shell tests passed');