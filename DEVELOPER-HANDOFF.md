# autom8 — Developer Handoff (START HERE)

Onboarding for the next developer. This points you at the right docs, explains
the current state, and lists exactly what's left to do.

---

## 1. What autom8 is
A project/task board for a software studio, wired to **GitHub** (Issues + push
webhooks), **Discord** (daily report), and **Claude** (AI task drafting), on
**Next.js 15 (App Router) + React 19 + Firebase (Firestore + Auth)**.

For the full feature & data-flow walkthrough — admin creates a project → developer
finishes a task → daily report — read **[FEATURE-DATA-FLOW-AUDIT.md](FEATURE-DATA-FLOW-AUDIT.md)**.

## 2. Where the project stands
It started as a prototype (no auth, open database). It has since been **hardened
toward production**. The three launch blockers are **closed in code**:

1. **Authentication** — Google sign-in required by default; first user becomes
   Admin (`src/lib/auth.ts`, `src/components/dashboard/auth-provider.tsx`,
   `sign-in.tsx`, `/api/auth/provision`).
2. **Database lockdown** — `firestore.rules` + `storage.rules` (auth-required,
   role-restricted, no self-escalation). **Must be deployed** to take effect.
3. **Server authorization + cost control** — every browser-facing API route is
   token-gated (`src/lib/route-auth.ts`); the paid AI route is Admin/PM-only and
   rate-limited (`src/lib/rate-limit.ts`).

Full change log + rationale: **[PATH-TO-PRODUCTION.md](PATH-TO-PRODUCTION.md)**.

> Demo mode still exists: set `NEXT_PUBLIC_REQUIRE_AUTH=false` to run without
> sign-in (the old identity switcher). Production leaves it unset (secure default).

## 3. Run it locally
1. `pnpm install`
2. Create a Firebase project and fill **`.env.local`** (a ready template is in the
   repo root — git-ignored). You need the 6 `NEXT_PUBLIC_FIREBASE_*` web keys **and**
   the 3 `FIREBASE_*` Admin-SDK keys (sign-in provisioning needs the Admin SDK).
3. **Deploy the rules** (or a fresh Firestore denies all reads): Firebase console →
   Firestore → Rules → paste `firestore.rules` → Publish. (Or `firebase deploy
   --only firestore:rules`.)
4. `pnpm dev` → http://localhost:3000/dashboard → Continue with Google → you're Admin.

Step-by-step with screenshots-worth of detail: **[PRODUCTION-SETUP.md](PRODUCTION-SETUP.md)**.

## 4. Tests / QA
```bash
pnpm qa               # run the unit suite + regenerate QA-STATUS.md
pnpm test             # unit tests only (Vitest)
pnpm test:watch       # watch mode
pnpm emulators        # start the Firebase emulators (needs the Firebase CLI + Java)
pnpm test:integration # emulator-backed integration tests (self-skip if no emulator)
pnpm build            # full Next.js build (also typechecks)
pnpm lint             # ESLint
```
**72 unit tests** cover the pure logic (access control, route auth, rate limit,
GitHub parsing/HMAC, Discord formatting, doc detection, nav, env validation, and
the atomic task-key math). An **emulator integration suite**
(`tests/integration/`) covers Firestore round-trips, the daily-report dedupe, and
concurrent `AUT-N` allocation — it self-skips when the emulator isn't running.
What's verified vs. what still needs an integration test is mapped in
**[QA-STATUS.md](QA-STATUS.md)** — regenerated on every `pnpm qa` run.

## 5. What's left to do (pick up here)
**Blocking go-live (owner — needs the Firebase account, not code):**
- [ ] Create the Firebase project, fill `.env.local`, deploy the rules (§3).
- [ ] Enable the Google sign-in provider + authorized domains in the console.

**Verify on a real Firebase project** (implemented in code Session 3, but the
build/typecheck can't prove live query semantics — see PATH-TO-PRODUCTION Session 3):
- [ ] `serverTimestamp()` writes + the daily-report window + activity ordering.
- [ ] Atomic `AUT-N` allocation (`counters/taskKey`) under concurrent creates —
      `pnpm emulators && pnpm test:integration` exercises this against the emulator.

**Done in Session 3 (was the follow-up backlog):**
- [x] **Role-edit UI** on the Team page (`updateAccessRole`) — Admins promote/demote
      inline; your own role is locked to prevent a last-Admin lockout.
- [x] Firestore **emulator** config + integration tests (`tests/integration/`).
- [x] A tuned **Content-Security-Policy** in `next.config.ts`.
- [x] Central **env-validation** helper (`src/lib/env.ts`).

**Recommended next:**
- [ ] Nonce-based CSP (drop `'unsafe-inline'` for scripts via middleware).
- [ ] Extend the emulator suite to the remaining CRUD + the security rules, and add
      a jsdom + Testing Library runner for the React components.
- [ ] Optional integrations when ready: GitHub App, Anthropic, Discord, Vercel
      cron — all documented in `.env.example` + PRODUCTION-SETUP.

## 6. Map of the code
- `src/lib/access.ts` — Admin/PM/Member visibility + permission rules (pure).
- `src/lib/firestore.ts` / `firestore-admin.ts` — client/admin Firestore CRUD.
- `src/lib/route-auth.ts` / `api-auth.ts` — server route auth (browser vs. CLI).
- `src/components/dashboard/provider.tsx` — the live data/context layer.
- `src/app/api/**` — route handlers (tasks, github, projects, reports, auth).
- `scripts/autom8.mjs` — CLI for syncing task status from git (see `AGENTS.md`).
- `firestore.rules`, `storage.rules`, `firebase.json` — deployable security config.

## 7. Conventions
- Task board sync is via `scripts/autom8.mjs` (`list`/`start`/`commit`/`done`) —
  commit messages stay clean (no task key inside). See **[AGENTS.md](AGENTS.md)**.
- Never commit `.env.local` (git-ignored). `qa-results.json` is generated.
