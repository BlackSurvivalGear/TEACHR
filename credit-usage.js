/* Browser universal TEACHR Credit model. Keep in sync with apps-script/CreditUsage.gs. */
(function initialiseCreditUsage(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.TEACHR_CREDIT_USAGE=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const INITIAL_FREE_CREDITS=18,CREDIT_SCHEMA_VERSION=1;
  const GENERATING_TOOL_IDS=Object.freeze(['lesson','worksheet','quiz','differentiate','curriculum','revision','presentation']);
  const UNLIMITED_ROLES=Object.freeze(['pro','admin','superadmin']);
  const nonNegativeInteger=(value,fallback=0)=>{const n=Number(value);return Number.isInteger(n)&&n>=0?n:fallback;};
  function hasUnlimitedCredits(profile={}){return profile.plan==='pro'||UNLIMITED_ROLES.includes(profile.role);}
  function createCreditRecord(balance=INITIAL_FREE_CREDITS,options={}){return{balance:nonNegativeInteger(balance,INITIAL_FREE_CREDITS),initialAllocation:nonNegativeInteger(options.initialAllocation,INITIAL_FREE_CREDITS),totalGranted:nonNegativeInteger(options.totalGranted),totalConsumed:nonNegativeInteger(options.totalConsumed),schemaVersion:CREDIT_SCHEMA_VERSION,migrated:options.migrated===true,updatedAt:options.updatedAt??null};}
  function normaliseCreditRecord(record){return record&&typeof record==='object'?createCreditRecord(record.balance,record):createCreditRecord();}
  return Object.freeze({INITIAL_FREE_CREDITS,CREDIT_SCHEMA_VERSION,GENERATING_TOOL_IDS,UNLIMITED_ROLES,hasUnlimitedCredits,createCreditRecord,normaliseCreditRecord});
});
