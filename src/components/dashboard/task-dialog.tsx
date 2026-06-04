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
import type { Priority, TaskStatus } from "@/lib/data";
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

const empty: TaskInput = {
  name: "",
  assigneeId: "",
  dueDate: "",
  priority: "Medium",
  status: "Pending",
};

export function TaskDialog() {
  const { dialog, setDialogOpen, addTask, updateTask, team } = useDashboard();
  const [form, setForm] = useState<TaskInput>(empty);
  const [error, setError] = useState<string | null>(null);

  const isEdit = dialog.mode === "edit";

  // Sync form whenever the dialog opens.
  useEffect(() => {
    if (!dialog.open) return;
    setError(null);
    if (isEdit && dialog.task) {
      const member =
        team.find((m) => m.name === dialog.task!.assignee.name) ?? team[0];
      setForm({
        name: dialog.task.name,
        assigneeId: member.id,
        dueDate: toInputDate(dialog.task.dueDate),
        priority: dialog.task.priority,
        status: dialog.task.status,
      });
    } else {
      setForm({ ...empty, assigneeId: team[0]?.id ?? "" });
    }
  }, [dialog.open, dialog.task, isEdit, team]);

  const set = <K extends keyof TaskInput>(key: K, val: TaskInput[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Task name is required.");
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
              : "Add a new task and assign it to a teammate."}
          </DialogDescription>
        </DialogHeader>

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
            <Label htmlFor="task-assignee">Assignee</Label>
            <select
              id="task-assignee"
              value={form.assigneeId}
              onChange={(e) => set("assigneeId", e.target.value)}
              className={cn(fieldClass, "cursor-pointer")}
            >
              {team.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} — {m.role}
                </option>
              ))}
            </select>
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

          {error && <p className="text-sm font-medium text-destructive">{error}</p>}

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
      </DialogContent>
    </Dialog>
  );
}
