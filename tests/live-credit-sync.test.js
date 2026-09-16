const assert=require('assert');const fs=require('fs');const path=require('path');
const app=fs.readFileSync(path.join(__dirname,'../app.js'),'utf8');
const service=fs.readFileSync(path.join(__dirname,'../usage-service.js'),'utf8');
const generation=fs.readFileSync(path.join(__dirname,'../apps-script/Generation.gs'),'utf8');
const creditModel=require('../apps-script/CreditUsage.gs');
const tools=['lesson','worksheet','quiz','differentiate','curriculum','revision'];

// Every primary generator is part of the one shared Credit model.
assert.deepEqual([...creditModel.GENERATING_TOOL_IDS],tools);
tools.forEach(tool=>assert.ok(creditModel.GENERATING_TOOL_IDS.includes(tool),`${tool} must use universal Credits`));
assert.ok(!creditModel.GENERATING_TOOL_IDS.includes('chat'),'Ask TEACHR must remain outside universal Credits');

// The common submit path handles every active primary tool and publishes the server result.
assert.match(app,/TEACHR_AI\.generate\(\{ token, prompt: buildPrompt\(data\), tool: activeTool \}\)/);
assert.match(app,/TEACHR_USAGE\?\.applyGenerationResult\?\.\(activeTool, result\.usage\)/);
assert.match(app,/TEACHR_USAGE\?\.refresh\?\.\(\)/);

// Successful server responses include the authoritative post-generation balance.
assert.match(generation,/recordGenerationSuccess_\(uid\)/);
assert.match(generation,/creditsRemaining:access\.unlimited\?null:next\.record\.balance/);
assert.match(generation,/const usage=isChat\?recordChatSuccess_\(uid\):recordGenerationSuccess_\(uid\)/);
assert.match(generation,/return\{ok:true,status:200,content,model,usage\}/);

// Client-side usage state republishes the authoritative balance to dashboard/tool UI.
assert.match(service,/function applyGenerationResult\(_toolId,usage\)/);
assert.match(service,/creditsRemaining:usage\.creditsRemaining/);
assert.match(service,/teachr:usagechange/);

// Provider failure/empty output occurs before success accounting, so no Credit is consumed.
const successRecordIndex=generation.indexOf("const usage=isChat?recordChatSuccess_(uid):recordGenerationSuccess_(uid)");
const contentCheckIndex=generation.indexOf("if(typeof content!=='string'||!content.trim())");
assert.ok(contentCheckIndex>=0&&successRecordIndex>contentCheckIndex,'Credit accounting must occur only after non-empty AI content');

console.log('live Credit sync tests passed for all six generators');
