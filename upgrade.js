import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js';
import { doc, getDoc, getFirestore } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const button = document.getElementById('upgrade-pro');
const status = document.getElementById('upgrade-status');
const api = window.TEACHR_PAYMENT?.appsScriptUrl || '';
const requestedReturn = new URLSearchParams(location.search).get('return');
const returnTo = requestedReturn && /^index\.html(?:[?#]|$)/.test(requestedReturn) ? requestedReturn : 'index.html';
let activationTimer = null;

function setStatus(message, type = '') { status.textContent = message; status.dataset.type = type; }
function hasPro(profile, user) {
  return profile.plan === 'pro' || ['pro', 'admin', 'superadmin'].includes(profile.role) || user.email?.toLowerCase() === 'admin@lawal.org';
}
async function readProfile(user) {
  const snapshot = await getDoc(doc(db, 'users', user.uid));
  return snapshot.data() || {};
}
function finishUpgrade() {
  if (activationTimer) clearInterval(activationTimer);
  setStatus('Pro TEACHR is active. Restoring your workspace.');
  button.textContent = 'Return to TEACHR';
  button.disabled = false;
  button.onclick = () => location.replace(returnTo);
  setTimeout(() => location.replace(returnTo), 900);
}
function watchForActivation(user) {
  if (activationTimer) clearInterval(activationTimer);
  let checks = 0;
  activationTimer = setInterval(async () => {
    if (++checks > 120) { clearInterval(activationTimer); activationTimer = null; setStatus('Checkout is still pending. Complete payment, then return to this tab.'); return; }
    try {
      const profile = await readProfile(user);
      if (hasPro(profile, user)) finishUpgrade();
    } catch (error) { console.warn('Unable to refresh Pro status:', error); }
  }, 2000);
}

onAuthStateChanged(auth, async (user) => {
  if (!user) { setStatus('Please sign in before upgrading.', 'error'); setTimeout(() => location.replace('index.html'), 1000); return; }
  try {
    const profile = await readProfile(user);
    if (hasPro(profile, user)) { finishUpgrade(); return; }
    if (!api) { setStatus('Payment setup is awaiting the TEACHR checkout web-app URL.', 'error'); return; }
    setStatus(`Signed in as ${user.email}`); button.disabled = false;
    button.onclick = () => {
      const checkoutUrl = `${api}?action=pro-pay&uid=${encodeURIComponent(user.uid)}&email=${encodeURIComponent(user.email || '')}`;
      const checkoutWindow = window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
      if (!checkoutWindow) {
        setStatus('Your browser blocked the checkout window. Allow pop-ups for TEACHR and try again.', 'error');
        return;
      }
      button.disabled = true;
      setStatus('Stripe checkout opened in a new secure tab. Your completed TEACHR form is preserved here. Access will restore automatically after activation.');
      watchForActivation(user);
    };
  } catch (error) { console.error(error); setStatus('Your TEACHR account could not be checked. Please try again.', 'error'); }
});
