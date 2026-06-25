// Client-side Firebase Authentication helpers.
//
// The app authenticates with Google sign-in. The signed-in user's uid becomes
// their identity everywhere (their role lives in users/{uid}.accessRole). Every
// privileged API call uses `authedFetch`, which attaches the current ID token as
// a Bearer header so the server can verify the caller (see src/lib/route-auth.ts).

"use client";

import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";

import { auth } from "./firebase";

export type { User };

const googleProvider = new GoogleAuthProvider();

// Subscribe to sign-in/out. Returns an unsubscribe function. No-op (reports
// signed-out) when Firebase Auth isn't configured.
export function onAuthChange(cb: (user: User | null) => void): () => void {
  if (!auth) {
    cb(null);
    return () => {};
  }
  return onAuthStateChanged(auth, cb);
}

// Email + password sign-in. The signed-in user's uid is their identity; the
// app provisions users/{uid} in Firestore on first sign-in (see
// /api/auth/provision), so the profile lands in the same place as before.
export async function signInWithEmail(
  email: string,
  password: string
): Promise<void> {
  if (!auth) throw new Error("Authentication is not configured.");
  await signInWithEmailAndPassword(auth, email.trim(), password);
}

export async function signInWithGoogle(): Promise<void> {
  if (!auth) throw new Error("Authentication is not configured.");
  await signInWithPopup(auth, googleProvider);
}

export async function signOutUser(): Promise<void> {
  if (!auth) return;
  await signOut(auth);
}

// The current user's fresh ID token, or null when signed out / unconfigured.
export async function getIdToken(): Promise<string | null> {
  const user = auth?.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

// fetch() that attaches the Firebase ID token as `Authorization: Bearer …` when
// a user is signed in. Use for every call to a privileged API route. Falls back
// to a plain fetch when signed out (the server then enforces its own policy).
export async function authedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const token = await getIdToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}
