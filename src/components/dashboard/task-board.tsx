"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Check,
  CircleDot,
  GitCommitHorizontal,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { type Priority, type Task, type TaskStatus } from "@/lib/data";
import { useDashboard } from "@/components/dashboard/provider";

const statusStyles: Record<TaskStatus, string> = {
  "In-progress": "bg-amber-100 text-amber-700",
  Pending: "bg-rose-100 text-rose-600",
  Completed: "bg-emerald-100 text-emerald-700",
};

const priorityStyles: Record<Priority, { dot: string; text: string }> = {
  High: { dot: "bg-rose-500", text: "text-rose-600" },
  Medium: { dot: "bg-amber-500", text: "text-amber-600" },
  Low: { dot: "bg-emerald-500", text: "text-emerald-600" },
};

const filters = ["All", "In-progress", "Pending", "Completed"] as const;
type Filter = (typeof filters)[number];

export function TaskBoard({
  initialQuery = "",
}: {
  initialQuery?: string;
}) {
  const {
    visibleTasks,
    projects,
    toggleTask,
    deleteTask,
    openEdit,
    openCreate,
    canEditTask,
    canToggleTask,
  } = useDashboard();
  const [query, setQuery] = useState(initialQuery);
  const [filter, setFilter] = useState<Filter>("All");
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);

  const projectName = useMemo(() => {
    const map = new Map(projects.map((p) => [p.id, p.name]));
    return (id: string) => map.get(id) ?? "—";
  }, [projects]);

  const counts = useMemo(
    () => ({
      All: visibleTasks.length,
      "In-progress": visibleTasks.filter((t) => t.status === "In-progress").length,
      Pending: visibleTasks.filter((t) => t.status === "Pending").length,
      Completed: visibleTasks.filter((t) => t.status === "Completed").length,
    }),
    [visibleTasks]
  ) as Record<Filter, number>;

  const visible = visibleTasks.filter((t) => {
    const matchesFilter = filter === "All" || t.status === filter;
    const q = query.toLowerCase();
    const matchesQuery =
      t.name.toLowerCase().includes(q) ||
      t.assignee.name.toLowerCase().includes(q) ||
      projectName(t.projectId).toLowerCase().includes(q);
    return matchesFilter && matchesQuery;
  });

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteTask(deleteTarget.id);
    toast.success("Task deleted", { description: deleteTarget.name });
    setDeleteTarget(null);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full max-w-xs items-center gap-2 rounded-full border border-border bg-background px-3.5 py-2 text-sm">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search task, assignee, project..."
            className="w-full bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
        <Button size="sm" className="font-semibold" onClick={openCreate}>
          <Plus className="size-4" /> Create Task
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1 border-b border-border/60 px-4 py-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              filter === f
                ? "bg-accent text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {f}
            <span
              className={cn(
                "grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-xs font-semibold",
                filter === f
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {counts[f]}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr className="bg-muted/40 text-xs font-semibold text-muted-foreground">
              <th className="px-5 py-3 font-semibold">Task Name</th>
              <th className="px-3 py-3 font-semibold">Project</th>
              <th className="px-3 py-3 font-semibold">Due Date</th>
              <th className="px-3 py-3 font-semibold">Assigned</th>
              <th className="px-3 py-3 font-semibold">Status</th>
              <th className="px-3 py-3 font-semibold">Priority</th>
              <th className="px-3 py-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {visible.map((task) => {
              const priority = priorityStyles[task.priority];
              const editable = canEditTask(task);
              const togglable = canToggleTask(task);
              return (
                <tr key={task.id} className="align-middle hover:bg-muted/30">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => togglable && toggleTask(task.id)}
                        disabled={!togglable}
                        aria-label={task.done ? "Mark incomplete" : "Mark complete"}
                        className={cn(
                          "grid size-5 shrink-0 place-items-center rounded-full border transition",
                          task.done
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground/30 bg-background hover:border-primary",
                          !togglable && "cursor-not-allowed opacity-50"
                        )}
                      >
                        {task.done && <Check className="size-3.5" strokeWidth={3} />}
                      </button>
                      <div className="min-w-0">
                        <div className="mb-0.5 flex items-center gap-2">
                          {task.key && (
                            <span className="font-mono text-[11px] font-semibold text-primary">
                              {task.key}
                            </span>
                          )}
                          {task.commits && task.commits.length > 0 && (
                            <span
                              className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground"
                              title={`${task.commits.length} linked commit(s)`}
                            >
                              <GitCommitHorizontal className="size-3" />
                              {task.commits.length}
                            </span>
                          )}
                          {task.issueNumber && (
                            <a
                              href={task.issueUrl || "#"}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground hover:text-primary"
                              title={`GitHub issue #${task.issueNumber}`}
                            >
                              <CircleDot className="size-3" />#{task.issueNumber}
                            </a>
                          )}
                        </div>
                        <span
                          className={cn(
                            "block max-w-[18rem] truncate font-medium text-foreground",
                            task.done && "text-muted-foreground line-through"
                          )}
                        >
                          {task.name}
                        </span>
                        {task.memberGenerated && (
                          <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700">
                            <Sparkles className="size-2.5" />
                            Member-generated
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3.5 text-muted-foreground">
                    {projectName(task.projectId)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3.5 text-muted-foreground">
                    {task.dueDate}
                  </td>
                  <td className="px-3 py-3.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "grid size-7 shrink-0 place-items-center rounded-full text-[11px] font-semibold",
                          task.assignee.tint
                        )}
                      >
                        {task.assignee.initials}
                      </span>
                      <span className="whitespace-nowrap font-medium text-foreground">
                        {task.assignee.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3.5">
                    <span
                      className={cn(
                        "inline-flex rounded-md px-2.5 py-1 text-xs font-medium",
                        statusStyles[task.status]
                      )}
                    >
                      {task.status}
                    </span>
                  </td>
                  <td className="px-3 py-3.5">
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium">
                      <span className={cn("size-2 rounded-full", priority.dot)} />
                      <span className={priority.text}>{task.priority}</span>
                    </span>
                  </td>
                  <td className="px-3 py-3.5">
                    {editable ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEdit(task)}
                          aria-label="Edit task"
                          className="grid size-7 place-items-center rounded-md bg-muted text-muted-foreground hover:bg-accent hover:text-primary"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(task)}
                          aria-label="Delete task"
                          className="grid size-7 place-items-center rounded-md bg-rose-50 text-rose-500 hover:bg-rose-100"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground/60">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {visible.length === 0 && (
          <div className="px-5 py-14 text-center text-sm text-muted-foreground">
            {visibleTasks.length === 0
              ? "No tasks yet. Create your first task to get started."
              : "No tasks match your search."}
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg">Delete task?</DialogTitle>
            <DialogDescription>
              This will permanently remove{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.name}
              </span>
              . This action can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete task
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
