// GET /api/projects/[id]/commits — list commits delivered by the project's
// per-division GitHub webhooks (Tahap 3), newest first.

import { firebaseReady } from "@/lib/firebase";
import { adminReady } from "@/lib/firebase-admin";
import { listProjectCommits } from "@/lib/firestore";
import { listProjectCommitsAdmin } from "@/lib/firestore-admin";
import { authorize } from "@/lib/route-auth";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!firebaseReady && !adminReady)
    return Response.json(
      { ok: false, error: "Firebase is not configured." },
      { status: 503 }
    );

  const auth = await authorize(req);
  if (!auth.ok) return auth.response;

  const { id: projectId } = await params;

  const commits = adminReady
    ? await listProjectCommitsAdmin(projectId)
    : await listProjectCommits(projectId);

  return Response.json({
    ok: true,
    storage: adminReady ? "admin" : "client",
    commits: commits.map((c) => ({
      id: c.id,
      division: c.division,
      sha: c.sha,
      message: c.message,
      body: c.body ?? "",
      url: c.url,
      author: c.author,
      timestamp: c.timestamp ?? "",
      receivedAt: c.receivedAt,
    })),
  });
}
