// GET /api/tasks — list tasks so Claude / the CLI can find what to work on.
// Auth: Authorization: Bearer <AUTOM8_API_TOKEN>.

import { firebaseReady } from "@/lib/firebase";
import { adminReady } from "@/lib/firebase-admin";
import { listTasks } from "@/lib/firestore";
import { listTasksAdmin } from "@/lib/firestore-admin";
import { apiTokenSet, isAuthorized } from "@/lib/api-auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!apiTokenSet)
    return Response.json(
      { ok: false, error: "AUTOM8_API_TOKEN is not set on the server." },
      { status: 500 }
    );
  if (!isAuthorized(req))
    return Response.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  if (!firebaseReady && !adminReady)
    return Response.json(
      { ok: false, error: "Firebase is not configured." },
      { status: 503 }
    );

  const tasks = adminReady ? await listTasksAdmin() : await listTasks();
  const out = tasks
    .map((t) => ({
      key: t.key,
      name: t.name,
      status: t.status,
      done: t.done,
      projectId: t.projectId,
      commits: (t.commits ?? []).length,
    }))
    .sort(
      (a, b) =>
        (Number(a.key?.split("-")[1]) || 0) - (Number(b.key?.split("-")[1]) || 0)
    );

  return Response.json({
    ok: true,
    storage: adminReady ? "admin" : "client",
    tasks: out,
  });
}
