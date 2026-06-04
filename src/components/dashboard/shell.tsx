"use client";

import { useState } from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { DashboardProvider } from "@/components/dashboard/provider";
import { TaskDialog } from "@/components/dashboard/task-dialog";

function ShellInner({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-border/60 lg:block">
        <Sidebar />
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
      >
        <div
          className={cn(
            "absolute inset-0 bg-foreground/40 transition-opacity",
            mobileOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setMobileOpen(false)}
        />
        <aside
          className={cn(
            "absolute inset-y-0 left-0 w-72 border-r border-border/60 shadow-xl transition-transform",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute right-3 top-4 grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
            aria-label="Close menu"
          >
            <X className="size-5" />
          </button>
          <Sidebar onNavigate={() => setMobileOpen(false)} />
        </aside>
      </div>

      {/* Content */}
      <div className="lg:pl-64">
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>

      <TaskDialog />
      <Toaster position="top-right" richColors />
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProvider>
      <ShellInner>{children}</ShellInner>
    </DashboardProvider>
  );
}
