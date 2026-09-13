import { firebaseConfig } from './firebase-config.js';

const nativeFetch = window.fetch.bind(window);
const projectId = firebaseConfig.projectId;
const firestoreBase = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents`;

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

function decodeFields(fields = {}) {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, fieldValue(value)]));
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}

async function readProductionUsage(url, options) {
  const token = new Headers(options?.headers || {}).get('Authorization');
  if (!token) return jsonResponse({ error: 'Administrator sign-in is required' }, 401);
  const uid = new URL(url, location.href).searchParams.get('uid');
  if (!uid) return jsonResponse({ error: 'A user ID is required' }, 400);
  const headers = { Authorization: token };
  const encodedUid = encodeURIComponent(uid);
  const [profileResponse, usageResponse] = await Promise.all([
    nativeFetch(`${firestoreBase}/users/${encodedUid}`, { headers }),
    nativeFetch(`${firestoreBase}/users/${encodedUid}/usage?pageSize=20`, { headers })
  ]);
  if (!profileResponse.ok) {
    const error = await profileResponse.json().catch(() => ({}));
    return jsonResponse({ error: error?.error?.message || 'Unable to read member profile' }, profileResponse.status);
  }
  if (!usageResponse.ok) {
    const error = await usageResponse.json().catch(() => ({}));
    return jsonResponse({ error: error?.error?.message || 'Unable to read generation usage' }, usageResponse.status);
  }
  const profileDoc = await profileResponse.json();
  const usagePayload = await usageResponse.json();
  const profile = decodeFields(profileDoc.fields);
  const usage = {};
  for (const document of usagePayload.documents || []) {
    const toolId = decodeURIComponent(document.name.split('/').pop());
    const record = decodeFields(document.fields);
    const successfulGenerations = Number(record.successfulGenerations) || 0;
    const allowance = Number.isInteger(Number(record.allowance)) ? Number(record.allowance) : 3;
    usage[toolId] = { ...record, successfulGenerations, allowance, remaining: Math.max(0, allowance - successfulGenerations) };
  }
  return jsonResponse({ uid, ...profile, usage });
}

window.fetch = async function teachrProductionFetch(input, options = {}) {
  const url = typeof input === 'string' ? input : input?.url || '';
  const parsed = new URL(url, location.href);
  if (options.method?.toUpperCase() !== 'POST' && parsed.origin === location.origin && parsed.pathname.endsWith('/api/admin/usage')) {
    return readProductionUsage(url, options);
  }
  return nativeFetch(input, options);
};
