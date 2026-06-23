# autom8 — Feature & Data-Flow Audit

> Scope: how the product actually works end-to-end, traced through the code.
> Centerpiece: the full step-by-step journey **from an Admin creating a project
> to a developer finishing a task**. Audit observations are collected at the end.
>
> Generated from a read of `src/` (Next.js App Router), `scripts/autom8.mjs`,
> and `.env.example`. File references are clickable.

---

## 1. What autom8 is

autom8 is a project/task board for a software studio, wired into **GitHub** and
**Discord** and augmented with **Claude** for task drafting. The novel parts are
the automations layered on top of an ordinary kanban board:

| Tahap (phase) | Feature | Direction |
|---|---|---|
| Tahap 1 | Upload a project brief (PDF/DOCX), extract its text | User → autom8 |
| Tahap 2 | AI drafts tasks from the brief (Claude) | autom8 ↔ Anthropic |
| — | Auto-open a GitHub Issue per task; close-Issue auto-completes task | autom8 ↔ GitHub (App) |
| Tahap 3 | Per-division GitHub push webhooks feed commits into the project | GitHub → autom8 |
| Tahap 4 | Daily digest of completed tasks + commits posted to Discord | autom8 → Discord |
| — | CLI (`scripts/autom8.mjs`) so Claude/devs sync task status from git | dev/CLI → autom8 |

---

## 2. Architecture at a glance

- **Frontend**: Next.js App Router, React client components. All dashboard state
  is held in one React context, [provider.tsx](src/components/dashboard/provider.tsx).
