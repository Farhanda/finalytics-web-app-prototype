// GitHub webhook receiver.
//
// GitHub (a repo webhook, or a GitHub App installed on the repo) POSTs a `push`
// event here on every commit. We verify the HMAC signature, scan each commit
// message for task keys (e.g. "AUT-12"), and update the matching task in
// Firestore: the commit is appended to the task, and a closing keyword
// ("closes/fixes/resolves AUT-12") marks the task Completed.
//
// Writes go through the Firebase Admin SDK when it's configured (production
// path), otherwise the client SDK (prototype). When the GitHub App credentials
// are set, we also report back to GitHub with a commit status + comment.

import { createHmac, timingSafeEqual } from "crypto";

import { firebaseReady } from "@/lib/firebase";
import { adminReady } from "@/lib/firebase-admin";
import {
  linkCommitToTask as linkCommitClient,
  logActivityDoc as logActivityClient,
} from "@/lib/firestore";
import {
  linkCommitToTaskAdmin,
  logActivityAdmin,
} from "@/lib/firestore-admin";
import { githubAppReady, reportCommitFeedback, splitFullName } from "@/lib/github-app";
import type { LinkedCommit } from "@/lib/data";

export const runtime = "nodejs";

const KEY_RE = /\bAUT-\d+\b/gi;

// Pick the storage layer once: Admin SDK if configured, else the client SDK.
const linkCommit = adminReady ? linkCommitToTaskAdmin : linkCommitClient;
const logActivity = adminReady ? logActivityAdmin : logActivityClient;

function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function verifySignature(secret: string, body: string, header: string | null) {
  if (!header) return false;
  const expected =
    "sha256=" + createHmac("sha256", secret).update(body, "utf8").digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(header);
  return a.length === b.length && timingSafeEqual(a, b);
}

type PushCommit = {
  id: string;
  message: string;
  url: string;
  author?: { name?: string; username?: string };
};
type PushPayload = {
  commits?: PushCommit[];
  repository?: { full_name?: string };
  installation?: { id?: number };
};

export async function POST(req: Request) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    return Response.json(
      { ok: false, error: "GITHUB_WEBHOOK_SECRET is not set on the server." },
      { status: 500 }
    );
  }
  if (!firebaseReady && !adminReady) {
    return Response.json(
      { ok: false, error: "Firebase is not configured." },
      { status: 503 }
    );
  }

  const raw = await req.text();
  const event = req.headers.get("x-github-event");

  if (!verifySignature(secret, raw, req.headers.get("x-hub-signature-256"))) {
    return Response.json({ ok: false, error: "Bad signature." }, { status: 401 });
  }

  if (event === "ping") return Response.json({ ok: true, pong: true });
  if (event !== "push") return Response.json({ ok: true, ignored: event });

  const payload = JSON.parse(raw) as PushPayload;
  const commits = payload.commits ?? [];
  const repo = splitFullName(payload.repository?.full_name ?? "");
  const installationId = payload.installation?.id;

  const linked: { key: string; task: string; closed: boolean }[] = [];
  let wroteBack = 0;

  for (const commit of commits) {
    const message = commit.message ?? "";
    const keys = [
      ...new Set((message.match(KEY_RE) ?? []).map((k) => k.toUpperCase())),
    ];
    if (keys.length === 0) continue;

    const authorName =
      commit.author?.name || commit.author?.username || "Someone";
    const linkedCommit: LinkedCommit = {
      sha: (commit.id ?? "").slice(0, 7),
      message: message.split("\n")[0].slice(0, 140),
      url: commit.url ?? "",
      author: authorName,
    };

    const perCommit: { key: string; closed: boolean }[] = [];

    for (const key of keys) {
      const closeRe = new RegExp(
        `\\b(clos(e|es|ed)|fix(|es|ed)|resolv(e|es|ed))\\s+${key}\\b`,
        "i"
      );
      const close = closeRe.test(message);

      try {
        const result = await linkCommit(key, linkedCommit, { close });
        if (!result) continue;
        await logActivity({
          actor: authorName,
          initials: initialsFrom(authorName),
          tint: "bg-slate-100 text-slate-700",
          action: close ? "closed via commit" : "linked a commit to",
          target: result.taskName,
        });
        linked.push({ key, task: result.taskName, closed: close });
        perCommit.push({ key, closed: close });
      } catch (err) {
        console.error(`[github] failed linking ${key}`, err);
      }
    }

    // Report back to GitHub (only for GitHub App deliveries with credentials).
    if (
      perCommit.length > 0 &&
      githubAppReady &&
      repo &&
      typeof installationId === "number"
    ) {
      const summary = perCommit
        .map((p) => `${p.key}${p.closed ? " (Completed)" : ""}`)
        .join(", ");
      await reportCommitFeedback({
        installationId,
        owner: repo.owner,
        repo: repo.repo,
        sha: commit.id,
        description: `Linked ${summary}`,
        comment: `🔗 **autom8** linked this commit to ${perCommit
          .map((p) => `\`${p.key}\`${p.closed ? " — marked **Completed**" : ""}`)
          .join(", ")}.`,
      });
      wroteBack += 1;
    }
  }

  return Response.json({
    ok: true,
    storage: adminReady ? "admin" : "client",
    commits: commits.length,
    linked,
    wroteBack,
  });
}

// A friendly response when the URL is opened in a browser.
export function GET() {
  return Response.json({
    ok: true,
    endpoint: "github webhook",
    configured: Boolean(process.env.GITHUB_WEBHOOK_SECRET),
    storage: adminReady ? "admin" : "client",
    writeBack: githubAppReady,
    hint: "Point your GitHub App / repo webhook (push events) at this URL.",
  });
}
