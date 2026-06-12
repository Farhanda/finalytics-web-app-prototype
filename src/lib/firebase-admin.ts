// Firebase Admin SDK (server-only).
//
// Used by the GitHub webhook route so commit-driven writes happen with
// privileged server credentials instead of the browser client SDK. This is the
// production-correct path: writes don't depend on permissive Firestore rules.
//
// Credentials come from a service account (Firebase console → Project settings →
// Service accounts → Generate new private key), provided via server-only env:
//   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
// `adminReady` is false until all three are set — callers fall back gracefully.

import { getApps, getApp, initializeApp, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

const projectId =
  process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
// Env values escape newlines as "\n" — turn them back into real newlines.
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

export const adminReady = Boolean(projectId && clientEmail && privateKey);

let app: App | undefined;
if (adminReady) {
  app = getApps().length
    ? getApp()
    : initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
      });
}

export const adminDb: Firestore | null = app ? getFirestore(app) : null;

// The initialized Admin app (or null) — exported so the Storage helper can reach
// the same credentials without re-initializing.
export const adminApp: App | null = app ?? null;
