// Pure, framework-free rules for the three access roles (Admin / PM / Member).
// These functions decide what a given user can SEE (visibility) and what they
// can DO (permissions). The provider binds them to the current user; pages and
// components consume the results. Keeping the logic here makes the policy easy
// to read in one place and trivial to unit-test.
//
//   Admin  — sees and manages everything.
//   PM     — sees only the projects they own; assigns work to their members.
//   Member — sees only the projects they're on and the tasks that involve them;
//            may create tasks, which are flagged as "member-generated".

import type { AccessRole, DashboardProject } from "./dashboard-data";
import type { Task } from "./data";

// ---------------------------------------------------------------------------
// Visibility
// ---------------------------------------------------------------------------

export function visibleProjects(
  role: AccessRole,
  userId: string,
  projects: DashboardProject[]
): DashboardProject[] {
  if (role === "Admin") return projects;
  if (role === "PM") return projects.filter((p) => p.pmId === userId);
  return projects.filter((p) => p.memberIds.includes(userId));
}

export function visibleTasks(
  role: AccessRole,
  userId: string,
  tasks: Task[],
  projects: DashboardProject[]
): Task[] {
  if (role === "Admin") return tasks;

  const scopedProjectIds = new Set(
    visibleProjects(role, userId, projects).map((p) => p.id)
  );

  if (role === "PM") {
    // Everything happening inside the projects this PM owns.
    return tasks.filter((t) => scopedProjectIds.has(t.projectId));
  }

  // Member: tasks inside their projects that they either own or created.
  return tasks.filter(
    (t) =>
      scopedProjectIds.has(t.projectId) &&
      (t.assigneeId === userId || t.createdById === userId)
  );
}

// ---------------------------------------------------------------------------
// Permissions
// ---------------------------------------------------------------------------

export function canCreateProject(role: AccessRole): boolean {
  return role === "Admin";
}

// Editing a project's members / details. Admins manage any project; a PM
// manages only the projects they own.
export function canManageProject(
  role: AccessRole,
  userId: string,
  project: DashboardProject
): boolean {
  return role === "Admin" || (role === "PM" && project.pmId === userId);
}

// Whether the user may add a task inside a given project.
export function canCreateTaskInProject(
  role: AccessRole,
  userId: string,
  project: DashboardProject
): boolean {
  return (
    role === "Admin" ||
    (role === "PM" && project.pmId === userId) ||
    (role === "Member" && project.memberIds.includes(userId))
  );
}

// Projects the user is allowed to create tasks in (used to populate the
// project picker in the task dialog).
export function creatableProjects(
  role: AccessRole,
  userId: string,
  projects: DashboardProject[]
): DashboardProject[] {
  return visibleProjects(role, userId, projects).filter((p) =>
    canCreateTaskInProject(role, userId, p)
  );
}

// Editing / deleting a specific task. Admins and the owning PM can touch any
// task in scope; a Member can only touch tasks they created.
export function canEditTask(
  role: AccessRole,
  userId: string,
  task: Task,
  projects: DashboardProject[]
): boolean {
  if (role === "Admin") return true;
  if (role === "PM") {
    const project = projects.find((p) => p.id === task.projectId);
    return !!project && project.pmId === userId;
  }
  return task.createdById === userId;
}

// Marking a task complete/incomplete. The assignee can always tick their own
// work; PMs/Admins can toggle anything they can see.
export function canToggleTask(
  role: AccessRole,
  userId: string,
  task: Task,
  projects: DashboardProject[]
): boolean {
  if (task.assigneeId === userId) return true;
  return canEditTask(role, userId, task, projects);
}
