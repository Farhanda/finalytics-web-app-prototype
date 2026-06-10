"use client";

import { useEffect, useState } from "react";
import { GitBranch } from "lucide-react";

import { cn } from "@/lib/utils";

type Status = { tokenSet: boolean; storage: "admin" | "client" };

export function TaskSyncCard() {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    fetch("/api/integration/status")
      .then((r) => r.json())
      .then((d) =>
        setStatus({
          tokenSet: Boolean(d.tokenSet),
          storage: d.storage === "admin" ? "admin" : "client",
        })
      )
      .catch(() => setStatus({ tokenSet: false, storage: "client" }));
  }, []);

  const ready = status?.tokenSet ?? null;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-foreground text-background">
            <GitBranch className="size-5" />
          </span>
          <div>
            <h3 className="font-heading text-lg font-bold text-foreground">
              Task sync (Claude)
            </h3>
            <p className="text-sm text-muted-foreground">
              Claude checks tasks off as it commits — no keys in commit messages.
            </p>
          </div>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
            ready ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
          )}
        >
          <span
            className={cn(
              "size-1.5 rounded-full",
              ready ? "bg-emerald-500" : "bg-amber-500"
            )}
          />
          {ready === null
            ? "Checking…"
            : ready
              ? "API ready"
              : "Token not set"}
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
            Auth:
            <span className="font-mono font-semibold text-foreground">
              AUTOM8_API_TOKEN
            </span>
          </span>
        </div>
      )}

      <div className="mt-5 rounded-lg border border-border bg-muted/30 p-4">
        <p className="text-sm font-medium text-foreground">
          How Claude updates the board
        </p>
        <pre className="mt-2 overflow-x-auto rounded-md bg-foreground/[0.04] p-3 font-mono text-xs leading-relaxed text-foreground">
{`node scripts/autom8.mjs list            # see tasks + keys
node scripts/autom8.mjs start AUT-12    # mark In-progress
node scripts/autom8.mjs commit AUT-12   # attach a WIP commit
node scripts/autom8.mjs done AUT-12     # attach commit + tick it off`}
        </pre>
        <p className="mt-2 text-xs text-muted-foreground">
          The CLI reads your latest git commit automatically — commit messages stay
          clean. Workflow lives in <span className="font-mono">AGENTS.md</span>.
        </p>
      </div>
    </div>
  );
}
