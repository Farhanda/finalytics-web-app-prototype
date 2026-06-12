// Firestore data layer: typed collection refs, CRUD helpers, and seeding.
//
// Documents store the entity WITHOUT its `id` field — the Firestore doc id IS the
// id. Reads reconstruct `{ id: doc.id, ...doc.data() }` via `fromSnap`. Seed
// documents keep their original ids (u0.., p1.., t1..) so the relational fields
// (pmId, memberIds, projectId, assigneeId, createdById) keep resolving.

import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type QuerySnapshot,
} from "firebase/firestore";

import { db } from "./firebase";
import {
  tasks as seedTasks,
  type LinkedCommit,
  type ProjectDocument,
  type Task,
  type TaskStatus,
} from "./data";
import {
  seedActivities,
  seedProjects,
  seedTeam,
  type Activity,
  type DashboardProject,
  type TeamMember,
} from "./dashboard-data";

export const usersCol = collection(db, "users");
export const projectsCol = collection(db, "projects");
export const tasksCol = collection(db, "tasks");
export const activitiesCol = collection(db, "activities");
export const documentsCol = collection(db, "documents");

// Map a snapshot to a typed array, folding the doc id into each entity.
export function fromSnap<T>(snap: QuerySnapshot): T[] {
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
}

function stripId<T extends { id: string }>(entity: T): Omit<T, "id"> {
  const { id: _id, ...rest } = entity;
  void _id;
  return rest;
}

// ---------------------------------------------------------------------------
// CRUD — the provider calls these; the UI updates via onSnapshot listeners.
// ---------------------------------------------------------------------------

export async function createTask(data: Omit<Task, "id">): Promise<string> {
  const ref = await addDoc(tasksCol, data);
  return ref.id;
}

export function updateTaskDoc(id: string, partial: Partial<Task>) {
  return updateDoc(doc(tasksCol, id), partial);
}

export function deleteTaskDoc(id: string) {
  return deleteDoc(doc(tasksCol, id));
}

export async function createProject(
  data: Omit<DashboardProject, "id">
): Promise<string> {
  const ref = await addDoc(projectsCol, data);
  return ref.id;
}

export function updateProjectDoc(
  id: string,
  partial: Partial<DashboardProject>
) {
  return updateDoc(doc(projectsCol, id), partial);
}

export async function createUser(
  data: Omit<TeamMember, "id">
): Promise<string> {
  const ref = await addDoc(usersCol, data);
  return ref.id;
}

export function updateUserDoc(id: string, partial: Partial<TeamMember>) {
  return updateDoc(doc(usersCol, id), partial);
}

export type TaskUpdateInput = {
  status?: TaskStatus;
  commit?: LinkedCommit;
};

export type TaskUpdateResult = {
  taskId: string;
  taskName: string;
  taskKey: string;
  status: TaskStatus;
  assignee: { name: string; initials: string; tint: string };
};

// Update the task with the given key: optionally set status (Completed also ticks
// `done`) and/or append a commit. Returns null when no task carries that key.
// Used by the autom8 task API (client-SDK path).
export async function updateTaskByKey(
  key: string,
  input: TaskUpdateInput
): Promise<TaskUpdateResult | null> {
  const snap = await getDocs(query(tasksCol, where("key", "==", key), limit(1)));
  if (snap.empty) return null;

  const d = snap.docs[0];
  const task = { id: d.id, ...d.data() } as Task;

  const update: Partial<Task> = {};
  if (input.commit) {
    update.commits = arrayUnion(input.commit) as unknown as LinkedCommit[];
  }
  if (input.status) {
    update.status = input.status;
    update.done = input.status === "Completed";
  }
  await updateDoc(d.ref, update);

  return {
    taskId: d.id,
    taskName: task.name,
    taskKey: key,
    status: input.status ?? task.status,
    assignee: task.assignee,
  };
}

// List tasks for the API (client-SDK path).
export async function listTasks(): Promise<Task[]> {
  return fromSnap<Task>(await getDocs(tasksCol));
}

// Fetch a single project by its doc id (client-SDK path). Used by the document
// upload route to confirm the target project exists before storing anything.
export async function getProject(id: string): Promise<DashboardProject | null> {
  const snap = await getDoc(doc(projectsCol, id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as DashboardProject) : null;
}

// Store an uploaded project document (metadata + extracted text). Client-SDK path.
export async function createDocumentRecord(
  data: Omit<ProjectDocument, "id">
): Promise<string> {
  const ref = await addDoc(documentsCol, data);
  return ref.id;
}

// List a project's uploaded documents, newest first. Client-SDK path. Filtered by
// equality only (no orderBy) so no composite index is required — sorted in memory.
export async function listDocumentsByProject(
  projectId: string
): Promise<ProjectDocument[]> {
  const snap = await getDocs(
    query(documentsCol, where("projectId", "==", projectId))
  );
  return fromSnap<ProjectDocument>(snap).sort(
    (a, b) => b.uploadedAt - a.uploadedAt
  );
}

export async function logActivityDoc(
  data: Omit<Activity, "id" | "createdAt" | "time"> & { time?: string }
): Promise<string> {
  const ref = await addDoc(activitiesCol, {
    ...data,
    time: data.time ?? "Just now",
    createdAt: Date.now(),
  });
  return ref.id;
}

// ---------------------------------------------------------------------------
// Seeding — first run (empty DB) and "Reset demo data" (overwrite).
// ---------------------------------------------------------------------------

async function clearCollection(
  batch: ReturnType<typeof writeBatch>,
  col: typeof usersCol
) {
  const snap = await getDocs(col);
  snap.docs.forEach((d) => batch.delete(d.ref));
}

export async function seedFirestore(): Promise<void> {
  const batch = writeBatch(db);

  // Wipe anything already there so a reset returns to a known state.
  await clearCollection(batch, usersCol);
  await clearCollection(batch, projectsCol);
  await clearCollection(batch, tasksCol);
  await clearCollection(batch, activitiesCol);

  seedTeam.forEach((u) => batch.set(doc(usersCol, u.id), stripId(u)));
  seedProjects.forEach((p) => batch.set(doc(projectsCol, p.id), stripId(p)));
  seedTasks.forEach((t) => batch.set(doc(tasksCol, t.id), stripId(t)));

  // Give seed activities a descending createdAt so the first entry reads as the
  // newest, while staying far below any live Date.now() value.
  const base = 1_000_000;
  seedActivities.forEach((a, i) =>
    batch.set(doc(activitiesCol, a.id), {
      ...stripId(a),
      createdAt: base - i,
    })
  );

  await batch.commit();
}

// One-shot helper for explicit seeding from a known id (kept for completeness).
export function setUserDoc(user: TeamMember) {
  return setDoc(doc(usersCol, user.id), stripId(user));
}
