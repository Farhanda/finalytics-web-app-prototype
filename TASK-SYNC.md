# Task sync — Claude checks tasks off as it works

The flow:

```
1. Create a task in autom8           → it gets a key like AUT-12
2. Claude works the task + commits   → normal commits, NO key in the message
3. Claude calls the autom8 CLI       → task moves In-progress / Completed,
                                        and the commit detail is attached
4. (later) Daily report → Discord    → summarises what was done today
```

Tasks are checked off **by Claude calling autom8's API**, not by parsing commit
messages. Commit messages stay clean; the integration is explicit and reliable.

## The CLI

[`scripts/autom8.mjs`](scripts/autom8.mjs) reads your latest git commit
automatically and talks to the autom8 API.

```bash
node scripts/autom8.mjs list            # see tasks + their keys
node scripts/autom8.mjs start AUT-12    # mark a task In-progress
node scripts/autom8.mjs commit AUT-12   # attach HEAD commit, stay In-progress (WIP)
node scripts/autom8.mjs done AUT-12     # attach HEAD commit + tick it off (Completed)
```

The commit's **subject + body + author + timestamp** are stored on the task, so the
body (your bullet points) feeds the daily report later. Write descriptive commits.

Claude already knows this workflow — it's documented in
[AGENTS.md](AGENTS.md) and loaded every session.

## Setup

### 1. API token (required)

The CLI authenticates with a bearer token. Set the same value on the server:

```bash
# .env.local
AUTOM8_API_TOKEN=<a long random string>
# AUTOM8_BASE_URL=http://localhost:3000   # only if the app runs elsewhere/deployed
```

Generate one quickly:

```bash
node -e "console.log('autom8_'+require('crypto').randomBytes(20).toString('hex'))"
```

The app must be reachable when the CLI runs (`pnpm dev`, or a deployed URL via
`AUTOM8_BASE_URL`). Check **Settings → Task sync** for status.

### 2. Secure writes — Firebase Admin SDK (recommended for production)

By default the API writes via the Firebase **client SDK**. Provide a service
account and it switches to the **Admin SDK** automatically (privileged server
writes, independent of Firestore rules):

```bash
# .env.local (server-only — NOT NEXT_PUBLIC)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## The API (if you want to integrate without the CLI)

All routes require `Authorization: Bearer <AUTOM8_API_TOKEN>`.

| Method + path | Body | Effect |
| --- | --- | --- |
| `GET /api/tasks` | — | list tasks (key, name, status, project) |
| `POST /api/tasks/update` | `{ taskKey, status?, commit? }` | set status and/or attach a commit |

`commit` shape: `{ sha, message, body?, url, author, timestamp? }`.
`status` ∈ `In-progress` · `Pending` · `Completed` (Completed also ticks `done`).

## Where it shows up

- **Task board** — the task ticks off; its key is on the row.
- **Edit task → Linked commits** — full message, body, author, time.
- **Projects → Commits tab** — every commit across the project's tasks.
