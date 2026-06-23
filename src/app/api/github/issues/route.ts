// POST /api/github/issues
//
// Auto-opens a GitHub Issue for one or more just-created tasks (Autom8 → GitHub)
// and writes issueNumber/issueUrl/repoFullName back onto each task. Called by the
// dashboard provider right after a task (or an approved AI batch) is created. The
// GitHub App key is server-only, so issue creation lives here, never the browser.
//
// Body: { taskIds: string[] }
// Each task gets a "created" | "skipped" | "failed" result, so a partial failure
// (one repo where the app isn't installed) never blocks the rest of a batch.

import { firebaseReady } from "@/lib/firebase";
import { adminReady } from "@/lib/firebase-admin";
import {
  getProject,
  getTask,
  logActivityDoc,
  updateTaskDoc,
} from "@/lib/firestore";
import {
  getProjectAdmin,
  getTaskAdmin,
  logActivityAdmin,
  updateTaskDocAdmin,
} from "@/lib/firestore-admin";
import { createIssue, githubAppReady } from "@/lib/github-app";
import { authorize } from "@/lib/route-auth";
import type { Task } from "@/lib/data";

export const runtime = "nodejs";

// Open at most a few issues at once so an AI batch can't trip GitHub's secondary
// rate limits.
const CONCURRENCY = 4;

type IssueResult = {
  taskId: string;
  status: "created" | "skipped" | "failed";
  issueNumber?: number;
  issueUrl?: string;
  reason?: string;
};

function issueBody(task: Task): string {
  return [
    `Tracked in autom8 as **${task.key}**.`,
    "",
    "Closing this issue will automatically mark the autom8 task complete.",
    "Reference it from a commit or PR with a closing keyword on the default",
    "branch — e.g. `fixes #<n>`, `closes #<n>`, or `resolves #<n>`.",
    "",
    "— opened automatically by autom8",
  ].join("\n");
}

async function createForTask(taskId: string): Promise<IssueResult> {
  const getT = adminReady ? getTaskAdmin : getTask;
  const getP = adminReady ? getProjectAdmin : getProject;
  const updateT = adminReady ? updateTaskDocAdmin : updateTaskDoc;
  const log = adminReady ? logActivityAdmin : logActivityDoc;

  const task = await getT(taskId);
  if (!task) return { taskId, status: "failed", reason: "Task not found." };
  if (task.issueNumber)
    return { taskId, status: "skipped", reason: "Already linked." };

  const project = await getP(task.projectId);
  const repoFullName = project?.repoFullName?.trim();
  if (!repoFullName)
    return { taskId, status: "skipped", reason: "Project has no linked repo." };

  try {
    const issue = await createIssue({
      repoFullName,
      title: `[${task.key}] ${task.name}`,
      body: issueBody(task),
    });
    if (!issue)
      return { taskId, status: "failed", reason: "GitHub App not configured." };

    await updateT(taskId, {
      issueNumber: issue.number,
      issueUrl: issue.url,
      repoFullName,
    });
    await log({
      actor: "autom8",
      initials: "A8",
      tint: "bg-slate-100 text-slate-700",
      action: `opened GitHub issue #${issue.number} for`,
      target: task.name,
    });
    return {
      taskId,
      status: "created",
      issueNumber: issue.number,
      issueUrl: issue.url,
    };
  } catch (err) {
    console.error("[github/issues] create failed", err);
    return {
      taskId,
      status: "failed",
      reason: err instanceof Error ? err.message : "Issue creation failed.",
    };
  }
}

export async function POST(req: Request) {
  if (!firebaseReady && !adminReady)
    return Response.json(
      { ok: false, error: "Firebase is not configured." },
      { status: 503 }
    );

  // Any signed-in member may trigger issue creation (it follows task creation,
  // which members can also do). Blocks anonymous callers.
  const auth = await authorize(req);
  if (!auth.ok) return auth.response;

  if (!githubAppReady)
    return Response.json(
      {
        ok: false,
        error:
          "GitHub App is not configured. Set GITHUB_APP_ID and GITHUB_APP_PRIVATE_KEY to auto-create issues.",
      },
      { status: 503 }
    );

  let taskIds: string[];
  try {
    const body = (await req.json()) as { taskIds?: unknown };
    taskIds = Array.isArray(body?.taskIds)
      ? body.taskIds.filter((t): t is string => typeof t === "string")
      : [];
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }
  if (taskIds.length === 0)
    return Response.json(
      { ok: false, error: "taskIds must be a non-empty array." },
      { status: 400 }
    );

  const results: IssueResult[] = [];
  for (let i = 0; i < taskIds.length; i += CONCURRENCY) {
    const wave = taskIds.slice(i, i + CONCURRENCY);
    results.push(...(await Promise.all(wave.map(createForTask))));
  }

  return Response.json({
    ok: true,
    storage: adminReady ? "admin" : "client",
    results,
  });
}
