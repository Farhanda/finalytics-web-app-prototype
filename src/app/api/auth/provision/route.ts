// POST /api/auth/provision
//
// Called once right after sign-in. Verifies the caller's Firebase ID token and
// makes sure a profile exists at users/{uid}. Runs with the Admin SDK so it can
// create the very first profile (the security rules only let an Admin create
// users — there's no Admin yet on a fresh workspace, so the bootstrap must be
// server-side).
//
// Bootstrap rule: the FIRST user to sign into an empty workspace becomes the
// Admin; everyone after that is provisioned as a Member for an Admin to place on
// projects / promote. Idempotent — returns the existing profile if already set.

import { adminAuth, adminDb, adminReady } from "@/lib/firebase-admin";
import { memberTints, type AccessRole, type TeamMember } from "@/lib/dashboard-data";

export const runtime = "nodejs";

function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export async function POST(req: Request) {
  if (!adminReady || !adminAuth || !adminDb)
    return Response.json(
      {
        ok: false,
        error:
          "Server auth is not configured. Set the Firebase Admin SDK env vars to enable sign-in provisioning.",
      },
      { status: 503 }
    );

  const token = (req.headers.get("authorization") ?? "")
    .replace(/^Bearer\s+/i, "")
    .trim();
  if (!token)
    return Response.json({ ok: false, error: "Sign in required." }, { status: 401 });

  let uid: string;
  let email: string;
  let displayName: string;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    uid = decoded.uid;
    email = decoded.email ?? "";
    displayName = decoded.name ?? email.split("@")[0] ?? "New member";
  } catch {
    return Response.json(
      { ok: false, error: "Invalid or expired session." },
      { status: 401 }
    );
  }

  try {
    const usersCol = adminDb.collection("users");
    const ref = usersCol.doc(uid);
    const existing = await ref.get();
    if (existing.exists) {
      return Response.json({
        ok: true,
        created: false,
        user: { id: uid, ...existing.data() },
      });
    }

    // Empty workspace? First user bootstraps as Admin.
    const any = await usersCol.limit(1).get();
    const isFirst = any.empty;
    const accessRole: AccessRole = isFirst ? "Admin" : "Member";

    // Pick a stable-ish avatar tint from the current member count.
    const count = (await usersCol.count().get()).data().count;

    const profile: Omit<TeamMember, "id"> = {
      name: displayName,
      email,
      initials: initialsFrom(displayName),
      tint: memberTints[count % memberTints.length],
      role: isFirst ? "Workspace Admin" : "Team Member",
      accessRole,
    };

    await ref.set(profile);

    return Response.json({
      ok: true,
      created: true,
      bootstrappedAdmin: isFirst,
      user: { id: uid, ...profile },
    });
  } catch (err) {
    // The Firestore calls above sign their requests with the Admin service
    // account. The most common production failure is a malformed
    // FIREBASE_PRIVATE_KEY (surrounding quotes or un-unescaped newlines in the
    // Vercel env), which lets verifyIdToken pass (it uses Google's public keys)
    // but breaks any Firestore access. Surface the real reason instead of a
    // bare 500 so it's diagnosable from the client and the server logs.
    const detail = err instanceof Error ? err.message : String(err);
    console.error("[auth/provision] Firestore provisioning failed:", err);
    return Response.json(
      { ok: false, error: "Could not set up your account.", detail },
      { status: 500 }
    );
  }
}
