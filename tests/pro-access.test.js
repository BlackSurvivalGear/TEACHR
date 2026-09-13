const fs = require('fs');
const read = path => fs.readFileSync(path, 'utf8');
const auth = read('teachr-auth.js'), paywall = read('pro-paywall.js'), upgrade = read('upgrade.html');
const admin = read('admin.js'), rules = read('firestore.rules'), backend = read('apps-script/Code.gs');
const checks = [
  ['new users are Members', auth.includes("'member'") && auth.includes("'free'")],
  ['Superadmin email is protected', auth.includes('admin@lawal.org') && rules.includes('admin@lawal.org')],
  ['generator submit is intercepted', paywall.includes("form?.addEventListener('submit'") && paywall.includes('stopImmediatePropagation')],
  ['Pro roles bypass the paywall', paywall.includes("['pro', 'admin', 'superadmin']")],
  ['upgrade is £9.99 monthly', upgrade.includes('£9.99') && upgrade.includes('per month')],
  ['all eight tools are advertised', (upgrade.match(/<li>/g) || []).length === 8],
  ['admin manages roles and status', admin.includes("data-role") && admin.includes('data-toggle')],
  ['client cannot self-upgrade', rules.includes("request.resource.data.plan == resource.data.get('plan', 'free')")],
  ['Stripe uses subscription mode', backend.includes("mode: 'subscription'") && backend.includes("[recurring][interval]': 'month'")],
  ['backend verifies account metadata', backend.includes("metadata.purpose !== 'teachr_monthly_pro'")],
  ['subscription reconciliation exists', backend.includes('function syncAllSubscriptions()')],
  ['Apps Script checkout escapes sandbox with base target top', backend.includes('<base target="_top">')],
  ['checkout link explicitly targets top window', backend.includes('target="_top"') && backend.includes('rel="noopener"')],
  ['checkout does not use scripted location redirect', !backend.includes('location.replace(') && !backend.includes('window.location.replace(')]
];
let failed = false;
for (const [name, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'}: ${name}`); if (!ok) failed = true; }
if (failed) process.exit(1);
