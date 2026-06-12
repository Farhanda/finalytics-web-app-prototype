// Server-side Firestore writes via the Admin SDK. Mirrors the helpers in
// ./firestore.ts (client SDK) so the task API can use whichever is configured.

import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "./firebase-admin";
import type { LinkedCommit, ProjectDocument, Task } from "./data";
import type { Activity, DashboardProject } from "./dashboard-data";
import type { TaskUpdateInput, TaskUpdateResult } from "./firestore";

export async function updateTaskByKeyAdmin(
  key: string,
  input: TaskUpdateInput
): Promise<TaskUpdateResult | null> {
  if (!adminDb) return null;

  const snap = await adminDb
    .collection("tasks")
    .where("key", "==", key)
    .limit(1)
    .get();
  if (snap.empty) return null;

  const d = snap.docs[0];
  const task = d.data() as Task;

  const update: Record<string, unknown> = {};
  if (input.commit) update.commits = FieldValue.arrayUnion(input.commit);
  if (input.status) {
    update.status = input.status;
    update.done = input.status === "Completed";
  }
  await d.ref.update(update);

  return {
    taskId: d.id,
    taskName: task.name,
    taskKey: key,
    status: input.status ?? task.status,
    assignee: task.assignee,
  };
}

export async function listTasksAdmin(): Promise<Task[]> {
  if (!adminDb) return [];
  const snap = await adminDb.collection("tasks").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Task);
}

export async function getProjectAdmin(
  id: string
): Promise<DashboardProject | null> {
  if (!adminDb) return null;
  const snap = await adminDb.collection("projects").doc(id).get();
  return snap.exists ? ({ id: snap.id, ...snap.data() } as DashboardProject) : null;
}

export async function createDocumentRecordAdmin(
  data: Omit<ProjectDocument, "id">
): Promise<string | null> {
  if (!adminDb) return null;
  const ref = await adminDb.collection("documents").add(data);
  return ref.id;
}

export async function listDocumentsByProjectAdmin(
  projectId: string
): Promise<ProjectDocument[]> {
  if (!adminDb) return [];
  const snap = await adminDb
    .collection("documents")
    .where("projectId", "==", projectId)
    .get();
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as ProjectDocument)
    .sort((a, b) => b.uploadedAt - a.uploadedAt);
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

// Re-export so the LinkedCommit type stays handy at this layer.
export type { LinkedCommit };
