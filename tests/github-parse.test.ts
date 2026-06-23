// GitHub payload/crypto helpers (src/lib/github.ts). These are pure parsers and
// HMAC checks — they do NOT call GitHub, so they're in scope for offline QA.

import crypto from "node:crypto";
import { describe, expect, it } from "vitest";

import {
  generateWebhookSecret,
  parsePushCommits,
  repoFullNameFromPayload,
  verifyGithubSignature,
} from "@/lib/github";

const sign = (body: string, secret: string) =>
  "sha256=" +
  crypto.createHmac("sha256", secret).update(body, "utf8").digest("hex");

describe("generateWebhookSecret", () => {
  it("returns a 48-char hex string", () => {
    const s = generateWebhookSecret();
    expect(s).toMatch(/^[0-9a-f]{48}$/);
  });
  it("returns a different value each call", () => {
    expect(generateWebhookSecret()).not.toBe(generateWebhookSecret());
  });
});

describe("verifyGithubSignature", () => {
  const body = '{"hello":"world"}';
  const secret = "s3cr3t";

  it("accepts a correct signature", () => {
    expect(verifyGithubSignature(body, sign(body, secret), secret)).toBe(true);
  });
  it("rejects a tampered body", () => {
    expect(
      verifyGithubSignature(body + "x", sign(body, secret), secret)
    ).toBe(false);
  });
  it("rejects the wrong secret", () => {
    expect(verifyGithubSignature(body, sign(body, "other"), secret)).toBe(false);
  });
  it("rejects a missing or malformed signature", () => {
    expect(verifyGithubSignature(body, null, secret)).toBe(false);
    expect(verifyGithubSignature(body, "garbage", secret)).toBe(false);
  });
});

describe("parsePushCommits", () => {
  it("splits subject/body and reads author + url", () => {
    const payload = {
      commits: [
        {
          id: "abcdef1234567890",
          message: "Fix the thing\n\nLonger body\nwith details",
          url: "https://github.com/o/r/commit/abc",
          timestamp: "2026-06-20T10:00:00Z",
          author: { name: "Dev One", username: "dev1" },
        },
      ],
    };
    const [c] = parsePushCommits(payload);
    expect(c.sha).toBe("abcdef123456"); // capped to 12
    expect(c.message).toBe("Fix the thing");
    expect(c.body).toBe("Longer body\nwith details");
    expect(c.author).toBe("Dev One");
    expect(c.url).toBe("https://github.com/o/r/commit/abc");
  });

  it("handles a subject-only message and missing author", () => {
    const [c] = parsePushCommits({
      commits: [{ id: "x", message: "Only subject" }],
    });
    expect(c.message).toBe("Only subject");
    expect(c.body).toBe("");
    expect(c.author).toBe("Unknown");
  });

  it("returns [] when there are no commits", () => {
    expect(parsePushCommits({})).toEqual([]);
    expect(parsePushCommits({ commits: [] })).toEqual([]);
  });

  it("caps very long subject and body", () => {
    const [c] = parsePushCommits({
      commits: [{ id: "x", message: "a".repeat(500) + "\n" + "b".repeat(5000) }],
    });
    expect(c.message.length).toBe(200);
    expect(c.body.length).toBe(2000);
  });
});

describe("repoFullNameFromPayload", () => {
  it("reads repository.full_name", () => {
    expect(repoFullNameFromPayload({ repository: { full_name: "o/r" } })).toBe(
      "o/r"
    );
  });
  it("returns undefined when absent", () => {
    expect(repoFullNameFromPayload({})).toBeUndefined();
  });
});
