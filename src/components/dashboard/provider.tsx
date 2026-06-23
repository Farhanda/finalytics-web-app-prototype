"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { toast } from "sonner";

import {
  type Priority,
  type Task,
  type TaskCategory,
  type TaskStatus,
} from "@/lib/data";
import {
  memberTints,
  projectTints,
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
import { firebaseReady, authRequired } from "@/lib/firebase";
import { authedFetch } from "@/lib/auth";
import { useAuth } from "@/components/dashboard/auth-provider";
import {
  activitiesCol,
  createProject,
  createTask,
  createUser,
  deleteTaskDoc,
  fromSnap,
  logActivityDoc,
  projectsCol,
  propagateAssigneeRename,
  seedFirestore,
  tasksCol,
  updateProjectDoc,
  updateTaskDoc,
  updateUserDoc,
  usersCol,
} from "@/lib/firestore";

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

// Next sequential task key (AUT-1, AUT-2, …) based on the highest existing one.
function nextTaskKey(existing: Task[]): string {
  const max = existing.reduce((m, t) => {
    const n = Number(/^AUT-(\d+)$/.exec(t.key ?? "")?.[1]);
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return `AUT-${max + 1}`;
}

export type TaskInput = {
  name: string;
  projectId: string;
  assigneeId: string;
  dueDate: string; // yyyy-mm-dd
  priority: Priority;
  status: TaskStatus;
};

// An AI-drafted task the PM approved in the review panel (Tahap 2). Assignee may
// be empty (assign later); status/dueDate default to Pending / none.
export type GeneratedTaskInput = {
  name: string;
  projectId: string;
  assigneeId: string; // "" = unassigned
  priority: Priority;
  category?: TaskCategory;
};

export type ProjectInput = {
  name: string;
  client: string;
  dueDate: string; // yyyy-mm-dd
  pmId: string;
  memberIds: string[];
  status: ProjectStatus;
  progress: number;
  repoFullName?: string; // "owner/repo" — required by the create form (picker)
};

export type PersonInput = {
  name: string;
  email: string;
  role: string; // job title
  accessRole: AccessRole;
};

export type Profile = {
  name: string;
  email: string;
  initials: string;
  tint: string;
};

// Default identity is the workspace Admin (first seed user).
const DEFAULT_USER_ID = "u0";
const USER_STORAGE_KEY = "autom8:currentUser:v1";

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
  // Live data from Firestore.
  tasks: Task[];
  projects: DashboardProject[];
  team: TeamMember[];
  activities: Activity[];

  // Connection / load status.
  loading: boolean;
  configured: boolean;

  // Current identity / role (client-only switcher).
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
  canAddPeople: boolean;

  // Mutations (write to Firestore; UI updates via snapshots).
  updateProfile: (partial: Partial<Pick<Profile, "name" | "email">>) => void;
  addProject: (input: ProjectInput) => void;
  updateProject: (id: string, partial: Partial<ProjectInput>) => void;
  addPerson: (input: PersonInput) => void;
  addTask: (input: TaskInput) => void;
  addGeneratedTasks: (inputs: GeneratedTaskInput[]) => Promise<void>;
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

  // Add-person dialog.
  personDialog: { open: boolean };
  openAddPerson: () => void;
  setPersonDialogOpen: (open: boolean) => void;

  resetDemo: () => void;
};

const DashboardContext = createContext<Ctx | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<DashboardProject[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  // Identity: in production it's the signed-in Firebase user (uid); in demo mode
  // (auth not required) it's a client-only switcher persisted to localStorage.
  const { user: firebaseUser } = useAuth();
  const [demoUserId, setDemoUserId] = useState<string>(DEFAULT_USER_ID);
  const currentUserId = authRequired ? firebaseUser?.uid ?? "" : demoUserId;

  const seededRef = useRef(false);

  // Demo-only: remember the chosen demo identity. Skipped under real auth.
  useEffect(() => {
    if (authRequired) return;
    try {
      const saved = window.localStorage.getItem(USER_STORAGE_KEY);
      if (saved) setDemoUserId(saved);
    } catch {
      // ignore
    }
  }, []);
  useEffect(() => {
    if (authRequired) return;
    try {
      window.localStorage.setItem(USER_STORAGE_KEY, demoUserId);
    } catch {
      // ignore
    }
  }, [demoUserId]);

  // Subscribe to Firestore. Four live listeners keep the UI in sync across
  // tabs/devices; the users listener also seeds the DB on first (empty) run.
  useEffect(() => {
    if (!firebaseReady) {
      setLoading(false);
      return;
    }

    const onError = (label: string) => (err: unknown) =>
      console.error(`[firestore] ${label} listener error`, err);

    const unsubUsers = onSnapshot(
      usersCol,
      (snap) => {
        // Demo mode only: self-seed an empty DB. In production the security rules
        // forbid this (and the first sign-in provisions the Admin), so skip it.
        if (snap.empty && !seededRef.current && !authRequired) {
          seededRef.current = true;
          seedFirestore().catch(onError("seed"));
          return; // keep loading until the seeded data arrives
        }
        setTeam(fromSnap<TeamMember>(snap));
        setLoading(false);
      },
      onError("users")
    );

    const unsubProjects = onSnapshot(
      projectsCol,
      (snap) => setProjects(fromSnap<DashboardProject>(snap)),
      onError("projects")
    );

    const unsubTasks = onSnapshot(
      tasksCol,
      (snap) => setTasks(fromSnap<Task>(snap)),
      onError("tasks")
    );

    const unsubActivities = onSnapshot(
      query(activitiesCol, orderBy("createdAt", "desc"), limit(20)),
      (snap) => setActivities(fromSnap<Activity>(snap)),
      onError("activities")
    );

    return () => {
      unsubUsers();
      unsubProjects();
      unsubTasks();
      unsubActivities();
    };
  }, []);

  // A valid TeamMember is always returned, even before live data arrives, so the
  // context type stays non-null during the brief loading window.
  const currentUser = useMemo<TeamMember>(() => {
    return (
      team.find((m) => m.id === currentUserId) ??
      team[0] ??
      seedTeam.find((m) => m.id === currentUserId) ??
      seedTeam[0]
    );
  }, [team, currentUserId]);
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

  const switchUser = useCallback(
    (userId: string) => {
      // In production identity is the signed-in user — the switcher is a no-op.
      if (authRequired) return;
      setDemoUserId(userId);
    },
    []
  );

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
    (entry: Omit<Activity, "id" | "createdAt" | "time"> & { time?: string }) => {
      logActivityDoc(entry).catch(
        (err) => console.error("[firestore] logActivity failed", err)
      );
    },
    []
  );

  const updateProfile = useCallback(
    (partial: Partial<Pick<Profile, "name" | "email">>) => {
      const next: Partial<TeamMember> = { ...partial };
      const newName = partial.name?.trim();
      if (newName) next.initials = initialsFrom(newName);
      updateUserDoc(currentUserId, next)
        .then(() => {
          // Refresh the denormalized assignee snapshot on this user's tasks so a
          // rename shows everywhere, not just on their profile.
          if (newName)
            return propagateAssigneeRename(currentUserId, {
              name: newName,
              initials: initialsFrom(newName),
              tint: currentUser.tint,
            });
        })
        .catch((err) => console.error("[firestore] updateProfile failed", err));
    },
    [currentUserId, currentUser.tint]
  );

  // Add a teammate. Writes a new `users` document to Firestore; the live users
  // listener folds it into `team`, so it appears everywhere (Team directory,
  // PM/member pickers, task assignees) without any extra wiring.
  const addPerson = useCallback(
    (input: PersonInput) => {
      const name = input.name.trim();
      const data: Omit<TeamMember, "id"> = {
        name,
        email: input.email.trim(),
        role: input.role.trim() || "Team Member",
        accessRole: input.accessRole,
        initials: initialsFrom(name),
        tint: memberTints[team.length % memberTints.length],
      };
      createUser(data)
        .then(() =>
          logActivity({
            actor: currentUser.name,
            initials: currentUser.initials,
            tint: currentUser.tint,
            action: "added",
            target: `${name} to the team`,
          })
        )
        .catch((err) => console.error("[firestore] addPerson failed", err));
    },
    [team.length, currentUser, logActivity]
  );

  // Best-effort: ask the server to open GitHub issues for freshly-created tasks.
  // The GitHub App key is server-only, so this goes through the API; the live
  // tasks listener folds the issue link back in once written. Never blocks task
  // creation — a 503 (App not configured) just shows a soft notice.
  const requestIssues = useCallback((taskIds: string[]) => {
    if (taskIds.length === 0) return;
    authedFetch("/api/github/issues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskIds }),
    })
      .then(async (res) => {
        if (res.status === 503) {
          const data = await res.json().catch(() => null);
          toast.message("Task saved without a GitHub issue", {
            description: data?.error ?? "GitHub App is not configured.",
          });
        }
      })
      .catch(() => {
        /* offline / network — the issue can be created later */
      });
  }, []);

  const addProject = useCallback(
    (input: ProjectInput) => {
      const data: Omit<DashboardProject, "id"> = {
        name: input.name.trim(),
        client: input.client.trim(),
        progress: input.progress,
        status: input.status,
        due: dueFromInput(input.dueDate),
        tint: projectTints[projects.length % projectTints.length],
        pmId: input.pmId,
        memberIds: input.memberIds,
        ...(input.repoFullName?.trim()
          ? { repoFullName: input.repoFullName.trim() }
          : {}),
      };
      createProject(data)
        .then(() =>
          logActivity({
            actor: currentUser.name,
            initials: currentUser.initials,
            tint: currentUser.tint,
            action: "created project",
            target: data.name,
          })
        )
        .catch(
          (err) => console.error("[firestore] addProject failed", err)
        );
    },
    [projects.length, currentUser, logActivity]
  );

  const updateProject = useCallback(
    (id: string, partial: Partial<ProjectInput>) => {
      const mapped: Partial<DashboardProject> = {
        ...(partial.name !== undefined && { name: partial.name.trim() }),
        ...(partial.client !== undefined && { client: partial.client.trim() }),
        ...(partial.dueDate !== undefined && { due: dueFromInput(partial.dueDate) }),
        ...(partial.pmId !== undefined && { pmId: partial.pmId }),
        ...(partial.memberIds !== undefined && { memberIds: partial.memberIds }),
        ...(partial.status !== undefined && { status: partial.status }),
        ...(partial.progress !== undefined && { progress: partial.progress }),
        ...(partial.repoFullName !== undefined && {
          repoFullName: partial.repoFullName.trim(),
        }),
      };
      const project = projects.find((p) => p.id === id);
      updateProjectDoc(id, mapped)
        .then(() =>
          logActivity({
            actor: currentUser.name,
            initials: currentUser.initials,
            tint: currentUser.tint,
            action: "updated project",
            target: partial.name?.trim() ?? project?.name ?? "a project",
          })
        )
        .catch(
          (err) => console.error("[firestore] updateProject failed", err)
        );
    },
    [projects, currentUser, logActivity]
  );

  const addTask = useCallback(
    (input: TaskInput) => {
      const member = team.find((m) => m.id === input.assigneeId) ?? team[0];
      const now = new Date();
      const data: Omit<Task, "id"> = {
        key: nextTaskKey(tasks),
        name: input.name.trim(),
        createdDate: formatDate(now),
        createdTime: formatTime(now),
        dueDate: dueFromInput(input.dueDate),
        commits: [],
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
      createTask(data)
        .then((id) => {
          logActivity({
            actor: currentUser.name,
            initials: currentUser.initials,
            tint: currentUser.tint,
            action: "created task",
            target: data.name,
          });
          requestIssues([id]);
        })
        .catch(
          (err) => console.error("[firestore] addTask failed", err)
        );
    },
    [tasks, team, currentUser, currentUserId, role, logActivity, requestIssues]
  );

  // Commit a batch of AI-drafted tasks the PM approved (Tahap 2). Keys are
  // assigned sequentially from one snapshot so a loop can't collide on the same
  // AUT-N (unlike calling addTask repeatedly). Unassigned drafts get a neutral
  // placeholder assignee and an empty assigneeId so they can be assigned later.
  const addGeneratedTasks = useCallback(
    async (inputs: GeneratedTaskInput[]) => {
      if (inputs.length === 0) return;
      const now = new Date();
      let n = tasks.reduce((m, t) => {
        const v = Number(/^AUT-(\d+)$/.exec(t.key ?? "")?.[1]);
        return Number.isFinite(v) && v > m ? v : m;
      }, 0);

      const ids: string[] = [];
      for (const input of inputs) {
        n += 1;
        const member = team.find((m) => m.id === input.assigneeId);
        const data: Omit<Task, "id"> = {
          key: `AUT-${n}`,
          name: input.name.trim(),
          createdDate: formatDate(now),
          createdTime: formatTime(now),
          dueDate: "No due date",
          commits: [],
          projectId: input.projectId,
          assigneeId: member?.id ?? "",
          assignee: member
            ? { name: member.name, initials: member.initials, tint: member.tint }
            : { name: "Unassigned", initials: "—", tint: "bg-muted text-muted-foreground" },
          createdById: currentUserId,
          memberGenerated: false,
          aiGenerated: true,
          ...(input.category ? { category: input.category } : {}),
          status: "Pending",
          priority: input.priority,
          done: false,
        };
        ids.push(await createTask(data));
      }

      logActivity({
        actor: currentUser.name,
        initials: currentUser.initials,
        tint: currentUser.tint,
        action: "generated",
        target: `${inputs.length} task${inputs.length === 1 ? "" : "s"} with AI`,
      });
      requestIssues(ids);
    },
    [tasks, team, currentUser, currentUserId, logActivity, requestIssues]
  );

  const updateTask = useCallback(
    (id: string, input: TaskInput) => {
      const member = team.find((m) => m.id === input.assigneeId) ?? team[0];
      const mapped: Partial<Task> = {
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
      };
      updateTaskDoc(id, mapped)
        .then(() =>
          logActivity({
            actor: currentUser.name,
            initials: currentUser.initials,
            tint: currentUser.tint,
            action: "updated task",
            target: input.name.trim(),
          })
        )
        .catch(
          (err) => console.error("[firestore] updateTask failed", err)
        );
    },
    [team, currentUser, logActivity]
  );

  const deleteTask = useCallback(
    (id: string) => {
      const task = tasks.find((t) => t.id === id);
      deleteTaskDoc(id)
        .then(() => {
          if (task)
            logActivity({
              actor: currentUser.name,
              initials: currentUser.initials,
              tint: currentUser.tint,
              action: "deleted task",
              target: task.name,
            });
        })
        .catch(
          (err) => console.error("[firestore] deleteTask failed", err)
        );
    },
    [tasks, currentUser, logActivity]
  );

  const toggleTask = useCallback(
    (id: string) => {
      const task = tasks.find((t) => t.id === id);
      if (!task) return;
      const done = !task.done;
      updateTaskDoc(id, {
        done,
        status: done ? "Completed" : "In-progress",
      })
        .then(() =>
          logActivity({
            actor: task.assignee.name,
            initials: task.assignee.initials,
            tint: task.assignee.tint,
            action: done ? "completed" : "reopened",
            target: task.name,
          })
        )
        .catch(
          (err) => console.error("[firestore] toggleTask failed", err)
        );
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

  const [personDialog, setPersonDialog] = useState<{ open: boolean }>({
    open: false,
  });
  const openAddPerson = useCallback(
    () => setPersonDialog({ open: true }),
    []
  );
  const setPersonDialogOpen = useCallback(
    (open: boolean) => setPersonDialog({ open }),
    []
  );

  const resetDemo = useCallback(() => {
    // Demo/staging only. Under real auth this would wipe the users collection
    // (including the signed-in Admin's own profile) and is hidden in the UI.
    if (authRequired) return;
    seedFirestore().catch(
      (err) => console.error("[firestore] resetDemo failed", err)
    );
    setDemoUserId(DEFAULT_USER_ID);
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      tasks,
      projects,
      team,
      activities,
      loading,
      configured: firebaseReady,
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
      canAddPeople: role === "Admin",
      updateProfile,
      addProject,
      updateProject,
      addPerson,
      addTask,
      addGeneratedTasks,
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
      personDialog,
      openAddPerson,
      setPersonDialogOpen,
      resetDemo,
    }),
    [
      tasks,
      projects,
      team,
      activities,
      loading,
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
      addPerson,
      addTask,
      addGeneratedTasks,
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
      personDialog,
      openAddPerson,
      setPersonDialogOpen,
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
