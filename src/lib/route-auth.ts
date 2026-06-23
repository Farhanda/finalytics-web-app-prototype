// Server-side authentication & authorization for the browser-facing API routes.
//
// The signed-in browser attaches its Firebase ID token as
// `Authorization: Bearer <idToken>` (see `authedFetch` in src/lib/auth.ts). Here
// we verify that token with the Admin SDK and resolve the caller's access role
// from their users/{uid} profile, then enforce a role requirement.
//
// Degradation: when the Admin SDK is NOT configured (`adminAuth` is null), tokens
// cannot be verified at all. Rather than hard-fail local/demo setups, `authorize`
// returns `{ ok: true, user: null, enforced: false }` so routes keep working
// locally. Production MUST set the Admin SDK env (see .env.example) — then every
// privileged route is enforced. This mirrors the app's existing
// `adminReady ? … : …` graceful-degradation pattern.
//
// NOTE: this is for the human/browser routes. The machine routes used by the CLI
// (/api/tasks, /api/tasks/update) keep their static AUTOM8_API_TOKEN bearer check
// in src/lib/api-auth.ts — a CLI can't perform an interactive Firebase sign-in.

import { adminAuth, adminDb } from "./firebase-admin";
import type { AccessRole } from "./dashboard-data";

export type AuthedUser = {
  uid: string;
  email: string | null;
  role: AccessRole;
};

export type AuthResult =
  // Proceed. `user` is the verified caller, or null when enforcement is
  // unavailable (Admin SDK not configured). `enforced` says which it was.
  | { ok: true; user: AuthedUser | null; enforced: boolean }
  // Stop and return this Response (401/403/500).
  | { ok: false; response: Response };

function deny(status: number, error: string): AuthResult {
  return { ok: false, response: Response.json({ ok: false, error }, { status }) };
}

function bearer(req: Request): string {
  return (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
}

// Verify the request's Firebase ID token and enforce an optional role allow-list.
export async function authorize(
  req: Request,
  opts: { roles?: AccessRole[] } = {}
): Promise<AuthResult> {
  // No Admin SDK → cannot verify. Local/demo posture: allow through unenforced.
  if (!adminAuth || !adminDb) {
    return { ok: true, user: null, enforced: false };
  }

  const token = bearer(req);
  if (!token) return deny(401, "Sign in required.");

  let uid: string;
  let email: string | null;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    uid = decoded.uid;
    email = decoded.email ?? null;
  } catch {
    return deny(401, "Invalid or expired session. Sign in again.");
  }

  // Resolve role from the user's own profile (the same source the rules trust).
  const snap = await adminDb.collection("users").doc(uid).get();
  if (!snap.exists) {
    return deny(403, "Your account isn't provisioned in this workspace yet.");
  }
  const role = (snap.data()?.accessRole ?? "Member") as AccessRole;

  if (opts.roles && !opts.roles.includes(role)) {
    return deny(403, `Requires one of: ${opts.roles.join(", ")}.`);
  }

  return { ok: true, user: { uid, email, role }, enforced: true };
}
