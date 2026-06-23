// Rate limiter (src/lib/rate-limit.ts). Pure, time-injected — no external deps.

import { describe, expect, it } from "vitest";

import { checkRateLimit, sweepRateLimits } from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  it("allows up to the limit, then blocks with 429", () => {
    const key = "t-basic";
    const now = 1_000_000;
    expect(checkRateLimit(key, 3, 60_000, now).ok).toBe(true);
    expect(checkRateLimit(key, 3, 60_000, now).ok).toBe(true);
    expect(checkRateLimit(key, 3, 60_000, now).ok).toBe(true);
    const blocked = checkRateLimit(key, 3, 60_000, now);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.response.status).toBe(429);
      expect(blocked.response.headers.get("Retry-After")).toBeTruthy();
    }
  });

  it("resets after the window elapses", () => {
    const key = "t-reset";
    expect(checkRateLimit(key, 1, 10_000, 0).ok).toBe(true);
    expect(checkRateLimit(key, 1, 10_000, 5_000).ok).toBe(false); // still in window
    expect(checkRateLimit(key, 1, 10_000, 10_001).ok).toBe(true); // window passed
  });

  it("tracks keys independently", () => {
    expect(checkRateLimit("t-a", 1, 1000, 0).ok).toBe(true);
    expect(checkRateLimit("t-b", 1, 1000, 0).ok).toBe(true); // different key, fresh
    expect(checkRateLimit("t-a", 1, 1000, 0).ok).toBe(false);
  });
});

describe("sweepRateLimits", () => {
  it("drops only expired windows", () => {
    checkRateLimit("t-sweep", 1, 1000, 0); // expires at 1000
    sweepRateLimits(2000); // past expiry → bucket removed
    // A fresh window is available again immediately.
    expect(checkRateLimit("t-sweep", 1, 1000, 2000).ok).toBe(true);
  });
});
