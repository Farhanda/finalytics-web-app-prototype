# GitHub integration — link commits to tasks

When you push a commit whose message mentions a task key (e.g. `AUT-12`), autom8
links that commit to the task, advances its status, and (optionally) reports back
to GitHub. It's driven by a **GitHub webhook**.

## How it works

```
git commit -m "fix dashboard crash, closes AUT-12"
   → git push
   → GitHub sends a "push" webhook  →  POST /api/github/webhook
   → verify HMAC signature → scan commit messages for AUT-<n>
   → update the task in Firestore (append commit, advance status)
   → (optional) write back to GitHub: commit status + comment
   → the dashboard updates live (onSnapshot)
```

Each task shows its key on the **Task board** row, and its linked commits in the
**Edit task** dialog. Connection status is in **Settings → GitHub**.

## Commit convention

| In your commit message | What happens to the task |
| --- | --- |
| `AUT-12` | commit linked; a Pending task moves to **In-progress** |
| `closes AUT-12` / `fixes AUT-12` / `resolves AUT-12` | also marked **Completed** |

You can reference several tasks in one commit (`AUT-3 AUT-4 …`).

## Three layers (each optional, set independently)

### 1. Webhook (required) — `GITHUB_WEBHOOK_SECRET`

The only thing needed for link + auto-status.

```bash
# .env.local
GITHUB_WEBHOOK_SECRET=<a long random string>
```

Register a **GitHub App** (`Settings → Developer settings → GitHub Apps → New`):
- **Webhook URL**: `https://<your-domain>/api/github/webhook`
- **Webhook secret**: the value above
- **Repository permissions**: Contents → *Read-only*
- **Subscribe to events**: ✅ Push
- Create, then **Install** it on your repo(s).

*(A plain repo webhook works too: Repo → Settings → Webhooks, payload URL = the
same URL, content type `application/json`, the same secret, "just the push
event". You lose write-back, since that needs the App identity.)*

**Local dev** needs a public URL — tunnel to localhost:

```bash
npx smee-client --url https://smee.io/<channel> --target http://localhost:3000/api/github/webhook
# or: ngrok http 3000  (use the ngrok URL as the Webhook URL)
```

### 2. Secure writes — Firebase **Admin SDK** (recommended for production)

By default the webhook writes via the Firebase **client SDK** (fine for a
prototype, relies on open Firestore rules). Provide a **service account** and the
webhook automatically switches to the **Admin SDK** — privileged server writes
that don't depend on permissive rules.

Firebase console → Project settings → Service accounts → *Generate new private key*:

```bash
# .env.local (server-only — NOT NEXT_PUBLIC)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Settings → GitHub shows **Storage: Admin SDK** once set. After this you can move
to the hardened, server-only rules in [firestore.rules](firestore.rules).

### 3. Write back to GitHub — the **GitHub App** identity

When the App credentials are set, every linked commit also gets, on GitHub:
- a **commit status** (`autom8 — Linked AUT-12 (Completed)`), and
- a **commit comment** listing the linked tasks.

In your GitHub App, generate a **private key** and grant extra permissions:
- **Commit statuses** → Read & write
- **Contents** → Read & write  *(for commit comments)*

```bash
# .env.local (server-only)
GITHUB_APP_ID=123456
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----\n"
```

Settings → GitHub shows **Write-back: On**. (Write-back only fires for GitHub App
deliveries — the payload carries the `installation.id` — not plain repo webhooks.)

## Notes

- **Task keys** (`AUT-1`, `AUT-2`, …) are shown on each task row; new tasks get the
  next number automatically.
- **Graceful degradation**: missing Admin creds → client SDK; missing App creds →
  no write-back. The webhook never crashes on absent config.
- **Security**: every request is verified with `X-Hub-Signature-256` (HMAC-SHA256)
  against `GITHUB_WEBHOOK_SECRET`; bad signatures get `401`.
