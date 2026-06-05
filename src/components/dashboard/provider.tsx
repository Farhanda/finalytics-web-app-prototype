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
  projectTints,
  seedActivities,
  seedProjects,
  seedTeam,
  type AccessRole,
  type Activity,
  type DashboardProject,
  type ProjectStatus,
  type TeamMember,
} from "@/lib/dashboard-data";
import {
  canCreateProject,
  canCreateTaskInProject,
  canEditTask,
  canManageProject,
  canToggleTask,
  creatableProjects,
  visibleProjects as selectVisibleProjects,
  visibleTasks as selectVisibleTasks,
} from "@/lib/access";

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
  projectId: string;
  assigneeId: string;
  dueDate: string; // yyyy-mm-dd
  priority: Priority;
  status: TaskStatus;
};

export type ProjectInput = {
  name: string;
  client: string;
  dueDate: string; // yyyy-mm-dd
  pmId: string;
  memberIds: string[];
  status: ProjectStatus;
  progress: number;
};

export type Profile = {
  name: string;
  email: string;
  initials: string;
  tint: string;
};

// Default identity is the workspace Admin (first seed user).
const DEFAULT_USER_ID = "u0";

function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type DialogState = { open: boolean; mode: "create" | "edit"; task: Task | null };
type ProjectDialogState = {
  open: boolean;
  mode: "create" | "edit";
  project: DashboardProject | null;
};

type Ctx = {
  // Raw state (full workspace — useful for Admin aggregates).
  tasks: Task[];
  projects: DashboardProject[];
  team: TeamMember[];
  activities: Activity[];

  // Current identity / role.
  currentUser: TeamMember;
  role: AccessRole;
  profile: Profile;
  switchUser: (userId: string) => void;
  userById: (id: string) => TeamMember | undefined;

  // Role-scoped views.
  visibleProjects: DashboardProject[];
  visibleTasks: Task[];

  // Project helpers.
  pmCandidates: TeamMember[];
  memberCandidates: TeamMember[];
  membersOf: (projectId: string) => TeamMember[];
  pmOf: (projectId: string) => TeamMember | undefined;
  creatableProjects: DashboardProject[];

  // Permissions bound to the current user.
  canCreateProject: boolean;
  canManageProject: (project: DashboardProject) => boolean;
  canCreateTaskInProject: (project: DashboardProject) => boolean;
  canEditTask: (task: Task) => boolean;
  canToggleTask: (task: Task) => boolean;

  // Mutations.
  updateProfile: (partial: Partial<Pick<Profile, "name" | "email">>) => void;
  addProject: (input: ProjectInput) => void;
  updateProject: (id: string, partial: Partial<ProjectInput>) => void;
  addTask: (input: TaskInput) => void;
  updateTask: (id: string, input: TaskInput) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;

  // Task dialog.
  dialog: DialogState;
  openCreate: () => void;
  openEdit: (task: Task) => void;
  setDialogOpen: (open: boolean) => void;

  // Project dialog.
  projectDialog: ProjectDialogState;
  openCreateProject: () => void;
  openEditProject: (project: DashboardProject) => void;
  setProjectDialogOpen: (open: boolean) => void;

  resetDemo: () => void;
};

const DashboardContext = createContext<Ctx | null>(null);

const STORAGE_KEY = "autom8:dashboard:v2";

