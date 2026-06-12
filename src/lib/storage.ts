// Server-only Firebase Storage helper for uploaded project documents.
//
// Uploading the raw binary is BEST-EFFORT: it only runs when the Admin SDK is
// configured AND a bucket name is available. In the prototype's default state
// (no service account) this is skipped and `uploadProjectDocument` returns null —
// the extracted text is still kept in Firestore, so the AI flow keeps working.

import { getStorage } from "firebase-admin/storage";

import { adminApp } from "./firebase-admin";

const bucketName =
  process.env.FIREBASE_STORAGE_BUCKET ||
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

export const storageReady = Boolean(adminApp && bucketName);

type UploadInput = {
  projectId: string;
  fileName: string;
  buffer: Buffer;
  contentType: string;
};

// Save the file under project-documents/<projectId>/<timestamp>-<name> and return
// its storage path, or null when Storage isn't configured.
export async function uploadProjectDocument(
  input: UploadInput
): Promise<string | null> {
  if (!storageReady || !adminApp || !bucketName) return null;

  const safeName = input.fileName.replace(/[^\w.\-]+/g, "_");
  const storagePath = `project-documents/${input.projectId}/${Date.now()}-${safeName}`;

  const bucket = getStorage(adminApp).bucket(bucketName);
  await bucket.file(storagePath).save(input.buffer, {
    contentType: input.contentType,
    resumable: false,
  });

  return storagePath;
}
