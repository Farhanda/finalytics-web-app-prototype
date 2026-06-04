import { Loader2, Truck } from "lucide-react";

import { cn } from "@/lib/utils";
import { projectStages } from "@/lib/data";

export function ProjectStatusMockup() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-slate-900/5">
      <div className="p-6 sm:p-7">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-3">
          <h4 className="font-heading text-xl font-bold text-foreground">
            Landing Page Finalytics
          </h4>
          <span className="inline-flex items-center rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            Paid
          </span>
          <span className="inline-flex items-center rounded-full border border-amber-300 px-3 py-1 text-xs font-semibold text-amber-600">
            In Progress
          </span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Order / Order Details / #0758267/90 — March 23, 2026 at 6:23 pm
        </p>

        {/* Progress */}
        <h5 className="mt-7 font-heading text-base font-bold text-foreground">
          Progress
        </h5>
        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-5">
          {projectStages.map((stage) => (
            <div key={stage.label}>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full",
                    stage.state === "done" && "w-full bg-emerald-500",
                    stage.state === "active" &&
                      "w-1/2 bg-amber-400 [background-image:repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(255,255,255,.45)_4px,rgba(255,255,255,.45)_8px)]",
                    stage.state === "todo" && "w-0"
                  )}
                />
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                <span className="text-xs font-medium text-foreground">
                  {stage.label}
                </span>
                {stage.state === "active" && (
                  <Loader2 className="size-3.5 animate-spin text-primary" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 bg-muted/30 px-6 py-4 sm:px-7">
        <span className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground">
          <Truck className="size-4 text-muted-foreground" />
          Estimated shipping date : Apr 25, 2026
        </span>
        <button className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/30">
          See Details
        </button>
      </div>
    </div>
  );
}
