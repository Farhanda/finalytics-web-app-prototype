#!/usr/bin/env node
// One-off helper: create (or reset the password of) a Firebase Auth user so they
// can sign in with email + password. Runs with the Admin SDK, so it needs the
// server credentials (FIREBASE_PROJECT_ID / CLIENT_EMAIL / PRIVATE_KEY) in
// .env.local — the same ones the app already uses.
//
//   node scripts/create-user.mjs <email> <password>
//   node scripts/create-user.mjs aixelindonesia@gmail.com 123123123
//
// Idempotent: if the email already exists, its password is updated instead.
// The first user to sign in to an empty workspace is provisioned as Admin by
// /api/auth/provision — this script only handles the Auth credential.

import { readFileSync, existsSync } from "node:fs";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function loadEnv() {
  const env = { ...process.env };
  if (existsSync(".env.local")) {
    const raw = readFileSync(".env.local", "utf8");
    // Handle multi-line quoted values (e.g. FIREBASE_PRIVATE_KEY spans lines).
    const re = /^([A-Z0-9_]+)=("(?:[^"\\]|\\.|\n)*"|.*)$/gim;
    let m;
    while ((m = re.exec(raw))) {
      const k = m[1];
      let v = m[2];
      if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
      if (env[k] === undefined) env[k] = v;
    }
  }
  return env;
}

const env = loadEnv();
const email = process.argv[2] || "aixelindonesia@gmail.com";
const password = process.argv[3] || "123123123";

const projectId =
  env.FIREBASE_PROJECT_ID || env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = env.FIREBASE_CLIENT_EMAIL;
const privateKey = env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  console.error(
    "Missing Firebase Admin credentials. Set FIREBASE_PROJECT_ID, " +
      "FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in .env.local."
  );
  process.exit(1);
}

const app = getApps().length
  ? getApps()[0]
  : initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const auth = getAuth(app);

try {
  let user;
  try {
    user = await auth.getUserByEmail(email);
    await auth.updateUser(user.uid, { password, emailVerified: true });
    console.log(`Updated password for existing user ${email} (uid ${user.uid}).`);
  } catch (e) {
    if (e?.code !== "auth/user-not-found") throw e;
    user = await auth.createUser({ email, password, emailVerified: true });
    console.log(`Created user ${email} (uid ${user.uid}).`);
  }
  console.log("Done. You can now sign in with this email and password.");
  process.exit(0);
} catch (err) {
  console.error("Failed:", err?.message || err);
  process.exit(1);
}
