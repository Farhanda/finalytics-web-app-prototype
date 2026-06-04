// Data that powers the autom8 application dashboard.
// Kept separate from the landing-page mockup data in ./data.ts.

import {
  CalendarDays,
  FileText,
  LayoutDashboard,
  LifeBuoy,
  ListChecks,
  Settings,
  Shield,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};

export const navGroups: NavGroup[] = [
  {
    title: "Main",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Tasks", href: "/dashboard/tasks", icon: ListChecks, badge: "6" },
      { label: "Projects", href: "/dashboard/projects", icon: FileText },
      { label: "Calendar", href: "/dashboard/calendar", icon: CalendarDays },
    ],
  },
  {
    title: "Workspace",
    items: [
      { label: "Team", href: "/dashboard/team", icon: Users },
      { label: "Roles", href: "/dashboard/roles", icon: Shield },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Settings", href: "/dashboard/settings", icon: Settings },
      { label: "Help & support", href: "/dashboard/help", icon: LifeBuoy },
    ],
  },
];

export type Kpi = {
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down";
  hint: string;
  icon: "users" | "box" | "roles" | "tasks";
};

export const kpis: Kpi[] = [
  {
    label: "Team Members",
    value: "24",
    delta: "8",
    trend: "up",
    hint: "vs. last month",
    icon: "users",
  },
  {
    label: "Total Projects",
    value: "12",
    delta: "2",
    trend: "down",
    hint: "vs. last month",
    icon: "box",
  },
  {
    label: "Total Roles",
    value: "8",
    delta: "1",
    trend: "up",
    hint: "vs. last month",
    icon: "roles",
  },
  {
    label: "Tasks Completed",
    value: "86%",
    delta: "12",
    trend: "up",
    hint: "this quarter",
    icon: "tasks",
  },
];

// Tasks completed per day for the weekly activity chart.
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
  name: string;
  client: string;
  progress: number;
  status: ProjectStatus;
  due: string;
  tint: string;
};

export const dashboardProjects: DashboardProject[] = [
  {
    name: "Landing Page Finalytics",
    client: "Finalytics",
    progress: 72,
    status: "On track",
    due: "Apr 25, 2026",
    tint: "bg-primary",
  },
  {
    name: "Mobile App Redesign",
    client: "Northwind",
    progress: 45,
    status: "At risk",
    due: "May 10, 2026",
    tint: "bg-amber-500",
  },
  {
    name: "Analytics Dashboard v2",
    client: "Lumina",
    progress: 90,
    status: "On track",
    due: "Apr 18, 2026",
    tint: "bg-emerald-500",
  },
  {
    name: "Billing Integration",
    client: "Vertex",
    progress: 28,
    status: "Delayed",
    due: "Jun 02, 2026",
    tint: "bg-rose-500",
  },
];

export type Activity = {
  actor: string;
  initials: string;
  tint: string;
  action: string;
  target: string;
  time: string;
};

export const activities: Activity[] = [
  {
    actor: "Sean Kemper",
    initials: "SK",
    tint: "bg-sky-100 text-sky-700",
    action: "completed",
    target: "Review system logs",
    time: "12m ago",
  },
  {
    actor: "Emma Johnson",
    initials: "EJ",
    tint: "bg-violet-100 text-violet-700",
    action: "commented on",
    target: "Prioritize bugs by severity",
    time: "48m ago",
  },
  {
    actor: "Liam Martinez",
    initials: "LM",
    tint: "bg-amber-100 text-amber-700",
    action: "moved to Front End",
    target: "Landing Page Finalytics",
    time: "2h ago",
  },
  {
    actor: "Olivia Thompson",
    initials: "OT",
    tint: "bg-emerald-100 text-emerald-700",
    action: "was assigned",
    target: "Investigate root cause",
    time: "5h ago",
  },
  {
    actor: "Noah Garcia",
    initials: "NG",
    tint: "bg-fuchsia-100 text-fuchsia-700",
    action: "uploaded a file to",
    target: "Develop bug fixes",
    time: "Yesterday",
  },
];

export const statusStyles: Record<ProjectStatus, string> = {
  "On track": "bg-emerald-100 text-emerald-700",
  "At risk": "bg-amber-100 text-amber-700",
  Delayed: "bg-rose-100 text-rose-600",
};
