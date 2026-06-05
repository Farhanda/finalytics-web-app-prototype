"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

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
import type { Priority, TaskStatus } from "@/lib/data";
import type { TeamMember } from "@/lib/dashboard-data";
import { useDashboard, type TaskInput } from "@/components/dashboard/provider";

const priorities: Priority[] = ["High", "Medium", "Low"];
const statuses: TaskStatus[] = ["In-progress", "Pending", "Completed"];

const fieldClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40";

// Convert a stored due date ("28 April, 2026") back to yyyy-mm-dd for the input.
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

export function TaskDialog() {
  const {
    dialog,
    setDialogOpen,
    addTask,
    updateTask,
    role,
    currentUser,
    creatableProjects,
    membersOf,
    projects,
  } = useDashboard();

  const [form, setForm] = useState<TaskInput>({
    name: "",
    projectId: "",
    assigneeId: "",
    dueDate: "",
    priority: "Medium",
    status: "Pending",
  });
  const [error, setError] = useState<string | null>(null);

  const isEdit = dialog.mode === "edit";
  const isMember = role === "Member";

  // Projects the user may file this task under. When editing, make sure the
  // task's current project is selectable even if it falls outside the list.
  const projectOptions = useMemo(() => {
    const list = [...creatableProjects];
    if (isEdit && dialog.task) {
      const current = projects.find((p) => p.id === dialog.task!.projectId);
      if (current && !list.some((p) => p.id === current.id)) list.unshift(current);
    }
    return list;
  }, [creatableProjects, isEdit, dialog.task, projects]);

  // Assignees depend on role: Members can only assign to themselves; PMs/Admins
  // pick from the selected project's members.
  const assigneeOptions = useMemo<TeamMember[]>(() => {
    if (isMember) return [currentUser];
    if (!form.projectId) return [];
    const members = membersOf(form.projectId);
    // Keep the current assignee visible even if no longer a project member.
    if (isEdit && dialog.task) {
      const assigned = dialog.task.assigneeId;
      if (assigned && !members.some((m) => m.id === assigned)) {
        const extra = projects.length ? membersOf(dialog.task.projectId) : [];
        const match = extra.find((m) => m.id === assigned);
        if (match) members.unshift(match);
      }
    }
    return members;
  }, [isMember, currentUser, form.projectId, membersOf, isEdit, dialog.task, projects.length]);

  // Sync form whenever the dialog opens.
  useEffect(() => {
    if (!dialog.open) return;
    setError(null);
    if (isEdit && dialog.task) {
      setForm({
        name: dialog.task.name,
        projectId: dialog.task.projectId,
        assigneeId: dialog.task.assigneeId,
        dueDate: toInputDate(dialog.task.dueDate),
        priority: dialog.task.priority,
        status: dialog.task.status,
      });
    } else {
      const project = creatableProjects[0];
      const projectId = project?.id ?? "";
      const assigneeId = isMember
        ? currentUser.id
        : project
          ? membersOf(project.id)[0]?.id ?? ""
          : "";
      setForm({
        name: "",
        projectId,
        assigneeId,
        dueDate: "",
        priority: "Medium",
        status: "Pending",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialog.open, dialog.task, isEdit]);

  const set = <K extends keyof TaskInput>(key: K, val: TaskInput[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  // When the project changes, re-default the assignee to a valid member.
  const onProjectChange = (projectId: string) => {
    setForm((f) => {
      const assigneeId = isMember
        ? currentUser.id
        : membersOf(projectId)[0]?.id ?? "";
      return { ...f, projectId, assigneeId };
    });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Task name is required.");
      return;
    }
    if (!form.projectId) {
      setError("Please choose a project.");
      return;
    }
    if (!form.assigneeId) {
      setError("Please choose an assignee.");
      return;
    }
    if (isEdit && dialog.task) {
      updateTask(dialog.task.id, form);
      toast.success("Task updated", { description: form.name.trim() });
    } else {
      addTask(form);
      toast.success("Task created", { description: form.name.trim() });
    }
    setDialogOpen(false);
  };

  return (
    <Dialog open={dialog.open} onOpenChange={setDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {isEdit ? "Edit task" : "Create task"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the details of this task."
              : isMember
                ? "Log a task for yourself — it will be flagged as member-generated."
                : "Add a new task and assign it to a teammate."}
          </DialogDescription>
        </DialogHeader>

        {projectOptions.length === 0 ? (
          <div className="rounded-lg border border-border bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground">
            You don&apos;t have a project to add tasks to yet.
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="task-name">Task name</Label>
              <input
                id="task-name"
                autoFocus
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Review system logs for errors"
                className={fieldClass}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="task-project">Project</Label>
              <select
                id="task-project"
                value={form.projectId}
                onChange={(e) => onProjectChange(e.target.value)}
                className={cn(fieldClass, "cursor-pointer")}
              >
                {projectOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="task-assignee">Assignee</Label>
              <select
                id="task-assignee"
                value={form.assigneeId}
                onChange={(e) => set("assigneeId", e.target.value)}
                disabled={isMember}
                className={cn(
                  fieldClass,
                  "cursor-pointer",
                  isMember && "cursor-not-allowed opacity-70"
                )}
              >
                {assigneeOptions.length === 0 && (
                  <option value="">No members on this project</option>
                )}
                {assigneeOptions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — {m.role}
                  </option>
                ))}
              </select>
              {isMember && (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Sparkles className="size-3.5" />
                  Member-generated tasks are always assigned to you.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="task-due">Due date</Label>
                <input
                  id="task-due"
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => set("dueDate", e.target.value)}
                  className={cn(fieldClass, "cursor-pointer")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="task-priority">Priority</Label>
                <select
                  id="task-priority"
                  value={form.priority}
                  onChange={(e) => set("priority", e.target.value as Priority)}
                  className={cn(fieldClass, "cursor-pointer")}
                >
                  {priorities.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="task-status">Status</Label>
              <select
                id="task-status"
                value={form.status}
                onChange={(e) => set("status", e.target.value as TaskStatus)}
                className={cn(fieldClass, "cursor-pointer")}
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <p className="text-sm font-medium text-destructive">{error}</p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="font-semibold">
                {isEdit ? "Save changes" : "Create task"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
