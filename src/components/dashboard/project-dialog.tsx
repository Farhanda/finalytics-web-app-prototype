"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { authedFetch } from "@/lib/auth";
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
  repoFullName: "",
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
  // Repos the GitHub App can reach — the Admin links one at creation (required).
  const [repos, setRepos] = useState<string[]>([]);
  const [reposLoading, setReposLoading] = useState(false);
  const [reposError, setReposError] = useState<string | null>(null);

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
        repoFullName: p.repoFullName ?? "",
      });
    } else {
      setForm({ ...empty, pmId: pmCandidates[0]?.id ?? "" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectDialog.open, projectDialog.project]);

  // Load the linkable repos from the GitHub App when the dialog opens.
  useEffect(() => {
    if (!projectDialog.open) return;
    let cancelled = false;
    setReposLoading(true);
    setReposError(null);
    authedFetch("/api/github/repos")
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (cancelled) return;
        if (res.ok && data?.ok) {
          const list: string[] = data.repos ?? [];
          setRepos(list);
          if (list.length === 0)
            setReposError(
              "The GitHub App can't see any repositories yet. Install it on a repo first."
            );
        } else {
          setRepos([]);
          setReposError(
            data?.error ??
              "Could not load repositories. Configure & install the autom8 GitHub App."
          );
        }
      })
      .catch(() => {
        if (cancelled) return;
        setRepos([]);
        setReposError("Could not reach the server to load repositories.");
      })
      .finally(() => {
        if (!cancelled) setReposLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectDialog.open]);

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
    // Linking a repo is required when creating — that's what wires the project to
    // GitHub Issues. (Editing a legacy project without one isn't forced.)
    if (!isEdit && !form.repoFullName?.trim()) {
      setError("Please link a GitHub repository.");
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

          <div className="space-y-1.5">
            <Label htmlFor="project-repo">
              GitHub repository{!isEdit && <span className="text-destructive"> *</span>}
            </Label>
            <select
              id="project-repo"
              value={form.repoFullName ?? ""}
              onChange={(e) => set("repoFullName", e.target.value)}
              disabled={reposLoading || repos.length === 0}
              className={cn(
                fieldClass,
                "cursor-pointer",
                (reposLoading || repos.length === 0) &&
                  "cursor-not-allowed opacity-70"
              )}
            >
              <option value="">
                {reposLoading
                  ? "Loading repositories…"
                  : repos.length === 0
                    ? "No repositories available"
                    : "Select a repository"}
              </option>
              {/* Keep a previously-linked repo selectable even if the app can no
                  longer enumerate it. */}
              {form.repoFullName &&
                !repos.includes(form.repoFullName) && (
                  <option value={form.repoFullName}>{form.repoFullName}</option>
                )}
              {repos.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              {reposError ??
                "Tasks in this project auto-open an issue in this repo; closing the issue completes the task."}
            </p>
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
