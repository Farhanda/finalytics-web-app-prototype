"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { authRequired, firebaseReady } from "@/lib/firebase";
import {
  onAuthChange,
  signInWithGoogle,
  signOutUser,
  type User,
} from "@/lib/auth";

type AuthCtx = {
  // Whether real sign-in is enforced (Firebase configured & not opted out).
  authRequired: boolean;
  firebaseReady: boolean;
  // The signed-in Firebase user (null when signed out or in demo mode).
  user: User | null;
  // True while we resolve the initial auth state.
  loading: boolean;
  // True once the user has a users/{uid} profile (server-provisioned).
  provisioned: boolean;
  provisionError: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // In demo mode (auth not required) we're never "loading" auth.
  const [loading, setLoading] = useState<boolean>(authRequired);
  const [provisioned, setProvisioned] = useState<boolean>(!authRequired);
  const [provisionError, setProvisionError] = useState<string | null>(null);

  useEffect(() => {
    if (!authRequired) {
      setLoading(false);
      return;
    }
    // Safety net: never strand the user on the "Checking your session…" spinner.
    // If Firebase Auth never resolves its initial state (e.g. its sign-in iframe
    // is blocked by CSP, or the network is down), stop loading after a grace
    // period and fall back to the sign-in screen with an explanation instead of
    // spinning forever.
    const timeout = setTimeout(() => {
      setLoading(false);
      setProvisionError(
        "Couldn't verify your session — check your connection and reload. " +
          "If this persists, the browser console may show a blocked request."
      );
    }, 15000);

    const unsub = onAuthChange(async (u) => {
      setUser(u);
      if (!u) {
        setProvisioned(false);
        setProvisionError(null);
        clearTimeout(timeout);
        setLoading(false);
        return;
      }
      // Ensure a profile exists (server-side, Admin SDK). First user → Admin.
      try {
        const token = await u.getIdToken();
        const res = await fetch("/api/auth/provision", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => null);
        if (res.ok && data?.ok) {
          setProvisioned(true);
          setProvisionError(null);
        } else {
          setProvisioned(false);
          setProvisionError(data?.error ?? "Could not set up your account.");
        }
      } catch {
        setProvisioned(false);
        setProvisionError(
          "Could not reach the server to set up your account."
        );
      } finally {
        clearTimeout(timeout);
        setLoading(false);
      }
    });
    return () => {
      clearTimeout(timeout);
      unsub();
    };
  }, []);

  const signIn = useCallback(async () => {
    setProvisionError(null);
    await signInWithGoogle();
  }, []);

  const signOut = useCallback(async () => {
    await signOutUser();
  }, []);

  return (
    <Ctx.Provider
      value={{
        authRequired,
        firebaseReady,
        user,
        loading,
        provisioned,
        provisionError,
        signIn,
        signOut,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
