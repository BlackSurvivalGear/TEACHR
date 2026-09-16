/* Stage 7B Stripe fulfilment. Stripe Checkout is verified server-side before any entitlement is granted. */
const TEACHR_BILLING_PLANS = Object.freeze({
  payg:{mode:'payment',pricePence:250,credits:10,chat:20,label:'10 TEACHR Credits'},
  standard:{mode:'subscription',pricePence:499,credits:25,chat:50,label:'Standard TEACHR'},
  pro:{mode:'subscription',pricePence:999,credits:55,chat:100,label:'Pro TEACHR'},
  premium:{mode:'subscription',pricePence:1999,credits:135,chat:null,label:'Premium TEACHR'}
});

function startTierCheckout_(params) {
  const uid=clean_(params.uid),email=clean_(params.email).toLowerCase(),plan=clean_(params.plan).toLowerCase();
  const offer=TEACHR_BILLING_PLANS[plan];
  if(!offer) throw new Error('Unknown TEACHR plan.');
  if(!/^[A-Za-z0-9_-]{10,128}$/.test(uid)) throw new Error('A valid signed-in account is required.');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('A valid account email is required.');
  if(firestoreString_(firestoreUser_(uid),'email').toLowerCase()!==email) throw new Error('The signed-in account could not be verified.');
  const webAppUrl=ScriptApp.getService().getUrl(),purpose=plan==='payg'?'teachr_payg':'teachr_monthly_'+plan;
  const payload={mode:offer.mode,customer_email:email,client_reference_id:uid,success_url:webAppUrl+'?action=tier-return&session_id={CHECKOUT_SESSION_ID}',cancel_url:webAppUrl+'?action=tier-cancel','metadata[uid]':uid,'metadata[plan]':plan,'metadata[purpose]':purpose,'line_items[0][quantity]':'1','line_items[0][price_data][currency]':'gbp','line_items[0][price_data][unit_amount]':String(offer.pricePence),'line_items[0][price_data][product_data][name]':offer.label};
  if(offer.mode==='subscription'){
    payload['line_items[0][price_data][recurring][interval]']='month';
    payload['subscription_data[metadata][uid]']=uid;payload['subscription_data[metadata][plan]']=plan;payload['subscription_data[metadata][purpose]']=purpose;
  }
  const session=stripeRequest_('/v1/checkout/sessions','post',payload);
  if(!session.id||!session.url) throw new Error('Stripe did not create a checkout session.');
  PropertiesService.getScriptProperties().setProperty('BILLING_SESSION_'+session.id,JSON.stringify({uid,email,plan,status:'CREATED',createdAt:Date.now()}));
  return redirectPage_(session.url,'Opening secure TEACHR checkout');
}

function finishTierCheckout_(params) {
  const sessionId=clean_(params.session_id),props=PropertiesService.getScriptProperties(),key='BILLING_SESSION_'+sessionId,pending=JSON.parse(props.getProperty(key)||'{}');
  if(!sessionId||!pending.uid||!pending.plan) throw new Error('Unknown or expired checkout session.');
  if(pending.status==='COMPLETED') return redirectPage_(CONFIG.SITE_URL+'?billing=success','TEACHR payment already applied');
  const offer=TEACHR_BILLING_PLANS[pending.plan],session=stripeRequest_('/v1/checkout/sessions/'+encodeURIComponent(sessionId),'get');
  if(!offer||session.status!=='complete'||session.payment_status!=='paid') throw new Error('The payment has not completed.');
  if(Number(session.amount_total)!==offer.pricePence||String(session.currency||'').toUpperCase()!=='GBP') throw new Error('Payment amount verification failed.');
  if(session.client_reference_id!==pending.uid||!session.metadata||session.metadata.uid!==pending.uid||session.metadata.plan!==pending.plan) throw new Error('Payment account verification failed.');
  const paidEmail=String((session.customer_details&&session.customer_details.email)||session.customer_email||'').toLowerCase();
  if(paidEmail!==pending.email||firestoreString_(firestoreUser_(pending.uid),'email').toLowerCase()!==pending.email) throw new Error('Payment email verification failed.');
  if(pending.plan==='payg') applyPaygFulfilment_(pending.uid,sessionId); else {
    if(!session.subscription) throw new Error('Stripe subscription was not created.');
    const subscription=stripeRequest_('/v1/subscriptions/'+encodeURIComponent(session.subscription),'get');
    applySubscriptionFulfilment_(pending.uid,pending.plan,subscription,sessionId);
    props.setProperty('BILLING_SUB_'+pending.uid,JSON.stringify({uid:pending.uid,email:pending.email,plan:pending.plan,subscriptionId:session.subscription}));
  }
  pending.status='COMPLETED';pending.completedAt=Date.now();props.setProperty(key,JSON.stringify(pending));
  return redirectPage_(CONFIG.SITE_URL+'?billing=success','TEACHR payment applied');
}

