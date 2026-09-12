const CONFIG = {
  SITE_URL: 'https://blacksurvivalgear.github.io/TEACHR/',
  FIREBASE_PROJECT_ID: 'teachr-bf740',
  PRICE_PENCE: 999,
  CURRENCY: 'GBP'
};

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || '';
    if (action === 'pro-pay') return startProCheckout_(e.parameter || {});
    if (action === 'pro-return') return finishProCheckout_(e.parameter || {});
    if (action === 'pro-cancel') return redirectPage_(CONFIG.SITE_URL + 'upgrade.html?upgrade=cancelled', 'Payment cancelled');
    throw new Error('Unsupported action.');
  } catch (error) { return messagePage_('TEACHR checkout error', error.message); }
}

function startProCheckout_(params) {
  const uid = clean_(params.uid), email = clean_(params.email).toLowerCase();
  if (!/^[A-Za-z0-9_-]{10,128}$/.test(uid)) throw new Error('A valid signed-in account is required.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('A valid account email is required.');
  const user = firestoreUser_(uid);
  if (firestoreString_(user, 'email').toLowerCase() !== email) throw new Error('The signed-in account could not be verified.');
  if (firestoreString_(user, 'plan') === 'pro') return redirectPage_(CONFIG.SITE_URL, 'Pro TEACHR already active');
  const webAppUrl = ScriptApp.getService().getUrl();
  const session = stripeRequest_('/v1/checkout/sessions', 'post', {
    mode: 'subscription', customer_email: email, client_reference_id: uid,
    success_url: webAppUrl + '?action=pro-return&session_id={CHECKOUT_SESSION_ID}',
    cancel_url: webAppUrl + '?action=pro-cancel',
    'metadata[uid]': uid, 'metadata[purpose]': 'teachr_monthly_pro',
    'subscription_data[metadata][uid]': uid, 'subscription_data[metadata][purpose]': 'teachr_monthly_pro',
    'line_items[0][quantity]': '1',
    'line_items[0][price_data][currency]': CONFIG.CURRENCY.toLowerCase(),
    'line_items[0][price_data][unit_amount]': String(CONFIG.PRICE_PENCE),
    'line_items[0][price_data][recurring][interval]': 'month',
    'line_items[0][price_data][product_data][name]': 'Pro TEACHR',
    'line_items[0][price_data][product_data][description]': 'Monthly access to all eight TEACHR tools'
  });
  if (!session.id || !session.url) throw new Error('Stripe did not create a checkout session.');
  PropertiesService.getScriptProperties().setProperty('PRO_SESSION_' + session.id, JSON.stringify({uid, email, status:'CREATED', createdAt:Date.now()}));
  return redirectPage_(session.url, 'Opening secure Pro TEACHR checkout');
}

function finishProCheckout_(params) {
  const sessionId = clean_(params.session_id), props = PropertiesService.getScriptProperties();
  const key = 'PRO_SESSION_' + sessionId, pending = JSON.parse(props.getProperty(key) || '{}');
  if (!sessionId || !pending.uid || !pending.email) throw new Error('Unknown or expired checkout session.');
  const session = stripeRequest_('/v1/checkout/sessions/' + encodeURIComponent(sessionId), 'get');
  if (session.status !== 'complete' || !session.subscription) throw new Error('The subscription has not completed.');
  if (Number(session.amount_total) !== CONFIG.PRICE_PENCE || String(session.currency || '').toUpperCase() !== CONFIG.CURRENCY) throw new Error('Subscription amount verification failed.');
  if (session.client_reference_id !== pending.uid || !session.metadata || session.metadata.purpose !== 'teachr_monthly_pro' || session.metadata.uid !== pending.uid) throw new Error('Subscription account verification failed.');
  const paidEmail = String((session.customer_details && session.customer_details.email) || session.customer_email || '').toLowerCase();
  if (paidEmail !== pending.email || firestoreString_(firestoreUser_(pending.uid), 'email').toLowerCase() !== pending.email) throw new Error('Subscription email verification failed.');
  grantPro_(pending.uid, sessionId, session.subscription, session.customer || '');
  pending.status = 'COMPLETED'; pending.subscriptionId = session.subscription; pending.paidAt = Date.now(); props.setProperty(key, JSON.stringify(pending));
  props.setProperty('PRO_SUB_' + pending.uid, JSON.stringify({uid:pending.uid, subscriptionId:session.subscription, email:pending.email}));
  return redirectPage_(CONFIG.SITE_URL + '?pro=success', 'Pro TEACHR activated');
}

function syncAllSubscriptions() {
  const props = PropertiesService.getScriptProperties();
  Object.keys(props.getProperties()).filter(key => key.indexOf('PRO_SUB_') === 0).forEach(key => {
    const record = JSON.parse(props.getProperty(key) || '{}');
    if (!record.uid || !record.subscriptionId) return;
    const subscription = stripeRequest_('/v1/subscriptions/' + encodeURIComponent(record.subscriptionId), 'get');
    const active = ['active','trialing'].indexOf(subscription.status) !== -1;
    setProAccess_(record.uid, active, record.subscriptionId);
  });
}

function grantPro_(uid, sessionId, subscriptionId, customerId) {
  setProAccess_(uid, true, subscriptionId, {proStripeSessionId:sessionId, stripeCustomerId:customerId});
}

function setProAccess_(uid, active, subscriptionId, extra) {
  const fields = Object.assign({
    role: {stringValue: active ? 'pro' : 'member'}, plan: {stringValue: active ? 'pro' : 'free'},
    proAccess: {stringValue: active ? 'monthly' : 'inactive'}, stripeSubscriptionId: {stringValue: subscriptionId || ''},
    updatedAt: {timestampValue:new Date().toISOString()}
  }, Object.keys(extra || {}).reduce((out,key) => { out[key] = {stringValue:String(extra[key] || '')}; return out; }, {}));
  const masks = Object.keys(fields).map(key => 'updateMask.fieldPaths=' + encodeURIComponent(key)).join('&');
  const url = 'https://firestore.googleapis.com/v1/projects/' + CONFIG.FIREBASE_PROJECT_ID + '/databases/(default)/documents/users/' + encodeURIComponent(uid) + '?' + masks;
  const response = UrlFetchApp.fetch(url, {method:'patch', contentType:'application/json', headers:{Authorization:'Bearer ' + ScriptApp.getOAuthToken()}, payload:JSON.stringify({fields}), muteHttpExceptions:true});
  if (response.getResponseCode() >= 300) throw new Error('Firestore access update failed: ' + response.getContentText());
}

function firestoreUser_(uid) {
  const url = 'https://firestore.googleapis.com/v1/projects/' + CONFIG.FIREBASE_PROJECT_ID + '/databases/(default)/documents/users/' + encodeURIComponent(uid);
  const response = UrlFetchApp.fetch(url, {headers:{Authorization:'Bearer ' + ScriptApp.getOAuthToken()}, muteHttpExceptions:true});
  if (response.getResponseCode() !== 200) throw new Error('TEACHR user profile was not found.');
  return JSON.parse(response.getContentText());
}
function firestoreString_(document, field) { return document && document.fields && document.fields[field] ? String(document.fields[field].stringValue || '') : ''; }
function stripeRequest_(path, method, payload) { const secret = PropertiesService.getScriptProperties().getProperty('STRIPE_SECRET_KEY'); if (!secret) throw new Error('Stripe credentials are not configured.'); const options = {method, headers:{Authorization:'Bearer ' + secret, Accept:'application/json'}, muteHttpExceptions:true}; if (payload !== undefined) { options.payload = payload; options.contentType = 'application/x-www-form-urlencoded'; } const response = UrlFetchApp.fetch('https://api.stripe.com' + path, options); const body = JSON.parse(response.getContentText() || '{}'); if (response.getResponseCode() >= 300) throw new Error('Stripe request failed: ' + clean_(body.error && body.error.message)); return body; }
function redirectPage_(url, title) { const safeUrl=escapeHtml_(url), safeTitle=escapeHtml_(title); return HtmlService.createHtmlOutput('<!doctype html><html><head><base target="_top"><meta charset="utf-8"><meta http-equiv="refresh" content="0;url='+safeUrl+'"><title>'+safeTitle+'</title></head><body><p>'+safeTitle+'</p><a href="'+safeUrl+'" target="_top">Continue</a></body></html>').setTitle(title); }
function messagePage_(title, message) { return HtmlService.createHtmlOutput('<!doctype html><html><head><meta charset="utf-8"><title>'+escapeHtml_(title)+'</title></head><body><h1>'+escapeHtml_(title)+'</h1><p>'+escapeHtml_(message)+'</p></body></html>').setTitle(title); }
function escapeHtml_(value) { return String(value || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function clean_(value) { return String(value || '').replace(/[<>]/g,'').trim().slice(0,500); }
