#!/usr/bin/env node
// autom8 task CLI — the bridge between your git work and the autom8 board.
//
// Claude (or you) calls this to keep tasks in sync. It reads the latest commit
// from git automatically, so commit messages stay clean (no "AUT-12" needed).
//
//   node scripts/autom8.mjs list                 # see tasks + their keys
//   node scripts/autom8.mjs start AUT-12         # mark a task In-progress
//   node scripts/autom8.mjs commit AUT-12        # attach HEAD commit (still WIP)
//   node scripts/autom8.mjs done AUT-12          # attach HEAD commit + Completed
//
// Config (from .env.local or the environment):
//   AUTOM8_API_TOKEN   required — same value as the server
//   AUTOM8_BASE_URL    optional — defaults to http://localhost:3000

import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";

function loadEnv() {
  const env = { ...process.env };
  if (existsSync(".env.local")) {
    for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#") || !t.includes("=")) continue;
      const i = t.indexOf("=");
      const k = t.slice(0, i).trim();
      let v = t.slice(i + 1).trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      )
        v = v.slice(1, -1);
      if (env[k] === undefined) env[k] = v;
    }
  }
  return env;
}

function git(args) {
  try {
    return execSync(`git ${args}`, { encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

function headCommit() {
  const sha = git("rev-parse HEAD");
  if (!sha) return null;
  const subject = git("log -1 --pretty=%s");
  const bodyText = git("log -1 --pretty=%b");
  const author = git("log -1 --pretty=%an");
  const timestamp = git("log -1 --pretty=%aI");

  // Build a GitHub commit URL from the origin remote, if it's a GitHub repo.
  let url = "";
  const remote = git("remote get-url origin");
  const m = remote.match(/github\.com[:/]+(.+?)(?:\.git)?$/i);
  if (m) url = `https://github.com/${m[1]}/commit/${sha}`;

  return { sha, message: subject, body: bodyText, url, author, timestamp };
}

async function main() {
  const env = loadEnv();
  const token = env.AUTOM8_API_TOKEN;
  const base = (env.AUTOM8_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
  const [cmd, key] = process.argv.slice(2);

  if (!token) {
    console.error("✗ AUTOM8_API_TOKEN is not set (add it to .env.local).");
    process.exit(1);
  }
  const auth = { Authorization: `Bearer ${token}` };

  if (cmd === "list") {
    const res = await fetch(`${base}/api/tasks`, { headers: auth });
    const data = await res.json();
    if (!data.ok) {
      console.error("✗", data.error || res.status);
      process.exit(1);
    }
    for (const t of data.tasks) {
      const mark = t.done ? "✓" : " ";
      console.log(
        `[${mark}] ${String(t.key).padEnd(7)} ${String(t.status).padEnd(12)} ${t.name}`
      );
    }
    return;
  }

  const statusFor = { start: "In-progress", commit: undefined, done: "Completed" };
  if (!(cmd in statusFor) || cmd === "list") {
    console.error(
      "Usage: node scripts/autom8.mjs <list|start|commit|done> [AUT-12]"
    );
    process.exit(1);
  }
  if (!key) {
    console.error(`✗ Provide a task key, e.g.  node scripts/autom8.mjs ${cmd} AUT-12`);
    process.exit(1);
  }

  const payload = { taskKey: key.toUpperCase() };
  if (statusFor[cmd]) payload.status = statusFor[cmd];
  if (cmd === "commit" || cmd === "done") {
    const c = headCommit();
    if (!c) {
      console.error("✗ Couldn't read a git commit from HEAD.");
      process.exit(1);
    }
    payload.commit = c;
    if (cmd === "commit") payload.status = "In-progress"; // logging a WIP commit
  }

  const res = await fetch(`${base}/api/tasks/update`, {
    method: "POST",
    headers: { ...auth, "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.ok) {
    console.error("✗", data.error || res.status);
    process.exit(1);
  }
  const verb =
    cmd === "done" ? "completed" : cmd === "start" ? "started" : "logged a commit on";
  console.log(`✓ ${verb} ${data.task.taskKey} — ${data.task.taskName} (${data.task.status})`);
}

main().catch((err) => {
  console.error("✗", err.message || err);
  process.exit(1);
});
