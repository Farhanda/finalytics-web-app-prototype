// DELETE /api/projects/[id]/webhooks/[webhookId] — remove a project webhook.

import { firebaseReady } from "@/lib/firebase";
import { adminReady } from "@/lib/firebase-admin";
import { deleteWebhook, getWebhookById } from "@/lib/firestore";
import { deleteWebhookAdmin, getWebhookByIdAdmin } from "@/lib/firestore-admin";

export const runtime = "nodejs";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; webhookId: string }> }
) {
  if (!firebaseReady && !adminReady)
    return Response.json(
      { ok: false, error: "Firebase is not configured." },
      { status: 503 }
    );

  const { id: projectId, webhookId } = await params;

  const hook = adminReady
    ? await getWebhookByIdAdmin(webhookId)
    : await getWebhookById(webhookId);
  if (!hook || hook.projectId !== projectId)
    return Response.json(
      { ok: false, error: "Webhook not found on this project." },
      { status: 404 }
    );

  if (adminReady) await deleteWebhookAdmin(webhookId);
  else await deleteWebhook(webhookId);

  return Response.json({ ok: true });
}
