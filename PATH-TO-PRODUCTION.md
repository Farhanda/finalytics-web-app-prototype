# autom8 — Path to Production

> **Owner:** Claude (acting PM + engineer)
> **Started:** 2026-06-20
> **Goal:** take autom8 from "working prototype" to "safe to put in front of real
> users with real data."
> **How we track:** this file is the single source of truth. Every work session
> appends to the [Progress log](#progress-log) and ticks boxes in the milestones.

---

## Verdict we're acting on

Not production-ready today. Three hard blockers (no login, open database, an
unauthenticated paid-AI endpoint) plus a set of data-integrity issues. Full
detail in [FEATURE-DATA-FLOW-AUDIT.md](FEATURE-DATA-FLOW-AUDIT.md) §9.

## Strategy (the approach decision)

Keep the app's best feature — **real-time Firestore listeners in the browser** —
and make it safe the idiomatic Firebase way:

1. **Firebase Authentication** (Google sign-in) → answers *"who are you?"*
2. **Firestore Security Rules** → enforce *"what may you read/write?"* **inside
   the database**, so it's safe even though the browser writes directly.
3. **Server-side ID-token verification** on the browser-facing API routes →
   privileged actions (AI, issue creation, webhooks admin) check a real identity.
4. **Data-integrity fixes** → server timestamps, no rename drift, no double-count,
   guarded destructive actions.

Identity stops being a free `localStorage` switcher; it becomes the signed-in
user, whose role comes from their `users` record and **cannot be self-escalated**
(enforced by rules).

> ⚠️ **Needs the account owner (you), not code** — flagged inline as 🙋 ACTION:
> enabling the Google sign-in provider in the Firebase console, deploying the
> security rules, and setting the service-account env vars. Code lands first;
> these are the go-live switches.

---

## Milestones

Priority order. P0 = blocker, P1 = important, P2 = polish.

### Phase 0 — Foundations ✅
- [x] Audit complete ([FEATURE-DATA-FLOW-AUDIT.md](FEATURE-DATA-FLOW-AUDIT.md))
- [x] This tracker created
- [x] Baseline build green (`pnpm build` exit 0; only a benign grpc/protobuf warning)

### Phase 1 — Authentication (P0) ✅ (code)
- [x] Add Firebase Auth client init + a typed auth helper (`src/lib/auth.ts`)
- [x] Sign-in screen (Google) + sign-out (`sign-in.tsx`, sidebar)
- [x] Auth context/provider; identity = signed-in user (`auth-provider.tsx`)
- [x] Protect `/dashboard/*` — `AuthGate` shows sign-in until authenticated
- [x] Remove the free user-switcher under real auth; "current user" = signed-in uid
- [x] First-login provisioning (`/api/auth/provision`): first user → Admin, rest → Member
- [ ] 🙋 ACTION: enable Google provider + add authorized domains in console

### Phase 2 — Authorization & database lockdown (P0)
- [x] Write `firestore.rules` enforcing the Admin/PM/Member model server-side
- [x] Forbid self-escalation (a user can't change their own `accessRole`)
- [x] `firebase.json` + `firestore.indexes.json` so rules/indexes are deployable
- [x] `storage.rules` — deny all direct client access (uploads are Admin-SDK only)
- [x] Server helper: verify a Firebase **ID token** (`src/lib/route-auth.ts`)
- [x] Gate the browser-facing routes (`document`, `webhooks`, `webhooks/[id]`, `generate-tasks`, `github/issues`, `github/repos`, `projects/[id]/commits`) on a verified token + role; client sends the token via `authedFetch`
- [ ] 🙋 ACTION: deploy rules (`firebase deploy --only firestore:rules`)

### Phase 3 — Cost & abuse protection (P0/P1) ✅
- [x] Require auth (Admin/PM) on `generate-tasks` + a per-user rate limit (`src/lib/rate-limit.ts`, 5/min)
- [x] Both webhook receivers reject oversized payloads (HMAC + 5 MB body cap)
- [x] Lock `resetDemo`/seeding behind demo-mode (no-op + hidden in UI under real auth)

### Phase 4 — Data integrity (P1)
- [x] Daily report counts **distinct** completed tasks (dedupe — no double-count)
- [x] Stop denormalized drift: propagate user renames to their tasks (`propagateAssigneeRename`)
- [ ] ↪ DEFERRED (needs live Firestore verification): `serverTimestamp()` migration
      — far-reaching (changes the report window + activity ordering reads). Sketch in PRODUCTION-SETUP §8.
- [ ] ↪ DEFERRED (needs live Firestore verification): atomic `AUT-N` allocation via a
      `counters/taskKey` transaction — avoided shipping untested code on the core
      task-creation path. Sketch in PRODUCTION-SETUP §8.

### Phase 5 — Hardening & ops (P1/P2)
- [x] Security headers (`next.config.ts` — nosniff, frame-deny, referrer, permissions, HSTS)
- [x] `.env.example` updated with the auth vars + production notes
- [x] Go-live runbook + smoke checklist ([PRODUCTION-SETUP.md](PRODUCTION-SETUP.md))
- [x] Structured 401/403/429/413 JSON responses on the gated routes (no stack leakage)
- [ ] ↪ DEFERRED: a central env-validation helper and a tuned CSP (baseline headers
      shipped; CSP needs per-origin tuning vs Firebase/Google). Tracked in PRODUCTION-SETUP §8.

### Phase 6 — Verification (P0)
- [x] `pnpm build` green (18 routes, incl. `/api/auth/provision`)
- [x] `pnpm lint` green
- [x] Manual smoke-test checklist documented (PRODUCTION-SETUP §7)
- [x] Security-rules behavior documented (rules header + runbook)
- [ ] ↪ 🙋 Live verification against a real Firebase project (cannot be done from here)

### Phase 7 — Automated QA suite ✅
- [x] Vitest installed + configured (`vitest.config.ts`, `@` alias, node env)
- [x] 58 unit tests across the pure/isolatable surface (access control, route
      auth, CLI auth, rate limit, GitHub parse+HMAC, Discord format, doc detect, nav)
- [x] `scripts/qa-report.mjs` → generates `QA-STATUS.md` (clean vs. needs-service map)
- [x] `pnpm test` / `pnpm qa` wired; fixed the esbuild `allowBuilds` approval that
      had blocked all pnpm scripts
- [x] GitHub-dependent + Firebase/AI/Discord/UI functions catalogued as
      "⏸ needs integration test" (per request, GitHub excluded)

---

## Risks & assumptions
- I cannot run a live Firebase backend here (no real credentials in the repo), so
  rules and auth are verified by **code review + `next build` typecheck**, not by
  hitting a live project. The 🙋 ACTION items are where you wire the live project.
- Going production-ready **changes behavior**: sign-in becomes required when
  Firebase is configured. When Firebase is *not* configured the app still builds
  and shows a friendly "configure" state (for local/demo).
- No git commits are made unless you ask — this `.md` is the progress record.

---

## Progress log

### 2026-06-20 — Session 1
- ✅ Audited the system end-to-end; wrote `FEATURE-DATA-FLOW-AUDIT.md`.
- ✅ Confirmed stack: Next.js 15.5.19 (standard App Router), React 19, Firebase
  web SDK v12 + firebase-admin v14. No custom Next fork despite the AGENTS.md note
  (no `node_modules/next/dist/docs`).
- ✅ Created this Path-to-Production tracker and locked the strategy (Firebase
  Auth + Security Rules + server-side token checks).
- ✅ Baseline build green.
- ✅ **Wave A — Database lockdown (Phase 2 artifacts):** replaced the old
  `allow if true` dev rules with production `firestore.rules` (auth-required reads,
  role-restricted writes mirroring `access.ts`, no self-escalation of
  `accessRole`, server-only collections denied to clients). Added `storage.rules`
  (deny all client access), `firebase.json`, and `firestore.indexes.json`
  (no composite indexes needed). **Design note:** workspace reads are allowed to
  any authenticated member so the whole-collection realtime listeners keep
  working — closing anonymous access is the v1 goal; per-employee read
  confidentiality is a future enhancement.
- ✅ **Wave B — Server-side authorization (Phase 2/3):** added `adminAuth` +
  ID-token verification (`src/lib/route-auth.ts`, `authorize()` with role
  allow-lists; degrades to "unenforced" only when the Admin SDK is absent). Gated
  every browser-facing route: `generate-tasks` (Admin/PM + 5/min rate limit via
  new `src/lib/rate-limit.ts`), `document` (POST Admin/PM, GET signed-in),
  `webhooks` + `webhooks/[id]` (Admin/PM), `github/issues` (signed-in),
  `github/repos` (Admin/PM), `projects/[id]/commits` (signed-in). The CLI routes
  (`/api/tasks*`) keep their static `AUTOM8_API_TOKEN`. Build green.
- ✅ **Wave C — Client authentication (Phase 1):** Google sign-in. New
  `src/lib/auth.ts` (`authedFetch` attaches the ID token), `auth-provider.tsx`
  (auth state + first-login provisioning call), `sign-in.tsx`, and an `AuthGate`
  in `shell.tsx` that blocks the dashboard until signed in. `/api/auth/provision`
  creates `users/{uid}` (first user → Admin). Provider identity now = signed-in
  uid; the demo switcher/seed/reset are gated to demo mode (`authRequired` off).
  All privileged client fetches use `authedFetch`. Fixed an eager `getAuth()`
  build crash (now null when unconfigured; helpers guard). Build + lint green
  (18 routes).
- ✅ **Wave D — Data integrity (Phase 4):** daily report now dedupes completed
  tasks (no double-count on reopen→recomplete); profile renames propagate to the
  user's denormalized task `assignee` snapshot (`propagateAssigneeRename`). Added
  a 5 MB body cap to both webhook receivers. Deferred `serverTimestamp()` and
  atomic `AUT-N` allocation — both touch core paths and need live Firestore
  verification I can't do here; sketched in PRODUCTION-SETUP §8.
- ✅ **Wave E — Hardening & ops (Phase 5/6):** baseline security headers in
  `next.config.ts`; `.env.example` documents the auth vars + "Admin SDK required
  in production"; new `PRODUCTION-SETUP.md` go-live runbook + smoke checklist.
  Final `pnpm build` + `pnpm lint` green.
- 🟢 **Status: the three P0 blockers are CLOSED in code** (no anonymous DB
  access; sign-in required; gated + rate-limited paid endpoint). Remaining work is
  the 🙋 live wiring (enable Google provider, set Admin SDK env, deploy rules) and
  the DEFERRED P1/P2 polish above. The app cannot be confirmed end-to-end without
  a real Firebase project — see PRODUCTION-SETUP §7 for the verification steps.

### 2026-06-20 — Session 2 (Automated QA)
- ✅ Built an automated QA suite (Vitest): **58 tests, all passing**, over every
  pure/isolatable function — with the security-critical access rules and route
  authorization most heavily covered.
- ✅ `pnpm qa` runs the suite and regenerates **[QA-STATUS.md](QA-STATUS.md)**: a
  function-by-function map of ✅ verified-clean vs. ⏸ needs-a-live-service
  (GitHub / Firebase / Anthropic / Discord / UI). GitHub-dependent functions are
  excluded per request.
- ✅ Fixed a pnpm `allowBuilds` placeholder (`esbuild`) that was blocking every
  pnpm script; `pnpm build`/`lint`/`test` all green again.
