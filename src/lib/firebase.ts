import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, setLogLevel, enableIndexedDbPersistence } from 'firebase/firestore';
import defaultConfig from '../../firebase-applet-config.json';

// Silence non-fatal Firestore connection attempt logs when offline or on poor network
try {
  setLogLevel('error');
} catch (e) {
  // Ignore log level setup errors
}

/**
 * CLIENT HANDOFF & FIREBASE CONFIGURATION GUIDE
 * --------------------------------------------------------------------------
 * By default, this app uses the automatically provisioned AI Studio Firebase
 * configuration imported from '../../firebase-applet-config.json'.
 * 
 * If you want to connect your own standalone Firebase project in production:
 * 1. Replace the `customConfig` object below with your Firebase Web App credentials
 *    (found in Firebase Console -> Project Settings -> General -> Your apps -> Web app).
 * 2. Set `USE_CUSTOM_CONFIG = true;`.
 */
const USE_CUSTOM_CONFIG = false;

const customConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  firestoreDatabaseId: "(default)"
};

// Environment Variable Checks
const envApiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const envAuthDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
const envProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const envStorageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
const envMessagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
const envAppId = import.meta.env.VITE_FIREBASE_APP_ID;
const envDatabaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID;

const firebaseConfig = {
  apiKey: envApiKey || defaultConfig.apiKey,
  authDomain: envAuthDomain || defaultConfig.authDomain,
  projectId: envProjectId || defaultConfig.projectId,
  storageBucket: envStorageBucket || defaultConfig.storageBucket,
  messagingSenderId: envMessagingSenderId || defaultConfig.messagingSenderId,
  appId: envAppId || defaultConfig.appId,
  firestoreDatabaseId: envDatabaseId || (defaultConfig as any).firestoreDatabaseId || '(default)'
};

let isFirebaseConfigValid = true;
let firebaseConfigError: string | null = null;

// Check if VITE_FIREBASE_API_KEY is missing, undefined, or empty placeholder
if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'YOUR_FIREBASE_API_KEY' || firebaseConfig.apiKey === '') {
  isFirebaseConfigValid = false;
  firebaseConfigError = 'Firebase Config မပြည့်စုံပါ။ Cloudflare Pages Deployment Environment Variables တွင် VITE_FIREBASE_... များကို စစ်ဆေးပေးပါ။';
  console.warn('⚠️ Firebase Initialization Warning: VITE_FIREBASE_API_KEY is missing or undefined. Please check Cloudflare Pages Deployment Environment Variables.');
}

let app;
try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
} catch (err: any) {
  isFirebaseConfigValid = false;
  firebaseConfigError = 'Firebase Config မပြည့်စုံပါ။ Cloudflare Pages Deployment Environment Variables တွင် VITE_FIREBASE_... များကို စစ်ဆေးပေးပါ။';
  console.warn('⚠️ Firebase Initialization Error:', err?.message || err);
  app = getApps().length ? getApp() : initializeApp({ apiKey: 'invalid-placeholder-key', projectId: 'invalid-placeholder-project' });
}

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Initialize Firestore with specific database ID if configured
const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Enable offline persistence for seamless performance when offline or on unstable networks
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    // Multiple tabs open, persistence can only be enabled in one tab at a time.
  } else if (err.code === 'unimplemented') {
    // The current browser does not support all of the features required to enable persistence
  }
});

export { app, auth, db, googleProvider, signInWithPopup, signOut, isFirebaseConfigValid, firebaseConfigError };

