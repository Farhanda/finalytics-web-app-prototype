"use client";

import { useState } from "react";
import { Loader2, LogIn, TriangleAlert } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/dashboard/auth-provider";

// Full-screen gate shown when auth is required and nobody is signed in (or the
// signed-in user couldn't be provisioned). Google is the only sign-in method.
export function SignIn() {
  const { signIn, provisionError, user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    setBusy(true);
    setError(null);
    try {
      await signIn();
    } catch (e) {
      // Popup closed / blocked / config missing.
      setError(
        e instanceof Error
          ? e.message.replace(/^Firebase:\s*/, "")
          : "Sign-in failed. Please try again."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-muted/30 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="flex justify-center">
          <Logo />
        </div>
        <h1 className="mt-6 text-center font-heading text-xl font-bold text-foreground">
          Sign in to autom8
        </h1>
        <p className="mt-1.5 text-center text-sm text-muted-foreground">
          Use your workspace Google account to continue.
        </p>

        <Button
          className="mt-6 w-full font-semibold"
          onClick={handleSignIn}
          disabled={busy}
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <LogIn className="size-4" />
          )}
          Continue with Google
        </Button>

        {/* A signed-in user who couldn't be provisioned (e.g. server auth not
            configured) lands here with an explanation. */}
        {(error || (user && provisionError)) && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2.5 text-xs text-amber-800">
            <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
            <span>{error ?? provisionError}</span>
          </div>
        )}

        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          Access is limited to members of this workspace. The first person to
          sign in becomes the workspace Admin.
        </p>
      </div>
    </div>
  );
}
