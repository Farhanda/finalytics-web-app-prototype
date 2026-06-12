// POST /api/github/webhook/[id] — receiver for a per-division project webhook.
//
// [id] is the webhook's id (one per division per project). We look it up, verify
// GitHub's HMAC signature with THAT webhook's own secret, and on a `push` event
// store the commits at the project level, tagged with the webhook's division.
// Task completion stays manual — commits only enrich the project feed (Tahap 3).

import { firebaseReady } from "@/lib/firebase";
import { adminReady } from "@/lib/firebase-admin";
import {
  addProjectCommits,
  getProject,
  getWebhookById,
  logActivityDoc,
  recordWebhookDelivery,
} from "@/lib/firestore";
import {
  addProjectCommitsAdmin,
  getProjectAdmin,
  getWebhookByIdAdmin,
  logActivityAdmin,
  recordWebhookDeliveryAdmin,
} from "@/lib/firestore-admin";
import {
  parsePushCommits,
  repoFullNameFromPayload,
  verifyGithubSignature,
} from "@/lib/github";
import type { ProjectCommit } from "@/lib/data";

export const runtime = "nodejs";

function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "GH";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!firebaseReady && !adminReady)
    return Response.json(
      { ok: false, error: "Firebase is not configured." },
      { status: 503 }
    );

  const { id: webhookId } = await params;

  const hook = adminReady
    ? await getWebhookByIdAdmin(webhookId)
    : await getWebhookById(webhookId);
  if (!hook)
    return Response.json(
      { ok: false, error: "Unknown webhook." },
      { status: 404 }
    );

  // Verify the signature against the RAW body before parsing anything.
  const raw = await req.text();
  const signature = req.headers.get("x-hub-signature-256");
  if (!verifyGithubSignature(raw, signature, hook.secret))
    return Response.json(
      { ok: false, error: "Invalid signature." },
      { status: 401 }
    );

  const event = req.headers.get("x-github-event") ?? "";
  if (event === "ping")
    return Response.json({ ok: true, message: "pong" });
  if (event !== "push")
    return Response.json({ ok: true, ignored: event });

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  // Optional defense-in-depth: if the webhook is pinned to a repo, reject others.
  if (hook.repoFullName) {
    const incoming = repoFullNameFromPayload(payload);
    if (incoming && incoming !== hook.repoFullName)
      return Response.json(
        { ok: false, error: "Repository does not match this webhook." },
        { status: 403 }
      );
  }

  const parsed = parsePushCommits(payload).filter((c) => c.sha);
  if (parsed.length === 0) return Response.json({ ok: true, commits: 0 });

  const now = Date.now();
  const commits: Omit<ProjectCommit, "id">[] = parsed.map((c) => ({
    projectId: hook.projectId,
    division: hook.division,
    sha: c.sha,
    message: c.message,
    body: c.body,
    url: c.url,
    author: c.author,
    timestamp: c.timestamp,
    receivedAt: now,
  }));

  if (adminReady) await addProjectCommitsAdmin(commits);
  else await addProjectCommits(commits);

  if (adminReady) await recordWebhookDeliveryAdmin(hook.id, commits.length);
  else await recordWebhookDelivery(hook.id, commits.length);

  // Surface it on the dashboard activity feed.
  const project = adminReady
    ? await getProjectAdmin(hook.projectId)
    : await getProject(hook.projectId);
  const actor = parsed[0].author || "GitHub";
  const log = adminReady ? logActivityAdmin : logActivityDoc;
  await log({
    actor,
    initials: initialsFrom(actor),
    tint: "bg-slate-100 text-slate-700",
    action: `pushed ${commits.length} commit${commits.length === 1 ? "" : "s"} to`,
    target: `${project?.name ?? "a project"} · ${hook.division}`,
  });

  return Response.json({ ok: true, commits: commits.length });
}
