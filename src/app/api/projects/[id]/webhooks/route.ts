// /api/projects/[id]/webhooks
//
// POST — create a per-division webhook for a project. The server generates the
//   secret and returns it ONCE (with the full webhook URL) so the division can
//   paste both into their repo's Settings → Webhooks.
// GET  — list a project's webhooks (secret masked).
//
// User-facing browser endpoints, so not behind the autom8 bearer token — matches
// the app's existing posture (the client writes Firestore directly).

import { firebaseReady } from "@/lib/firebase";
import { adminReady } from "@/lib/firebase-admin";
import {
  createWebhook,
  getProject,
  listWebhooksByProject,
} from "@/lib/firestore";
import {
  createWebhookAdmin,
  getProjectAdmin,
  listWebhooksByProjectAdmin,
} from "@/lib/firestore-admin";
import { generateWebhookSecret } from "@/lib/github";
import { authorize } from "@/lib/route-auth";
import { toMillisOrNull } from "@/lib/time";
import { TASK_CATEGORIES, type ProjectWebhook, type TaskCategory } from "@/lib/data";

export const runtime = "nodejs";

function webhookUrl(req: Request, webhookId: string) {
  return `${new URL(req.url).origin}/api/github/webhook/${webhookId}`;
}

function maskSecret(secret: string) {
  return secret.length <= 4 ? "••••" : `••••${secret.slice(-4)}`;
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

  // Creating a webhook (and seeing its secret) is a project-management action.
  const auth = await authorize(req, { roles: ["Admin", "PM"] });
  if (!auth.ok) return auth.response;

  const { id: projectId } = await params;

  const project = adminReady
    ? await getProjectAdmin(projectId)
    : await getProject(projectId);
  if (!project)
    return Response.json(
      { ok: false, error: `No project with id ${projectId}.` },
      { status: 404 }
    );

  let body: { division?: string; repoFullName?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const division = body.division as TaskCategory;
  if (!TASK_CATEGORIES.includes(division))
    return Response.json(
      { ok: false, error: `division must be one of ${TASK_CATEGORIES.join(", ")}.` },
      { status: 400 }
    );

  const repoFullName = body.repoFullName?.trim();

  // `createdAt` is stamped server-side (serverTimestamp) inside the create helper.
  const record: Omit<ProjectWebhook, "id" | "createdAt"> = {
    projectId,
    division,
    ...(repoFullName ? { repoFullName } : {}),
    secret: generateWebhookSecret(),
    deliveries: 0,
  };

  const create = adminReady ? createWebhookAdmin : createWebhook;
  const id = await create(record);
  if (!id)
    return Response.json(
      { ok: false, error: "Failed to create the webhook." },
      { status: 500 }
    );

  // Secret + URL are returned in full here ONCE — the GET list masks the secret.
  return Response.json({
    ok: true,
    storage: adminReady ? "admin" : "client",
    webhook: {
      id,
      division,
      repoFullName: repoFullName ?? null,
      secret: record.secret,
      url: webhookUrl(req, id),
    },
  });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!firebaseReady && !adminReady)
    return Response.json(
      { ok: false, error: "Firebase is not configured." },
      { status: 503 }
    );

  const auth = await authorize(req, { roles: ["Admin", "PM"] });
  if (!auth.ok) return auth.response;

  const { id: projectId } = await params;

  const hooks = adminReady
    ? await listWebhooksByProjectAdmin(projectId)
    : await listWebhooksByProject(projectId);

  return Response.json({
    ok: true,
    storage: adminReady ? "admin" : "client",
    webhooks: hooks.map((w) => ({
      id: w.id,
      division: w.division,
      repoFullName: w.repoFullName ?? null,
      secretMasked: maskSecret(w.secret),
      deliveries: w.deliveries,
      lastDeliveryAt: toMillisOrNull(w.lastDeliveryAt),
      url: webhookUrl(req, w.id),
    })),
  });
}
