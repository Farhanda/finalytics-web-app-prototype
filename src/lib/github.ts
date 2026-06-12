// Server-only helpers for the per-division GitHub webhook integration (Tahap 3):
// secret generation, HMAC signature verification, and push-payload parsing.

import crypto from "crypto";

// A fresh per-webhook secret the division pastes into their repo's webhook config.
export function generateWebhookSecret(): string {
  return crypto.randomBytes(24).toString("hex");
}

// Verify GitHub's X-Hub-Signature-256 against the raw request body. Uses a
// constant-time compare so we don't leak timing information about the secret.
export function verifyGithubSignature(
  rawBody: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false;
  const expected =
    "sha256=" +
    crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export type ParsedCommit = {
  sha: string;
  message: string;
  body: string;
  url: string;
  author: string;
  timestamp: string;
};

type GithubPushCommit = {
  id?: string;
  message?: string;
  url?: string;
  timestamp?: string;
  author?: { name?: string; username?: string };
};

type GithubPushPayload = {
  repository?: { full_name?: string };
  commits?: GithubPushCommit[];
};

export function repoFullNameFromPayload(payload: unknown): string | undefined {
  return (payload as GithubPushPayload)?.repository?.full_name;
}

// Extract the commits from a `push` event payload, splitting each message into a
// subject (first line) and body (the rest), capped to keep documents small.
export function parsePushCommits(payload: unknown): ParsedCommit[] {
  const commits = (payload as GithubPushPayload)?.commits ?? [];
  return commits.map((c) => {
    const full = String(c.message ?? "");
    const nl = full.indexOf("\n");
    const subject = (nl === -1 ? full : full.slice(0, nl)).trim();
    const body = (nl === -1 ? "" : full.slice(nl + 1)).trim();
    return {
      sha: String(c.id ?? "").slice(0, 12),
      message: subject.slice(0, 200),
      body: body.slice(0, 2000),
      url: String(c.url ?? ""),
      author: String(c.author?.name ?? c.author?.username ?? "Unknown"),
      timestamp: String(c.timestamp ?? ""),
    };
  });
}
