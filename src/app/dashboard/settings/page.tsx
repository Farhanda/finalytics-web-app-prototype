"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { accessRoleStyles } from "@/lib/dashboard-data";
import { useDashboard } from "@/components/dashboard/provider";
import { GithubIntegrationCard } from "@/components/dashboard/github-card";

const fieldClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40";

function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function SettingsPage() {
  const {
    profile,
    updateProfile,
    role,
    team,
    visibleProjects,
    visibleTasks,
    resetDemo,
  } = useDashboard();

  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);

  // Keep local form in sync if the profile changes elsewhere.
  useEffect(() => {
    setName(profile.name);
    setEmail(profile.email);
  }, [profile.name, profile.email]);

  const dirty = name !== profile.name || email !== profile.email;

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name can't be empty");
      return;
    }
    updateProfile({ name: name.trim(), email: email.trim() });
    toast.success("Profile updated");
  };

  const isAdmin = role === "Admin";
  const workspace = [
    { label: "Workspace", value: "autom8 by Finalytics" },
    { label: "Your access role", value: role },
    ...(isAdmin ? [{ label: "Members", value: String(team.length) }] : []),
    {
      label: isAdmin ? "Projects" : "My projects",
      value: String(visibleProjects.length),
    },
    {
      label: isAdmin ? "Total tasks" : "My tasks",
      value: String(visibleTasks.length),
    },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-extrabold tracking-tight text-foreground">
          Settings
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your profile and workspace preferences.
        </p>
      </div>

      {/* Profile */}
      <form
        onSubmit={save}
        className="rounded-2xl border border-border bg-card p-6 shadow-sm"
      >
        <h3 className="font-heading text-lg font-bold text-foreground">Profile</h3>
        <p className="text-sm text-muted-foreground">
          This updates your name across the dashboard instantly.
        </p>

        <div className="mt-5 flex items-center gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-full bg-primary/15 text-lg font-bold text-primary">
            {initialsFrom(name)}
          </span>
          <div className="text-sm text-muted-foreground">
            <span
              className={cn(
                "inline-flex rounded-md px-2 py-0.5 text-xs font-semibold",
                accessRoleStyles[role]
              )}
            >
              {role}
            </span>
            <p className="mt-1">Your avatar uses your initials.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={fieldClass}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={fieldClass}
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={!dirty}
            onClick={() => {
              setName(profile.name);
              setEmail(profile.email);
            }}
          >
            Reset
          </Button>
          <Button type="submit" className="font-semibold" disabled={!dirty}>
            Save changes
          </Button>
        </div>
      </form>

      {/* Workspace */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h3 className="font-heading text-lg font-bold text-foreground">Workspace</h3>
        <dl className="mt-4 divide-y divide-border/60">
          {workspace.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between py-2.5 text-sm"
            >
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className="font-medium text-foreground">{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* GitHub integration */}
      <GithubIntegrationCard />

      {/* Danger zone */}
      <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-6">
        <h3 className="font-heading text-lg font-bold text-foreground">
          Danger zone
        </h3>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Restore all tasks, activity, and profile to their original demo state.
          </p>
          <Button
            variant="outline"
            className={cn("border-rose-300 text-rose-600 hover:bg-rose-100")}
            onClick={() => {
              resetDemo();
              toast.success("Demo data reset");
            }}
          >
            <RotateCcw className="size-4" />
            Reset demo data
          </Button>
        </div>
      </div>
    </div>
  );
}
