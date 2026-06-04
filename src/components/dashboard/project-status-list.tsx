import { MoreHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";
import { dashboardProjects, statusStyles } from "@/lib/dashboard-data";

export function ProjectStatusList() {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border/60 px-6 py-5">
        <div>
          <h3 className="font-heading text-lg font-bold text-foreground">
            Active projects
          </h3>
          <p className="text-sm text-muted-foreground">
            Real-time progress across your workspace
          </p>
        </div>
        <button className="text-sm font-semibold text-primary hover:underline">
          View all
        </button>
      </div>

      <ul className="divide-y divide-border/60">
        {dashboardProjects.map((project) => (
          <li
            key={project.name}
            className="flex flex-wrap items-center gap-4 px-6 py-4"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate font-semibold text-foreground">
                  {project.name}
                </span>
                <span
                  className={cn(
                    "inline-flex shrink-0 rounded-md px-2 py-0.5 text-xs font-medium",
                    statusStyles[project.status]
                  )}
                >
                  {project.status}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {project.client} · Due {project.due}
              </p>
            </div>

            <div className="flex w-full items-center gap-3 sm:w-56">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn("h-full rounded-full", project.tint)}
                  style={{ width: `${project.progress}%` }}
                />
              </div>
              <span className="w-9 text-right text-sm font-semibold text-foreground">
                {project.progress}%
              </span>
            </div>

            <button
              className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted"
              aria-label="More options"
            >
              <MoreHorizontal className="size-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
