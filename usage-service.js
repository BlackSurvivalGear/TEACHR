import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js';

const model = window.TEACHR_CREDIT_USAGE;
if (!model) throw new Error('TEACHR Credit usage model is not loaded');

let requestVersion = 0;
let state = createState('signed-out');

function createState(status, values = {}) {
  return { status, uid: values.uid || null, unlimited: values.unlimited === true, creditsRemaining: values.creditsRemaining, error: values.error || null };
}
function copyState() { return { ...state }; }
function publish(nextState) { state=nextState; window.dispatchEvent(new CustomEvent('teachr:usagechange',{detail:copyState()})); }

async function load(account) {
  const version=++requestVersion;
  if(!account?.uid){publish(createState('signed-out'));return copyState();}
  publish(createState('loading',{uid:account.uid}));
  try {
    const snapshot=await getDoc(doc(window.TEACHR_AUTH.db,'users',account.uid,'credits','balance'));
    if(version!==requestVersion)return copyState();
    const record=model.normaliseCreditRecord(snapshot.exists()?snapshot.data():null);
    const unlimited=model.hasUnlimitedCredits(account);
    publish(createState('ready',{uid:account.uid,unlimited,creditsRemaining:unlimited?null:record.balance}));
  } catch(error) {
    if(version!==requestVersion)return copyState();
    console.error('Unable to load TEACHR Credits:',error);
    publish(createState('error',{uid:account.uid,error:'TEACHR Credits are temporarily unavailable'}));
  }
  return copyState();
}

function getRemaining(){if(state.status!=='ready')return undefined;return state.unlimited?null:state.creditsRemaining;}
function applyGenerationResult(_toolId,usage){
  if(state.status!=='ready'||!usage)return copyState();
  if(usage.unlimited===true){publish(createState('ready',{uid:state.uid,unlimited:true,creditsRemaining:null}));return copyState();}
  if(!Number.isInteger(usage.creditsRemaining)||usage.creditsRemaining<0)return copyState();
  publish(createState('ready',{uid:state.uid,unlimited:false,creditsRemaining:usage.creditsRemaining}));
  return copyState();
}
window.addEventListener('teachr:authchange',event=>load(event.detail?.user));
window.TEACHR_USAGE=Object.freeze({getSnapshot:copyState,getRemaining,applyGenerationResult,refresh:()=>load(window.TEACHR_AUTH?.getAccount?.())});
const currentAccount=window.TEACHR_AUTH?.getAccount?.();if(currentAccount)load(currentAccount);