- **Live data**: **Firebase Firestore**. The browser subscribes with four
  `onSnapshot` listeners (`users`, `projects`, `tasks`, `activities`) — every
  write shows up across all tabs/devices in real time
  ([provider.tsx:259-306](src/components/dashboard/provider.tsx#L259-L306)).
- **Two Firestore access paths**, chosen at runtime:
  - **Client SDK** ([firestore.ts](src/lib/firestore.ts)) — used by the browser
    and as a fallback in API routes.
  - **Admin SDK** ([firestore-admin.ts](src/lib/firestore-admin.ts)) — used by
    API routes when service-account env is set. Every route picks
    `adminReady ? …Admin() : …()`.
- **Server-only integrations** (keys never reach the browser):
  - Claude / Anthropic — [ai.ts](src/lib/ai.ts) (`aiReady`)
  - GitHub App (Issues) — [github-app.ts](src/lib/github-app.ts) (`githubAppReady`)
  - GitHub push webhooks (HMAC) — [github.ts](src/lib/github.ts)
  - Discord — [discord.ts](src/lib/discord.ts) (`discordReady`)
  - Document parsing & storage — [doc-parse.ts](src/lib/doc-parse.ts), [storage.ts](src/lib/storage.ts)
- **Graceful degradation**: every integration exposes a `…Ready` boolean and
  returns HTTP **503** with a friendly message when its keys are missing, so the
  core board keeps working unconfigured.

### Firestore collections
Defined in [firestore.ts:46-52](src/lib/firestore.ts#L46-L52). Documents are
stored **without** their `id` field — the Firestore doc id *is* the id, folded
back in on read by `fromSnap` ([firestore.ts:55-57](src/lib/firestore.ts#L55-L57)).

| Collection | Holds | Key type |
|---|---|---|
| `users` | Team members (name, role, `accessRole`) | [TeamMember](src/lib/dashboard-data.ts#L145-L155) |
| `projects` | Projects (PM, members, `repoFullName`) | [DashboardProject](src/lib/dashboard-data.ts#L70-L86) |
| `tasks` | Tasks (assignee, status, commits, issue link) | [Task](src/lib/data.ts#L48-L81) |
| `activities` | Activity-feed entries (sorted by `createdAt`) | [Activity](src/lib/dashboard-data.ts#L193-L203) |
| `documents` | Uploaded briefs + extracted text | [ProjectDocument](src/lib/data.ts#L204-L219) |
| `webhooks` | Per-division push webhooks (id, secret, division) | [ProjectWebhook](src/lib/data.ts#L224-L235) |
| `projectCommits` | Commits delivered by push webhooks | [ProjectCommit](src/lib/data.ts#L239-L250) |

---

## 3. Roles & access control

Three access roles drive both **visibility** (what you see) and **permissions**
(what you can do). The rules are pure functions in
[access.ts](src/lib/access.ts), bound to the current user in the provider.

| Role | Sees | Can do |
|---|---|---|
| **Admin** | Everything | Create projects, manage any project/task, manage the Team directory |
| **PM** | Only projects they own (`pmId`) + all tasks in them | Manage their projects, assign/create/edit/toggle tasks in them |
| **Member** | Only projects they're on + tasks they own or created | Create tasks (flagged `memberGenerated`), edit/toggle their own |

> ⚠️ **Identity is a client-side demo switcher**, not authentication. The
> "current user" is stored in `localStorage` and freely switchable
> ([provider.tsx:143-144, 335-337](src/components/dashboard/provider.tsx#L143-L144)).
> All access rules run **in the browser**; there is no server-side enforcement
> and (per `.env.example`) no Firestore Security Rules are shipped. See
> [Audit findings](#9-audit-findings).

---

## 4. ⭐ End-to-end: Admin creates a project → developer finishes a task

This is the main flow. Each step lists the **UI entry point**, the **code path**,
and the **data written**.

### Step 0 — Prerequisites (one-time setup)
- Firebase configured (client and/or Admin SDK). On first run against an empty DB,
  the app **self-seeds** demo users/projects/tasks/activities
  ([provider.tsx:268-280](src/components/dashboard/provider.tsx#L268-L280) →
  [seedFirestore](src/lib/firestore.ts#L314-L338)).
- For the GitHub Issues loop: a **GitHub App** created and installed on the repos,
  with `GITHUB_APP_ID` + `GITHUB_APP_PRIVATE_KEY` + `GITHUB_APP_WEBHOOK_SECRET`
  set. Its single webhook points at `/api/github/app`.
- For AI drafting: `ANTHROPIC_API_KEY`. For the digest: `DISCORD_WEBHOOK_URL` +
  `CRON_SECRET`. For the CLI: `AUTOM8_API_TOKEN`.

### Step 1 — Admin creates the project
- **UI**: Projects page → "New project" → [ProjectDialog](src/components/dashboard/project-dialog.tsx).
- The dialog loads linkable repos from **`GET /api/github/repos`**
  ([repos route](src/app/api/github/repos/route.ts) →
  [listAccessibleRepos](src/lib/github-app.ts#L88-L99)) and **requires** the Admin
  to pick a `repoFullName` (`owner/repo`) when creating
  ([project-dialog.tsx:152-156](src/components/dashboard/project-dialog.tsx#L152-L156)).
- The Admin assigns a **PM** and checks **team members**.
- **Submit** → `addProject()` → [createProject](src/lib/firestore.ts#L103-L108)
  writes a `projects` doc and logs an activity
  ([provider.tsx:472-502](src/components/dashboard/provider.tsx#L472-L502)).
- **Data written**: 1 `projects` doc (`pmId`, `memberIds[]`, `repoFullName`, tint,
  progress, status) + 1 `activities` doc ("created project").
- The live `projects` listener re-renders the board instantly.

> Only an **Admin** can reach this step — `canCreateProject` is Admin-only
> ([access.ts:58-60](src/lib/access.ts#L58-L60)).

### Step 2 — (Optional) Upload a brief → AI drafts tasks (Tahap 1 + 2)
The PM (or Admin) can let Claude propose the task list instead of typing each one.

1. **Upload** — Project card → "Docs" → [DocumentDialog](src/components/dashboard/document-dialog.tsx)
   → **`POST /api/projects/[id]/document`** ([document route](src/app/api/projects/[id]/document/route.ts)).
   The server validates the file (PDF/DOCX, ≤10 MB), **extracts plain text**
   ([extractText](src/lib/doc-parse.ts)), best-effort uploads the raw binary to
   Firebase Storage, and writes a `documents` doc carrying the text
   (`taskGenStatus: "pending"`). Text is capped at 150 000 chars.
2. **Generate** — "Generate tasks" → **`POST /api/projects/[id]/generate-tasks`**
   ([generate-tasks route](src/app/api/projects/[id]/generate-tasks/route.ts)).
   It loads the document text and calls
   [generateTasksFromDocument](src/lib/ai.ts#L54-L89): Claude (`claude-opus-4-8`)
   with **structured outputs** returns 5–20 drafts `{name, category, priority,
   description}`. The route **does not persist tasks** — it returns the drafts and
   flips the document to `taskGenStatus: "done"`.
3. **Review & assign** — [TaskReviewDialog](src/components/dashboard/task-review-dialog.tsx)
   lets the PM edit/deselect/assign each draft, then `addGeneratedTasks()` commits
   the approved batch ([provider.tsx:582-628](src/components/dashboard/provider.tsx#L582-L628)).

> **Why a human gate?** Keys (`AUT-N`) and assignees are resolved against live
> Firestore state on the client, so the AI proposes but the PM disposes.

### Step 3 — A task is created (manually or from the AI batch)
- **Manual**: Task dialog → `addTask()`
  ([provider.tsx:536-576](src/components/dashboard/provider.tsx#L536-L576)).
- **From AI**: `addGeneratedTasks()` (batch).
- Either way → [createTask](src/lib/firestore.ts#L69-L72) writes a `tasks` doc.
  Key is the next sequential **`AUT-N`** ([nextTaskKey](src/components/dashboard/provider.tsx#L89-L96));
  the batch path numbers from one snapshot so a loop can't collide.
- **Data written**: N `tasks` docs (`projectId`, `assigneeId` + denormalized
  `assignee`, `status`, `priority`, `done`, `createdById`, `memberGenerated`,
  `aiGenerated?`, `category?`) + 1 `activities` doc.

### Step 4 — Auto-open a GitHub Issue for each new task
- Right after creating tasks, the provider calls **`POST /api/github/issues`**
  with the new task ids ([requestIssues](src/components/dashboard/provider.tsx#L452-L470)).
  This is **best-effort** — it never blocks task creation.
- The route ([github/issues](src/app/api/github/issues/route.ts)) for each task:
  looks up the task → its project's `repoFullName` → calls
  [createIssue](src/lib/github-app.ts#L67-L84) as the GitHub App →
  writes `issueNumber`, `issueUrl`, `repoFullName` **back onto the task**, and logs
  an activity. Each task yields `created | skipped | failed` so one bad repo can't
  sink a batch (concurrency capped at 4).
- **Issue body** tells the dev: closing the Issue (e.g. `fixes #12` on the default
  branch) will auto-complete the autom8 task
  ([issueBody](src/app/api/github/issues/route.ts#L43-L53)).
- If the GitHub App isn't configured → **503**, surfaced as a soft toast
  ("Task saved without a GitHub issue"). The task still exists.

### Step 5 — (Optional) Wire per-division push webhooks (Tahap 3)
- Project card → "GitHub" → [WebhookDialog](src/components/dashboard/webhook-dialog.tsx)
  → **`POST /api/projects/[id]/webhooks`** ([webhooks route](src/app/api/projects/[id]/webhooks/route.ts)).
- The server generates a **per-webhook HMAC secret**
  ([generateWebhookSecret](src/lib/github.ts#L7-L9)), writes a `webhooks` doc
  tagged with a **division** (Frontend/Backend/…), and returns the **URL + secret
  exactly once** (the GET list masks the secret).
- Each division pastes that URL + secret into their repo's
  **Settings → Webhooks** (content type `application/json`, event `push`).

> Note these are **two different GitHub channels**: the **App** webhook
> (`/api/github/app`, one global secret) handles **Issues** for the
> open/close loop; the **per-division** webhooks (`/api/github/webhook/[id]`,
> one secret each) handle **push** events for the commit feed.

### Step 6 — Developer (or Claude) works the task & syncs via the CLI
The dev finds the task key on the board (or via the CLI), then drives status from
git. Per [AGENTS.md](AGENTS.md), **commit messages stay clean** — the key is never
in the commit; the CLI reads `HEAD` and tells autom8.

```bash
node scripts/autom8.mjs list            # GET /api/tasks      → see keys
node scripts/autom8.mjs start AUT-12    # POST /api/tasks/update {status:"In-progress"}
git commit -m "…"                       # write a descriptive message
node scripts/autom8.mjs commit AUT-12   # POST /api/tasks/update {commit:…, status:"In-progress"}
```

- The CLI ([autom8.mjs](scripts/autom8.mjs)) loads `AUTOM8_API_TOKEN` from
  `.env.local`, reads the HEAD commit (sha/subject/body/author/timestamp + a
  GitHub URL derived from `origin`), and POSTs to the bearer-protected API.
- **`POST /api/tasks/update`** ([update route](src/app/api/tasks/update/route.ts)):
  authenticates the bearer token ([isAuthorized](src/lib/api-auth.ts#L6-L12)),
  validates status, and calls
  [updateTaskByKey(Admin)](src/lib/firestore.ts#L144-L171) — sets status and/or
  **appends the commit** via `arrayUnion`, plus logs an activity
  ("started" / "logged a commit on").
- **Data written**: the matching `tasks` doc gains `commits[]` entries / new
  `status`; 1 `activities` doc per call. The live `tasks` listener updates the
  board; linked commits also render in the project card's **Commits** tab
  ([project-card.tsx:109-122](src/components/dashboard/project-card.tsx#L109-L122)).

Meanwhile, every `git push` to a repo with a per-division webhook delivers to
**`POST /api/github/webhook/[id]`** ([webhook receiver](src/app/api/github/webhook/[id]/route.ts)):
it verifies the HMAC against that webhook's own secret, parses the push commits,
writes them to `projectCommits` tagged with the division, bumps the delivery
counter, and logs an activity. These enrich the project feed but **do not**
complete tasks.

### Step 7 — Developer finishes the task
Three independent ways to mark a task **Completed** (`done: true`):

1. **Close the GitHub Issue** (the headline automation). A commit/PR with a
   closing keyword (`fixes #12`) on the default branch closes the Issue → GitHub
   App fires the **`issues`** event to **`POST /api/github/app`**
   ([app webhook](src/app/api/github/app/route.ts)). It verifies the global HMAC,
   reads the payload ([parseIssuesPayload](src/lib/github-app.ts#L110-L124)),
   finds the task by `(repoFullName, issueNumber)`
   ([findTaskByIssue](src/lib/firestore.ts#L90-L101)), and sets
   `done:true, status:"Completed"`. **Idempotent** — a no-op if already in the
   target state, so GitHub's at-least-once redelivery is safe. `reopened` flips it
   back to In-progress.
2. **CLI**: `node scripts/autom8.mjs done AUT-12` → `POST /api/tasks/update`
   `{status:"Completed", commit:…}` → `done:true` + final commit attached.
3. **In the UI**: the assignee (or a PM/Admin) ticks the task →
   [toggleTask](src/components/dashboard/provider.tsx#L685-L708) →
   `done:true, status:"Completed"` + "completed" activity. Permission gated by
   [canToggleTask](src/lib/access.ts#L115-L123).

In all three, the write lands on the same `tasks` doc and an **activity with
`action:"completed"`** is logged — which is exactly what the daily report counts.

### Step 8 — The day's work rolls up to Discord (Tahap 4)
- **`/api/reports/daily`** ([daily report](src/app/api/reports/daily/route.ts))
  runs on **Vercel Cron** (GET with `CRON_SECRET`; `vercel.json` → 10:00 UTC /
  17:00 WIB) or a manual POST.
- It reads the last N hours (default 24) of `activities`, `projectCommits`, and
  `projects`, then computes: **completed tasks** (activities where
  `action === "completed"`) and **commits grouped by project → division**.
- Builds an embed ([buildDailyEmbed](src/lib/discord.ts#L30-L62)) and POSTs to the
  Discord Incoming Webhook. `?dryRun=1` returns the JSON without sending.

---

## 5. Sequence — the GitHub Issues "complete the loop"

```
Admin creates project (links owner/repo)
        │
        ▼
Task created  ──POST /api/github/issues──►  GitHub App opens Issue #N
        │                                         │  (issueNumber/url written back to task)
        ▼                                         │
Dev commits "fixes #N" on default branch ─────────┘
        │
        ▼
GitHub closes Issue #N ──issues:closed──► POST /api/github/app
                                               │ verify HMAC, find task by (repo,#N)
                                               ▼
                                    task.done=true, status="Completed"
                                               │
                                               ▼
                              activity "completed" ──► daily Discord report
```

No echo loop: completing a task in autom8 never calls GitHub, and the App handler
is idempotent on redelivery
([app route:74-77](src/app/api/github/app/route.ts#L74-L77)).

---

## 6. The task lifecycle (status field)

`status ∈ {Pending, In-progress, Completed}`, with a parallel boolean `done`
([data.ts:5, 78-80](src/lib/data.ts#L5)).

| Transition | Trigger |
|---|---|
| → **Pending** | AI-drafted tasks default to Pending ([provider.tsx:611-612](src/components/dashboard/provider.tsx#L611-L612)) |
| → **In-progress** | `autom8 start`, `autom8 commit`, or untick in UI |
| → **Completed** (`done:true`) | `autom8 done`, UI tick, or GitHub Issue closed |
| Completed → **In-progress** | UI untick, or GitHub Issue reopened |

`done` and `status` are kept in lockstep everywhere they're written (`done =
status === "Completed"`).

---

## 7. Where each integration's key lives

| Integration | Env / config | Gate | Failure mode |
|---|---|---|---|
| Firebase client | `NEXT_PUBLIC_FIREBASE_*` | `firebaseReady` | Board runs read-only/empty |
| Firebase Admin | `FIREBASE_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY` | `adminReady` | Routes fall back to client SDK |
| GitHub App (Issues) | `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY` | `githubAppReady` | Repo picker empty; tasks created w/o Issue (503) |
| GitHub App webhook | `GITHUB_APP_WEBHOOK_SECRET` | `githubWebhookReady` | `/api/github/app` returns 503 |
| Per-division webhooks | per-webhook secret (generated) | — | Bad signature → 401 |
| Claude | `ANTHROPIC_API_KEY` | `aiReady` | "Generate tasks" → 503 |
| Discord | `DISCORD_WEBHOOK_URL` | `discordReady` | Report computes; send → 503 (dryRun still works) |
| Task API / CLI | `AUTOM8_API_TOKEN` | `apiTokenSet` | 401 / 500 |
| Daily cron | `CRON_SECRET` | — | Manual trigger uses `AUTOM8_API_TOKEN` |

---

## 8. Endpoint inventory

| Method & path | Auth | Purpose |
|---|---|---|
| `GET /api/tasks` | Bearer `AUTOM8_API_TOKEN` | List tasks for the CLI/Claude |
| `POST /api/tasks/update` | Bearer `AUTOM8_API_TOKEN` | Set status / append commit by key |
| `POST /api/projects/[id]/document` | none (browser) | Upload brief, extract text |
| `GET /api/projects/[id]/document` | none | List a project's documents |
| `POST /api/projects/[id]/generate-tasks` | none | Claude drafts tasks (no persist) |
| `GET/POST /api/projects/[id]/webhooks` | none | Manage per-division webhooks |
| `DELETE /api/projects/[id]/webhooks/[webhookId]` | none | Delete a webhook |
| `GET /api/projects/[id]/commits` | none | Project commit feed |
| `POST /api/github/issues` | none | Auto-open Issues for tasks |
| `POST /api/github/webhook/[id]` | per-webhook HMAC | Receive push commits |
| `POST /api/github/app` | global HMAC | Receive Issue open/close/reopen |
| `GET /api/github/repos` | none | List App-accessible repos |
| `GET/POST /api/reports/daily` | Bearer `CRON_SECRET`/`AUTOM8_API_TOKEN` | Build + send Discord digest |
| `GET /api/integration/status` | none | Settings card status (no secrets) |

---

## 9. Audit findings

Observations from tracing the flow. Severity is the author's read, not a mandate.

### 🔴 Security / correctness
1. **No authentication or server-side authorization.** Identity is a
   `localStorage` user-switcher and all access rules run in the browser
   ([provider.tsx:240-255](src/components/dashboard/provider.tsx#L240-L255),
   [access.ts](src/lib/access.ts)). Anyone who can reach the app is effectively
   any role.
2. **Browser-facing write endpoints are unauthenticated.** `document`,
   `webhooks`, `generate-tasks`, and `github/issues` take **no token** (by design,
   per their header comments — they mirror the client-SDK posture). With the
   client SDK and no Firestore Security Rules shipped (`.env.example` ships none),
   the database is open to anonymous reads/writes. **This is the single biggest
   gap** — before any real deployment, add Firebase Auth + Firestore Security
   Rules (or move all writes behind the Admin SDK + a session).
3. **`generate-tasks` is unauthenticated and spends money.** It calls Claude with
   uploaded text and no rate limit / token gate — a cost-amplification vector.
4. **`POST /api/github/issues` is unauthenticated.** A caller who can guess task
   ids could trigger Issue creation on linked repos.

### 🟠 Data integrity / consistency
5. **Denormalized assignee can drift.** Each task stores a copy of
   `assignee {name, initials, tint}` alongside `assigneeId`
   ([data.ts:63-64](src/lib/data.ts#L63-L64)). Renaming a user
   (`updateProfile`/`updateUserDoc`) does **not** rewrite tasks, so the board can
   show a stale name. Same for `project.repoFullName` denormalized onto tasks.
6. **Sequential `AUT-N` keys are computed client-side from the current snapshot.**
   Two browsers creating tasks concurrently can mint the **same key**
   ([nextTaskKey](src/components/dashboard/provider.tsx#L89-L96)). The batch path
   avoids *intra-batch* collisions but not *cross-client* ones.
7. **`Date.now()`-based timestamps** for `activities.createdAt`,
   `uploadedAt`, `receivedAt` use server/client wall-clock, not Firestore
   `serverTimestamp()` — clock skew can mis-order the feed and the report window.
8. **Daily report counts the activity verb, not the task.** Completion is counted
   by `activity.action === "completed"`
   ([reports/daily:77-79](src/app/api/reports/daily/route.ts#L77-L79)). A task
   toggled Completed→reopened→Completed is counted **twice**; a task completed
   then renamed still shows the old target string.

### 🟡 Operational / UX
9. **Secrets shown once with no rotation UI.** Per-division webhook secrets are
   returned once ([webhooks route:90-101](src/app/api/projects/[id]/webhooks/route.ts#L90-L101));
   losing one means delete + recreate. Reasonable, but worth documenting.
10. **GitHub App installation cache is process-global and never invalidated**
    ([github-app.ts:36, 47-60](src/lib/github-app.ts#L36)). If an installation is
    moved/removed, a stale id lingers until the process restarts.
11. **Two parallel "commit" stores.** Commits arrive either as `task.commits[]`
    (via the CLI) or `projectCommits` (via push webhooks); the project card merges
    them for display but they never reconcile (the same commit can appear twice if
    both paths fire). Intentional, but a source of confusion.
12. **First-run seeding races on an empty DB.** `seededRef` guards a single tab,
    but two tabs opening a fresh DB simultaneously could both seed
    ([provider.tsx:271-276](src/components/dashboard/provider.tsx#L271-L276)).
13. **`resetDemo` wipes `users/projects/tasks/activities` for everyone** with no
    confirmation at the data layer ([seedFirestore](src/lib/firestore.ts#L314-L338)).

### 🟢 Things done well
- Clean **degrade-to-503** pattern across every optional integration — the core
  board never hard-depends on GitHub/Claude/Discord.
- **HMAC verification against the raw body before parsing**, with constant-time
  compare, on both webhook receivers
  ([github.ts:13-26](src/lib/github.ts#L13-L26)).
- **Idempotent** Issue-close handler that tolerates GitHub's at-least-once
  redelivery, and a deliberately **echo-free** design (completing in autom8 never
  calls GitHub).
- **Structured outputs** for the AI step — schema-constrained JSON, no fragile
  text parsing ([ai.ts:21-41](src/lib/ai.ts#L21-L41)).
- **Human-in-the-loop** gate on AI tasks; clean client/admin SDK mirroring so the
  same logic works in either deployment posture.

---

## 10. One-paragraph summary

An **Admin** creates a project and links a GitHub repo. Optionally a brief is
uploaded, **Claude** drafts tasks, and a PM reviews/assigns them; otherwise tasks
are typed in. Each new task **auto-opens a GitHub Issue** in the linked repo and
the Issue link is written back onto the task. A **developer** picks up a task by
its `AUT-N` key, marks it In-progress and attaches commits through the
`scripts/autom8.mjs` CLI (which reads `git HEAD`, so commit messages stay clean),
while per-division **push webhooks** stream commits into the project feed. The
developer **finishes** by closing the GitHub Issue (`fixes #N`), running
`autom8 done`, or ticking it in the UI — all converge on `status: Completed` and a
`"completed"` activity. A daily **Vercel Cron** job rolls those completions and
commits into a **Discord** digest. The flow is well-instrumented and degrades
gracefully, but it currently has **no real authentication or server-side
authorization** — the chief thing to fix before production.
```
