import { TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";
import { weeklyActivity } from "@/lib/dashboard-data";

export function WeeklyChart() {
  const max = Math.max(...weeklyActivity.map((d) => d.value));
  const total = weeklyActivity.reduce((sum, d) => sum + d.value, 0);
  const peakIndex = weeklyActivity.findIndex((d) => d.value === max);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-heading text-lg font-bold text-foreground">
            Tasks completed
          </h3>
          <p className="text-sm text-muted-foreground">This week</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
          <TrendingUp className="size-3.5" />
          +18%
        </span>
      </div>

      <div className="mt-6 flex items-baseline gap-2">
        <span className="font-heading text-3xl font-extrabold text-foreground">
          {total}
        </span>
        <span className="text-sm text-muted-foreground">tasks done</span>
      </div>

      <div className="mt-6 flex min-h-44 flex-1 items-end gap-2 sm:gap-3">
        {weeklyActivity.map((d, i) => (
          <div
            key={d.day}
            className="flex h-full flex-1 flex-col items-center justify-end gap-2"
          >
            <span className="text-xs font-semibold text-muted-foreground">
              {d.value}
            </span>
            <div className="flex w-full flex-1 items-end justify-center">
              <div
                className={cn(
                  "w-full max-w-9 rounded-t-md transition-all",
                  i === peakIndex ? "bg-primary" : "bg-primary/25"
                )}
                style={{ height: `${Math.max((d.value / max) * 100, 6)}%` }}
                title={`${d.value} tasks`}
              />
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              {d.day}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
