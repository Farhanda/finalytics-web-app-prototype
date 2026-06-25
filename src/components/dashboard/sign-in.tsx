"use client";

import { useState } from "react";
import { Loader2, LogIn, TriangleAlert } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/components/dashboard/auth-provider";

// Friendlier copy for the handful of Firebase Auth errors a user can actually
// hit on a sign-in form, so they don't see a raw "auth/…" code.
function friendlyError(message: string): string {
  const code = message.match(/auth\/[\w-]+/)?.[0];
  switch (code) {
    case "auth/invalid-email":
      return "That doesn't look like a valid email address.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Incorrect email or password.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    default:
      return message.replace(/^Firebase:\s*/, "");
  }
}

// Full-screen gate shown when auth is required and nobody is signed in (or the
// signed-in user couldn't be provisioned). Email + password sign-in.
export function SignIn() {
  const { signIn, provisionError, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn(email, password);
    } catch (e) {
      setError(
        e instanceof Error ? friendlyError(e.message) : "Sign-in failed. Please try again."
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
          Enter your email and password to continue.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={busy}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={busy}
            />
          </div>

          <Button type="submit" className="w-full font-semibold" disabled={busy}>
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <LogIn className="size-4" />
            )}
            Sign in
          </Button>
        </form>

        {/* A failed sign-in, or a signed-in user who couldn't be provisioned
            (e.g. server auth not configured), lands here with an explanation. */}
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
