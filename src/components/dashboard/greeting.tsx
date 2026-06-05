"use client";

import { cn } from "@/lib/utils";
import { accessRoleStyles } from "@/lib/dashboard-data";
import { useDashboard } from "@/components/dashboard/provider";

export function DashboardGreeting() {
  const { currentUser, role } = useDashboard();
  const firstName = currentUser.name.trim().split(/\s+/)[0] || "there";

  const subtitle =
    role === "Admin"
      ? "Here's everything happening across your workspace today."
      : role === "PM"
        ? "Here's how your projects and team are tracking today."
        : "Here's what's on your plate today.";

  return (
    <div>
      <div className="flex items-center gap-2">
        <h2 className="font-heading text-2xl font-extrabold tracking-tight text-foreground">
          Good morning, {firstName} 👋
        </h2>
        <span
          className={cn(
            "rounded-md px-2 py-0.5 text-xs font-semibold",
            accessRoleStyles[role]
          )}
        >
          {role}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}
