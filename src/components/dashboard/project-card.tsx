"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarClock,
  ExternalLink,
  FileText,
  GitCommitHorizontal,
  Settings2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { statusStyles, type DashboardProject } from "@/lib/dashboard-data";
import { useDashboard } from "@/components/dashboard/provider";
import { DocumentDialog } from "@/components/dashboard/document-dialog";

type Tab = "overview" | "commits";

export function ProjectCard({ project }: { project: DashboardProject }) {
  const {
    pmOf,
    membersOf,
    canManageProject,
    openEditProject,
    visibleTasks,
    currentUser,
  } = useDashboard();
  const [tab, setTab] = useState<Tab>("overview");
  const [docsOpen, setDocsOpen] = useState(false);

  const pm = pmOf(project.id);
  const members = membersOf(project.id);

  // Aggregate every linked commit across this project's tasks (newest first).
  const commits = visibleTasks
    .filter((t) => t.projectId === project.id)
    .flatMap((t) =>
      (t.commits ?? []).map((c) => ({
        ...c,
        taskKey: t.key,
        taskName: t.name,
      }))
    )
    .reverse();

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-heading text-lg font-bold text-foreground">
            {project.name}
          </h3>
          <p className="mt-0.5 text-sm text-muted-foreground">{project.client}</p>
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 rounded-md px-2.5 py-1 text-xs font-medium",
            statusStyles[project.status]
          )}
        >
          {project.status}
        </span>
      </div>

      {/* Tabs */}
      <div className="mt-4 inline-flex gap-1 rounded-lg bg-muted/60 p-1">
        <button
          onClick={() => setTab("overview")}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            tab === "overview"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Overview
        </button>
        <button
          onClick={() => setTab("commits")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            tab === "commits"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <GitCommitHorizontal className="size-3.5" />
          Commits
          <span
            className={cn(
              "grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-semibold",
              tab === "commits"
                ? "bg-primary/15 text-primary"
                : "bg-muted text-muted-foreground"
            )}
          >
            {commits.length}
          </span>
        </button>
      </div>

      {tab === "overview" ? (
        <>
          {/* PM + team */}
          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {pm ? (
                <>
                  <span
                    className={cn(
                      "grid size-8 shrink-0 place-items-center rounded-full text-[11px] font-semibold",
                      pm.tint
                    )}
                  >
                    {pm.initials}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {pm.name}
                    </p>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Project manager
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No PM assigned</p>
              )}
            </div>

            <div className="flex items-center">
              <div className="flex -space-x-2">
                {members.slice(0, 4).map((m) => (
                  <span
                    key={m.id}
                    title={m.name}
                    className={cn(
                      "grid size-8 place-items-center rounded-full text-[11px] font-semibold ring-2 ring-card",
                      m.tint
                    )}
                  >
                    {m.initials}
                  </span>
                ))}
              </div>
              {members.length > 4 && (
                <span className="ml-1 text-xs font-medium text-muted-foreground">
                  +{members.length - 4}
                </span>
              )}
              {members.length === 0 && (
                <span className="text-xs text-muted-foreground">
                  No members yet
                </span>
              )}
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">Progress</span>
              <span className="font-semibold text-foreground">
                {project.progress}%
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full", project.tint)}
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </div>
        </>
      ) : (
        /* Commits tab */
        <div className="mt-4 min-h-24">
          {commits.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
              No commits yet. They appear here as Claude works the project&apos;s
              tasks and runs{" "}
              <span className="font-mono font-semibold text-foreground">
                autom8 commit
              </span>
              .
            </div>
          ) : (
            <ul className="max-h-64 space-y-1 overflow-y-auto">
              {commits.map((c, i) => (
                <li
                  key={`${c.sha}-${i}`}
                  className="flex items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/50"
                >
                  <GitCommitHorizontal className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <a
                      href={c.url || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-sm text-foreground hover:underline"
                    >
                      <span className="truncate">{c.message}</span>
                      <ExternalLink className="size-3 shrink-0 text-muted-foreground" />
                    </a>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="font-mono">{c.sha}</span>
                      <span>·</span>
                      <span className="truncate">{c.author}</span>
                      {c.timestamp && (
                        <>
                          <span>·</span>
                          <span className="shrink-0">
                            {new Date(c.timestamp).toLocaleDateString(undefined, {
                              day: "2-digit",
                              month: "short",
                            })}
                          </span>
                        </>
                      )}
                      <span
                        className="ml-auto shrink-0 font-mono font-semibold text-primary"
                        title={c.taskName}
                      >
                        {c.taskKey}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-5 flex items-center justify-between gap-2 border-t border-border/60 pt-4">
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarClock className="size-4" />
          {project.due}
        </span>
        <div className="flex items-center gap-2">
          {canManageProject(project) && (
            <>
              <button
                onClick={() => setDocsOpen(true)}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
              >
                <FileText className="size-3.5" />
                Docs
              </button>
              <button
                onClick={() => openEditProject(project)}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
              >
                <Settings2 className="size-3.5" />
                Manage
              </button>
            </>
          )}
          <Link
            href={`/dashboard/tasks?q=${encodeURIComponent(project.name)}`}
            className="inline-flex items-center gap-0.5 text-sm font-semibold text-primary hover:underline"
          >
            Tasks
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </div>

      {canManageProject(project) && (
        <DocumentDialog
          project={project}
          uploadedBy={currentUser.name}
          open={docsOpen}
          onOpenChange={setDocsOpen}
        />
      )}
    </div>
  );
}
