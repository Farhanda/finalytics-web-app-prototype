// Access-control rules (src/lib/access.ts) — the security-critical visibility &
// permission policy for Admin / PM / Member. Pure functions, no external deps.

import { describe, expect, it } from "vitest";

import {
  canCreateProject,
  canCreateTaskInProject,
  canEditTask,
  canManageProject,
  canToggleTask,
  creatableProjects,
  visibleProjects,
  visibleTasks,
} from "@/lib/access";
import type { DashboardProject } from "@/lib/dashboard-data";
import type { Task } from "@/lib/data";

const project = (
  id: string,
  pmId: string,
  memberIds: string[]
): DashboardProject => ({
  id,
  pmId,
  memberIds,
  name: id,
  client: "c",
  progress: 0,
  status: "On track",
  due: "",
  tint: "",
});

const task = (
  id: string,
  projectId: string,
  assigneeId: string,
  createdById: string
): Task =>
  ({ id, projectId, assigneeId, createdById }) as unknown as Task;

const projects = [
  project("p1", "pm1", ["m1", "m2"]),
  project("p2", "pm2", ["m2", "m3"]),
];
const tasks = [
  task("t1", "p1", "m1", "pm1"),
  task("t2", "p1", "m2", "m2"), // member-created
  task("t3", "p2", "m3", "pm2"),
];
const idsOf = (arr: { id: string }[]) => arr.map((x) => x.id).sort();
const p1 = projects[0];
const p2 = projects[1];

describe("visibleProjects", () => {
  it("Admin sees every project", () => {
    expect(idsOf(visibleProjects("Admin", "anyone", projects))).toEqual([
      "p1",
      "p2",
    ]);
  });
  it("PM sees only projects they own", () => {
    expect(idsOf(visibleProjects("PM", "pm1", projects))).toEqual(["p1"]);
    expect(idsOf(visibleProjects("PM", "pm2", projects))).toEqual(["p2"]);
  });
  it("Member sees only projects they're on", () => {
    expect(idsOf(visibleProjects("Member", "m1", projects))).toEqual(["p1"]);
    expect(idsOf(visibleProjects("Member", "m2", projects))).toEqual([
      "p1",
      "p2",
    ]);
  });
});

describe("visibleTasks", () => {
  it("Admin sees all tasks", () => {
    expect(idsOf(visibleTasks("Admin", "x", tasks, projects))).toEqual([
      "t1",
      "t2",
      "t3",
    ]);
  });
  it("PM sees every task in their projects", () => {
    expect(idsOf(visibleTasks("PM", "pm1", tasks, projects))).toEqual([
      "t1",
      "t2",
    ]);
  });
  it("Member sees only tasks they own or created, within their projects", () => {
    expect(idsOf(visibleTasks("Member", "m1", tasks, projects))).toEqual(["t1"]);
    expect(idsOf(visibleTasks("Member", "m2", tasks, projects))).toEqual(["t2"]);
    expect(idsOf(visibleTasks("Member", "m3", tasks, projects))).toEqual(["t3"]);
  });
});

describe("canCreateProject", () => {
  it("is Admin-only", () => {
    expect(canCreateProject("Admin")).toBe(true);
    expect(canCreateProject("PM")).toBe(false);
    expect(canCreateProject("Member")).toBe(false);
  });
});

describe("canManageProject", () => {
  it("Admin manages any project", () => {
    expect(canManageProject("Admin", "x", p2)).toBe(true);
  });
  it("PM manages only the projects they own", () => {
    expect(canManageProject("PM", "pm1", p1)).toBe(true);
    expect(canManageProject("PM", "pm1", p2)).toBe(false);
  });
  it("Member never manages a project", () => {
    expect(canManageProject("Member", "m1", p1)).toBe(false);
  });
});

describe("canCreateTaskInProject", () => {
  it("Admin can create anywhere", () => {
    expect(canCreateTaskInProject("Admin", "x", p2)).toBe(true);
  });
  it("PM can create in their own project only", () => {
    expect(canCreateTaskInProject("PM", "pm1", p1)).toBe(true);
    expect(canCreateTaskInProject("PM", "pm1", p2)).toBe(false);
  });
  it("Member can create in projects they're on only", () => {
    expect(canCreateTaskInProject("Member", "m1", p1)).toBe(true);
    expect(canCreateTaskInProject("Member", "m1", p2)).toBe(false);
  });
});

describe("creatableProjects", () => {
  it("returns visible projects the user can add tasks to", () => {
    expect(idsOf(creatableProjects("Member", "m2", projects))).toEqual([
      "p1",
      "p2",
    ]);
    expect(idsOf(creatableProjects("PM", "pm1", projects))).toEqual(["p1"]);
  });
});

describe("canEditTask", () => {
  it("Admin edits anything", () => {
    expect(canEditTask("Admin", "x", tasks[2], projects)).toBe(true);
  });
  it("PM edits tasks in their own project", () => {
    expect(canEditTask("PM", "pm1", tasks[0], projects)).toBe(true);
    expect(canEditTask("PM", "pm1", tasks[2], projects)).toBe(false);
  });
  it("Member edits only what they created", () => {
    expect(canEditTask("Member", "m2", tasks[1], projects)).toBe(true); // created t2
    expect(canEditTask("Member", "m2", tasks[0], projects)).toBe(false); // created by pm1
  });
});

describe("canToggleTask", () => {
  it("the assignee can always toggle their own task", () => {
    expect(canToggleTask("Member", "m1", tasks[0], projects)).toBe(true);
    expect(canToggleTask("Member", "m3", tasks[2], projects)).toBe(true);
  });
  it("falls back to edit rights otherwise", () => {
    // m1 is neither assignee nor creator of t2 → cannot toggle.
    expect(canToggleTask("Member", "m1", tasks[1], projects)).toBe(false);
    // PM of p1 can toggle a p1 task they don't own as assignee.
    expect(canToggleTask("PM", "pm1", tasks[1], projects)).toBe(true);
    // PM of p1 cannot toggle a p2 task.
    expect(canToggleTask("PM", "pm1", tasks[2], projects)).toBe(false);
  });
});
