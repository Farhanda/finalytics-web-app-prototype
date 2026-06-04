"use client";

import { CalendarClock } from "lucide-react";

import { cn } from "@/lib/utils";
import { statusStyles } from "@/lib/dashboard-data";
import { useDashboard } from "@/components/dashboard/provider";

export default function ProjectsPage() {
  const { projects } = useDashboard();

  const summary = [
    { label: "Total projects", value: projects.length },
    {
      label: "On track",
      value: projects.filter((p) => p.status === "On track").length,
    },
    {
      label: "At risk",
      value: projects.filter((p) => p.status === "At risk").length,
    },
    {
      label: "Delayed",
      value: projects.filter((p) => p.status === "Delayed").length,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-extrabold tracking-tight text-foreground">
          Projects
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Track delivery progress across every client engagement.
        </p>
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
        {projects.map((project) => (
          <div
            key={project.id}
            className="rounded-2xl border border-border bg-card p-6 shadow-sm"
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

            <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarClock className="size-4" />
              Estimated delivery {project.due}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
