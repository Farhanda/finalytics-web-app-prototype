"use client";

import { useState } from "react";
import { Loader2, TriangleAlert, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { DashboardProvider, useDashboard } from "@/components/dashboard/provider";
import { AuthProvider, useAuth } from "@/components/dashboard/auth-provider";
import { SignIn } from "@/components/dashboard/sign-in";
import { TaskDialog } from "@/components/dashboard/task-dialog";
import { ProjectDialog } from "@/components/dashboard/project-dialog";
import { PersonDialog } from "@/components/dashboard/person-dialog";

// Shown until the first Firestore snapshot resolves (and while it seeds on first run).
function LoadingState() {
  return (
    <div className="grid place-items-center py-32 text-muted-foreground">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="size-7 animate-spin text-primary" />
        <p className="text-sm">Loading your workspace…</p>
      </div>
    </div>
  );
}

// Shown when the NEXT_PUBLIC_FIREBASE_* env vars are missing.
function ConfigNotice() {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-amber-200 bg-amber-50/60 p-8 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-xl bg-amber-100 text-amber-600">
        <TriangleAlert className="size-6" />
      </span>
      <h2 className="mt-4 font-heading text-xl font-bold text-foreground">
        Firebase isn&apos;t configured yet
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Copy{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">.env.example</code>{" "}
        to{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">.env.local</code>,
        paste your Firebase web config, then restart the dev server.
      </p>
    </div>
  );
}

function MainContent({ children }: { children: React.ReactNode }) {
  const { loading, configured } = useDashboard();
  if (!configured) return <ConfigNotice />;
  if (loading) return <LoadingState />;
  return <>{children}</>;
}

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
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <MainContent>{children}</MainContent>
        </main>
      </div>

      <TaskDialog />
      <ProjectDialog />
      <PersonDialog />
      <Toaster position="top-right" richColors />
    </div>
  );
}

// Decides whether to show the sign-in screen, a provisioning spinner, or the
// app. In demo mode (auth not required) it's a passthrough.
function AuthGate({ children }: { children: React.ReactNode }) {
  const { authRequired, loading, user, provisioned } = useAuth();

  if (!authRequired) return <>{children}</>;

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-muted/30 text-muted-foreground">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-7 animate-spin text-primary" />
          <p className="text-sm">Checking your session…</p>
        </div>
      </div>
    );
  }

  // Not signed in, or signed in but not yet provisioned (show sign-in + reason).
  if (!user || !provisioned) return <SignIn />;

  return <>{children}</>;
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthGate>
        <DashboardProvider>
          <ShellInner>{children}</ShellInner>
        </DashboardProvider>
      </AuthGate>
    </AuthProvider>
  );
}