function applyPaygFulfilment_(uid,sessionId) {
  const props=PropertiesService.getScriptProperties(),eventKey='BILLING_PAYG_'+sessionId;
  if(props.getProperty(eventKey)) return;
  updateCreditBuckets_(uid,function(record){return TEACHR_CREDIT_USAGE.addPurchasedCredits(record,10);});
  addPersistentChatAllowance_(uid,20);
  props.setProperty(eventKey,new Date().toISOString());
}

function applySubscriptionFulfilment_(uid,plan,subscription,sourceId) {
  const offer=TEACHR_BILLING_PLANS[plan];
  if(!offer||offer.mode!=='subscription'||!subscription||!['active','trialing'].includes(subscription.status)) throw new Error('Subscription is not active.');
  const invoiceId=String(subscription.latest_invoice||sourceId||'');
  const props=PropertiesService.getScriptProperties(),eventKey='BILLING_RENEWAL_'+uid+'_'+invoiceId;
  if(props.getProperty(eventKey)) return;
  updateCreditBuckets_(uid,function(record){return TEACHR_CREDIT_USAGE.applyMonthlyRenewal(record,plan);});
  resetMonthlyChatAllowance_(uid,plan);
  setBillingProfile_(uid,plan,subscription.id||'',subscription.customer||'');
  props.setProperty(eventKey,new Date().toISOString());
}

function syncAllSubscriptions() {
  const props=PropertiesService.getScriptProperties();
  Object.keys(props.getProperties()).filter(k=>k.indexOf('BILLING_SUB_')===0).forEach(key=>{
    const record=JSON.parse(props.getProperty(key)||'{}');if(!record.uid||!record.subscriptionId||!record.plan)return;
    const subscription=stripeRequest_('/v1/subscriptions/'+encodeURIComponent(record.subscriptionId),'get');
    if(['active','trialing'].includes(subscription.status)) applySubscriptionFulfilment_(record.uid,record.plan,subscription,'sync');
    else setBillingProfile_(record.uid,'free',record.subscriptionId,subscription.customer||'');
  });
}

function updateCreditBuckets_(uid,mutator) {
  for(let attempt=0;attempt<3;attempt++){
    const transaction=generationFirestore_(':beginTransaction','post',{}).transaction;let committed=false;
    try{
      const path='/users/'+encodeURIComponent(uid)+'/credits/balance?transaction='+encodeURIComponent(transaction);
      const doc=generationFirestore_(path,'get',undefined,true),current=TEACHR_CREDIT_USAGE.normaliseCreditRecord(generationFields_(doc)),next=mutator(current);
      const r=next.record||next;
      generationFirestore_(':commit','post',{transaction,writes:[{update:{name:'projects/'+CONFIG.FIREBASE_PROJECT_ID+'/databases/(default)/documents/users/'+uid+'/credits/balance',fields:{balance:{integerValue:String(r.balance)},monthlyCredits:{integerValue:String(r.monthlyCredits)},starterCredits:{integerValue:String(r.starterCredits)},purchasedCredits:{integerValue:String(r.purchasedCredits)},initialAllocation:{integerValue:String(r.initialAllocation)},totalGranted:{integerValue:String(r.totalGranted)},totalConsumed:{integerValue:String(r.totalConsumed)},schemaVersion:{integerValue:String(r.schemaVersion)},migrated:{booleanValue:r.migrated===true}}},updateMask:{fieldPaths:['balance','monthlyCredits','starterCredits','purchasedCredits','initialAllocation','totalGranted','totalConsumed','schemaVersion','migrated']},updateTransforms:[{fieldPath:'updatedAt',setToServerValue:'REQUEST_TIME'}]}]});
      committed=true;return r;
    }catch(error){if(!error.retryable||attempt===2)throw error;}finally{if(!committed){try{generationFirestore_(':rollback','post',{transaction});}catch(_){}}}
  }
}

function setBillingProfile_(uid,plan,subscriptionId,customerId) {
  const active=plan!=='free',fields={role:{stringValue:'member'},plan:{stringValue:plan},subscriptionStatus:{stringValue:active?'active':'inactive'},stripeSubscriptionId:{stringValue:subscriptionId||''},stripeCustomerId:{stringValue:String(customerId||'')},updatedAt:{timestampValue:new Date().toISOString()}};
  const masks=Object.keys(fields).map(k=>'updateMask.fieldPaths='+encodeURIComponent(k)).join('&');
  const url='https://firestore.googleapis.com/v1/projects/'+CONFIG.FIREBASE_PROJECT_ID+'/databases/(default)/documents/users/'+encodeURIComponent(uid)+'?'+masks;
  const response=UrlFetchApp.fetch(url,{method:'patch',contentType:'application/json',headers:{Authorization:'Bearer '+ScriptApp.getOAuthToken()},payload:JSON.stringify({fields}),muteHttpExceptions:true});
  if(response.getResponseCode()>=300) throw new Error('Firestore billing profile update failed.');
}
