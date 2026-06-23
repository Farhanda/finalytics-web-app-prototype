// Discord report formatting (src/lib/discord.ts → buildDailyEmbed). Pure; the
// network send (sendDiscordEmbed) needs a live webhook and is out of scope here.

import { describe, expect, it } from "vitest";

import { buildDailyEmbed, type DailyReport } from "@/lib/discord";

const base: DailyReport = {
  windowHours: 24,
  dateLabel: "20 Jun 2026",
  completedTasks: [],
  completedCount: 0,
  totalCommits: 0,
  projects: [],
};

describe("buildDailyEmbed", () => {
  it("renders an empty report with placeholders", () => {
    const e = buildDailyEmbed(base);
    expect(e.title).toBe("autom8 — Daily report");
    const [completed, commits] = e.fields;
    expect(completed.name).toContain("(0)");
    expect(completed.value).toBe("_None_");
    expect(commits.value).toBe("_None_");
  });

  it("lists completed tasks and per-division commit breakdown", () => {
    const e = buildDailyEmbed({
      ...base,
      completedTasks: ["Build login", "Fix bug"],
      completedCount: 2,
      totalCommits: 5,
      projects: [
        {
          name: "Acme",
          total: 5,
          divisions: [
            { division: "Frontend", count: 3 },
            { division: "Backend", count: 2 },
          ],
        },
      ],
    });
    const [completed, commits] = e.fields;
    expect(completed.name).toContain("(2)");
    expect(completed.value).toContain("Build login");
    expect(completed.value).toContain("Fix bug");
    expect(commits.name).toContain("(5)");
    expect(commits.value).toContain("Acme");
    expect(commits.value).toContain("Frontend 3");
    expect(commits.value).toContain("Backend 2");
  });

  it("truncates long completed lists with an overflow note", () => {
    const many = Array.from({ length: 40 }, (_, i) => `Task ${i}`);
    const e = buildDailyEmbed({ ...base, completedTasks: many, completedCount: 40 });
    expect(e.fields[0].value).toContain("more");
  });
});
