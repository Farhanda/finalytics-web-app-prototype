// Server-side Firestore writes via the Admin SDK. Mirrors the helpers in
// ./firestore.ts (client SDK) so the task API can use whichever is configured.

import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { adminDb } from "./firebase-admin";
import { toMillis } from "./time";
import type {
  DocTaskGenStatus,
  LinkedCommit,
  ProjectCommit,
  ProjectDocument,
  ProjectWebhook,
  Task,
} from "./data";
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

export async function getTaskAdmin(id: string): Promise<Task | null> {
  if (!adminDb) return null;
  const snap = await adminDb.collection("tasks").doc(id).get();
  return snap.exists ? ({ id: snap.id, ...snap.data() } as Task) : null;
}

export async function updateTaskDocAdmin(
  id: string,
  partial: Partial<Task>
): Promise<void> {
  if (!adminDb) return;
  await adminDb.collection("tasks").doc(id).update(partial);
}

// Find the task linked to a GitHub issue (repo + number). Queries by issueNumber
// only (automatic single-field index) and matches repoFullName in memory — no
// composite index needed. Mirrors findTaskByIssue in firestore.ts.
export async function findTaskByIssueAdmin(
  repoFullName: string,
  issueNumber: number
): Promise<Task | null> {
  if (!adminDb) return null;
  const snap = await adminDb
    .collection("tasks")
    .where("issueNumber", "==", issueNumber)
    .get();
  const match = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Task)
    .find((t) => t.repoFullName === repoFullName);
  return match ?? null;
}

export async function getProjectAdmin(
  id: string
): Promise<DashboardProject | null> {
  if (!adminDb) return null;
  const snap = await adminDb.collection("projects").doc(id).get();
  return snap.exists ? ({ id: snap.id, ...snap.data() } as DashboardProject) : null;
}

export async function createDocumentRecordAdmin(
  data: Omit<ProjectDocument, "id" | "uploadedAt">
): Promise<string | null> {
  if (!adminDb) return null;
  const ref = await adminDb
    .collection("documents")
    .add({ ...data, uploadedAt: FieldValue.serverTimestamp() });
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
    .sort((a, b) => toMillis(b.uploadedAt) - toMillis(a.uploadedAt));
}

export async function setDocumentTaskGenStatusAdmin(
  id: string,
  status: DocTaskGenStatus
): Promise<void> {
  if (!adminDb) return;
  await adminDb.collection("documents").doc(id).update({ taskGenStatus: status });
}

// --- GitHub webhooks + project commits (Tahap 3). Admin-SDK path. ---

export async function createWebhookAdmin(
  data: Omit<ProjectWebhook, "id" | "createdAt">
): Promise<string | null> {
  if (!adminDb) return null;
  const ref = await adminDb
    .collection("webhooks")
    .add({ ...data, createdAt: FieldValue.serverTimestamp() });
  return ref.id;
}

export async function listWebhooksByProjectAdmin(
  projectId: string
): Promise<ProjectWebhook[]> {
  if (!adminDb) return [];
  const snap = await adminDb
    .collection("webhooks")
    .where("projectId", "==", projectId)
    .get();
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as ProjectWebhook)
    .sort((a, b) => toMillis(a.createdAt) - toMillis(b.createdAt));
}

export async function getWebhookByIdAdmin(
  id: string
): Promise<ProjectWebhook | null> {
  if (!adminDb) return null;
  const snap = await adminDb.collection("webhooks").doc(id).get();
  return snap.exists ? ({ id: snap.id, ...snap.data() } as ProjectWebhook) : null;
}

export async function deleteWebhookAdmin(id: string): Promise<void> {
  if (!adminDb) return;
  await adminDb.collection("webhooks").doc(id).delete();
}

export async function recordWebhookDeliveryAdmin(
  id: string,
  count: number
): Promise<void> {
  if (!adminDb) return;
  await adminDb
    .collection("webhooks")
    .doc(id)
    .update({
      deliveries: FieldValue.increment(count),
      lastDeliveryAt: FieldValue.serverTimestamp(),
    });
}

export async function addProjectCommitsAdmin(
  commits: Omit<ProjectCommit, "id" | "receivedAt">[]
): Promise<void> {
  if (!adminDb) return;
  const batch = adminDb.batch();
  for (const c of commits)
    batch.set(adminDb.collection("projectCommits").doc(), {
      ...c,
      receivedAt: FieldValue.serverTimestamp(),
    });
  await batch.commit();
}

export async function listProjectCommitsAdmin(
  projectId: string
): Promise<ProjectCommit[]> {
  if (!adminDb) return [];
  const snap = await adminDb
    .collection("projectCommits")
    .where("projectId", "==", projectId)
    .get();
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as ProjectCommit)
    .sort((a, b) => toMillis(b.receivedAt) - toMillis(a.receivedAt));
}

// --- Daily report queries (Tahap 4). Admin-SDK path. ---

export async function listProjectsAdmin(): Promise<DashboardProject[]> {
  if (!adminDb) return [];
  const snap = await adminDb.collection("projects").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as DashboardProject);
}

export async function listActivitiesSinceAdmin(
  since: number
): Promise<Activity[]> {
  if (!adminDb) return [];
  const snap = await adminDb
    .collection("activities")
    .where("createdAt", ">=", Timestamp.fromMillis(since))
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Activity);
}

export async function listProjectCommitsSinceAdmin(
  since: number
): Promise<ProjectCommit[]> {
  if (!adminDb) return [];
  const snap = await adminDb
    .collection("projectCommits")
    .where("receivedAt", ">=", Timestamp.fromMillis(since))
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ProjectCommit);
}

export async function logActivityAdmin(
  data: Omit<Activity, "id" | "createdAt" | "time"> & { time?: string }
): Promise<void> {
  if (!adminDb) return;
  await adminDb.collection("activities").add({
    ...data,
    time: data.time ?? "Just now",
    createdAt: FieldValue.serverTimestamp(),
  });
}

// Re-export so the LinkedCommit type stays handy at this layer.
export type { LinkedCommit };
