// Server route authorization (src/lib/route-auth.ts) — degradation path.
// In the test env the Admin SDK is not configured (no service-account env), so
// `authorize` cannot verify tokens and must pass through UNENFORCED. This proves
// the local/demo posture; the enforced path is covered in route-auth.enforced.

import { describe, expect, it } from "vitest";

import { authorize } from "@/lib/route-auth";

describe("authorize — degradation (no Admin SDK)", () => {
  it("passes through unenforced with a null user", async () => {
    const res = await authorize(new Request("http://x"));
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.enforced).toBe(false);
      expect(res.user).toBeNull();
    }
  });
});
