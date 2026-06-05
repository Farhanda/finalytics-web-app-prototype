"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { ProjectStatus } from "@/lib/dashboard-data";
import { useDashboard, type ProjectInput } from "@/components/dashboard/provider";

const statuses: ProjectStatus[] = ["On track", "At risk", "Delayed"];

const fieldClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40";

// Best-effort: turn a stored display date ("25 April, 2026") into yyyy-mm-dd.
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
function toInputDate(due: string): string {
  const m = due.match(/^(\d{1,2})\s+(\w+),\s+(\d{4})$/);
  if (!m) return "";
  const month = MONTHS.indexOf(m[2]);
  if (month < 0) return "";
  return `${m[3]}-${String(month + 1).padStart(2, "0")}-${m[1].padStart(2, "0")}`;
}

const empty: ProjectInput = {
  name: "",
  client: "",
  dueDate: "",
  pmId: "",
  memberIds: [],
  status: "On track",
  progress: 0,
};

export function ProjectDialog() {
  const {
    projectDialog,
    setProjectDialogOpen,
    addProject,
    updateProject,
    role,
    pmCandidates,
    memberCandidates,
  } = useDashboard();

  const [form, setForm] = useState<ProjectInput>(empty);
  const [error, setError] = useState<string | null>(null);

  const isEdit = projectDialog.mode === "edit";
  const isAdmin = role === "Admin";
  // Admins can reassign the PM; a PM editing their own project cannot.
  const canSetPm = isAdmin;

  useEffect(() => {
    if (!projectDialog.open) return;
    setError(null);
    if (isEdit && projectDialog.project) {
      const p = projectDialog.project;
      setForm({
        name: p.name,
        client: p.client,
        dueDate: toInputDate(p.due),
        pmId: p.pmId,
        memberIds: [...p.memberIds],
        status: p.status,
        progress: p.progress,
      });
    } else {
      setForm({ ...empty, pmId: pmCandidates[0]?.id ?? "" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectDialog.open, projectDialog.project]);

  const set = <K extends keyof ProjectInput>(key: K, val: ProjectInput[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const toggleMember = (id: string) =>
    setForm((f) => ({
      ...f,
      memberIds: f.memberIds.includes(id)
        ? f.memberIds.filter((m) => m !== id)
        : [...f.memberIds, id],
    }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Project name is required.");
      return;
    }
    if (!form.pmId) {
      setError("Please assign a project manager.");
      return;
    }
    if (isEdit && projectDialog.project) {
      updateProject(projectDialog.project.id, form);
      toast.success("Project updated", { description: form.name.trim() });
    } else {
      addProject(form);
      toast.success("Project created", { description: form.name.trim() });
    }
    setProjectDialogOpen(false);
  };

  return (
    <Dialog open={projectDialog.open} onOpenChange={setProjectDialogOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {isEdit ? "Manage project" : "New project"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update details and assign the team working on this project."
              : "Create a project, assign a PM, and pick the team."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="project-name">Project name</Label>
              <input
                id="project-name"
                autoFocus
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Landing Page Redesign"
                className={fieldClass}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="project-client">Client</Label>
              <input
                id="project-client"
                value={form.client}
                onChange={(e) => set("client", e.target.value)}
                placeholder="e.g. Finalytics"
                className={fieldClass}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="project-pm">Project manager</Label>
              <select
                id="project-pm"
                value={form.pmId}
                onChange={(e) => set("pmId", e.target.value)}
                disabled={!canSetPm}
                className={cn(
                  fieldClass,
                  "cursor-pointer",
                  !canSetPm && "cursor-not-allowed opacity-70"
                )}
              >
                {pmCandidates.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="project-due">Target delivery</Label>
              <input
                id="project-due"
                type="date"
                value={form.dueDate}
                onChange={(e) => set("dueDate", e.target.value)}
                className={cn(fieldClass, "cursor-pointer")}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="project-status">Status</Label>
              <select
                id="project-status"
                value={form.status}
                onChange={(e) => set("status", e.target.value as ProjectStatus)}
                className={cn(fieldClass, "cursor-pointer")}
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="project-progress">Progress (%)</Label>
              <input
                id="project-progress"
                type="number"
                min={0}
                max={100}
                value={form.progress}
                onChange={(e) =>
                  set(
                    "progress",
                    Math.max(0, Math.min(100, Number(e.target.value) || 0))
                  )
                }
                className={fieldClass}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Team members</Label>
            <div className="grid max-h-44 grid-cols-1 gap-1 overflow-y-auto rounded-lg border border-border p-2 sm:grid-cols-2">
              {memberCandidates.map((m) => {
                const checked = form.memberIds.includes(m.id);
                return (
                  <label
                    key={m.id}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                      checked ? "bg-accent" : "hover:bg-muted"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleMember(m.id)}
                      className="size-4 accent-[var(--color-primary)]"
                    />
                    <span
                      className={cn(
                        "grid size-6 shrink-0 place-items-center rounded-full text-[10px] font-semibold",
                        m.tint
                      )}
                    >
                      {m.initials}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-foreground">
                      {m.name}
                    </span>
                  </label>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {form.memberIds.length} member
              {form.memberIds.length === 1 ? "" : "s"} selected
            </p>
          </div>

          {error && (
            <p className="text-sm font-medium text-destructive">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => setProjectDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="font-semibold">
              {isEdit ? "Save changes" : "Create project"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
