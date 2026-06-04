"use client";

import Link from "next/link";
import { ArrowUpRight, Shield } from "lucide-react";

import { cn } from "@/lib/utils";
import { useDashboard } from "@/components/dashboard/provider";
import type { TeamMember } from "@/lib/dashboard-data";

export default function RolesPage() {
  const { team, tasks } = useDashboard();

  const roles = (() => {
    const map = new Map<string, TeamMember[]>();
    for (const m of team) {
      const arr = map.get(m.role) ?? [];
      arr.push(m);
      map.set(m.role, arr);
    }
    return [...map.entries()]
      .map(([role, members]) => {
        const names = new Set(members.map((m) => m.name));
        const roleTasks = tasks.filter((t) => names.has(t.assignee.name));
        return {
          role,
          members,
          total: roleTasks.length,
          open: roleTasks.filter((t) => !t.done).length,
        };
      })
      .sort((a, b) => b.members.length - a.members.length);
  })();

  const summary = [
    { label: "Total roles", value: roles.length },
    { label: "Team members", value: team.length },
    {
      label: "Largest role",
      value: roles[0] ? `${roles[0].members.length}` : "0",
      sub: roles[0]?.role,
    },
    {
      label: "Open tasks",
      value: tasks.filter((t) => !t.done).length,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-extrabold tracking-tight text-foreground">
          Roles
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          How your team is organized, and the workload behind each role.
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
            {item.sub && (
              <p className="truncate text-xs text-muted-foreground/70">{item.sub}</p>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {roles.map(({ role, members, total, open }) => (
          <div
            key={role}
            className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-accent text-primary">
                  <Shield className="size-5" />
                </span>
                <div>
                  <h3 className="font-semibold text-foreground">{role}</h3>
                  <p className="text-xs text-muted-foreground">
                    {members.length} member{members.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex -space-x-2">
              {members.map((m) => (
                <span
                  key={m.id}
                  title={m.name}
                  className={cn(
                    "grid size-9 place-items-center rounded-full text-[11px] font-semibold ring-2 ring-card",
                    m.tint
                  )}
                >
                  {m.initials}
                </span>
              ))}
            </div>

            <div className="mt-5 flex items-center gap-4 border-t border-border/60 pt-4 text-sm">
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
                href={`/dashboard/team?role=${encodeURIComponent(role)}`}
                className="ml-auto inline-flex items-center gap-0.5 text-sm font-semibold text-primary hover:underline"
              >
                View members
                <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
