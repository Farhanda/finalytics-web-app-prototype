// Seed data + types for the autom8 application dashboard.
// Live state (tasks, activity) is managed by the DashboardProvider; the arrays
// here are the initial seed only.

import {
  FolderKanban,
  LayoutDashboard,
  ListChecks,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

// Access roles that drive what each user can see and do across the app.
export type AccessRole = "Admin" | "PM" | "Member";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};

// The sidebar is role-aware: everyone gets Dashboard / Project / Task, only
// Admins manage the Team directory, and Settings is shared by all roles.
export function navGroupsFor(role: AccessRole): NavGroup[] {
  const groups: NavGroup[] = [
    {
      title: "Main",
      items: [
        { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { label: "Project", href: "/dashboard/projects", icon: FolderKanban },
        { label: "Task", href: "/dashboard/tasks", icon: ListChecks },
      ],
    },
  ];

  if (role === "Admin") {
    groups.push({
      title: "Workspace",
      items: [{ label: "Team", href: "/dashboard/team", icon: Users }],
    });
  }

  groups.push({
    title: "System",
    items: [{ label: "Settings", href: "/dashboard/settings", icon: Settings }],
  });

  return groups;
}

// Tasks completed per day — illustrative weekly history for the chart.
export const weeklyActivity: { day: string; value: number }[] = [
  { day: "Mon", value: 12 },
  { day: "Tue", value: 18 },
  { day: "Wed", value: 9 },
  { day: "Thu", value: 22 },
  { day: "Fri", value: 16 },
  { day: "Sat", value: 6 },
  { day: "Sun", value: 4 },
];

export type ProjectStatus = "On track" | "At risk" | "Delayed";

export type DashboardProject = {
  id: string;
  name: string;
  client: string;
  progress: number;
  status: ProjectStatus;
  due: string;
  tint: string;
  // The PM who owns delivery of this project (a TeamMember with accessRole "PM").
  pmId: string;
  // Team members the PM has assigned to this project.
  memberIds: string[];
};

// Rotating accent colors used when an Admin creates a new project.
export const projectTints = [
  "bg-primary",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-rose-500",
  "bg-sky-500",
  "bg-violet-500",
];

export const seedProjects: DashboardProject[] = [
  {
    id: "p1",
    name: "Landing Page Finalytics",
    client: "Finalytics",
    progress: 72,
    status: "On track",
    due: "Apr 25, 2026",
    tint: "bg-primary",
    pmId: "u4",
    memberIds: ["u1", "u2", "u3"],
  },
  {
    id: "p2",
    name: "Mobile App Redesign",
    client: "Northwind",
    progress: 45,
    status: "At risk",
    due: "May 10, 2026",
    tint: "bg-amber-500",
    pmId: "u7",
    memberIds: ["u3", "u5", "u6"],
  },
  {
    id: "p3",
    name: "Analytics Dashboard v2",
    client: "Lumina",
    progress: 90,
    status: "On track",
    due: "Apr 18, 2026",
    tint: "bg-emerald-500",
    pmId: "u4",
    memberIds: ["u1", "u5", "u8"],
  },
  {
    id: "p4",
    name: "Billing Integration",
    client: "Vertex",
    progress: 28,
    status: "Delayed",
    due: "Jun 02, 2026",
    tint: "bg-rose-500",
    pmId: "u7",
    memberIds: ["u2", "u6", "u8"],
  },
];

export type TeamMember = {
  id: string;
  name: string;
  initials: string;
  tint: string;
  // Job title (e.g. "Backend Engineer"), distinct from the access role below.
  role: string;
  email: string;
  // Access role that controls what this person can see and do.
  accessRole: AccessRole;
};

// The first entry is the workspace Admin ("you" by default). Two PMs each own
// a couple of projects; everyone else is a Team Member.
export const seedTeam: TeamMember[] = [
  { id: "u0", name: "Farhan A.", initials: "FA", tint: "bg-primary/15 text-primary", role: "Workspace Admin", email: "aixelindonesia@gmail.com", accessRole: "Admin" },
  { id: "u1", name: "Sean Kemper", initials: "SK", tint: "bg-sky-100 text-sky-700", role: "Backend Engineer", email: "sean.kemper@autom8.app", accessRole: "Member" },
  { id: "u2", name: "Victoria Sullivan", initials: "VS", tint: "bg-rose-100 text-rose-700", role: "QA Engineer", email: "victoria.s@autom8.app", accessRole: "Member" },
  { id: "u3", name: "Liam Martinez", initials: "LM", tint: "bg-amber-100 text-amber-700", role: "Frontend Engineer", email: "liam.m@autom8.app", accessRole: "Member" },
  { id: "u4", name: "Emma Johnson", initials: "EJ", tint: "bg-violet-100 text-violet-700", role: "Project Manager", email: "emma.j@autom8.app", accessRole: "PM" },
  { id: "u5", name: "Olivia Thompson", initials: "OT", tint: "bg-emerald-100 text-emerald-700", role: "Data Analyst", email: "olivia.t@autom8.app", accessRole: "Member" },
  { id: "u6", name: "Noah Garcia", initials: "NG", tint: "bg-fuchsia-100 text-fuchsia-700", role: "Backend Engineer", email: "noah.g@autom8.app", accessRole: "Member" },
  { id: "u7", name: "Ava Wilson", initials: "AW", tint: "bg-teal-100 text-teal-700", role: "Project Manager", email: "ava.w@autom8.app", accessRole: "PM" },
  { id: "u8", name: "Ethan Brown", initials: "EB", tint: "bg-indigo-100 text-indigo-700", role: "DevOps Engineer", email: "ethan.b@autom8.app", accessRole: "Member" },
];

// Visual styling for access-role badges shown throughout the UI.
export const accessRoleStyles: Record<AccessRole, string> = {
  Admin: "bg-violet-100 text-violet-700",
  PM: "bg-sky-100 text-sky-700",
  Member: "bg-muted text-muted-foreground",
};

export type Activity = {
  id: string;
  actor: string;
  initials: string;
  tint: string;
  action: string;
  target: string;
  time: string;
  // Millisecond sort key so Firestore can return the feed newest-first.
  createdAt?: number;
};

export const seedActivities: Activity[] = [
  { id: "a1", actor: "Sean Kemper", initials: "SK", tint: "bg-sky-100 text-sky-700", action: "completed", target: "Review system logs", time: "12m ago" },
  { id: "a2", actor: "Emma Johnson", initials: "EJ", tint: "bg-violet-100 text-violet-700", action: "commented on", target: "Prioritize bugs by severity", time: "48m ago" },
  { id: "a3", actor: "Liam Martinez", initials: "LM", tint: "bg-amber-100 text-amber-700", action: "moved to Front End", target: "Landing Page Finalytics", time: "2h ago" },
  { id: "a4", actor: "Olivia Thompson", initials: "OT", tint: "bg-emerald-100 text-emerald-700", action: "was assigned", target: "Investigate root cause", time: "5h ago" },
];

export const statusStyles: Record<ProjectStatus, string> = {
  "On track": "bg-emerald-100 text-emerald-700",
  "At risk": "bg-amber-100 text-amber-700",
  Delayed: "bg-rose-100 text-rose-600",
};
