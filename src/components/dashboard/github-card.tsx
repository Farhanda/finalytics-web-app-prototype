"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, Copy, GitBranch } from "lucide-react";

import { cn } from "@/lib/utils";

type Status = {
  configured: boolean;
  storage: "admin" | "client";
  writeBack: boolean;
};

export function GithubIntegrationCard() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<Status | null>(null);
  const [copied, setCopied] = useState(false);

  const configured = status?.configured ?? null;

  useEffect(() => {
    const endpoint = `${window.location.origin}/api/github/webhook`;
    setUrl(endpoint);
    fetch(endpoint)
      .then((r) => r.json())
      .then((d) =>
        setStatus({
          configured: Boolean(d.configured),
          storage: d.storage === "admin" ? "admin" : "client",
          writeBack: Boolean(d.writeBack),
        })
      )
      .catch(() =>
        setStatus({ configured: false, storage: "client", writeBack: false })
      );
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Webhook URL copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy");
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-foreground text-background">
            <GitBranch className="size-5" />
          </span>
          <div>
            <h3 className="font-heading text-lg font-bold text-foreground">
              GitHub
            </h3>
            <p className="text-sm text-muted-foreground">
              Link commits to tasks and auto-update status.
            </p>
          </div>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
            configured
              ? "bg-emerald-100 text-emerald-700"
              : "bg-amber-100 text-amber-700"
          )}
        >
          <span
            className={cn(
              "size-1.5 rounded-full",
              configured ? "bg-emerald-500" : "bg-amber-500"
            )}
          />
          {configured === null
            ? "Checking…"
            : configured
              ? "Webhook ready"
              : "Secret not set"}
        </span>
      </div>

      {status && (
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-1 font-medium text-muted-foreground">
            Storage:
            <span className="font-semibold text-foreground">
              {status.storage === "admin" ? "Admin SDK" : "Client SDK"}
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-1 font-medium text-muted-foreground">
            Write-back to GitHub:
            <span
              className={cn(
                "font-semibold",
                status.writeBack ? "text-emerald-600" : "text-foreground"
              )}
            >
              {status.writeBack ? "On" : "Off"}
            </span>
          </span>
        </div>
      )}

      <div className="mt-5 space-y-1.5">
        <p className="text-sm font-medium text-foreground">Webhook URL</p>
        <div className="flex items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-lg border border-border bg-muted/40 px-3 py-2 font-mono text-xs text-foreground">
            {url || "…"}
          </code>
          <button
            onClick={copy}
            className="grid size-9 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Copy webhook URL"
          >
            {copied ? (
              <Check className="size-4 text-emerald-600" />
            ) : (
              <Copy className="size-4" />
            )}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Add this as a <span className="font-medium">push</span> webhook (content
          type <span className="font-mono">application/json</span>) in your GitHub
          App or repo, using the same secret as{" "}
          <span className="font-mono">GITHUB_WEBHOOK_SECRET</span>.
        </p>
      </div>

      <div className="mt-5 rounded-lg border border-border bg-muted/30 p-3">
        <p className="text-sm font-medium text-foreground">Commit convention</p>
        <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
          <li>
            <code className="rounded bg-card px-1.5 py-0.5 font-mono text-xs ring-1 ring-border">
              AUT-12
            </code>{" "}
            — links the commit to that task (Pending → In-progress).
          </li>
          <li>
            <code className="rounded bg-card px-1.5 py-0.5 font-mono text-xs ring-1 ring-border">
              closes AUT-12
            </code>{" "}
            — also marks the task <span className="font-medium">Completed</span>.
          </li>
        </ul>
        <p className="mt-2 text-xs text-muted-foreground">
          Find a task&apos;s key (e.g. <span className="font-mono">AUT-12</span>) on
          its row in the Task board.
        </p>
      </div>
    </div>
  );
}
