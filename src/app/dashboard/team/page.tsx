"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowUpRight, Mail, ShieldAlert, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { accessRoleStyles, type AccessRole } from "@/lib/dashboard-data";
import { useDashboard } from "@/components/dashboard/provider";

const ACCESS_ORDER: AccessRole[] = ["Admin", "PM", "Member"];

function TeamContent() {
  const { team, tasks, role } = useDashboard();
  const searchParams = useSearchParams();
  const jobFilter = searchParams.get("role");

  // The Team directory is an Admin-only surface.
  if (role !== "Admin") {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card px-6 py-16 text-center">
          <span className="grid size-12 place-items-center rounded-xl bg-rose-50 text-rose-500">
            <ShieldAlert className="size-6" />
          </span>
          <h2 className="font-heading text-xl font-bold text-foreground">
            Admins only
          </h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            The team directory is available to workspace admins. Switch to an
            Admin identity to manage people and roles.
          </p>
        </div>
      </div>
    );
  }

  const members = jobFilter
    ? team.filter((m) => m.role === jobFilter)
    : team;

  const taskCountFor = (id: string) => {
    const assigned = tasks.filter((t) => t.assigneeId === id);
    return {
      total: assigned.length,
      open: assigned.filter((t) => !t.done).length,
    };
  };

  const accessCounts = ACCESS_ORDER.map((r) => ({
    role: r,
    count: team.filter((m) => m.accessRole === r).length,
  }));

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

      {/* Access-role summary */}
      <div className="grid grid-cols-3 gap-4">
        {accessCounts.map(({ role: r, count }) => (
          <div
            key={r}
            className="rounded-2xl border border-border bg-card p-5 shadow-sm"
          >
            <span
              className={cn(
                "inline-flex rounded-md px-2 py-0.5 text-xs font-semibold",
                accessRoleStyles[r]
              )}
            >
              {r}
            </span>
            <div className="mt-3 font-heading text-2xl font-extrabold text-foreground">
              {count}
            </div>
          </div>
        ))}
      </div>

      {jobFilter && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtered by title:</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-sm font-semibold text-primary">
            {jobFilter}
            <Link href="/dashboard/team" aria-label="Clear filter">
              <X className="size-3.5" />
            </Link>
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((member) => {
          const { total, open } = taskCountFor(member.id);
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
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-semibold text-foreground">
                      {member.name}
                    </h3>
                    <span
                      className={cn(
                        "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold",
                        accessRoleStyles[member.accessRole]
                      )}
                    >
                      {member.accessRole}
                    </span>
                  </div>
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
          No members with this title.
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
