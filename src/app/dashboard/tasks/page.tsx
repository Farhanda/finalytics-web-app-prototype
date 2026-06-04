import type { Metadata } from "next";

import { TaskBoard } from "@/components/dashboard/task-board";

export const metadata: Metadata = {
  title: "Task Assignment — autom8",
};

const summary = [
  { label: "Total tasks", value: "6" },
  { label: "In progress", value: "2" },
  { label: "Due this week", value: "3" },
  { label: "Completed", value: "2" },
];

export default function TasksPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-extrabold tracking-tight text-foreground">
          Task Assignment
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Every task across your projects — owned, dated, and prioritized.
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

      <TaskBoard />
    </div>
  );
}
