const fs = require('fs');
const assert = require('assert');

const generation = fs.readFileSync('apps-script/Generation.gs', 'utf8');
const chatUsage = fs.readFileSync('apps-script/ChatUsage.gs', 'utf8');
const creditModel = fs.readFileSync('apps-script/CreditUsage.gs', 'utf8');

assert(chatUsage.includes('TEACHR_CHAT_FREE_MESSAGES = 10'), 'free members must receive a permanent 10-message AI Chat cap');
assert(chatUsage.includes("'/usage/chat'"), 'chat usage must use its own Firestore document');
assert(chatUsage.includes('successfulMessages'), 'chat must track successful messages independently');
assert(chatUsage.includes("'CHAT_LIMIT_REACHED'"), 'chat must return its own limit code');
assert(chatUsage.includes('TEACHR_CREDIT_USAGE.hasUnlimitedCredits(profile)'), 'Pro/Admin/Superadmin must remain unlimited');
assert(chatUsage.includes('recordChatSuccess_'), 'successful chat responses must be recorded transactionally');
assert(generation.includes("if(isChat)chatUsageAccess_(uid);else creditAccess_(uid)"), 'chat access must be checked independently from universal Credits before provider use');
assert(generation.includes('const usage=isChat?recordChatSuccess_(uid):recordGenerationSuccess_(uid)'), 'chat success must not consume universal Credits');
assert(creditModel.includes("GENERATING_TOOL_IDS: Object.freeze(['lesson', 'worksheet', 'quiz', 'differentiate', 'curriculum', 'revision'])"), 'chat must remain outside the six Credit-consuming tools');
assert(!creditModel.includes("'chat'"), 'chat must not become a Credit-consuming generating tool');

console.log('AI chat Stage 4 independent usage-control tests passed');