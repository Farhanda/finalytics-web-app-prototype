// POST /api/github/app — the autom8 GitHub App's single webhook endpoint.
//
// Distinct from the per-division push webhook (/api/github/webhook/[id]): the App
// delivers events from EVERY installed repo here, verified with one global secret
// (GITHUB_APP_WEBHOOK_SECRET). We act only on `issues`:
//   • closed   → mark the linked task Completed  (the auto-complete half of the loop)
//   • reopened → flip it back to In-progress
// Issue creation is the other half (POST /api/github/issues). Completing a task in
// autom8 never calls GitHub, so there's no echo loop. The handler is idempotent
// (no-op when the task is already in the target state) to absorb redeliveries.

import { firebaseReady } from "@/lib/firebase";
import { adminReady } from "@/lib/firebase-admin";
import { findTaskByIssue, logActivityDoc, updateTaskDoc } from "@/lib/firestore";
import {
  findTaskByIssueAdmin,
  logActivityAdmin,
  updateTaskDocAdmin,
} from "@/lib/firestore-admin";
import {
  githubWebhookReady,
  githubWebhookSecret,
  parseIssuesPayload,
  verifyGithubSignature,
} from "@/lib/github-app";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!firebaseReady && !adminReady)
    return Response.json(
      { ok: false, error: "Firebase is not configured." },
      { status: 503 }
    );
  if (!githubWebhookReady)
    return Response.json(
      { ok: false, error: "GITHUB_APP_WEBHOOK_SECRET is not set." },
      { status: 503 }
    );

  // Reject oversized bodies before reading them into memory.
  if (Number(req.headers.get("content-length") ?? 0) > 5_000_000)
    return Response.json(
      { ok: false, error: "Payload too large." },
      { status: 413 }
    );

  // Verify the signature against the RAW body before parsing anything.
  const raw = await req.text();
  const signature = req.headers.get("x-hub-signature-256");
  if (!verifyGithubSignature(raw, signature, githubWebhookSecret))
    return Response.json(
      { ok: false, error: "Invalid signature." },
      { status: 401 }
    );

  const event = req.headers.get("x-github-event") ?? "";
  if (event === "ping") return Response.json({ ok: true, message: "pong" });
  if (event !== "issues") return Response.json({ ok: true, ignored: event });

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const ev = parseIssuesPayload(payload);
  if (ev.action !== "closed" && ev.action !== "reopened")
    return Response.json({ ok: true, ignored: ev.action });
  if (!ev.repoFullName || ev.issueNumber === undefined)
    return Response.json({ ok: true, ignored: "missing repo/issue" });

  const find = adminReady ? findTaskByIssueAdmin : findTaskByIssue;
  const updateT = adminReady ? updateTaskDocAdmin : updateTaskDoc;
  const log = adminReady ? logActivityAdmin : logActivityDoc;

  const task = await find(ev.repoFullName, ev.issueNumber);
  if (!task) return Response.json({ ok: true, matched: false });

  const closing = ev.action === "closed";
  // Idempotent: nothing to do if the task is already in the target state — guards
  // against GitHub's at-least-once webhook redelivery.
  if (closing === task.done) return Response.json({ ok: true, unchanged: true });

  await updateT(task.id, {
    done: closing,
    status: closing ? "Completed" : "In-progress",
  });
  await log({
    actor: "GitHub",
    initials: "GH",
    tint: "bg-slate-100 text-slate-700",
    action: closing
      ? `closed issue #${ev.issueNumber} — completed`
      : `reopened issue #${ev.issueNumber} —`,
    target: task.name,
  });

  return Response.json({ ok: true, taskKey: task.key, done: closing });
}