let idCounter = 0;
function uid(prefix: string) {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`;
}

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(seedTasks);
  const [projects, setProjects] = useState<DashboardProject[]>(seedProjects);
  const [team, setTeam] = useState<TeamMember[]>(seedTeam);
  const [activities, setActivities] = useState<Activity[]>(seedActivities);
  const [currentUserId, setCurrentUserId] = useState<string>(DEFAULT_USER_ID);

  // Hydrate from localStorage after mount (keeps SSR === first client render).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.tasks) setTasks(parsed.tasks);
        if (parsed.projects) setProjects(parsed.projects);
        if (parsed.team) setTeam(parsed.team);
        if (parsed.activities) setActivities(parsed.activities);
        if (parsed.currentUserId) setCurrentUserId(parsed.currentUserId);
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
        JSON.stringify({ tasks, projects, team, activities, currentUserId })
      );
    } catch {
      // ignore quota errors
    }
  }, [tasks, projects, team, activities, currentUserId]);

  const currentUser = useMemo(
    () => team.find((m) => m.id === currentUserId) ?? team[0],
    [team, currentUserId]
  );
  const role = currentUser.accessRole;

  const profile = useMemo<Profile>(
    () => ({
      name: currentUser.name,
      email: currentUser.email,
      initials: currentUser.initials,
      tint: currentUser.tint,
    }),
    [currentUser]
  );

  const userById = useCallback(
    (id: string) => team.find((m) => m.id === id),
    [team]
  );

  const switchUser = useCallback((userId: string) => {
    setCurrentUserId(userId);
  }, []);

  // Role-scoped views.
  const visibleProjects = useMemo(
    () => selectVisibleProjects(role, currentUserId, projects),
    [role, currentUserId, projects]
  );
  const visibleTasks = useMemo(
    () => selectVisibleTasks(role, currentUserId, tasks, projects),
    [role, currentUserId, tasks, projects]
  );

  const pmCandidates = useMemo(
    () => team.filter((m) => m.accessRole === "PM"),
    [team]
  );
  const memberCandidates = useMemo(
    () => team.filter((m) => m.accessRole === "Member"),
    [team]
  );
  const membersOf = useCallback(
    (projectId: string) => {
      const project = projects.find((p) => p.id === projectId);
      if (!project) return [];
      return project.memberIds
        .map((id) => team.find((m) => m.id === id))
        .filter((m): m is TeamMember => Boolean(m));
    },
    [projects, team]
  );
  const pmOf = useCallback(
    (projectId: string) => {
      const project = projects.find((p) => p.id === projectId);
      return project ? team.find((m) => m.id === project.pmId) : undefined;
    },
    [projects, team]
  );

  const creatable = useMemo(
    () => creatableProjects(role, currentUserId, projects),
    [role, currentUserId, projects]
  );

  // Permissions bound to the current user.
  const canManageProjectBound = useCallback(
    (project: DashboardProject) => canManageProject(role, currentUserId, project),
    [role, currentUserId]
  );
  const canCreateTaskInProjectBound = useCallback(
    (project: DashboardProject) =>
      canCreateTaskInProject(role, currentUserId, project),
    [role, currentUserId]
  );
  const canEditTaskBound = useCallback(
    (task: Task) => canEditTask(role, currentUserId, task, projects),
    [role, currentUserId, projects]
  );
  const canToggleTaskBound = useCallback(
    (task: Task) => canToggleTask(role, currentUserId, task, projects),
    [role, currentUserId, projects]
  );

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

  const updateProfile = useCallback(
    (partial: Partial<Pick<Profile, "name" | "email">>) => {
      setTeam((prev) =>
        prev.map((m) =>
          m.id === currentUserId
            ? {
                ...m,
                ...partial,
                initials: partial.name ? initialsFrom(partial.name) : m.initials,
              }
            : m
        )
      );
    },
    [currentUserId]
  );

  const addProject = useCallback(
    (input: ProjectInput) => {
      const project: DashboardProject = {
        id: uid("p"),
        name: input.name.trim(),
        client: input.client.trim(),
        progress: input.progress,
        status: input.status,
        due: dueFromInput(input.dueDate),
        tint: projectTints[projects.length % projectTints.length],
        pmId: input.pmId,
        memberIds: input.memberIds,
      };
      setProjects((prev) => [project, ...prev]);
      logActivity({
        actor: currentUser.name,
        initials: currentUser.initials,
        tint: currentUser.tint,
        action: "created project",
        target: project.name,
      });
    },
    [projects.length, currentUser, logActivity]
  );

  const updateProject = useCallback(
    (id: string, partial: Partial<ProjectInput>) => {
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id !== id) return p;
          return {
            ...p,
            ...(partial.name !== undefined && { name: partial.name.trim() }),
            ...(partial.client !== undefined && { client: partial.client.trim() }),
            ...(partial.dueDate !== undefined && {
              due: dueFromInput(partial.dueDate),
            }),
            ...(partial.pmId !== undefined && { pmId: partial.pmId }),
            ...(partial.memberIds !== undefined && {
              memberIds: partial.memberIds,
            }),
            ...(partial.status !== undefined && { status: partial.status }),
            ...(partial.progress !== undefined && { progress: partial.progress }),
          };
        })
      );
      const project = projects.find((p) => p.id === id);
      if (project) {
        logActivity({
          actor: currentUser.name,
          initials: currentUser.initials,
          tint: currentUser.tint,
          action: "updated project",
          target: partial.name?.trim() ?? project.name,
        });
      }
    },
    [projects, currentUser, logActivity]
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
        projectId: input.projectId,
        assigneeId: member.id,
        assignee: {
          name: member.name,
          initials: member.initials,
          tint: member.tint,
        },
        createdById: currentUserId,
        memberGenerated: role === "Member",
        status: input.status,
        priority: input.priority,
        done: input.status === "Completed",
      };
      setTasks((prev) => [task, ...prev]);
      logActivity({
        actor: currentUser.name,
        initials: currentUser.initials,
        tint: currentUser.tint,
        action: "created task",
        target: task.name,
      });
    },
    [team, currentUser, currentUserId, role, logActivity]
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
                projectId: input.projectId,
                assigneeId: member.id,
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
        actor: currentUser.name,
        initials: currentUser.initials,
        tint: currentUser.tint,
        action: "updated task",
        target: input.name.trim(),
      });
    },
    [team, currentUser, logActivity]
  );

  const deleteTask = useCallback(
    (id: string) => {
      const task = tasks.find((t) => t.id === id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      if (task) {
        logActivity({
          actor: currentUser.name,
          initials: currentUser.initials,
          tint: currentUser.tint,
          action: "deleted task",
          target: task.name,
        });
      }
    },
    [tasks, currentUser, logActivity]
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

  const [projectDialog, setProjectDialog] = useState<ProjectDialogState>({
    open: false,
    mode: "create",
    project: null,
  });

  const openCreateProject = useCallback(
    () => setProjectDialog({ open: true, mode: "create", project: null }),
    []
  );
  const openEditProject = useCallback(
    (project: DashboardProject) =>
      setProjectDialog({ open: true, mode: "edit", project }),
    []
  );
  const setProjectDialogOpen = useCallback(
    (open: boolean) => setProjectDialog((d) => ({ ...d, open })),
    []
  );

  const resetDemo = useCallback(() => {
    setTasks(seedTasks);
    setProjects(seedProjects);
    setTeam(seedTeam);
    setActivities(seedActivities);
    setCurrentUserId(DEFAULT_USER_ID);
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      tasks,
      projects,
      team,
      activities,
      currentUser,
      role,
      profile,
      switchUser,
      userById,
      visibleProjects,
      visibleTasks,
      pmCandidates,
      memberCandidates,
      membersOf,
      pmOf,
      creatableProjects: creatable,
      canCreateProject: canCreateProject(role),
      canManageProject: canManageProjectBound,
      canCreateTaskInProject: canCreateTaskInProjectBound,
      canEditTask: canEditTaskBound,
      canToggleTask: canToggleTaskBound,
      updateProfile,
      addProject,
      updateProject,
      addTask,
      updateTask,
      deleteTask,
      toggleTask,
      dialog,
      openCreate,
      openEdit,
      setDialogOpen,
      projectDialog,
      openCreateProject,
      openEditProject,
      setProjectDialogOpen,
      resetDemo,
    }),
    [
      tasks,
      projects,
      team,
      activities,
      currentUser,
      role,
      profile,
      switchUser,
      userById,
      visibleProjects,
      visibleTasks,
      pmCandidates,
      memberCandidates,
      membersOf,
      pmOf,
      creatable,
      canManageProjectBound,
      canCreateTaskInProjectBound,
      canEditTaskBound,
      canToggleTaskBound,
      updateProfile,
      addProject,
      updateProject,
      addTask,
      updateTask,
      deleteTask,
      toggleTask,
      dialog,
      openCreate,
      openEdit,
      setDialogOpen,
      projectDialog,
      openCreateProject,
      openEditProject,
      setProjectDialogOpen,
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
