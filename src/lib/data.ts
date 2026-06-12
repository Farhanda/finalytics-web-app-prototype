// Shared sample data that powers the product mockups across the landing page.
// Keeping it in one place keeps the "demo" story consistent everywhere.

export type Priority = "High" | "Medium" | "Low";
export type TaskStatus = "In-progress" | "Pending" | "Completed";

// Discipline buckets the AI sorts generated tasks into (Tahap 2) and that
// per-division webhooks map commits to (Tahap 3).
export type TaskCategory =
  | "Frontend"
  | "Backend"
  | "Design"
  | "QA"
  | "DevOps"
  | "Research"
  | "Other";

export const TASK_CATEGORIES: TaskCategory[] = [
  "Frontend",
  "Backend",
  "Design",
  "QA",
  "DevOps",
  "Research",
  "Other",
];

// A task proposal returned by the AI before a PM reviews and assigns it.
export type GeneratedTaskDraft = {
  name: string;
  category: TaskCategory;
  priority: Priority;
  description: string;
};

// A git commit linked to a task. Reported by the autom8 CLI when Claude (or a
// developer) works on a task — the full message body + timestamp are kept so the
// daily report can describe what was done and when.
export type LinkedCommit = {
  sha: string;
  message: string; // subject (first line)
  body?: string; // remaining commit body (bullets / details)
  url: string;
  author: string;
  timestamp?: string; // ISO 8601 commit time
};

export type Task = {
  id: string;
  // Short task handle (e.g. "AUT-12") used by the autom8 CLI / Claude to target
  // a task. No longer required inside commit messages.
  key: string;
  name: string;
  createdDate: string;
  createdTime: string;
  dueDate: string;
  // Commits linked from GitHub (newest first). Optional — most tasks have none.
  commits?: LinkedCommit[];
  // Which project this task belongs to (see seedProjects in dashboard-data.ts).
  projectId: string;
  // The member the task is assigned to. `assignee` keeps a denormalized copy
  // for cheap rendering; `assigneeId` is the source of truth for filtering.
  assigneeId: string;
  assignee: { name: string; initials: string; tint: string };
  // Who created the task, and whether it was self-created by a Team Member
  // (PMs/Admins assign work; member-generated tasks are flagged in the UI).
  createdById: string;
  memberGenerated: boolean;
  // True when the task was drafted by AI from an uploaded document (Tahap 2).
  aiGenerated?: boolean;
  // Discipline bucket assigned by the AI (FE/BE/etc.) — optional, for grouping.
  category?: TaskCategory;
  status: TaskStatus;
  priority: Priority;
  done: boolean;
};

export const tasks: Task[] = [
  {
    id: "t1",
    key: "AUT-1",
    name: "Review system logs for any reported errors",
    createdDate: "23 April, 2024",
    createdTime: "05:09 PM",
    dueDate: "30 April, 2024",
    projectId: "p1",
    assigneeId: "u1",
    assignee: { name: "Sean Kemper", initials: "SK", tint: "bg-sky-100 text-sky-700" },
    createdById: "u4",
    memberGenerated: false,
    status: "In-progress",
    priority: "High",
    done: true,
  },
  {
    id: "t2",
    key: "AUT-2",
    name: "Conduct user testing to identify potential bugs",
    createdDate: "14 May, 2024",
    createdTime: "10:51 AM",
    dueDate: "25 Aug, 2024",
    projectId: "p1",
    assigneeId: "u2",
    assignee: { name: "Victoria Sullivan", initials: "VS", tint: "bg-rose-100 text-rose-700" },
    createdById: "u4",
    memberGenerated: false,
    status: "Pending",
    priority: "Low",
    done: true,
  },
  {
    id: "t3",
    key: "AUT-3",
    name: "Gather feedback from stakeholders regarding any issues",
    createdDate: "12 April, 2024",
    createdTime: "12:09 PM",
    dueDate: "28 April, 2024",
    projectId: "p2",
    assigneeId: "u3",
    assignee: { name: "Liam Martinez", initials: "LM", tint: "bg-amber-100 text-amber-700" },
    createdById: "u7",
    memberGenerated: false,
    status: "In-progress",
    priority: "High",
    done: true,
  },
  {
    id: "t4",
    key: "AUT-4",
    name: "Prioritize bugs based on severity and impact",
    createdDate: "10 April, 2024",
    createdTime: "10:09 PM",
    dueDate: "15 April, 2024",
    projectId: "p3",
    assigneeId: "u5",
    assignee: { name: "Olivia Thompson", initials: "OT", tint: "bg-emerald-100 text-emerald-700" },
    createdById: "u4",
    memberGenerated: false,
    status: "Completed",
    priority: "Medium",
    done: false,
  },
  {
    id: "t5",
    key: "AUT-5",
    name: "Investigate and analyze the root cause of each bug",
    createdDate: "22 May, 2024",
    createdTime: "03:41 PM",
    dueDate: "05 July, 2024",
    projectId: "p3",
    assigneeId: "u5",
    assignee: { name: "Olivia Thompson", initials: "OT", tint: "bg-emerald-100 text-emerald-700" },
    createdById: "u4",
    memberGenerated: false,
    status: "Pending",
    priority: "Low",
    done: false,
  },
  {
    id: "t6",
    key: "AUT-6",
    name: "Develop and implement fixes for the identified bugs",
    createdDate: "18 May, 2024",
    createdTime: "09:09 AM",
    dueDate: "30 April, 2024",
    projectId: "p2",
    assigneeId: "u6",
    assignee: { name: "Noah Garcia", initials: "NG", tint: "bg-fuchsia-100 text-fuchsia-700" },
    createdById: "u7",
    memberGenerated: false,
    status: "Completed",
    priority: "Low",
    done: false,
  },
  {
    id: "t7",
    key: "AUT-7",
    name: "Add unit tests for the auth module",
    createdDate: "20 May, 2024",
    createdTime: "02:15 PM",
    dueDate: "02 June, 2024",
    projectId: "p1",
    assigneeId: "u1",
    assignee: { name: "Sean Kemper", initials: "SK", tint: "bg-sky-100 text-sky-700" },
    createdById: "u1",
    memberGenerated: true,
    status: "In-progress",
    priority: "Medium",
    done: false,
  },
];

