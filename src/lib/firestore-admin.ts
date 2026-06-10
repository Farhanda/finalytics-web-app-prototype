// Server-side Firestore writes via the Admin SDK. Mirrors the commit-linking
// helpers in ./firestore.ts (client SDK) so the webhook route can use whichever
// is configured. Same signatures + return shape, so callers are interchangeable.

import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "./firebase-admin";
import type { LinkedCommit, Task } from "./data";
import type { Activity } from "./dashboard-data";
import type { CommitLinkResult } from "./firestore";

export async function linkCommitToTaskAdmin(
  key: string,
  commit: LinkedCommit,
  opts: { close: boolean }
): Promise<CommitLinkResult | null> {
  if (!adminDb) return null;

  const snap = await adminDb
    .collection("tasks")
    .where("key", "==", key)
    .limit(1)
    .get();
  if (snap.empty) return null;

  const d = snap.docs[0];
  const task = d.data() as Task;

  const update: Record<string, unknown> = {
    commits: FieldValue.arrayUnion(commit),
  };
  if (opts.close) {
    update.done = true;
    update.status = "Completed";
  } else if (task.status === "Pending") {
    update.status = "In-progress";
  }
  await d.ref.update(update);

  return {
    taskId: d.id,
    taskName: task.name,
    taskKey: key,
    assignee: task.assignee,
    closed: opts.close,
  };
}

export async function logActivityAdmin(
  data: Omit<Activity, "id" | "createdAt" | "time"> & { time?: string }
): Promise<void> {
  if (!adminDb) return;
  await adminDb.collection("activities").add({
    ...data,
    time: data.time ?? "Just now",
    createdAt: Date.now(),
  });
}
