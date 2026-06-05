"use client";

import Link from "next/link";
import { ArrowUpRight, CalendarClock, Plus, Settings2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { statusStyles } from "@/lib/dashboard-data";
import { useDashboard } from "@/components/dashboard/provider";

export default function ProjectsPage() {
  const {
    visibleProjects,
    role,
    canCreateProject,
    canManageProject,
    openCreateProject,
    openEditProject,
    pmOf,
    membersOf,
  } = useDashboard();

  const subtitle =
    role === "Admin"
      ? "Every client engagement across the workspace."
      : role === "PM"
        ? "Projects you manage — assign your team and track delivery."
        : "Projects you're part of, and where your work fits in.";

  const summary = [
    { label: "Projects", value: visibleProjects.length },
    {
      label: "On track",
      value: visibleProjects.filter((p) => p.status === "On track").length,
    },
    {
      label: "At risk",
      value: visibleProjects.filter((p) => p.status === "At risk").length,
    },
    {
      label: "Delayed",
      value: visibleProjects.filter((p) => p.status === "Delayed").length,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-extrabold tracking-tight text-foreground">
            Projects
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {canCreateProject && (
          <Button className="font-semibold" onClick={openCreateProject}>
            <Plus className="size-4" /> New project
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summary.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-border bg-card p-5 shadow-sm"
          >
            <div className="font-heading text-2xl font-extrabold text-foreground">
              {item.value}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {visibleProjects.map((project) => {
          const pm = pmOf(project.id);
          const members = membersOf(project.id);
          return (
            <div
              key={project.id}
              className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-heading text-lg font-bold text-foreground">
                    {project.name}
                  </h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {project.client}
                  </p>
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

              <div className="mt-5 flex items-center justify-between gap-2 border-t border-border/60 pt-4">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarClock className="size-4" />
                  {project.due}
                </span>
                <div className="flex items-center gap-2">
                  {canManageProject(project) && (
                    <button
                      onClick={() => openEditProject(project)}
                      className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
                    >
                      <Settings2 className="size-3.5" />
                      Manage
                    </button>
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
            </div>
          );
        })}
      </div>

      {visibleProjects.length === 0 && (
        <p className="rounded-2xl border border-border bg-card px-5 py-14 text-center text-sm text-muted-foreground">
          {canCreateProject
            ? "No projects yet. Create your first project to get started."
            : "You haven't been assigned to any projects yet."}
        </p>
      )}
    </div>
  );
}
