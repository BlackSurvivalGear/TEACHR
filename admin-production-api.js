import { firebaseConfig } from './firebase-config.js';

const nativeFetch = window.fetch.bind(window);
const projectId = firebaseConfig.projectId;
const firestoreBase = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents`;
const firestoreCommit = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents:commit`;
const toolIds = ['lesson','worksheet','quiz','differentiate','curriculum','revision','parent'];

function fieldValue(field) {
  if (!field || typeof field !== 'object') return undefined;
  if ('stringValue' in field) return field.stringValue;
  if ('integerValue' in field) return Number(field.integerValue);
  if ('doubleValue' in field) return Number(field.doubleValue);
  if ('booleanValue' in field) return field.booleanValue;
  if ('timestampValue' in field) return field.timestampValue;
  if ('nullValue' in field) return null;
  return undefined;
}
function decodeFields(fields = {}) { return Object.fromEntries(Object.entries(fields).map(([key,value]) => [key,fieldValue(value)])); }
function jsonResponse(payload,status=200){ return new Response(JSON.stringify(payload),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}}); }
function bearer(options){ return new Headers(options?.headers || {}).get('Authorization') || ''; }
function uidFromUrl(url){ return new URL(url,location.href).searchParams.get('uid') || ''; }
function usageDocumentName(uid,toolId){ return `projects/${projectId}/databases/(default)/documents/users/${uid}/usage/${toolId}`; }
function mapField(value){
  const fields={};
  for(const [key,item] of Object.entries(value)){
    if(typeof item==='number') fields[key]={integerValue:String(item)};
    else if(typeof item==='boolean') fields[key]={booleanValue:item};
    else fields[key]={stringValue:String(item ?? '')};
  }
  return {mapValue:{fields}};
}

async function readUsageRecords(uid, token){
  const encodedUid=encodeURIComponent(uid),headers={Authorization:token};
  const [profileResponse,usageResponse]=await Promise.all([
    nativeFetch(`${firestoreBase}/users/${encodedUid}`,{headers}),
    nativeFetch(`${firestoreBase}/users/${encodedUid}/usage?pageSize=20`,{headers})
  ]);
  if(!profileResponse.ok){const error=await profileResponse.json().catch(()=>({}));throw Object.assign(new Error(error?.error?.message||'Unable to read member profile'),{status:profileResponse.status});}
  if(!usageResponse.ok){const error=await usageResponse.json().catch(()=>({}));throw Object.assign(new Error(error?.error?.message||'Unable to read generation usage'),{status:usageResponse.status});}
  const profileDoc=await profileResponse.json(),usagePayload=await usageResponse.json(),profile=decodeFields(profileDoc.fields),usage={};
  for(const document of usagePayload.documents||[]){const toolId=decodeURIComponent(document.name.split('/').pop()),record=decodeFields(document.fields),successfulGenerations=Number(record.successfulGenerations)||0,allowance=Number.isInteger(Number(record.allowance))?Number(record.allowance):3;usage[toolId]={...record,successfulGenerations,allowance,remaining:Math.max(0,allowance-successfulGenerations)};}
  return {uid,...profile,usage};
}

async function readProductionUsage(url,options){
  const token=bearer(options); if(!token)return jsonResponse({error:'Administrator sign-in is required'},401);
  const uid=uidFromUrl(url); if(!uid)return jsonResponse({error:'A user ID is required'},400);
  try{return jsonResponse(await readUsageRecords(uid,token));}catch(error){return jsonResponse({error:error.message||'Unable to read generation usage'},error.status||503);}
}

async function adjustProductionUsage(options){
  const token=bearer(options); if(!token)return jsonResponse({error:'Administrator sign-in is required'},401);
  let input; try{input=JSON.parse(options.body||'{}');}catch{return jsonResponse({error:'Invalid request body'},400);}
  const uid=String(input.uid||'').trim(),action=input.action,tool=input.tool,amount=Number(input.amount);
  if(!uid)return jsonResponse({error:'A target user is required'},400);
  if(!['add','reset'].includes(action))return jsonResponse({error:'Action must be add or reset'},400);
  if(tool!=='all'&&!toolIds.includes(tool))return jsonResponse({error:'Select a valid generating tool or all tools'},400);
  if(action==='add'&&(!Number.isInteger(amount)||amount<1||amount>1000))return jsonResponse({error:'Added generations must be an integer from 1 to 1000'},400);
  try{
    const current=await readUsageRecords(uid,token),selected=tool==='all'?toolIds:[tool],now=new Date().toISOString();
    const writes=selected.map(toolId=>{
      const record=current.usage[toolId]||{successfulGenerations:0,allowance:3};
      const used=Number(record.successfulGenerations)||0,currentAllowance=Number.isInteger(Number(record.allowance))?Number(record.allowance):3;
      const newAllowance=action==='reset'?used+3:Math.max(currentAllowance,used)+amount;
      const audit={action,amount:action==='reset'?3:amount,adminUid:'firebase-authenticated-admin',reason:String(input.reason||'Admin dashboard adjustment').slice(0,240),at:now};
      return {update:{name:usageDocumentName(uid,toolId),fields:{toolId:{stringValue:toolId},successfulGenerations:{integerValue:String(used)},allowance:{integerValue:String(newAllowance)},updatedAt:{timestampValue:now},lastAdminAdjustment:mapField(audit)}},updateMask:{fieldPaths:['toolId','successfulGenerations','allowance','updatedAt','lastAdminAdjustment']}};
    });
    const response=await nativeFetch(firestoreCommit,{method:'POST',headers:{Authorization:token,'Content-Type':'application/json'},body:JSON.stringify({writes})});
    const payload=await response.json().catch(()=>({}));
    if(!response.ok)return jsonResponse({error:payload?.error?.message||'Unable to update generation allowance'},response.status);
    return jsonResponse({ok:true,uid,action,tool});
  }catch(error){return jsonResponse({error:error.message||'Unable to update generation allowance'},error.status||503);}
}

window.fetch=async function teachrProductionFetch(input,options={}){
  const url=typeof input==='string'?input:input?.url||'',parsed=new URL(url,location.href),method=(options.method||'GET').toUpperCase();
  if(parsed.origin===location.origin&&parsed.pathname.endsWith('/api/admin/usage')&&method==='GET')return readProductionUsage(url,options);
  if(parsed.origin===location.origin&&parsed.pathname.endsWith('/api/admin/usage-adjustment')&&method==='POST')return adjustProductionUsage(options);
  return nativeFetch(input,options);
};
