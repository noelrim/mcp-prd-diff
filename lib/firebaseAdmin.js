import admin from 'firebase-admin';

let appInstance = null;

export function getAdminApp() {
  if (appInstance) return appInstance;

  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!json) {
    throw new Error('Missing env FIREBASE_SERVICE_ACCOUNT_JSON');
  }

  const creds = JSON.parse(json);
  appInstance = admin.initializeApp({
    credential: admin.credential.cert(creds)
  });

  return appInstance;
}
