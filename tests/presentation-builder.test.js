const assert = require('assert');
const fs = require('fs');

const app = fs.readFileSync('app.js','utf8');
const shell = fs.readFileSync('app-shell.js','utf8');
const generation = fs.readFileSync('apps-script/Generation.gs','utf8');
const credits = require('../apps-script/CreditUsage.gs');

assert(credits.GENERATING_TOOL_IDS.includes('presentation'), 'presentation must consume TEACHR Credits');
assert(app.includes("presentation: { title: 'Presentation Builder'"), 'client tool config must include Presentation Builder');
assert(app.includes("slidesCopyUrl: payload.slidesCopyUrl || null"), 'client must accept the Google Slides copy URL');
assert(app.includes('Open Editable Google Slides'), 'result must expose the editable Google Slides action');
assert(shell.includes("presentation:['Presentation Builder'"), 'dashboard must expose Presentation Builder');
assert(generation.includes("body.tool==='presentation'?createPresentationCopy_"), 'Apps Script must create a Slides copy for presentation generations');
assert(generation.includes('SlidesApp.create'), 'Apps Script must use the native Google Slides service');
assert(generation.includes("+'/copy'"), 'generated deck must open through Google Slides make-a-copy flow');
assert(generation.includes('DriveApp.Access.ANYONE_WITH_LINK'), 'source deck must be viewable so the Google make-a-copy flow can open');

console.log('presentation-builder tests passed');
