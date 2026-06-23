import { describe, it, expect } from "vitest";

import { checkEnv, formatEnvReport, ENV_FEATURES } from "@/lib/env";

// A fully-configured production environment (every required + optional var set).
const FULL: NodeJS.ProcessEnv = {
  NEXT_PUBLIC_FIREBASE_API_KEY: "k",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: "p",
  FIREBASE_CLIENT_EMAIL: "svc@p.iam",
  FIREBASE_PRIVATE_KEY: "-----BEGIN-----",
  FIREBASE_PROJECT_ID: "p",
  AUTOM8_API_TOKEN: "t",
  ANTHROPIC_API_KEY: "a",
  DISCORD_WEBHOOK_URL: "https://discord/x",
  GITHUB_APP_ID: "1",
  GITHUB_APP_PRIVATE_KEY: "pk",
  NODE_ENV: "development"
};

describe("checkEnv", () => {
  it("reports ready when all required vars are present", () => {
    const r = checkEnv(FULL);
    expect(r.ready).toBe(true);
    expect(r.missingRequired).toEqual([]);
    expect(r.features.every((f) => f.ready)).toBe(true);
  });

  it("flags an empty environment as not ready and lists required misses", () => {
    const r = checkEnv({});
    expect(r.ready).toBe(false);
    // Every required feature contributes at least one missing var.
    const requiredKeys = ENV_FEATURES.filter((f) => f.required).map((f) => f.key);
    for (const key of requiredKeys) {
      const f = r.features.find((x) => x.key === key)!;
      expect(f.ready).toBe(false);
      expect(f.missing.length).toBeGreaterThan(0);
    }
    // Optional features are never counted in missingRequired.
    expect(r.missingRequired).not.toContain("ANTHROPIC_API_KEY");
  });

  it("treats blank/whitespace values as unset", () => {
    const r = checkEnv({ ...FULL, AUTOM8_API_TOKEN: "   " });
    expect(r.ready).toBe(false);
    expect(r.missingRequired).toContain("AUTOM8_API_TOKEN");
  });

  it("satisfies a oneOf slot via the public projectId fallback", () => {
    const env = { ...FULL };
    delete env.FIREBASE_PROJECT_ID; // fall back to NEXT_PUBLIC_FIREBASE_PROJECT_ID
    const admin = checkEnv(env).features.find((f) => f.key === "firebase-admin")!;
    expect(admin.ready).toBe(true);
  });

  it("reports the oneOf slot missing when neither projectId is set", () => {
    const env = { ...FULL };
    delete env.FIREBASE_PROJECT_ID;
    delete env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const r = checkEnv(env);
    const admin = r.features.find((f) => f.key === "firebase-admin")!;
    expect(admin.ready).toBe(false);
    // firebase-web also goes unready (it needs NEXT_PUBLIC_FIREBASE_PROJECT_ID).
    expect(r.ready).toBe(false);
  });

  it("optional integrations don't block readiness", () => {
    const env = { ...FULL };
    delete env.ANTHROPIC_API_KEY;
    delete env.DISCORD_WEBHOOK_URL;
    delete env.GITHUB_APP_ID;
    delete env.GITHUB_APP_PRIVATE_KEY;
    const r = checkEnv(env);
    expect(r.ready).toBe(true);
    expect(r.features.find((f) => f.key === "anthropic")!.ready).toBe(false);
  });
});

describe("formatEnvReport", () => {
  it("summarizes a healthy environment", () => {
    const out = formatEnvReport(checkEnv(FULL));
    expect(out).toContain("all required features configured");
    expect(out).toContain("✓");
  });

  it("names the missing required vars for an empty environment", () => {
    const out = formatEnvReport(checkEnv({}));
    expect(out).toContain("missing required vars");
    expect(out).toContain("✗");
  });
});
