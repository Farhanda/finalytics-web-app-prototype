// Shared sample data that powers the product mockups across the landing page.
// Keeping it in one place keeps the "demo" story consistent everywhere.

export type Priority = "High" | "Medium" | "Low";
export type TaskStatus = "In-progress" | "Pending" | "Completed";

export type Task = {
  id: string;
  name: string;
  createdDate: string;
  createdTime: string;
  dueDate: string;
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
  status: TaskStatus;
  priority: Priority;
  done: boolean;
};

export const tasks: Task[] = [
  {
    id: "t1",
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
