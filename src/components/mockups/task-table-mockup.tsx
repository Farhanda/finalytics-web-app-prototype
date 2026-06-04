import { Check, Pencil, Plus, Search, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { tasks, type Priority, type TaskStatus } from "@/lib/data";

const statusStyles: Record<TaskStatus, string> = {
  "In-progress": "bg-amber-100 text-amber-700",
  Pending: "bg-rose-100 text-rose-600",
  Completed: "bg-emerald-100 text-emerald-700",
};

const priorityDot: Record<Priority, string> = {
  High: "bg-rose-500 text-rose-600",
  Medium: "bg-amber-500 text-amber-600",
  Low: "bg-emerald-500 text-emerald-600",
};

export function TaskTableMockup() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-slate-900/5">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 border-b border-border/70 px-5 py-4">
        <div className="flex w-full max-w-xs items-center gap-2 rounded-full border border-border bg-background px-3.5 py-2 text-sm text-muted-foreground">
          <Search className="size-4" />
          <span>Search task...</span>
        </div>
        <button className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/30">
          <Plus className="size-4" /> Create Task
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="bg-muted/50 text-xs font-semibold text-muted-foreground">
              <th className="px-5 py-3 font-semibold">Task Name</th>
              <th className="px-3 py-3 font-semibold">Created Date</th>
              <th className="px-3 py-3 font-semibold">Due Date</th>
              <th className="px-3 py-3 font-semibold">Assigned</th>
              <th className="px-3 py-3 font-semibold">Status</th>
              <th className="px-3 py-3 font-semibold">Priority</th>
              <th className="px-3 py-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/70">
            {tasks.map((task) => (
              <tr key={task.id} className="align-middle">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "grid size-5 shrink-0 place-items-center rounded-full border transition",
                        task.done
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/30 bg-background"
                      )}
                    >
                      {task.done && <Check className="size-3.5" strokeWidth={3} />}
                    </span>
                    <span
                      className={cn(
                        "max-w-[15rem] truncate font-medium text-foreground",
                        task.done && "text-muted-foreground line-through"
                      )}
                    >
                      {task.name}
                    </span>
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-3.5 text-muted-foreground">
                  {task.createdDate}{" "}
                  <span className="text-xs text-muted-foreground/70">
                    {task.createdTime}
                  </span>
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
                    <span
                      className={cn(
                        "size-2 rounded-full",
                        priorityDot[task.priority].split(" ")[0]
                      )}
                    />
                    <span className={priorityDot[task.priority].split(" ")[1]}>
                      {task.priority}
                    </span>
                  </span>
                </td>
                <td className="px-3 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <span className="grid size-7 place-items-center rounded-md bg-muted text-muted-foreground">
                      <Pencil className="size-3.5" />
                    </span>
                    <span className="grid size-7 place-items-center rounded-md bg-rose-50 text-rose-500">
                      <Trash2 className="size-3.5" />
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
