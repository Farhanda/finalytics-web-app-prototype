import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { DashboardGreeting } from "@/components/dashboard/greeting";
import { StatCards } from "@/components/dashboard/stat-cards";
import { WeeklyChart } from "@/components/dashboard/weekly-chart";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { ProjectStatusList } from "@/components/dashboard/project-status-list";
import { TaskBoard } from "@/components/dashboard/task-board";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Greeting */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <DashboardGreeting />
        <Link
          href="/dashboard/tasks"
          className={cn(buttonVariants({ variant: "outline" }), "font-semibold")}
        >
          View all tasks
          <ArrowRight className="size-4" />
        </Link>
      </div>

      {/* KPIs */}
      <StatCards />

      {/* Chart + activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <WeeklyChart />
        </div>
        <ActivityFeed />
      </div>

      {/* Active projects */}
      <ProjectStatusList />

      {/* Recent tasks */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading text-lg font-bold text-foreground">
              Task Assignment
            </h3>
            <p className="text-sm text-muted-foreground">
              Assign, track, and update work in real time
            </p>
          </div>
          <Link
            href="/dashboard/tasks"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "font-semibold text-primary"
            )}
          >
            Open board
          </Link>
        </div>
        <TaskBoard />
      </div>
    </div>
  );
}
