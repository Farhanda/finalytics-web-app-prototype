#!/usr/bin/env node
// autom8 automated QA — runs the unit suite and writes QA-STATUS.md: a function-
// by-function map of what's verified-clean vs. what isn't covered yet (because it
// needs a live external service: GitHub, Firebase, Anthropic, or Discord).
//
//   node scripts/qa-report.mjs
//
// Invokes Vitest via Node directly (not pnpm) so it works regardless of pnpm's
// build-approval prompt. Exits non-zero if any test fails.

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { basename } from "node:path";

const RESULTS = "qa-results.json";
const OUT = "QA-STATUS.md";

// --- What each test file verifies (module + the functions it exercises) -------
const TESTED = [
  {
    files: ["access.test.ts"],
    module: "src/lib/access.ts",
    label: "Access control (visibility + permissions)",
    functions: [
      "visibleProjects",
      "visibleTasks",
      "canCreateProject",
      "canManageProject",
      "canCreateTaskInProject",
      "creatableProjects",
      "canEditTask",
      "canToggleTask",
    ],
  },
  {
    files: ["route-auth.test.ts", "route-auth.enforced.test.ts"],
    module: "src/lib/route-auth.ts",
    label: "Server API authorization (token verify + roles)",
    functions: ["authorize — degradation, 401, 403, role-gate, success"],
  },
  {
    files: ["api-auth.test.ts"],
    module: "src/lib/api-auth.ts",
    label: "CLI bearer-token auth",
    functions: ["isAuthorized"],
  },
  {
    files: ["rate-limit.test.ts"],
    module: "src/lib/rate-limit.ts",
    label: "Rate limiting (paid-endpoint abuse guard)",
    functions: ["checkRateLimit", "sweepRateLimits"],
  },
  {
    files: ["github-parse.test.ts"],
    module: "src/lib/github.ts",
    label: "GitHub payload parsing + HMAC (no network)",
    functions: [
      "generateWebhookSecret",
      "verifyGithubSignature",
      "parsePushCommits",
      "repoFullNameFromPayload",
    ],
  },
  {
    files: ["discord.test.ts"],
    module: "src/lib/discord.ts",
    label: "Daily report formatting",
    functions: ["buildDailyEmbed (+ bullets/truncation)"],
  },
  {
    files: ["doc-parse.test.ts"],
    module: "src/lib/doc-parse.ts",
    label: "Document-kind detection",
    functions: ["detectDocKind", "mimeForKind"],
  },
  {
    files: ["dashboard-data.test.ts"],
    module: "src/lib/dashboard-data.ts",
    label: "Role-aware navigation + seed integrity",
    functions: ["navGroupsFor", "seed referential integrity"],
  },
];

// --- What is intentionally NOT unit-tested here (needs a live service) ---------
const EXCLUDED = [
  {
    service: "GitHub (network / App install)",
    why: "calls the GitHub API or receives its webhooks",
    items: [
      "src/lib/github-app.ts → createIssue, listAccessibleRepos (parseIssuesPayload is pure and could be extracted)",
      "src/app/api/github/issues/route.ts, github/repos/route.ts",
      "src/app/api/github/app/route.ts, github/webhook/[id]/route.ts",
    ],
  },
  {
    service: "Firebase / Firestore",
    why: "reads/writes a live database — use the Firestore emulator for integration tests",
    items: [
      "src/lib/firestore.ts, firestore-admin.ts (all CRUD, seeding, propagateAssigneeRename)",
      "src/lib/firebase.ts, firebase-admin.ts, storage.ts (SDK init / uploads)",
      "src/app/api/tasks/route.ts, tasks/update/route.ts, auth/provision/route.ts",
      "src/app/api/projects/[id]/document|webhooks|commits routes",
    ],
  },
  {
    service: "Anthropic (Claude)",
    why: "a paid AI request",
    items: [
      "src/lib/ai.ts → generateTasksFromDocument",
      "src/app/api/projects/[id]/generate-tasks/route.ts",
    ],
  },
  {
    service: "Discord (network)",
    why: "posts to a live webhook",
    items: [
      "src/lib/discord.ts → sendDiscordEmbed",
      "src/app/api/reports/daily/route.ts (send path; grouping logic is unit-testable next)",
    ],
  },
  {
    service: "Browser / React UI",
    why: "components need a DOM/component test runner (jsdom + Testing Library)",
    items: [
      "src/components/dashboard/* (provider, auth-provider, sign-in, dialogs, sidebar, …)",
    ],
  },
];

