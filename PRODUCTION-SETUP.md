# autom8 — Production Setup & Go-Live Runbook

Step-by-step to take the hardened build live. Items marked **🙋 YOU** need account
access (Firebase / GitHub / Vercel consoles) and can't be done from code.
Companion docs: [PATH-TO-PRODUCTION.md](PATH-TO-PRODUCTION.md) (what changed &
why) and [FEATURE-DATA-FLOW-AUDIT.md](FEATURE-DATA-FLOW-AUDIT.md) (how it works).

---

## 0. Prerequisites
- A Firebase project (Blaze plan if you want Cloud Storage for raw uploads).
- The Firebase CLI: `npm i -g firebase-tools` then `firebase login`.
- Node + pnpm (already used by the repo).

## 1. Firebase — Firestore, Auth, Storage  🙋 YOU
1. **Firestore**: create the database (production mode).
2. **Authentication → Sign-in method**: enable **Google**.
3. **Authentication → Settings → Authorized domains**: add your deploy domain
   (e.g. `autom8.vercel.app`). `localhost` is pre-authorized for dev.
4. **Storage** (optional): create a bucket if you want original PDFs/DOCX kept
   (text extraction works without it).

## 2. Environment variables
Copy `.env.example` → `.env.local` (local) and set the same in your host (Vercel
→ Project → Settings → Environment Variables). Minimum for production:

| Var | Why |
|---|---|
| `NEXT_PUBLIC_FIREBASE_*` (6) | Web SDK + turns sign-in **on** by default |
| `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` | **Required** — verifies ID tokens & provisions users |
| `AUTOM8_API_TOKEN` | CLI/Claude task sync |
| `GITHUB_APP_ID` / `GITHUB_APP_PRIVATE_KEY` / `GITHUB_APP_WEBHOOK_SECRET` | Issues sync (optional but recommended) |
| `ANTHROPIC_API_KEY` | AI task drafting (optional) |
| `DISCORD_WEBHOOK_URL` / `CRON_SECRET` | Daily report (optional) |

> Do **not** set `NEXT_PUBLIC_REQUIRE_AUTH=false` in production — that disables
> sign-in (local demo only).

Service-account key (`FIREBASE_PRIVATE_KEY`) comes from Firebase console →
Project settings → Service accounts → **Generate new private key**.

## 3. Deploy the security rules  🙋 YOU
This is the step that locks the database. From the repo root:
```bash
firebase use <your-project-id>
firebase deploy --only firestore:rules,storage
```
(Indexes: `firebase deploy --only firestore` — none are required today.)

Verify in console → Firestore → Rules that the published rules are the ones from
`firestore.rules` (auth-required, role-restricted), **not** "allow if true".

## 4. First Admin bootstrap
The first person to sign in to an **empty** workspace is auto-provisioned as
**Admin** (`/api/auth/provision`). So:
1. Deploy the app, open it, click **Continue with Google** as yourself.
2. You're now Admin. Add teammates from **Team**, then have them sign in — they
   come in as **Member**; promote to PM/Admin as needed.

> Migrating an existing demo DB? The old seed users (`u0…u8`) won't match real
> Google UIDs. Start clean, or have each real person sign in and reassign
> projects/tasks to the new uid-keyed profiles.

## 5. GitHub App (Issues loop)  🙋 YOU
Follow `.env.example`'s GitHub App block: permissions Issues=R/W, Metadata=R,
subscribe to **Issues**, webhook URL `https://<deploy>/api/github/app` with
`GITHUB_APP_WEBHOOK_SECRET`, then install on the repos you'll link to projects.
Per-division **push** webhooks are created in-app (Project card → GitHub).

## 6. Daily report cron
`vercel.json` already schedules `/api/reports/daily` (10:00 UTC / 17:00 WIB).
Set `CRON_SECRET` + `DISCORD_WEBHOOK_URL`. Preview anytime:
`GET /api/reports/daily?dryRun=1` with a Bearer `AUTOM8_API_TOKEN`.

---

## 7. Go-live verification checklist
- [ ] `pnpm build` and `pnpm lint` pass.
- [ ] Rules deployed; Firestore Rules tab shows the production rules.
- [ ] Signed-out, the dashboard shows the **Sign in** screen (no data leaks).
- [ ] First Google sign-in becomes **Admin**; a second account becomes **Member**.
- [ ] A Member cannot see projects they're not on (role scoping holds).
- [ ] Direct DB probe without auth is denied (e.g. Rules Playground / a script
      with no token → permission denied on `tasks`).
- [ ] `POST /api/projects/<id>/generate-tasks` without a token → **401**; as a
      Member → **403**; as PM/Admin → works; 6th call in a minute → **429**.
- [ ] Create a task → GitHub Issue opens; close the Issue → task auto-completes.
- [ ] Daily report `?dryRun=1` returns sane JSON; counts are de-duplicated.

---

## 8. Known limitations / recommended follow-ups
- **Workspace read scope**: any authenticated member can *read* all
  projects/tasks (writes are role-restricted). Per-employee read confidentiality
  would require re-scoping the realtime listeners to per-user queries + matching
  rules.
- **Rate limiter is in-memory**: per-instance, not a strict global cap. Back it
  with Upstash/Redis for a hard limit across serverless instances.
- **Server timestamps**: `createdAt`/`receivedAt`/`uploadedAt` use wall-clock
  `Date.now()`. For multi-writer correctness, migrate to Firestore
  `serverTimestamp()` (touches the report window + activity ordering reads).
- **Task keys (`AUT-N`)** are allocated from a client snapshot; two
  simultaneous creators can collide on a display key (the doc id is still
  unique). A `counters/taskKey` transaction would make them strictly sequential.
- **CSP**: baseline security headers are set in `next.config.ts`; a
  Content-Security-Policy still needs tuning against Firebase/Google origins.
