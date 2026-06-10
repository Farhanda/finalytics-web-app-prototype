"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { accessRoleStyles, type AccessRole } from "@/lib/dashboard-data";
import { useDashboard, type PersonInput } from "@/components/dashboard/provider";

const accessRoles: { value: AccessRole; hint: string }[] = [
  { value: "Member", hint: "Works on assigned projects and tasks." },
  { value: "PM", hint: "Owns projects and assigns work to members." },
  { value: "Admin", hint: "Full access to everything in the workspace." },
];

const fieldClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40";

function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const empty: PersonInput = {
  name: "",
  email: "",
  role: "",
  accessRole: "Member",
};

export function PersonDialog() {
  const { personDialog, setPersonDialogOpen, addPerson } = useDashboard();

  const [form, setForm] = useState<PersonInput>(empty);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (personDialog.open) {
      setForm(empty);
      setError(null);
    }
  }, [personDialog.open]);

  const set = <K extends keyof PersonInput>(key: K, val: PersonInput[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    addPerson(form);
    toast.success("Teammate added", { description: form.name.trim() });
    setPersonDialogOpen(false);
  };

  const selectedHint = accessRoles.find((r) => r.value === form.accessRole)?.hint;

  return (
    <Dialog open={personDialog.open} onOpenChange={setPersonDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">Add people</DialogTitle>
          <DialogDescription>
            Invite a teammate to the workspace. They&apos;ll show up everywhere —
            the team directory, project pickers, and task assignees.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          {/* Avatar preview */}
          <div className="flex items-center gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary/15 text-base font-bold text-primary">
              {initialsFrom(form.name)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {form.name.trim() || "New teammate"}
              </p>
              <span
                className={cn(
                  "mt-0.5 inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold",
                  accessRoleStyles[form.accessRole]
                )}
              >
                {form.accessRole}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="person-name">Full name</Label>
            <input
              id="person-name"
              autoFocus
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Jordan Lee"
              className={fieldClass}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="person-email">Email</Label>
            <input
              id="person-email"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="jordan.lee@autom8.app"
              className={fieldClass}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="person-title">Job title</Label>
            <input
              id="person-title"
              value={form.role}
              onChange={(e) => set("role", e.target.value)}
              placeholder="e.g. Frontend Engineer"
              className={fieldClass}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="person-access">Access role</Label>
            <select
              id="person-access"
              value={form.accessRole}
              onChange={(e) => set("accessRole", e.target.value as AccessRole)}
              className={cn(fieldClass, "cursor-pointer")}
            >
              {accessRoles.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.value}
                </option>
              ))}
            </select>
            {selectedHint && (
              <p className="text-xs text-muted-foreground">{selectedHint}</p>
            )}
          </div>

          {error && (
            <p className="text-sm font-medium text-destructive">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPersonDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="font-semibold">
              Add person
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
