import { cn } from "@/lib/utils";
import { activities } from "@/lib/dashboard-data";

export function ActivityFeed() {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border/60 px-6 py-5">
        <h3 className="font-heading text-lg font-bold text-foreground">
          Recent activity
        </h3>
        <p className="text-sm text-muted-foreground">What your team did lately</p>
      </div>

      <ul className="flex-1 space-y-1 p-3">
        {activities.map((item, i) => (
          <li
            key={i}
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

      <div className="border-t border-border/60 p-3">
        <button className="w-full rounded-lg py-2 text-sm font-semibold text-primary hover:bg-accent">
          View all activity
        </button>
      </div>
    </div>
  );
}
