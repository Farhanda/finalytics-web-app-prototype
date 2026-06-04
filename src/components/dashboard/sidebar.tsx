"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { ChevronsUpDown, Home, RotateCcw } from "lucide-react";

import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";
import { navGroups } from "@/lib/dashboard-data";
import { useDashboard } from "@/components/dashboard/provider";

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { tasks, profile, resetDemo } = useDashboard();
  const [menuOpen, setMenuOpen] = useState(false);

  const openTasks = tasks.filter((t) => !t.done).length;

  return (
    <div className="flex h-full flex-col bg-card">
      <div className="flex h-16 items-center border-b border-border/60 px-5">
        <Link href="/" aria-label="autom8 home" onClick={onNavigate}>
          <Logo />
        </Link>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {navGroups.map((group) => (
          <div key={group.title}>
            <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
              {group.title}
            </p>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));
                const badge =
                  item.href === "/dashboard/tasks" && openTasks > 0
                    ? String(openTasks)
                    : null;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        active
                          ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <item.icon className="size-[18px]" />
                      <span className="flex-1">{item.label}</span>
                      {badge && (
                        <span
                          className={cn(
                            "grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-xs font-semibold",
                            active
                              ? "bg-primary-foreground/20 text-primary-foreground"
                              : "bg-accent text-primary"
                          )}
                        >
                          {badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="relative border-t border-border/60 p-3">
        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute bottom-16 left-3 right-3 z-50 overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
              <Link
                href="/"
                onClick={() => {
                  setMenuOpen(false);
                  onNavigate?.();
                }}
                className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-foreground hover:bg-muted"
              >
                <Home className="size-4 text-muted-foreground" />
                Back to home page
              </Link>
              <button
                onClick={() => {
                  resetDemo();
                  setMenuOpen(false);
                  toast.success("Demo data reset");
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-foreground hover:bg-muted"
              >
                <RotateCcw className="size-4 text-muted-foreground" />
                Reset demo data
              </button>
            </div>
          </>
        )}

        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-muted"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
            {profile.initials}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-foreground">
              {profile.name}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {profile.email}
            </span>
          </span>
          <ChevronsUpDown className="size-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
