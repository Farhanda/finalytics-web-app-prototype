// POST /api/tasks/update — the integration point for Claude / the autom8 CLI.
//
// Body: { taskKey: "AUT-12", status?: "In-progress"|"Completed"|"Pending",
//         commit?: { sha, message, body?, url, author, timestamp? } }
//
// Sets the task's status (Completed also ticks it off) and/or attaches a commit.
// Writes via the Admin SDK when configured, otherwise the client SDK.
// Auth: Authorization: Bearer <AUTOM8_API_TOKEN>.

import { firebaseReady } from "@/lib/firebase";
import { adminReady } from "@/lib/firebase-admin";
import {
  logActivityDoc,
  updateTaskByKey,
  type TaskUpdateInput,
} from "@/lib/firestore";
import { logActivityAdmin, updateTaskByKeyAdmin } from "@/lib/firestore-admin";
import { apiTokenSet, isAuthorized } from "@/lib/api-auth";
import type { LinkedCommit, TaskStatus } from "@/lib/data";

export const runtime = "nodejs";

const STATUSES: TaskStatus[] = ["In-progress", "Pending", "Completed"];

function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export async function POST(req: Request) {
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

  let body: {
    taskKey?: string;
    status?: string;
    commit?: Partial<LinkedCommit>;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const taskKey = String(body.taskKey ?? "").trim().toUpperCase();
  if (!taskKey)
    return Response.json(
      { ok: false, error: "taskKey is required (e.g. AUT-12)." },
      { status: 400 }
    );

  const input: TaskUpdateInput = {};
  if (body.status) {
    if (!STATUSES.includes(body.status as TaskStatus))
      return Response.json(
        { ok: false, error: `status must be one of ${STATUSES.join(", ")}.` },
        { status: 400 }
      );
    input.status = body.status as TaskStatus;
  }
  if (body.commit && body.commit.sha) {
    input.commit = {
      sha: String(body.commit.sha).slice(0, 12),
      message: String(body.commit.message ?? "").slice(0, 200),
      body: body.commit.body ? String(body.commit.body).slice(0, 2000) : "",
      url: String(body.commit.url ?? ""),
      author: String(body.commit.author ?? "Claude"),
      timestamp: body.commit.timestamp ? String(body.commit.timestamp) : "",
    };
  }

  if (!input.status && !input.commit)
    return Response.json(
      { ok: false, error: "Provide a status and/or a commit." },
      { status: 400 }
    );

  const updater = adminReady ? updateTaskByKeyAdmin : updateTaskByKey;
  const result = await updater(taskKey, input);
  if (!result)
    return Response.json(
      { ok: false, error: `No task with key ${taskKey}.` },
      { status: 404 }
    );

  const actor = input.commit?.author || "Claude";
  const action =
    input.status === "Completed"
      ? "completed"
      : input.status === "In-progress"
        ? "started"
        : "logged a commit on";
  const log = adminReady ? logActivityAdmin : logActivityDoc;
  await log({
    actor,
    initials: initialsFrom(actor),
    tint: "bg-slate-100 text-slate-700",
    action,
    target: result.taskName,
  });

  return Response.json({
    ok: true,
    storage: adminReady ? "admin" : "client",
    task: result,
  });
}
