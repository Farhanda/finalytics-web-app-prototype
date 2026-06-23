# GitHub Issues sync — tasks ⇄ issues, both ways

autom8 can open a **GitHub Issue** for every task and tick the task off **automatically**
when that issue is closed. It builds on the Tahap 3 webhook work, but uses a **GitHub
App** so it can *write* to GitHub (the per-division push webhooks only *read*).

The flow:

```
1. Admin creates a project   → links ONE GitHub repo (picked from a dropdown)
2. Anyone adds a task        → autom8 opens an issue "[AUT-12] <name>" in that repo
3. Dev commits "fixes #12"   → on the default branch / merged PR, GitHub closes the issue
4. GitHub fires issues.closed → autom8 finds the task and marks it Completed ✅
```

Issue creation is automatic on task create (manual tasks **and** approved AI batches).
Completion is driven by GitHub's own `issues.closed` event — autom8 never parses commits
for this, and completing a task in autom8 never calls GitHub, so there's no echo loop.

> ⚠️ **The one rule your team must know.** GitHub only **auto-closes** an issue when a
> commit or PR uses a **closing keyword** — `fixes #12`, `closes #12`, `resolves #12` —
> **and** that commit lands on the repo's **default branch** (directly, or via a merged
> PR). A bare `#12`, or a commit sitting on an unmerged feature branch, only *links* the
> issue; the task ticks off when the issue actually closes (i.e. on merge).

## What you need

| Env var (server-only) | Purpose |
| --- | --- |
| `GITHUB_APP_ID` | identifies your GitHub App |
| `GITHUB_APP_PRIVATE_KEY` | signs requests as the App (open / read issues) |
| `GITHUB_APP_WEBHOOK_SECRET` | verifies the App's `issues` webhook deliveries |

Until `GITHUB_APP_ID` + `GITHUB_APP_PRIVATE_KEY` are set, the **repo picker is empty and
projects can't be created** (a repo is required), and the issue API returns a friendly
`503`. The `issues.closed` → auto-complete webhook additionally needs the secret.

## Setup

### 1. Create the GitHub App

GitHub → **Settings → Developer settings → GitHub Apps → New GitHub App**
(for a team repo, use the **org's** Settings → Developer settings).

| Field | Value |
| --- | --- |
| **GitHub App name** | e.g. `autom8 — <yourorg>` |
| **Homepage URL** | anything (your deploy URL is fine) |
| **Webhook → Active** | ✓ checked |
| **Webhook URL** | `https://<your-deploy>/api/github/app` |
| **Webhook secret** | the value you'll set as `GITHUB_APP_WEBHOOK_SECRET` |
| **Repository permissions → Issues** | **Read and write** |
| **Repository permissions → Metadata** | Read-only (auto-required) |
| **Subscribe to events** | **Issues** |

Click **Create GitHub App**.

### 2. Grab the credentials

On the new App's settings page:

- Copy the **App ID** (near the top) → `GITHUB_APP_ID`.
- **Generate a private key** → downloads a `.pem` → its contents are `GITHUB_APP_PRIVATE_KEY`.

### 3. Install the App on your repos

Left sidebar → **Install App** → install on your account/org → choose **All repositories**
or hand-pick the repos you'll link to projects. (A project can only target a repo the App
is installed on.)

### 4. Configure autom8

```bash
# .env.local (server-only — NOT NEXT_PUBLIC)
GITHUB_APP_ID=123456
# Paste the .pem. Multi-line quoted works; so does a single line with \n escapes
# (same handling as FIREBASE_PRIVATE_KEY).
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
...
-----END RSA PRIVATE KEY-----
"
GITHUB_APP_WEBHOOK_SECRET=<the same long random string from step 1>
```

Generate a secret quickly:

```bash
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```

Restart `pnpm dev` after editing `.env.local`.

> **Local development:** opening issues (outbound) works on `localhost` with no tunnel.
> The **auto-complete** half needs GitHub to *reach* your server, so the webhook URL must
> be public — deploy a Vercel preview, or expose `localhost:3000` with a tunnel
> (`cloudflared` / `ngrok`) and use that as the App's Webhook URL.

> **Production writes:** when the Firebase **Admin SDK** is configured (see
> [TASK-SYNC.md](TASK-SYNC.md) §2), the webhook write-back and issue links are written with
> privileged server credentials; otherwise it falls back to the client SDK.

## Use it

1. **Create a project (Admin).** The *New project* dialog now has a **required GitHub
   repository** dropdown, populated from the repos your App can see. Pick one.
2. **Add a task.** An issue `[AUT-12] <task name>` appears in that repo within a moment,
   and the task row shows a `#12` badge linking to it.
3. **Close the loop.** A teammate pushes `fixes #12` to the default branch (or merges a PR
   that says it). GitHub closes the issue → the task flips to **Completed** on its own.
   Reopening the issue flips the task back to **In-progress**.

## Test it without writing code

Easiest end-to-end check:

1. Create a project linked to a test repo, then add a task → confirm the issue opens.
2. In GitHub, **close that issue** from the UI (no commit needed) → the task should tick off.
3. Inspect deliveries at **GitHub App → Advanced → Recent Deliveries**. Each `issues`
   delivery should be `200`. Use **Redeliver** to replay a payload (handy for debugging —
   the handler is idempotent, so replaying a `closed` event won't double-anything).
   A wrong `GITHUB_APP_WEBHOOK_SECRET` makes deliveries come back `401`.

## The routes (for reference)

| Method + path | Auth | Effect |
| --- | --- | --- |
| `GET /api/github/repos` | — | repos the App can access (feeds the project picker) |
| `POST /api/github/issues` | — | `{ taskIds }` → open issues + link them onto the tasks |
| `POST /api/github/app` | App webhook signature | `issues.closed` → complete the task; `reopened` → reopen |

`/api/github/issues` and `/api/github/repos` are browser-facing (same posture as the
existing webhook/document routes — the client already writes Firestore directly).
`/api/github/app` is verified with `GITHUB_APP_WEBHOOK_SECRET` via GitHub's
`X-Hub-Signature-256`.

## Notes & limits

- **One repo per project.** Linked by the Admin at creation; every task in the project
  opens its issue there. Existing/demo projects created before this feature stay unlinked
  and simply don't sync (their tasks are created without an issue).
- **Idempotent + partial-failure tolerant.** Re-running issue creation skips tasks that are
  already linked; if the App isn't installed on one repo, only that task is marked failed —
  the rest still get issues. Webhook redeliveries are no-ops once the task is in state.
- **Direction is one-way per trigger.** autom8 → GitHub on task *create*; GitHub → autom8 on
  issue *close*. Closing a GitHub issue from inside autom8 (when you toggle a task done) is
  intentionally **not** wired up, to keep the two sides from chasing each other.

## Where it shows up

- **Task board** — a `#12` issue badge next to the task key; the checkbox ticks itself when
  the issue closes.
- **Edit task → Linked commits card** — a "GitHub issue #12" link.
- **New project dialog** — the required repository dropdown.
