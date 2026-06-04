import type { Metadata } from "next";

import { TaskBoard } from "@/components/dashboard/task-board";

export const metadata: Metadata = {
  title: "Task Assignment — autom8",
};

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;

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

      <TaskBoard key={q} initialQuery={q} />
    </div>
  );
}
