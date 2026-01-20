import admin from 'firebase-admin';
import { getAdminApp } from './firebaseAdmin.js';

export function getDb() {
  getAdminApp();
  return admin.firestore();
}

export function nowTs() {
  return admin.firestore.Timestamp.now();
}
