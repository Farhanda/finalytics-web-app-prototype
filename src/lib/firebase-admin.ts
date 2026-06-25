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
import { getAuth, type Auth } from "firebase-admin/auth";

import { checkEnv, formatEnvReport } from "./env";

const projectId =
  process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
// Env values escape newlines as "\n" — turn them back into real newlines.
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

export const adminReady = Boolean(projectId && clientEmail && privateKey);

// One-time startup audit: surface ALL missing required env vars in one place
// (see src/lib/env.ts) instead of failing one service at a time. Server-only,
// and quiet under the test runner.
if (typeof window === "undefined" && !process.env.VITEST) {
  const report = checkEnv();
  if (!report.ready) {
    console.warn("[env] Some required configuration is missing.\n" + formatEnvReport(report));
  }
}

// cert() parses the private key eagerly, so a malformed FIREBASE_PRIVATE_KEY
// (surrounding quotes or un-unescaped newlines — the classic Vercel env paste
// mistake) throws right here at module load. Because almost every API route
// imports this module, an unguarded throw takes the WHOLE server down: the
// function crashes during initialization and Next serves a generic 500 HTML
// page before any route handler runs. Catch it so the failure degrades to the
// same graceful "server auth not configured" path as a missing key, and log
// the real reason for the server logs.
let app: App | undefined;
let adminInitError: string | null = null;
if (adminReady) {
  try {
    app = getApps().length
      ? getApp()
      : initializeApp({
          credential: cert({ projectId, clientEmail, privateKey }),
        });
  } catch (err) {
    adminInitError = err instanceof Error ? err.message : String(err);
    console.error(
      "[firebase-admin] Failed to initialize the Admin SDK — check that " +
        "FIREBASE_PRIVATE_KEY is the unquoted PEM (literal \\n escapes are OK):",
      err
    );
  }
}

// The Admin SDK initialization error message, if any — surfaced by API routes
// so a bad service-account key is diagnosable from the client response.
export const adminInitErrorMessage = adminInitError;

export const adminDb: Firestore | null = app ? getFirestore(app) : null;

// Firebase Auth (Admin) — used server-side to verify the ID token a signed-in
// browser sends on privileged API routes. Null until the Admin SDK is configured;
// when null, token verification is impossible and routes treat auth as
// "unenforceable" (local/demo posture). Production REQUIRES the Admin SDK.
export const adminAuth: Auth | null = app ? getAuth(app) : null;

// The initialized Admin app (or null) — exported so the Storage helper can reach
// the same credentials without re-initializing.
export const adminApp: App | null = app ?? null;
