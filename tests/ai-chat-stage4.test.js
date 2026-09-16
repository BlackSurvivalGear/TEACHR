const fs = require('fs');
const assert = require('assert');

const generation = fs.readFileSync('apps-script/Generation.gs', 'utf8');
const chatUsage = fs.readFileSync('apps-script/ChatUsage.gs', 'utf8');
const creditModel = fs.readFileSync('apps-script/CreditUsage.gs', 'utf8');

assert(/const\s+TEACHR_CHAT_FREE_MESSAGES\s*=\s*10\s*;/.test(chatUsage), 'free members must receive a permanent 10-message AI Chat cap');
assert(/persistentAllowance\s*:\s*intOr_\(raw\.persistentAllowance\s*,\s*TEACHR_CHAT_FREE_MESSAGES\)/.test(chatUsage), 'free chat allowance must be stored as a persistent entitlement');
assert(chatUsage.includes("'/usage/chat'"), 'chat usage must use its own Firestore document');
assert(/persistentUsed|successfulMessages/.test(chatUsage), 'chat must track successful persistent messages independently');
assert(chatUsage.includes("'CHAT_LIMIT_REACHED'"), 'chat must return its own limit code');
assert(/\['admin','superadmin'\]\.includes\(role\)\|\|plan==='premium'/.test(chatUsage), 'Admin/Superadmin and Premium chat must be unlimited');
assert(chatUsage.includes('recordChatSuccess_'), 'successful chat responses must be recorded transactionally');
assert(generation.includes("if(isChat)chatUsageAccess_(uid);else creditAccess_(uid)"), 'chat access must be checked independently from universal Credits before provider use');
assert(generation.includes('const usage=isChat?recordChatSuccess_(uid):recordGenerationSuccess_(uid)'), 'chat success must not consume universal Credits');
const toolIdsMatch = creditModel.match(/const\s+GENERATING_TOOL_IDS\s*=\s*Object\.freeze\(\[([^\]]+)\]\)/);
assert(toolIdsMatch, 'universal Credit model must define the generating tool IDs');
const creditToolIds = [...toolIdsMatch[1].matchAll(/['"]([^'"]+)['"]/g)].map(match => match[1]);
assert.deepStrictEqual(creditToolIds, ['lesson','worksheet','quiz','differentiate','curriculum','revision'], 'only the six primary generators may consume universal Credits');
assert(!creditToolIds.includes('chat'), 'chat must remain outside the six Credit-consuming tools');

console.log('AI chat Stage 4 independent usage-control tests passed');