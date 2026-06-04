"use client";

import { cn } from "@/lib/utils";
import { useDashboard } from "@/components/dashboard/provider";

export function ActivityFeed() {
  const { activities } = useDashboard();

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border/60 px-6 py-5">
        <h3 className="font-heading text-lg font-bold text-foreground">
          Recent activity
        </h3>
        <p className="text-sm text-muted-foreground">What your team did lately</p>
      </div>

      <ul className="flex-1 space-y-1 overflow-y-auto p-3">
        {activities.length === 0 && (
          <li className="px-3 py-10 text-center text-sm text-muted-foreground">
            No activity yet.
          </li>
        )}
        {activities.slice(0, 6).map((item) => (
          <li
            key={item.id}
            className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/60"
          >
            <span
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-full text-xs font-semibold",
                item.tint
              )}
            >
              {item.initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-snug text-foreground">
                <span className="font-semibold">{item.actor}</span>{" "}
                <span className="text-muted-foreground">{item.action}</span>{" "}
                <span className="font-medium">{item.target}</span>
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{item.time}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
