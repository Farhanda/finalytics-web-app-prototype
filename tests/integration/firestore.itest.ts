import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { initializeApp, deleteApp, type FirebaseApp } from "firebase/app";
import {
  addDoc,
  collection,
  connectFirestoreEmulator,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  runTransaction,
  where,
  type Firestore,
} from "firebase/firestore";

import { computeTaskKeys } from "@/lib/task-keys";

// Integration coverage for the Firestore CRUD + daily-report query logic that the
// unit suite can't reach (it needs a real database). Runs only against the local
// emulator; self-skips when FIRESTORE_EMULATOR_HOST is unset so `pnpm test` and a
// no-emulator `pnpm test:integration` both stay green.
//
//   pnpm emulators
//   pnpm test:integration
const EMULATOR = process.env.FIRESTORE_EMULATOR_HOST; // e.g. "localhost:8080"

describe.skipIf(!EMULATOR)("Firestore (emulator)", () => {
  let app: FirebaseApp;
  let db: Firestore;

  beforeAll(() => {
    const [host, port] = (EMULATOR ?? "localhost:8080").split(":");
    app = initializeApp({ projectId: "autom8-itest" }, "itest");
    db = getFirestore(app);
    connectFirestoreEmulator(db, host, Number(port));
  });

  afterAll(async () => {
    if (app) await deleteApp(app);
  });

  it("round-trips a task document (create → read → delete)", async () => {
    const ref = await addDoc(collection(db, "tasks"), {
      key: "AUT-1",
      name: "Emulator round-trip",
      status: "Pending",
      done: false,
    });
    const snap = await getDoc(doc(db, "tasks", ref.id));
    expect(snap.exists()).toBe(true);
    expect(snap.data()?.name).toBe("Emulator round-trip");

    await deleteDoc(doc(db, "tasks", ref.id));
    const gone = await getDoc(doc(db, "tasks", ref.id));
    expect(gone.exists()).toBe(false);
  });

  it("daily report counts DISTINCT completed tasks within the window", async () => {
    const since = 2_000_000; // above the seed band, fixed so the test is deterministic
    const activities = collection(db, "activities");

    // t-a completed twice (reopened then re-completed) → must count once.
    // t-b completed once. A "created" action must be ignored entirely.
    const written = [
      { action: "completed", target: "t-a", createdAt: since + 1 },
      { action: "completed", target: "t-a", createdAt: since + 2 },
      { action: "completed", target: "t-b", createdAt: since + 3 },
      { action: "created task", target: "t-c", createdAt: since + 4 },
    ];
    const refs = await Promise.all(written.map((a) => addDoc(activities, a)));

    try {
      const snap = await getDocs(
        query(activities, where("createdAt", ">=", since))
      );
      const rows = snap.docs.map((d) => d.data());
      const distinctCompleted = [
        ...new Set(
          rows.filter((a) => a.action === "completed").map((a) => a.target)
        ),
      ];
      expect(distinctCompleted.sort()).toEqual(["t-a", "t-b"]);
    } finally {
      await Promise.all(refs.map((r) => deleteDoc(r)));
    }
  });

  it("atomic key allocation never hands the same AUT-N to concurrent callers", async () => {
    const counter = doc(db, "counters", "taskKey-itest");

    // Mirror allocateTaskKeys() against this test's emulator-connected db.
    const allocate = (count: number, floor = 0) =>
      runTransaction(db, async (tx) => {
        const snap = await tx.get(counter);
        const stored = snap.exists() ? Number(snap.data()?.value) || 0 : 0;
        const { keys, next } = computeTaskKeys(stored, floor, count);
        tx.set(counter, { value: next });
        return keys;
      });

    try {
      // Fire many allocations at once; the transaction must serialize them.
      const batches = await Promise.all(
        Array.from({ length: 20 }, () => allocate(1))
      );
      const all = batches.flat();
      expect(all.length).toBe(20);
      // No duplicates across all concurrently-issued keys.
      expect(new Set(all).size).toBe(20);
    } finally {
      await deleteDoc(counter);
    }
  });
});
