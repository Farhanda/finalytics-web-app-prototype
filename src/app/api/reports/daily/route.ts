// /api/reports/daily — build the daily digest (tasks completed + commits per
// project over the last N hours) and post it to the Aixel Discord channel.
//
// GET  — used by Vercel Cron (it sends a GET with the CRON_SECRET bearer).
// POST — manual trigger.
// Query: ?dryRun=1 returns the computed report as JSON without sending;
//        ?hours=N overrides the 24h window.
//
// Auth: Authorization: Bearer <CRON_SECRET> (preferred, set by Vercel Cron) or
// <AUTOM8_API_TOKEN> (manual). Outward-facing (sends to Discord), so it's gated.

import { firebaseReady } from "@/lib/firebase";
import { adminReady } from "@/lib/firebase-admin";
import {
  listActivitiesSince,
  listProjectCommitsSince,
  listProjects,
} from "@/lib/firestore";
import {
  listActivitiesSinceAdmin,
  listProjectCommitsSinceAdmin,
  listProjectsAdmin,
} from "@/lib/firestore-admin";
import {
  buildDailyEmbed,
  discordReady,
  sendDiscordEmbed,
  type DailyReport,
} from "@/lib/discord";

export const runtime = "nodejs";

function authorized(req: Request): boolean {
  const provided = (req.headers.get("authorization") ?? "")
    .replace(/^Bearer\s+/i, "")
    .trim();
  if (!provided) return false;
  const cron = process.env.CRON_SECRET;
  const token = process.env.AUTOM8_API_TOKEN;
  return (
    (Boolean(cron) && provided === cron) ||
    (Boolean(token) && provided === token)
  );
}

async function handle(req: Request) {
  if (!firebaseReady && !adminReady)
    return Response.json(
      { ok: false, error: "Firebase is not configured." },
      { status: 503 }
    );
  if (!authorized(req))
    return Response.json(
      {
        ok: false,
        error:
          "Unauthorized. Send a Bearer CRON_SECRET or AUTOM8_API_TOKEN. (Set one in the environment.)",
      },
      { status: 401 }
    );

  const url = new URL(req.url);
  const dryRun = ["1", "true", "yes"].includes(
    (url.searchParams.get("dryRun") ?? "").toLowerCase()
  );
  const hours = Math.max(1, Number(url.searchParams.get("hours")) || 24);
  const since = Date.now() - hours * 60 * 60 * 1000;

  const [projects, activities, commits] = await Promise.all([
    adminReady ? listProjectsAdmin() : listProjects(),
    adminReady ? listActivitiesSinceAdmin(since) : listActivitiesSince(since),
    adminReady
      ? listProjectCommitsSinceAdmin(since)
      : listProjectCommitsSince(since),
  ]);

  const completedTasks = activities
    .filter((a) => a.action === "completed")
    .map((a) => a.target);

  // Group commits by project, then by division.
  const nameById = new Map(projects.map((p) => [p.id, p.name]));
  const byProject = new Map<
    string,
    { name: string; total: number; divisions: Map<string, number> }
  >();
  for (const c of commits) {
    const name = nameById.get(c.projectId) ?? "Unknown project";
    const entry =
      byProject.get(c.projectId) ??
      { name, total: 0, divisions: new Map<string, number>() };
    entry.total += 1;
    entry.divisions.set(c.division, (entry.divisions.get(c.division) ?? 0) + 1);
    byProject.set(c.projectId, entry);
  }

  const report: DailyReport = {
    windowHours: hours,
    dateLabel: new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    completedTasks,
    completedCount: completedTasks.length,
    totalCommits: commits.length,
    projects: [...byProject.values()]
      .sort((a, b) => b.total - a.total)
      .map((p) => ({
        name: p.name,
        total: p.total,
        divisions: [...p.divisions.entries()]
          .sort((a, b) => b[1] - a[1])
          .map(([division, count]) => ({ division, count })),
      })),
  };

  if (dryRun) return Response.json({ ok: true, sent: false, report });

  if (!discordReady)
    return Response.json(
      {
        ok: false,
        error:
          "DISCORD_WEBHOOK_URL is not set. Add it to send the report (or use ?dryRun=1 to preview).",
        report,
      },
      { status: 503 }
    );

  try {
    await sendDiscordEmbed(buildDailyEmbed(report));
  } catch (err) {
    console.error("[reports/daily] Discord send failed.", err);
    return Response.json(
      { ok: false, error: "Failed to send the Discord report.", report },
      { status: 502 }
    );
  }

  return Response.json({ ok: true, sent: true, report });
}

export const GET = handle;
export const POST = handle;
