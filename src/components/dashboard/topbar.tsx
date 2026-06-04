"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Menu, Plus, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useDashboard } from "@/components/dashboard/provider";

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
  const router = useRouter();
  const { openCreate, activities } = useDashboard();
  const [query, setQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);

  const title = titles[pathname] ?? "Dashboard";

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/dashboard/tasks?q=${encodeURIComponent(q)}` : "/dashboard/tasks");
  };

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
        <form
          onSubmit={onSearch}
          className="hidden items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-sm text-muted-foreground focus-within:border-ring md:flex"
        >
          <Search className="size-4" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks..."
            className="w-40 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
          />
        </form>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative grid size-10 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Notifications"
          >
            <Bell className="size-5" />
            {activities.length > 0 && (
              <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-primary ring-2 ring-background" />
            )}
          </button>

          {notifOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setNotifOpen(false)}
              />
              <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
                <div className="border-b border-border/60 px-4 py-3">
                  <p className="text-sm font-semibold text-foreground">
                    Notifications
                  </p>
                </div>
                <ul className="max-h-80 divide-y divide-border/60 overflow-y-auto">
                  {activities.slice(0, 6).map((item) => (
                    <li key={item.id} className="flex items-start gap-3 px-4 py-3">
                      <span
                        className={cn(
                          "grid size-8 shrink-0 place-items-center rounded-full text-[11px] font-semibold",
                          item.tint
                        )}
                      >
                        {item.initials}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm leading-snug text-foreground">
                          <span className="font-semibold">{item.actor}</span>{" "}
                          <span className="text-muted-foreground">
                            {item.action}
                          </span>{" "}
                          {item.target}
                        </p>
                        <p className="text-xs text-muted-foreground">{item.time}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/dashboard"
                  onClick={() => setNotifOpen(false)}
                  className="block border-t border-border/60 px-4 py-2.5 text-center text-sm font-semibold text-primary hover:bg-accent"
                >
                  View all activity
                </Link>
              </div>
            </>
          )}
        </div>

        <Button size="sm" className="font-semibold" onClick={openCreate}>
          <Plus className="size-4" />
          <span className="hidden sm:inline">Create Task</span>
        </Button>
      </div>
    </header>
  );
}
