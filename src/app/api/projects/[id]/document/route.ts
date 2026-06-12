// /api/projects/[id]/document
//
// POST — upload a project brief (pdf/docx) as multipart/form-data (`file` field).
//   Extracts plain text, stores the raw file in Firebase Storage (best-effort),
//   and saves a `documents` record carrying the text for the AI step (Tahap 2).
// GET  — list a project's uploaded documents (metadata only, no text body).
//
// This is a user-facing browser endpoint, so it is NOT behind the autom8 bearer
// token (that token is server-only and unavailable to the client). It matches the
// app's current posture where the client SDK writes to Firestore directly.

import { firebaseReady } from "@/lib/firebase";
import { adminReady } from "@/lib/firebase-admin";
import {
  createDocumentRecord,
  getProject,
  listDocumentsByProject,
  logActivityDoc,
} from "@/lib/firestore";
import {
  createDocumentRecordAdmin,
  getProjectAdmin,
  listDocumentsByProjectAdmin,
  logActivityAdmin,
} from "@/lib/firestore-admin";
import { detectDocKind, extractText, mimeForKind } from "@/lib/doc-parse";
import { uploadProjectDocument } from "@/lib/storage";
import type { ProjectDocument } from "@/lib/data";

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_DOC_TEXT = 150_000; // chars — well under Firestore's ~1 MB doc limit

function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
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

  const { id: projectId } = await params;

  const project = adminReady
    ? await getProjectAdmin(projectId)
    : await getProject(projectId);
  if (!project)
    return Response.json(
      { ok: false, error: `No project with id ${projectId}.` },
      { status: 404 }
    );

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return Response.json(
      { ok: false, error: "Expected multipart/form-data." },
      { status: 400 }
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File))
    return Response.json(
      { ok: false, error: "A `file` field is required." },
      { status: 400 }
    );

  if (file.size === 0)
    return Response.json(
      { ok: false, error: "The uploaded file is empty." },
      { status: 400 }
    );
  if (file.size > MAX_BYTES)
    return Response.json(
      { ok: false, error: "File exceeds the 10 MB limit." },
      { status: 413 }
    );

  const kind = detectDocKind(file.name, file.type);
  if (!kind)
    return Response.json(
      { ok: false, error: "Only PDF and DOCX files are supported." },
      { status: 415 }
    );

  const buffer = Buffer.from(await file.arrayBuffer());

  let text: string;
  try {
    text = await extractText(buffer, kind);
  } catch {
    return Response.json(
      { ok: false, error: "Could not read text from this file." },
      { status: 422 }
    );
  }

  if (!text)
    return Response.json(
      { ok: false, error: "No readable text found in this file." },
      { status: 422 }
    );

  const textTruncated = text.length > MAX_DOC_TEXT;
  if (textTruncated) text = text.slice(0, MAX_DOC_TEXT);

  const mimeType = file.type || mimeForKind(kind);
  const uploadedBy = String(formData.get("uploadedBy") ?? "").trim() || "Unknown";

  // Best-effort raw-file storage; never fail the upload over it.
  let storagePath: string | null = null;
  try {
    storagePath = await uploadProjectDocument({
      projectId,
      fileName: file.name,
      buffer,
      contentType: mimeType,
    });
  } catch (err) {
    console.warn("[document] Storage upload failed; keeping text only.", err);
  }

  const record: Omit<ProjectDocument, "id"> = {
    projectId,
    fileName: file.name,
    mimeType,
    size: file.size,
    storagePath,
    text,
    textTruncated,
    uploadedBy,
    uploadedAt: Date.now(),
    taskGenStatus: "pending",
  };

  const create = adminReady ? createDocumentRecordAdmin : createDocumentRecord;
  const docId = await create(record);
  if (!docId)
    return Response.json(
      { ok: false, error: "Failed to save the document." },
      { status: 500 }
    );

  const log = adminReady ? logActivityAdmin : logActivityDoc;
  await log({
    actor: uploadedBy,
    initials: initialsFrom(uploadedBy),
    tint: "bg-slate-100 text-slate-700",
    action: "uploaded a brief for",
    target: project.name,
  });

  return Response.json({
    ok: true,
    storage: adminReady ? "admin" : "client",
    fileStored: Boolean(storagePath),
    document: {
      id: docId,
      fileName: record.fileName,
      mimeType: record.mimeType,
      size: record.size,
      textLength: text.length,
      textTruncated,
      uploadedBy,
      uploadedAt: record.uploadedAt,
      taskGenStatus: record.taskGenStatus,
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

  const { id: projectId } = await params;

  const docs = adminReady
    ? await listDocumentsByProjectAdmin(projectId)
    : await listDocumentsByProject(projectId);

  return Response.json({
    ok: true,
    storage: adminReady ? "admin" : "client",
    documents: docs.map((d) => ({
      id: d.id,
      fileName: d.fileName,
      mimeType: d.mimeType,
      size: d.size,
      textLength: (d.text ?? "").length,
      textTruncated: d.textTruncated,
      uploadedBy: d.uploadedBy,
      uploadedAt: d.uploadedAt,
      taskGenStatus: d.taskGenStatus,
    })),
  });
}
