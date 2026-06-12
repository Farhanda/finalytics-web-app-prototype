"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Loader2, Plus, Trash2, Webhook } from "lucide-react";
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
import { TASK_CATEGORIES, type TaskCategory } from "@/lib/data";
import type { DashboardProject } from "@/lib/dashboard-data";

type HookSummary = {
  id: string;
  division: TaskCategory;
  repoFullName: string | null;
  secretMasked: string;
  deliveries: number;
  lastDeliveryAt: number | null;
  url: string;
};

type CreatedHook = {
  id: string;
  division: TaskCategory;
  repoFullName: string | null;
  secret: string;
  url: string;
};

const fieldClass =
  "h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40";

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      size="xs"
      variant="outline"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          toast.error(`Could not copy ${label}.`);
        }
      }}
    >
      {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

export function WebhookDialog({
  project,
  open,
  onOpenChange,
}: {
  project: DashboardProject;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [hooks, setHooks] = useState<HookSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [division, setDivision] = useState<TaskCategory>("Frontend");
  const [repoFullName, setRepoFullName] = useState("");
  const [justCreated, setJustCreated] = useState<CreatedHook | null>(null);

  const endpoint = `/api/projects/${project.id}/webhooks`;

  async function refresh() {
    setLoading(true);
    try {
      const data = await fetch(endpoint).then((r) => r.json());
      if (data?.ok) setHooks(data.webhooks ?? []);
    } catch {
      /* listing is best-effort */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    setJustCreated(null);
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          division,
          repoFullName: repoFullName.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        toast.error("Could not create webhook", {
          description: data?.error ?? `Server responded ${res.status}.`,
        });
        return;
      }
      setJustCreated(data.webhook as CreatedHook);
      setRepoFullName("");
      toast.success("Webhook created", {
        description: `${data.webhook.division} — copy the secret now, it won't be shown again.`,
      });
      await refresh();
    } catch {
      toast.error("Could not create webhook", {
        description: "Could not reach the server.",
      });
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`${endpoint}/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        toast.error("Could not delete webhook");
        return;
      }
      if (justCreated?.id === id) setJustCreated(null);
      await refresh();
    } catch {
      toast.error("Could not delete webhook");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Webhook className="size-4" />
            GitHub webhooks
          </DialogTitle>
          <DialogDescription>
            Add one webhook per division for{" "}
            <span className="font-medium text-foreground">{project.name}</span>.
            Each division pastes its own URL + secret into their repo&apos;s
            Settings → Webhooks (content type{" "}
            <span className="font-mono">application/json</span>, event:{" "}
            <span className="font-mono">push</span>). Commits land in this
            project&apos;s feed, tagged with the division.
          </DialogDescription>
        </DialogHeader>

        {/* Create form */}
        <div className="grid gap-2 sm:grid-cols-[10rem_1fr_auto] sm:items-end">
          <div className="space-y-1.5">
            <Label htmlFor="wh-division">Division</Label>
            <select
              id="wh-division"
              value={division}
              onChange={(e) => setDivision(e.target.value as TaskCategory)}
              className={cn(fieldClass, "cursor-pointer")}
            >
              {TASK_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wh-repo">Repo (optional)</Label>
            <input
              id="wh-repo"
              value={repoFullName}
              onChange={(e) => setRepoFullName(e.target.value)}
              placeholder="owner/repo"
              className={fieldClass}
            />
          </div>
          <Button
            type="button"
            className="font-semibold"
            disabled={creating}
            onClick={handleCreate}
          >
            {creating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            Add
          </Button>
        </div>

        {/* Secret shown once */}
        {justCreated && (
          <div className="space-y-2 rounded-xl border border-primary/30 bg-primary/5 p-3">
            <p className="text-xs font-semibold text-foreground">
              {justCreated.division} webhook created — copy these now, the secret
              won&apos;t be shown again.
            </p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-14 shrink-0 text-[11px] font-medium text-muted-foreground">
                  URL
                </span>
                <code className="min-w-0 flex-1 truncate rounded bg-background px-2 py-1 text-[11px]">
                  {justCreated.url}
                </code>
                <CopyButton value={justCreated.url} label="URL" />
              </div>
              <div className="flex items-center gap-2">
                <span className="w-14 shrink-0 text-[11px] font-medium text-muted-foreground">
                  Secret
                </span>
                <code className="min-w-0 flex-1 truncate rounded bg-background px-2 py-1 text-[11px]">
                  {justCreated.secret}
                </code>
                <CopyButton value={justCreated.secret} label="secret" />
              </div>
            </div>
          </div>
        )}

        {/* Existing webhooks */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Configured
          </p>
          {loading ? (
            <p className="px-1 py-4 text-center text-sm text-muted-foreground">
              Loading…
            </p>
          ) : hooks.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
              No webhooks yet.
            </p>
          ) : (
            <ul className="max-h-56 space-y-1 overflow-y-auto">
              {hooks.map((h) => (
                <li
                  key={h.id}
                  className="flex items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {h.division}
                      {h.repoFullName && (
                        <span className="ml-1.5 font-mono text-xs font-normal text-muted-foreground">
                          {h.repoFullName}
                        </span>
                      )}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                      <span className="font-mono">secret {h.secretMasked}</span>
                      <span>·</span>
                      <span>
                        {h.deliveries} deliver
                        {h.deliveries === 1 ? "y" : "ies"}
                      </span>
                      <CopyButton value={h.url} label="URL" />
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(h.id)}
                    aria-label="Delete webhook"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end pt-1">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
