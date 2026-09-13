import {
  collection,
  getDocs
} from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js';

const model = window.TEACHR_GENERATION_USAGE;
if (!model) throw new Error('TEACHR generation usage model is not loaded');

let requestVersion = 0;
let state = createState('signed-out');

function createState(status, values = {}) {
  return {
    status,
    uid: values.uid || null,
    unlimited: values.unlimited === true,
    tools: values.tools || {},
    error: values.error || null
  };
}

function copyState() {
  return {
    ...state,
    tools: Object.fromEntries(Object.entries(state.tools).map(([toolId, usage]) => [toolId, { ...usage }]))
  };
}

function publish(nextState) {
  state = nextState;
  window.dispatchEvent(new CustomEvent('teachr:usagechange', { detail: copyState() }));
}

async function load(account) {
  const version = ++requestVersion;
  if (!account?.uid) {
    publish(createState('signed-out'));
    return copyState();
  }

  publish(createState('loading', { uid: account.uid }));
  try {
    const snapshot = await getDocs(collection(window.TEACHR_AUTH.db, 'users', account.uid, 'usage'));
    if (version !== requestVersion) return copyState();
    const records = snapshot.docs.map(document => ({ ...document.data(), toolId: document.id }));
    const usage = model.createUsageSnapshot(account, records);
    publish(createState('ready', { uid: account.uid, ...usage }));
  } catch (error) {
    if (version !== requestVersion) return copyState();
    console.error('Unable to load TEACHR generation usage:', error);
    publish(createState('error', {
      uid: account.uid,
      error: 'Generation usage is temporarily unavailable'
    }));
  }
  return copyState();
}

function getRemaining(toolId) {
  if (state.status !== 'ready') return undefined;
  if (state.unlimited) return null;
  return state.tools[toolId]?.remaining;
}

function applyGenerationResult(toolId, usage) {
  if (state.status !== 'ready' || !model.isGeneratingTool(toolId) || !usage) return copyState();
  if (usage.unlimited === true) {
    publish(createState('ready', { uid: state.uid, unlimited: true, tools: state.tools }));
    return copyState();
  }
  const current = state.tools[toolId];
  if (!current || !Number.isInteger(usage.remaining) || usage.remaining < 0) return copyState();
  publish(createState('ready', {
    uid: state.uid,
    unlimited: false,
    tools: {
      ...state.tools,
      [toolId]: {
        ...current,
        successfulGenerations: Math.max(0, current.allowance - usage.remaining),
        remaining: Math.min(current.allowance, usage.remaining)
      }
    }
  }));
  return copyState();
}

window.addEventListener('teachr:authchange', event => load(event.detail?.user));

window.TEACHR_USAGE = Object.freeze({
  getSnapshot: copyState,
  getRemaining,
  applyGenerationResult,
  refresh: () => load(window.TEACHR_AUTH?.getAccount?.())
});

const currentAccount = window.TEACHR_AUTH?.getAccount?.();
if (currentAccount) load(currentAccount);