// A project brief (pdf/docx) uploaded by a PM. The extracted plain text is kept
// inline so the AI step (Tahap 2) can turn it into draft tasks without
// re-downloading the binary. The raw file lives in Firebase Storage when that is
// configured; otherwise `storagePath` is null and only the text is retained.
export type DocTaskGenStatus = "pending" | "generating" | "done" | "error";

export type ProjectDocument = {
  id: string;
  projectId: string;
  fileName: string;
  mimeType: string;
  size: number; // bytes
  // Path inside the Storage bucket, or null when Storage isn't configured.
  storagePath: string | null;
  // Extracted plain text (capped — see MAX_DOC_TEXT in the upload route).
  text: string;
  textTruncated: boolean;
  uploadedBy: string;
  uploadedAt: number; // ms epoch
  // Flipped by Tahap 2 once Claude has generated tasks from this document.
  taskGenStatus: DocTaskGenStatus;
};

// A per-division GitHub webhook on a project (Tahap 3). Each division that has a
// repo on GitHub gets its own webhook (its own URL + secret); commits it
// delivers are tagged with that division so they land in the right bucket.
export type ProjectWebhook = {
  id: string;
  projectId: string;
  division: TaskCategory;
  // Optional "owner/repo" — when set, deliveries from other repos are rejected.
  repoFullName?: string;
  // HMAC secret used to verify GitHub's X-Hub-Signature-256. Server-side only.
  secret: string;
  createdAt: number;
  deliveries: number;
  lastDeliveryAt?: number;
};

// A commit read from a project's GitHub webhook (Tahap 3). Stored at the project
// level (not linked to a single task) and tagged with the division it came from.
export type ProjectCommit = {
  id: string;
  projectId: string;
  division: TaskCategory;
  sha: string;
  message: string; // subject (first line)
  body?: string; // remaining commit body
  url: string;
  author: string;
  timestamp?: string; // ISO 8601 commit time
  receivedAt: number; // ms epoch when the webhook delivered it
};

export type InvoiceStatus = "Completed" | "Cancel" | "Pending";

export type Invoice = {
  id: string;
  status: InvoiceStatus;
  dueDate: string;
  pic: string;
};

export const invoices: Invoice[] = [
  { id: "#INV2540", status: "Completed", dueDate: "07 Jan, 2023", pic: "Elang" },
  { id: "#INV3924", status: "Cancel", dueDate: "03 Dec, 2023", pic: "Evan" },
  { id: "#INV5032", status: "Completed", dueDate: "28 Sep, 2023", pic: "Rizki" },
  { id: "#INV1695", status: "Pending", dueDate: "10 Aug, 2023", pic: "Luthfi" },
];

export type ProgressStage = {
  label: string;
  state: "done" | "active" | "todo";
};

export const projectStages: ProgressStage[] = [
  { label: "UI/UX", state: "done" },
  { label: "Copywriting", state: "done" },
  { label: "Front End", state: "active" },
  { label: "User Acceptance Test", state: "todo" },
  { label: "Deployed", state: "todo" },
];
