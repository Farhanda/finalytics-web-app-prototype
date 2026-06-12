"use client";

import { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
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
import type { GeneratedTaskDraft, Priority, TaskCategory } from "@/lib/data";
import type { DashboardProject } from "@/lib/dashboard-data";
import { useDashboard } from "@/components/dashboard/provider";

const PRIORITIES: Priority[] = ["High", "Medium", "Low"];

const categoryTint: Record<TaskCategory, string> = {
  Frontend: "bg-sky-100 text-sky-700",
  Backend: "bg-violet-100 text-violet-700",
  Design: "bg-rose-100 text-rose-700",
  QA: "bg-amber-100 text-amber-700",
  DevOps: "bg-emerald-100 text-emerald-700",
  Research: "bg-cyan-100 text-cyan-700",
  Other: "bg-muted text-muted-foreground",
};

const fieldClass =
  "h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40";

type Row = {
  include: boolean;
  name: string;
  category: TaskCategory;
  priority: Priority;
  description: string;
  assigneeId: string; // "" = unassigned
};

export function TaskReviewDialog({
  project,
  drafts,
  open,
  onOpenChange,
}: {
  project: DashboardProject | null;
  drafts: GeneratedTaskDraft[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { membersOf, addGeneratedTasks } = useDashboard();
  const [rows, setRows] = useState<Row[]>([]);
  const [saving, setSaving] = useState(false);

  const members = project ? membersOf(project.id) : [];

  // Re-seed the editable rows whenever a fresh batch of drafts arrives.
  useEffect(() => {
    if (!open) return;
    setRows(
      drafts.map((d) => ({
        include: true,
        name: d.name,
        category: d.category,
        priority: d.priority,
        description: d.description,
        assigneeId: "",
      }))
    );
  }, [open, drafts]);

  const setRow = (i: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const selectedCount = rows.filter((r) => r.include && r.name.trim()).length;

  async function handleAdd() {
    if (!project) return;
    const inputs = rows
      .filter((r) => r.include && r.name.trim())
      .map((r) => ({
        name: r.name.trim(),
        projectId: project.id,
        assigneeId: r.assigneeId,
        priority: r.priority,
        category: r.category,
      }));
    if (inputs.length === 0) return;

    setSaving(true);
    try {
      await addGeneratedTasks(inputs);
      toast.success("Tasks added to board", {
        description: `${inputs.length} task${
          inputs.length === 1 ? "" : "s"
        } created in ${project.name}.`,
      });
      onOpenChange(false);
    } catch {
      toast.error("Could not add tasks", {
        description: "Something went wrong saving the tasks.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="size-4 text-primary" />
            Review AI-drafted tasks
          </DialogTitle>
          <DialogDescription>
            {project ? (
              <>
                Edit, deselect, or assign before adding to{" "}
                <span className="font-medium text-foreground">
                  {project.name}
                </span>
                . Unassigned tasks can be assigned later on the board.
              </>
            ) : (
              "Review the generated tasks."
            )}
          </DialogDescription>
        </DialogHeader>

        {rows.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            No tasks were generated from this document.
          </p>
        ) : (
          <ul className="max-h-[26rem] space-y-2 overflow-y-auto pr-1">
            {rows.map((r, i) => (
              <li
                key={i}
                className={cn(
                  "rounded-xl border border-border p-3 transition-colors",
                  r.include ? "bg-card" : "bg-muted/40 opacity-60"
                )}
              >
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={r.include}
                    onChange={(e) => setRow(i, { include: e.target.checked })}
                    className="mt-1 size-4 shrink-0 accent-[var(--color-primary)]"
                  />
                  <div className="min-w-0 flex-1 space-y-2">
                    <input
                      value={r.name}
                      onChange={(e) => setRow(i, { name: e.target.value })}
                      className={cn(fieldClass, "font-medium")}
                    />
                    <p className="text-xs text-muted-foreground">
                      {r.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex shrink-0 rounded-md px-2 py-1 text-[11px] font-medium",
                          categoryTint[r.category]
                        )}
                      >
                        {r.category}
                      </span>
                      <select
                        value={r.priority}
                        onChange={(e) =>
                          setRow(i, { priority: e.target.value as Priority })
                        }
                        className={cn(fieldClass, "h-8 w-auto cursor-pointer")}
                        aria-label="Priority"
                      >
                        {PRIORITIES.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                      <select
                        value={r.assigneeId}
                        onChange={(e) =>
                          setRow(i, { assigneeId: e.target.value })
                        }
                        className={cn(fieldClass, "h-8 w-auto cursor-pointer")}
                        aria-label="Assignee"
                      >
                        <option value="">Unassigned</option>
                        {members.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="text-sm text-muted-foreground">
            {selectedCount} selected
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="font-semibold"
              disabled={saving || selectedCount === 0}
              onClick={handleAdd}
            >
              {saving && <Loader2 className="size-4 animate-spin" />}
              Add {selectedCount > 0 ? selectedCount : ""} to board
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