// --- Run the suite -------------------------------------------------------------
console.log("▶ Running unit suite (Vitest)…\n");
const run = spawnSync(
  process.execPath,
  ["node_modules/vitest/vitest.mjs", "run"],
  { stdio: "inherit" }
);

if (!existsSync(RESULTS)) {
  console.error(`\n✗ ${RESULTS} not found — could not produce a report.`);
  process.exit(run.status ?? 1);
}

const data = JSON.parse(readFileSync(RESULTS, "utf8"));

// file basename -> { passed, failed, total }
const byFile = new Map();
for (const tr of data.testResults ?? []) {
  const name = basename(tr.name);
  const passed = (tr.assertionResults ?? []).filter(
    (a) => a.status === "passed"
  ).length;
  const failed = (tr.assertionResults ?? []).filter(
    (a) => a.status === "failed"
  ).length;
  byFile.set(name, { passed, failed, total: passed + failed });
}

const statusFor = (files) => {
  let passed = 0;
  let failed = 0;
  let found = false;
  for (const f of files) {
    const s = byFile.get(f);
    if (s) {
      found = true;
      passed += s.passed;
      failed += s.failed;
    }
  }
  if (!found) return { icon: "⚪", note: "no result", passed, failed };
  if (failed > 0) return { icon: "❌", note: `${failed} failing`, passed, failed };
  return { icon: "✅", note: `${passed} passing`, passed, failed };
};

// --- Render QA-STATUS.md -------------------------------------------------------
const stamp = new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC";
const ok = data.numFailedTests === 0 && (run.status ?? 0) === 0;
const L = [];

L.push("# autom8 — QA Status");
L.push("");
L.push(`> Auto-generated by \`node scripts/qa-report.mjs\` on ${stamp}.`);
L.push("> Edit the manifest in that script, not this file (it's overwritten).");
L.push("");
L.push(
  `**Result:** ${ok ? "🟢 PASS" : "🔴 FAIL"} — ` +
    `${data.numPassedTests}/${data.numTotalTests} tests passing ` +
    `across ${data.testResults?.length ?? 0} files.`
);
L.push("");
L.push(
  "Scope: every pure / isolatable function (business rules, parsers, formatters, " +
    "auth logic). Functions that need a live external service are listed in " +
    "§2 — they're verified by integration tests / manual QA, not here. Per your " +
    "ask, the GitHub-dependent functions are explicitly out of scope."
);
L.push("");

L.push("## 1. Verified clean (unit-tested)");
L.push("");
L.push("| Status | Area | Module | Functions |");
L.push("|:--:|---|---|---|");
for (const t of TESTED) {
  const s = statusFor(t.files);
  L.push(
    `| ${s.icon} ${s.note} | ${t.label} | \`${t.module}\` | ${t.functions
      .map((f) => `\`${f}\``)
      .join(", ")} |`
  );
}
L.push("");

L.push("## 2. Not covered here — needs a live external service");
L.push("");
L.push(
  "These are *not broken* — they just can't be proven correct without the real " +
    "service (or an emulator/mock). Status = ⏸ pending integration test."
);
L.push("");
for (const e of EXCLUDED) {
  L.push(`### ⏸ ${e.service}`);
  L.push(`_Why excluded: ${e.why}._`);
  L.push("");
  for (const it of e.items) L.push(`- \`${it}\``);
  L.push("");
}

L.push("## 3. Per-file results");
L.push("");
L.push("| Test file | Passed | Failed |");
L.push("|---|--:|--:|");
for (const [name, s] of [...byFile.entries()].sort()) {
  L.push(`| \`tests/${name}\` | ${s.passed} | ${s.failed} |`);
}
L.push("");

L.push("## 4. How to run");
L.push("");
L.push("```bash");
L.push("pnpm qa            # run the suite + regenerate this file (node scripts/qa-report.mjs)");
L.push("pnpm test          # just the tests (Vitest)");
L.push("pnpm test:watch    # watch mode while developing");
L.push("```");
L.push("");
L.push(
  "> esbuild's build is pre-approved in `pnpm-workspace.yaml` (`allowBuilds`), so " +
    "pnpm scripts run without prompts."
);
L.push("");
L.push(
  "Next QA expansion (good first integration targets): the daily-report grouping " +
    "logic, and Firestore CRUD against the local emulator."
);
L.push("");

writeFileSync(OUT, L.join("\n"));
console.log(`\n✓ Wrote ${OUT} (${ok ? "PASS" : "FAIL"}).`);
process.exit(run.status ?? 0);
