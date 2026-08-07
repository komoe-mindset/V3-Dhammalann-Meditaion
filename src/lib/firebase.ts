import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import defaultConfig from '../../firebase-applet-config.json';

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

const firebaseConfig = USE_CUSTOM_CONFIG ? customConfig : defaultConfig;

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Initialize Firestore with specific database ID if configured
const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export { app, auth, db, googleProvider, signInWithPopup, signOut };

