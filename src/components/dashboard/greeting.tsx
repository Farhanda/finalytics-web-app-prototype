"use client";

import { useDashboard } from "@/components/dashboard/provider";

export function DashboardGreeting() {
  const { profile } = useDashboard();
  const firstName = profile.name.trim().split(/\s+/)[0] || "there";

  return (
    <div>
      <h2 className="font-heading text-2xl font-extrabold tracking-tight text-foreground">
        Good morning, {firstName} 👋
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Here&apos;s what&apos;s happening across your workspace today.
      </p>
    </div>
  );
}
