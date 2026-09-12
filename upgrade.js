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

function setStatus(message, type = '') { status.textContent = message; status.dataset.type = type; }

onAuthStateChanged(auth, async (user) => {
  if (!user) { setStatus('Please sign in before upgrading.', 'error'); setTimeout(() => location.replace('index.html'), 1000); return; }
  try {
    const snapshot = await getDoc(doc(db, 'users', user.uid));
    const profile = snapshot.data() || {};
    if (profile.plan === 'pro' || ['pro', 'admin', 'superadmin'].includes(profile.role) || user.email?.toLowerCase() === 'admin@lawal.org') {
      setStatus('Pro TEACHR is already active on this account.');
      button.textContent = 'Return to TEACHR'; button.disabled = false; button.onclick = () => location.href = 'index.html'; return;
    }
    if (!api) { setStatus('Payment setup is awaiting the TEACHR checkout web-app URL.', 'error'); return; }
    setStatus(`Signed in as ${user.email}`); button.disabled = false;
    button.onclick = () => {
      button.disabled = true; setStatus('Opening secure Stripe checkout…');
      location.href = `${api}?action=pro-pay&uid=${encodeURIComponent(user.uid)}&email=${encodeURIComponent(user.email || '')}`;
    };
  } catch (error) { console.error(error); setStatus('Your TEACHR account could not be checked. Please try again.', 'error'); }
});
