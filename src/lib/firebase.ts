// Firebase Web (client) SDK initialization.
//
// Config comes from NEXT_PUBLIC_FIREBASE_* env vars (see .env.example). These are
// inlined into the client bundle and are safe to expose — Firestore Security
// Rules, not key secrecy, control access.
//
// We use the singleton pattern (getApps()/getApp()) so the app initializes once
// and survives Fast Refresh / re-renders without throwing "duplicate app".

import { getApps, getApp, initializeApp, type FirebaseOptions } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// True only when the essential config is present. Components can use this to show
// a friendly "configure Firebase" message instead of crashing on a bad connect.
export const firebaseReady = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId
);

if (!firebaseReady && typeof window !== "undefined") {
  console.warn(
    "[firebase] Missing NEXT_PUBLIC_FIREBASE_* env vars. Copy .env.example to " +
      ".env.local, paste your Firebase web config, and restart the dev server."
  );
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);

// getAuth() eagerly validates the API key and throws auth/invalid-api-key when
// Firebase isn't configured (e.g. during a build with no env). Firestore connects
// lazily and doesn't, so only Auth needs this guard. Null when unconfigured; the
// auth helpers in ./auth degrade gracefully.
export const auth: Auth | null = firebaseReady ? getAuth(app) : null;

// Whether the app should REQUIRE a signed-in user. Secure-by-default: on as soon
// as Firebase is configured. Set NEXT_PUBLIC_REQUIRE_AUTH=false to fall back to
// the local demo identity switcher (no real sign-in) for development only.
export const authRequired =
  firebaseReady && process.env.NEXT_PUBLIC_REQUIRE_AUTH !== "false";
