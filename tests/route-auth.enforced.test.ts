// Server route authorization (src/lib/route-auth.ts) — enforced path, with the
// Firebase Admin SDK mocked so we can drive token verification & role lookup.

import { beforeEach, describe, expect, it, vi } from "vitest";

const verifyIdToken = vi.fn();
const docGet = vi.fn();

vi.mock("@/lib/firebase-admin", () => ({
  adminAuth: { verifyIdToken: (t: string) => verifyIdToken(t) },
  adminDb: {
    collection: () => ({ doc: () => ({ get: () => docGet() }) }),
  },
}));

import { authorize } from "@/lib/route-auth";

const reqWith = (token?: string) =>
  new Request("http://x", {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });

beforeEach(() => {
  verifyIdToken.mockReset();
  docGet.mockReset();
});

describe("authorize — enforced (Admin SDK mocked)", () => {
  it("401 when no token is supplied", async () => {
    const r = await authorize(reqWith());
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.response.status).toBe(401);
  });

  it("401 when the token fails verification", async () => {
    verifyIdToken.mockRejectedValue(new Error("bad token"));
    const r = await authorize(reqWith("tok"));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.response.status).toBe(401);
  });

  it("403 when the user has no provisioned profile", async () => {
    verifyIdToken.mockResolvedValue({ uid: "u1", email: "a@b.com" });
    docGet.mockResolvedValue({ exists: false, data: () => undefined });
    const r = await authorize(reqWith("tok"));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.response.status).toBe(403);
  });

  it("403 when the role is not in the allow-list", async () => {
    verifyIdToken.mockResolvedValue({ uid: "u1", email: "a@b.com" });
    docGet.mockResolvedValue({
      exists: true,
      data: () => ({ accessRole: "Member" }),
    });
    const r = await authorize(reqWith("tok"), { roles: ["Admin"] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.response.status).toBe(403);
  });

  it("allows an in-list role and returns the verified user", async () => {
    verifyIdToken.mockResolvedValue({ uid: "u1", email: "a@b.com" });
    docGet.mockResolvedValue({
      exists: true,
      data: () => ({ accessRole: "Admin" }),
    });
    const r = await authorize(reqWith("tok"), { roles: ["Admin", "PM"] });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.enforced).toBe(true);
      expect(r.user).toEqual({ uid: "u1", email: "a@b.com", role: "Admin" });
    }
  });
});
