// ============================================
// Firebase Configuration
// ============================================
// 
// To set up your own Firebase project:
//
// 1. Go to https://console.firebase.google.com
// 2. Click "Create a project" → name it anything (e.g., "life-planner")
// 3. Once created, click the web icon "</>" to add a web app
// 4. Copy the firebaseConfig object and paste it below
// 5. Go to Authentication → Sign-in method → enable "Google"
// 6. Go to Firestore Database → Create database → start in test mode
//
// That's it! Your app will sync across all your devices.
// ============================================

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDzqN6R7U_DJFOvQM8NHvTMU0zBuzG2ccQ",
  authDomain: "life-planner-7eb29.firebaseapp.com",
  projectId: "life-planner-7eb29",
  storageBucket: "life-planner-7eb29.firebasestorage.app",
  messagingSenderId: "981849470179",
  appId: "1:981849470179:web:601f2d68c58d207ac441d6",
  measurementId: "G-LS5EE93QZY"
};

// Only initialize if configured
const isConfigured = !!firebaseConfig.apiKey;

let app, auth, db, provider;

if (isConfigured) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  provider = new GoogleAuthProvider();
}

// ---- Auth helpers ----
export function googleSignIn() {
  if (!isConfigured) {
    console.warn("Firebase not configured. Add your config in src/firebase.js");
    return Promise.reject(new Error("Firebase not configured"));
  }
  return signInWithPopup(auth, provider);
}

export function googleSignOut() {
  if (!isConfigured) return Promise.resolve();
  return signOut(auth);
}

export function onAuth(callback) {
  if (!isConfigured) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

// ---- Firestore sync helpers ----
const STORE_KEYS = {
  data: "lp_v4_data",
  habits: "lp_v4_habits",
  years: "lp_v4_years",
  theme: "lp_v4_theme",
};

export function saveToCloud(uid, storeKey, value) {
  if (!isConfigured || !uid) return;
  const docRef = doc(db, "users", uid, "planner", storeKey);
  return setDoc(docRef, { value, updatedAt: Date.now() }, { merge: true }).catch(err => {
    console.warn("Firestore save failed:", err);
  });
}

export function listenToCloud(uid, storeKey, callback) {
  if (!isConfigured || !uid) return () => {};
  const docRef = doc(db, "users", uid, "planner", storeKey);
  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      callback(snap.data().value);
    }
  }, (err) => {
    console.warn("Firestore listen error:", err);
  });
}

export { isConfigured, STORE_KEYS };
