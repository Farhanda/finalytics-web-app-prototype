"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useDashboard } from "@/components/dashboard/provider";
import { ProjectCard } from "@/components/dashboard/project-card";

export default function ProjectsPage() {
  const { visibleProjects, role, canCreateProject, openCreateProject } =
    useDashboard();

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
        {visibleProjects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
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
