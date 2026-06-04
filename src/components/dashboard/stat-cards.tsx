import {
  ArrowDownRight,
  ArrowUpRight,
  Box,
  CheckCircle2,
  Headphones,
  Users,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { kpis, type Kpi } from "@/lib/dashboard-data";

const icons: Record<Kpi["icon"], LucideIcon> = {
  users: Users,
  box: Box,
  roles: Headphones,
  tasks: CheckCircle2,
};

export function StatCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((kpi) => {
        const Icon = icons[kpi.icon];
        const up = kpi.trend === "up";
        return (
          <div
            key={kpi.label}
            className="rounded-2xl border border-border bg-card p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="grid size-11 place-items-center rounded-xl bg-accent text-primary">
                <Icon className="size-5" />
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-semibold",
                  up
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-rose-100 text-rose-600"
                )}
              >
                {up ? (
                  <ArrowUpRight className="size-3" />
                ) : (
                  <ArrowDownRight className="size-3" />
                )}
                {kpi.delta}
              </span>
            </div>
            <div className="mt-4">
              <div className="font-heading text-3xl font-extrabold text-foreground">
                {kpi.value}
              </div>
              <p className="mt-1 text-sm font-medium text-foreground">
                {kpi.label}
              </p>
              <p className="text-xs text-muted-foreground">{kpi.hint}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
