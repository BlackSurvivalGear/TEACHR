import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js';
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile
} from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

const state = {
  status: 'loading',
  user: null,
  mode: 'public'
};

const authButton = document.getElementById('authButton');
const profileButton = document.getElementById('profileButton');
const profileName = document.getElementById('profileName');
const avatar = document.getElementById('avatar');
const dialog = document.getElementById('authDialog');
const form = document.getElementById('authForm');
const title = document.getElementById('authTitle');
const subtitle = document.getElementById('authSubtitle');
const nameField = document.getElementById('authNameField');
const nameInput = document.getElementById('authName');
const emailInput = document.getElementById('authEmail');
const passwordInput = document.getElementById('authPassword');
const submitButton = document.getElementById('authSubmit');
const googleButton = document.getElementById('googleSignIn');
const modeButton = document.getElementById('authModeToggle');
const errorBox = document.getElementById('authError');
const signOutButton = document.getElementById('signOutButton');

let createMode = false;

function friendlyAuthError(error) {
  const code = error?.code || '';
  const messages = {
    'auth/email-already-in-use': 'That email address already has a TEACHR account.',
    'auth/invalid-credential': 'Email or password is incorrect.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/missing-password': 'Enter your password.',
    'auth/popup-closed-by-user': 'Google sign-in was closed before it finished.',
    'auth/popup-blocked': 'Your browser blocked the Google sign-in window.',
    'auth/weak-password': 'Use a stronger password with at least 6 characters.',
    'auth/network-request-failed': 'Authentication could not reach Firebase. Check your connection and try again.'
  };
  return messages[code] || 'Authentication could not be completed. Please try again.';
}

function setBusy(busy) {
  submitButton.disabled = busy;
  googleButton.disabled = busy;
  modeButton.disabled = busy;
  submitButton.textContent = busy ? 'Please wait…' : (createMode ? 'Create account' : 'Sign in');
}

function setCreateMode(value) {
  createMode = Boolean(value);
  title.textContent = createMode ? 'Create your TEACHR account' : 'Sign in to TEACHR';
  subtitle.textContent = createMode
    ? 'Create an account to unlock your personal TEACHR workspace.'
    : 'Sign in to access your TEACHR workspace.';
  nameField.hidden = !createMode;
  nameInput.required = createMode;
  submitButton.textContent = createMode ? 'Create account' : 'Sign in';
  modeButton.textContent = createMode ? 'Already have an account? Sign in' : 'New to TEACHR? Create account';
  errorBox.hidden = true;
  errorBox.textContent = '';
}

function openAuthDialog(mode = 'signin') {
  setCreateMode(mode === 'create');
  form.reset();
  if (typeof dialog.showModal === 'function') dialog.showModal();
}

function closeAuthDialog() {
  if (dialog.open) dialog.close();
}

function publishAuthState(user) {
  state.user = user || null;
  state.status = user ? 'signed-in' : 'public';
  state.mode = user ? 'signed-in' : 'public';
  document.documentElement.dataset.auth = state.mode;
  window.dispatchEvent(new CustomEvent('teachr:authchange', {
    detail: {
      status: state.status,
      mode: state.mode,
      user: user ? {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || '',
        photoURL: user.photoURL || ''
      } : null
    }
  }));
}

function renderAuthState(user) {
  if (user) {
    authButton.hidden = true;
    profileButton.hidden = false;
    const displayName = user.displayName || user.email?.split('@')[0] || 'Teacher';
    profileName.textContent = displayName;
    avatar.textContent = displayName.trim().charAt(0).toUpperCase() || 'T';
    signOutButton.hidden = false;
  } else {
    authButton.hidden = false;
    profileButton.hidden = true;
    profileName.textContent = 'Teacher';
    avatar.textContent = 'T';
    signOutButton.hidden = true;
  }
}

authButton?.addEventListener('click', () => openAuthDialog('signin'));
modeButton?.addEventListener('click', () => setCreateMode(!createMode));

googleButton?.addEventListener('click', async () => {
  errorBox.hidden = true;
  setBusy(true);
  try {
    await signInWithPopup(auth, googleProvider);
    closeAuthDialog();
  } catch (error) {
    errorBox.textContent = friendlyAuthError(error);
    errorBox.hidden = false;
  } finally {
    setBusy(false);
  }
});

form?.addEventListener('submit', async event => {
  event.preventDefault();
  errorBox.hidden = true;
  setBusy(true);
  try {
    if (createMode) {
      const credential = await createUserWithEmailAndPassword(auth, emailInput.value.trim(), passwordInput.value);
      const displayName = nameInput.value.trim();
      if (displayName) await updateProfile(credential.user, { displayName });
    } else {
      await signInWithEmailAndPassword(auth, emailInput.value.trim(), passwordInput.value);
    }
    closeAuthDialog();
  } catch (error) {
    errorBox.textContent = friendlyAuthError(error);
    errorBox.hidden = false;
  } finally {
    setBusy(false);
  }
});

signOutButton?.addEventListener('click', async () => {
  try {
    await firebaseSignOut(auth);
  } catch {
    window.dispatchEvent(new CustomEvent('teachr:autherror', { detail: { message: 'Sign out could not be completed.' } }));
  }
});

onAuthStateChanged(auth, user => {
  renderAuthState(user);
  publishAuthState(user);
});

window.TEACHR_AUTH = Object.freeze({
  auth,
  db,
  getUser: () => state.user,
  getMode: () => state.mode,
  openSignIn: () => openAuthDialog('signin'),
  openCreateAccount: () => openAuthDialog('create'),
  signOut: () => firebaseSignOut(auth)
});
