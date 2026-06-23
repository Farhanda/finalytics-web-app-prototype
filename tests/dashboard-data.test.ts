// Role-aware navigation (src/lib/dashboard-data.ts → navGroupsFor) and seed
// integrity. Pure data/logic.

import { describe, expect, it } from "vitest";

import {
  accessRoleStyles,
  navGroupsFor,
  seedProjects,
  seedTeam,
} from "@/lib/dashboard-data";

const labels = (role: Parameters<typeof navGroupsFor>[0]) =>
  navGroupsFor(role).flatMap((g) => g.items.map((i) => i.label));
const titles = (role: Parameters<typeof navGroupsFor>[0]) =>
  navGroupsFor(role).map((g) => g.title);

describe("navGroupsFor", () => {
  it("everyone gets Dashboard / Project / Task and Settings", () => {
    for (const role of ["Admin", "PM", "Member"] as const) {
      const l = labels(role);
      expect(l).toEqual(
        expect.arrayContaining(["Dashboard", "Project", "Task", "Settings"])
      );
    }
  });
  it("only Admin gets the Team (Workspace) group", () => {
    expect(titles("Admin")).toContain("Workspace");
    expect(labels("Admin")).toContain("Team");
    expect(labels("PM")).not.toContain("Team");
    expect(labels("Member")).not.toContain("Team");
  });
});

describe("seed data integrity", () => {
  it("has a style for every access role", () => {
    expect(Object.keys(accessRoleStyles).sort()).toEqual([
      "Admin",
      "Member",
      "PM",
    ]);
  });
  it("every seed project references an existing PM and members", () => {
    const ids = new Set(seedTeam.map((m) => m.id));
    for (const p of seedProjects) {
      expect(ids.has(p.pmId)).toBe(true);
      for (const m of p.memberIds) expect(ids.has(m)).toBe(true);
    }
  });
});
