// POST /api/projects/[id]/generate-tasks
//
// Reads an uploaded document's extracted text and asks Claude to draft a
// structured list of tasks (Tahap 2). Returns the proposals for the PM to
// review/assign in the UI — it does NOT persist tasks itself (the client
// commits approved ones via the dashboard provider so keys/assignees are
// resolved against live state).
//
// Body: { documentId?: string }  — defaults to the project's newest document.

import { firebaseReady } from "@/lib/firebase";
import { adminReady } from "@/lib/firebase-admin";
import {
  getProject,
  listDocumentsByProject,
  setDocumentTaskGenStatus,
} from "@/lib/firestore";
import {
  getProjectAdmin,
  listDocumentsByProjectAdmin,
  setDocumentTaskGenStatusAdmin,
} from "@/lib/firestore-admin";
import { aiReady, generateTasksFromDocument } from "@/lib/ai";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!firebaseReady && !adminReady)
    return Response.json(
      { ok: false, error: "Firebase is not configured." },
      { status: 503 }
    );
  if (!aiReady)
    return Response.json(
      {
        ok: false,
        error:
          "ANTHROPIC_API_KEY is not set on the server. Add it to .env.local and restart to enable AI task generation.",
      },
      { status: 503 }
    );

  const { id: projectId } = await params;

  const project = adminReady
    ? await getProjectAdmin(projectId)
    : await getProject(projectId);
  if (!project)
    return Response.json(
      { ok: false, error: `No project with id ${projectId}.` },
      { status: 404 }
    );

  let documentId: string | undefined;
  try {
    const body = (await req.json()) as { documentId?: string };
    documentId = body?.documentId;
  } catch {
    // Empty/invalid body is fine — fall back to the newest document.
  }

  const docs = adminReady
    ? await listDocumentsByProjectAdmin(projectId)
    : await listDocumentsByProject(projectId);

  const doc = documentId
    ? docs.find((d) => d.id === documentId)
    : docs[0]; // newest first

  if (!doc)
    return Response.json(
      {
        ok: false,
        error: documentId
          ? `No document with id ${documentId} on this project.`
          : "No documents uploaded yet. Upload a brief first.",
      },
      { status: 404 }
    );

  if (!doc.text?.trim())
    return Response.json(
      { ok: false, error: "That document has no readable text." },
      { status: 422 }
    );

  let tasks;
  try {
    tasks = await generateTasksFromDocument({
      projectName: project.name,
      text: doc.text,
    });
  } catch (err) {
    console.error("[generate-tasks] AI generation failed.", err);
    return Response.json(
      { ok: false, error: "AI task generation failed. Please try again." },
      { status: 502 }
    );
  }

  // Best-effort: mark the document so the UI can show "Tasks ready".
  try {
    if (adminReady) await setDocumentTaskGenStatusAdmin(doc.id, "done");
    else await setDocumentTaskGenStatus(doc.id, "done");
  } catch (err) {
    console.warn("[generate-tasks] Could not update document status.", err);
  }

  return Response.json({
    ok: true,
    storage: adminReady ? "admin" : "client",
    projectName: project.name,
    documentId: doc.id,
    fileName: doc.fileName,
    tasks,
  });
}
