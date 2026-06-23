"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Loader2, Sparkles, UploadCloud } from "lucide-react";
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
import { authedFetch } from "@/lib/auth";
import type { GeneratedTaskDraft } from "@/lib/data";
import type { DashboardProject } from "@/lib/dashboard-data";

// Lightweight view of a document as returned by GET /api/projects/[id]/document.
type DocSummary = {
  id: string;
  fileName: string;
  size: number;
  uploadedBy: string;
  uploadedAt: number;
  textLength: number;
  textTruncated: boolean;
  taskGenStatus: "pending" | "generating" | "done" | "error";
};

const ACCEPT =
  ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatWhen(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function DocumentDialog({
  project,
  uploadedBy,
  open,
  onOpenChange,
  onTasksGenerated,
}: {
  project: DashboardProject;
  uploadedBy: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Called with the AI drafts so the parent can open the review dialog.
  onTasksGenerated: (drafts: GeneratedTaskDraft[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [docs, setDocs] = useState<DocSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const endpoint = `/api/projects/${project.id}/document`;

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    authedFetch(endpoint)
      .then((r) => r.json())
      .then((data) => {
        if (active && data?.ok) setDocs(data.documents ?? []);
      })
      .catch(() => {
        /* listing is best-effort; the upload form still works */
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open, endpoint]);

  async function handleFiles(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("uploadedBy", uploadedBy);

      const res = await authedFetch(endpoint, { method: "POST", body });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        toast.error("Upload failed", {
          description: data?.error ?? `Server responded ${res.status}.`,
        });
        return;
      }

      toast.success("Document uploaded", {
        description: `${data.document.fileName} — text extracted${
          data.fileStored ? " and stored" : ""
        }.`,
      });
      // Refresh the list so the new brief shows immediately.
      const list = await authedFetch(endpoint).then((r) => r.json());
      if (list?.ok) setDocs(list.documents ?? []);
    } catch {
      toast.error("Upload failed", {
        description: "Could not reach the server. Is the app running?",
      });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleGenerate(documentId: string) {
    setGeneratingId(documentId);
    try {
      const res = await authedFetch(`/api/projects/${project.id}/generate-tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        toast.error("Task generation failed", {
          description: data?.error ?? `Server responded ${res.status}.`,
        });
        return;
      }

      const drafts: GeneratedTaskDraft[] = data.tasks ?? [];
      if (drafts.length === 0) {
        toast.info("No tasks generated", {
          description: "The document didn't yield any tasks.",
        });
        return;
      }

      // Hand the drafts to the parent and close so the review dialog can open.
      onOpenChange(false);
      onTasksGenerated(drafts);
    } catch {
      toast.error("Task generation failed", {
        description: "Could not reach the server. Is the app running?",
      });
    } finally {
      setGeneratingId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg">Project documents</DialogTitle>
          <DialogDescription>
            Upload a brief (PDF or DOCX) for{" "}
            <span className="font-medium text-foreground">{project.name}</span>.
            autom8 extracts its text so AI can draft tasks from it.
          </DialogDescription>
        </DialogHeader>

        {/* Upload dropzone */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border px-4 py-8 text-center transition-colors",
            uploading
              ? "cursor-wait opacity-70"
              : "cursor-pointer hover:border-ring hover:bg-muted/40"
          )}
        >
          {uploading ? (
            <Loader2 className="size-6 animate-spin text-primary" />
          ) : (
            <UploadCloud className="size-6 text-muted-foreground" />
          )}
          <span className="text-sm font-medium text-foreground">
            {uploading ? "Extracting text…" : "Click to choose a file"}
          </span>
          <span className="text-xs text-muted-foreground">
            PDF or DOCX, up to 10 MB
          </span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {/* Existing documents */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Uploaded
          </p>
          {loading ? (
            <p className="px-1 py-4 text-center text-sm text-muted-foreground">
              Loading…
            </p>
          ) : docs.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
              No documents yet.
            </p>
          ) : (
            <ul className="max-h-56 space-y-1 overflow-y-auto">
              {docs.map((d) => (
                <li
                  key={d.id}
                  className="flex items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/50"
                >
                  <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground">
                      {d.fileName}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                      <span>{formatSize(d.size)}</span>
                      <span>·</span>
                      <span className="truncate">{d.uploadedBy}</span>
                      <span>·</span>
                      <span className="shrink-0">{formatWhen(d.uploadedAt)}</span>
                      {d.taskGenStatus === "done" && (
                        <>
                          <span>·</span>
                          <span className="inline-flex shrink-0 items-center gap-1 font-medium text-emerald-700">
                            <Sparkles className="size-3" /> Tasks ready
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="mt-0.5 shrink-0"
                    disabled={generatingId !== null}
                    onClick={() => handleGenerate(d.id)}
                  >
                    {generatingId === d.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="size-3.5" />
                    )}
                    Generate tasks
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
