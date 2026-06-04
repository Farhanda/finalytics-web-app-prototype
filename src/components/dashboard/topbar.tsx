"use client";

import { usePathname } from "next/navigation";
import { Bell, Menu, MessageSquare, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/tasks": "Task Assignment",
  "/dashboard/projects": "Projects",
  "/dashboard/calendar": "Calendar",
  "/dashboard/team": "Team",
  "/dashboard/roles": "Roles",
  "/dashboard/settings": "Settings",
  "/dashboard/help": "Help & support",
};

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();
  const title = titles[pathname] ?? "Dashboard";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <button
        onClick={onMenuClick}
        className="grid size-10 place-items-center rounded-lg text-foreground lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </button>

      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">autom8 / {title}</p>
        <h1 className="truncate font-heading text-lg font-bold leading-tight text-foreground">
          {title}
        </h1>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="hidden items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-sm text-muted-foreground md:flex">
          <Search className="size-4" />
          <input
            placeholder="Search anything..."
            className="w-40 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>

        <button className="relative grid size-10 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
          <Bell className="size-5" />
          <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-primary ring-2 ring-background" />
        </button>
        <button className="hidden size-10 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground sm:grid">
          <MessageSquare className="size-5" />
        </button>

        <Button size="sm" className="font-semibold">
          <Plus className="size-4" />
          <span className="hidden sm:inline">Create Task</span>
        </Button>
      </div>
    </header>
  );
}
