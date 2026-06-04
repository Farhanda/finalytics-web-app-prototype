"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { tasks as seedTasks, type Priority, type Task, type TaskStatus } from "@/lib/data";
import {
  seedActivities,
  seedProjects,
  seedTeam,
  type Activity,
  type DashboardProject,
  type TeamMember,
} from "@/lib/dashboard-data";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatDate(d: Date) {
  const dd = String(d.getDate()).padStart(2, "0");
  return `${dd} ${MONTHS[d.getMonth()]}, ${d.getFullYear()}`;
}

function formatTime(d: Date) {
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${String(h).padStart(2, "0")}:${m} ${ampm}`;
}

function dueFromInput(value: string) {
  // value is "yyyy-mm-dd" from <input type="date">
  if (!value) return "No due date";
  const [y, mo, d] = value.split("-").map(Number);
  return `${String(d).padStart(2, "0")} ${MONTHS[mo - 1]}, ${y}`;
}

export type TaskInput = {
  name: string;
  assigneeId: string;
  dueDate: string; // yyyy-mm-dd
  priority: Priority;
  status: TaskStatus;
};

const CURRENT_USER = {
  name: "Farhan A.",
  initials: "FA",
  tint: "bg-primary/15 text-primary",
};

type DialogState = { open: boolean; mode: "create" | "edit"; task: Task | null };

type Ctx = {
  tasks: Task[];
  projects: DashboardProject[];
  team: TeamMember[];
  activities: Activity[];
  currentUser: typeof CURRENT_USER;
  addTask: (input: TaskInput) => void;
  updateTask: (id: string, input: TaskInput) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  dialog: DialogState;
  openCreate: () => void;
  openEdit: (task: Task) => void;
  setDialogOpen: (open: boolean) => void;
  resetDemo: () => void;
};

const DashboardContext = createContext<Ctx | null>(null);

const STORAGE_KEY = "autom8:dashboard:v1";

let idCounter = 0;
function uid(prefix: string) {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`;
}

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(seedTasks);
  const [activities, setActivities] = useState<Activity[]>(seedActivities);
  const projects = seedProjects;
  const team = seedTeam;

  // Hydrate from localStorage after mount (keeps SSR === first client render).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.tasks) setTasks(parsed.tasks);
        if (parsed.activities) setActivities(parsed.activities);
      }
    } catch {
      // ignore corrupt storage
    }
  }, []);

  // Persist on change.
  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ tasks, activities })
      );
    } catch {
      // ignore quota errors
    }
  }, [tasks, activities]);

  const logActivity = useCallback(
    (entry: Omit<Activity, "id" | "time"> & { time?: string }) => {
      setActivities((prev) =>
        [
          { id: uid("a"), time: entry.time ?? "Just now", ...entry },
          ...prev,
        ].slice(0, 12)
      );
    },
    []
  );

  const addTask = useCallback(
    (input: TaskInput) => {
      const member = team.find((m) => m.id === input.assigneeId) ?? team[0];
      const now = new Date();
      const task: Task = {
        id: uid("t"),
        name: input.name.trim(),
        createdDate: formatDate(now),
        createdTime: formatTime(now),
        dueDate: dueFromInput(input.dueDate),
        assignee: {
          name: member.name,
          initials: member.initials,
          tint: member.tint,
        },
        status: input.status,
        priority: input.priority,
        done: input.status === "Completed",
      };
      setTasks((prev) => [task, ...prev]);
      logActivity({
        actor: CURRENT_USER.name,
        initials: CURRENT_USER.initials,
        tint: CURRENT_USER.tint,
        action: "created task",
        target: task.name,
      });
    },
    [team, logActivity]
  );

  const updateTask = useCallback(
    (id: string, input: TaskInput) => {
      const member = team.find((m) => m.id === input.assigneeId) ?? team[0];
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                name: input.name.trim(),
                dueDate: dueFromInput(input.dueDate),
                assignee: {
                  name: member.name,
                  initials: member.initials,
                  tint: member.tint,
                },
                status: input.status,
                priority: input.priority,
                done: input.status === "Completed",
              }
            : t
        )
      );
      logActivity({
        actor: CURRENT_USER.name,
        initials: CURRENT_USER.initials,
        tint: CURRENT_USER.tint,
        action: "updated task",
        target: input.name.trim(),
      });
    },
    [team, logActivity]
  );

  const deleteTask = useCallback(
    (id: string) => {
      const task = tasks.find((t) => t.id === id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      if (task) {
        logActivity({
          actor: CURRENT_USER.name,
          initials: CURRENT_USER.initials,
          tint: CURRENT_USER.tint,
          action: "deleted task",
          target: task.name,
        });
      }
    },
    [tasks, logActivity]
  );

  const toggleTask = useCallback(
    (id: string) => {
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== id) return t;
          const done = !t.done;
          return {
            ...t,
            done,
            status: done ? "Completed" : "In-progress",
          };
        })
      );
      const task = tasks.find((t) => t.id === id);
      if (task) {
        logActivity({
          actor: task.assignee.name,
          initials: task.assignee.initials,
          tint: task.assignee.tint,
          action: task.done ? "reopened" : "completed",
          target: task.name,
        });
      }
    },
    [tasks, logActivity]
  );

  const [dialog, setDialog] = useState<DialogState>({
    open: false,
    mode: "create",
    task: null,
  });

  const openCreate = useCallback(
    () => setDialog({ open: true, mode: "create", task: null }),
    []
  );
  const openEdit = useCallback(
    (task: Task) => setDialog({ open: true, mode: "edit", task }),
    []
  );
  const setDialogOpen = useCallback(
    (open: boolean) => setDialog((d) => ({ ...d, open })),
    []
  );

  const resetDemo = useCallback(() => {
    setTasks(seedTasks);
    setActivities(seedActivities);
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      tasks,
      projects,
      team,
      activities,
      currentUser: CURRENT_USER,
      addTask,
      updateTask,
      deleteTask,
      toggleTask,
      dialog,
      openCreate,
      openEdit,
      setDialogOpen,
      resetDemo,
    }),
    [
      tasks,
      projects,
      team,
      activities,
      addTask,
      updateTask,
      deleteTask,
      toggleTask,
      dialog,
      openCreate,
      openEdit,
      setDialogOpen,
      resetDemo,
    ]
  );

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return ctx;
}
