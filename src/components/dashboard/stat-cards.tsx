"use client";

import { Box, CheckCircle2, ListTodo, Users, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { useDashboard } from "@/components/dashboard/provider";

export function StatCards() {
  const { tasks, projects, team } = useDashboard();

  const total = tasks.length;
  const done = tasks.filter((t) => t.done).length;
  const open = total - done;
  const completion = total ? Math.round((done / total) * 100) : 0;
  const roles = new Set(team.map((m) => m.role)).size;
  const onTrack = projects.filter((p) => p.status === "On track").length;

  const cards: {
    label: string;
    value: string;
    hint: string;
    icon: LucideIcon;
    bar?: number;
  }[] = [
    {
      label: "Team Members",
      value: String(team.length),
      hint: `across ${roles} roles`,
      icon: Users,
    },
    {
      label: "Active Projects",
      value: String(projects.length),
      hint: `${onTrack} on track`,
      icon: Box,
    },
    {
      label: "Open Tasks",
      value: String(open),
      hint: `${total} total · ${done} done`,
      icon: ListTodo,
    },
    {
      label: "Completion",
      value: `${completion}%`,
      hint: `${done} of ${total} done`,
      icon: CheckCircle2,
      bar: completion,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border border-border bg-card p-5 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-accent text-primary">
              <card.icon className="size-5" />
            </span>
            <span className="text-sm font-medium text-foreground">
              {card.label}
            </span>
          </div>
          <div className="mt-4">
            <div className="font-heading text-3xl font-extrabold text-foreground">
              {card.value}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{card.hint}</p>
            {typeof card.bar === "number" && (
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn("h-full rounded-full bg-primary transition-all")}
                  style={{ width: `${card.bar}%` }}
                />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
