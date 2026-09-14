const fs = require('fs');
const assert = require('assert');

const shell = fs.readFileSync('app-shell.js', 'utf8');

assert(shell.includes("vle:['TEACHR VLE'"), 'Authenticated member dashboard must register the VLE card');
assert(shell.includes("vle:'◫'"), 'VLE card must have a dashboard icon');
assert(shell.includes("key==='vle'?window.location.assign('vle.html'):openTool(key)"), 'VLE card must navigate directly to vle.html');

console.log('VLE member dashboard card regression checks passed.');
