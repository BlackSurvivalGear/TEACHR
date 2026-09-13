const fs = require('fs');
const assert = require('assert');

const generation = fs.readFileSync('apps-script/Generation.gs', 'utf8');
const chatUsage = fs.readFileSync('apps-script/ChatUsage.gs', 'utf8');
const model = fs.readFileSync('apps-script/GenerationUsage.gs', 'utf8');

assert(chatUsage.includes('TEACHR_CHAT_FREE_MESSAGES = 10'), 'free members must receive 10 AI Chat messages');
assert(chatUsage.includes("'/usage/chat'"), 'chat usage must use its own Firestore document');
assert(chatUsage.includes('successfulMessages'), 'chat must track successful messages independently');
assert(chatUsage.includes("'CHAT_LIMIT_REACHED'"), 'chat must return its own limit code');
assert(chatUsage.includes('TEACHR_GENERATION_USAGE.hasUnlimitedGenerations(profile)'), 'Pro/Admin/Superadmin must remain unlimited');
assert(chatUsage.includes('recordChatSuccess_'), 'successful chat responses must be recorded transactionally');
assert(generation.includes("if(isChat)chatUsageAccess_(uid);else generationAccess_(uid,body.tool)"), 'chat access must be checked independently before provider use');
assert(generation.includes('const usage=isChat?recordChatSuccess_(uid):recordGenerationSuccess_(uid,body.tool)'), 'chat success must not consume generator counters');
assert(model.includes("GENERATING_TOOL_IDS = Object.freeze(['lesson','worksheet','quiz','differentiate','curriculum','revision'])"), 'chat must not become a seventh generator quota');
assert(!model.includes("'chat','lesson'"), 'chat must remain outside the six generating tool IDs');

console.log('AI chat Stage 4 independent usage-control tests passed');