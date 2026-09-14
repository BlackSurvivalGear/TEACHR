import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js';
import { firebaseConfig } from './firebase-config.js';

// Use the default Firebase app name so Auth reads the same persisted session
// created by teachr-auth.js on the main TEACHR workspace.
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const content = document.getElementById('vleContent');
const locked = document.getElementById('vleLocked');

function requiresVerification(user) {
  return Boolean(user && user.providerData?.some(provider => provider.providerId === 'password') && !user.emailVerified);
}

onAuthStateChanged(auth, user => {
  if (!user || requiresVerification(user)) {
    content.hidden = true;
    locked.classList.add('show');
    return;
  }
  locked.classList.remove('show');
  content.hidden = false;
});
