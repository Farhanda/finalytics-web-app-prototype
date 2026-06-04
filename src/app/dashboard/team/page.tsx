"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowUpRight, Mail, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { useDashboard } from "@/components/dashboard/provider";

function TeamContent() {
  const { team, tasks } = useDashboard();
  const searchParams = useSearchParams();
  const role = searchParams.get("role");

  const members = role ? team.filter((m) => m.role === role) : team;

  const taskCountFor = (name: string) => {
    const assigned = tasks.filter((t) => t.assignee.name === name);
    return {
      total: assigned.length,
      open: assigned.filter((t) => !t.done).length,
    };
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-extrabold tracking-tight text-foreground">
          Team
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {team.length} people across {new Set(team.map((m) => m.role)).size}{" "}
          roles.
        </p>
      </div>

      {role && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtered by role:</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-sm font-semibold text-primary">
            {role}
            <Link href="/dashboard/team" aria-label="Clear filter">
              <X className="size-3.5" />
            </Link>
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((member) => {
          const { total, open } = taskCountFor(member.name);
          return (
            <div
              key={member.id}
              className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "grid size-12 shrink-0 place-items-center rounded-full text-sm font-semibold",
                    member.tint
                  )}
                >
                  {member.initials}
                </span>
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-foreground">
                    {member.name}
                  </h3>
                  <p className="truncate text-sm text-muted-foreground">
                    {member.role}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="size-4" />
                <span className="truncate">{member.email}</span>
              </div>

              <div className="mt-4 flex items-center gap-4 border-t border-border/60 pt-4 text-sm">
                <div>
                  <span className="font-heading text-lg font-bold text-foreground">
                    {total}
                  </span>{" "}
                  <span className="text-muted-foreground">tasks</span>
                </div>
                <div>
                  <span className="font-heading text-lg font-bold text-foreground">
                    {open}
                  </span>{" "}
                  <span className="text-muted-foreground">open</span>
                </div>
                <Link
                  href={`/dashboard/tasks?q=${encodeURIComponent(member.name)}`}
                  className="ml-auto inline-flex items-center gap-0.5 text-sm font-semibold text-primary hover:underline"
                >
                  View tasks
                  <ArrowUpRight className="size-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {members.length === 0 && (
        <p className="rounded-2xl border border-border bg-card px-5 py-14 text-center text-sm text-muted-foreground">
          No members in this role.
        </p>
      )}
    </div>
  );
}

export default function TeamPage() {
  return (
    <Suspense fallback={null}>
      <TeamContent />
    </Suspense>
  );
}
