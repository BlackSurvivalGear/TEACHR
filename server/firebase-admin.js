const { applicationDefault, cert, getApps, initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { FieldValue, getFirestore } = require('firebase-admin/firestore');

let services;

function credentialFromEnvironment() {
  const encoded = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!encoded) return applicationDefault();
  let serviceAccount;
  try { serviceAccount = JSON.parse(encoded); }
  catch { throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON must contain valid JSON'); }
  return cert(serviceAccount);
}

function getFirebaseAdminServices() {
  if (services) return services;
  const app = getApps()[0] || initializeApp({ credential: credentialFromEnvironment() });
  services = {
    auth: getAuth(app),
    db: getFirestore(app),
    serverTimestamp: () => FieldValue.serverTimestamp()
  };
  return services;
}

module.exports = { getFirebaseAdminServices };
