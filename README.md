# autom8 — Landing Page

Marketing landing page for **autom8**, the project automation platform by **Finalytics**.
Built to showcase three connected product surfaces — task assignment, real-time
progress tracking, and client-ready project status.

## Tech stack

- **Next.js 15** (App Router) + **TypeScript**
- **Tailwind CSS v4**
- **shadcn/ui** (Base UI primitives) + **lucide-react** icons
- **Plus Jakarta Sans** (display + body), **JetBrains Mono**

## Getting started

This project uses **pnpm** (pinned via `packageManager` in `package.json`). If you don't
have it, enable it with `corepack enable`.

```bash
pnpm install
pnpm dev         # http://localhost:3000
```

```bash
pnpm build       # production build
pnpm start       # serve the production build
pnpm lint        # eslint
```

> First install runs native build scripts for `sharp` and `unrs-resolver`, pre-approved in
> [pnpm-workspace.yaml](pnpm-workspace.yaml) (`allowBuilds`).

### Firebase (Firestore backend)

The `/dashboard` app stores its data in **Firebase Firestore** via the Web (client) SDK.
You need a Firebase project to run it:

1. **Create a project** at <https://console.firebase.google.com> → *Add project*.
2. **Firestore Database** → *Create database* → start in **Test mode** → pick a region
   (e.g. `asia-southeast2` for Jakarta).
3. **Project settings → Your apps → Web (`</>`)** → register an app → copy the config.
4. `cp .env.example .env.local` and paste the values (the `NEXT_PUBLIC_FIREBASE_*` keys).
5. `pnpm dev` — on first load the app **auto-seeds** Firestore with the demo data.

The `NEXT_PUBLIC_FIREBASE_*` keys are inlined into the client bundle and are safe to
expose — access is governed by [firestore.rules](firestore.rules), not key secrecy.

> ⚠️ **Security:** there is no login yet, so the role-switcher is the identity and the
> Admin/PM/Member rules are enforced **client-side** ([src/lib/access.ts](src/lib/access.ts)).
> Firestore runs in **Test mode** (open) for the prototype. Lock it down with the
> auth-aware rules drafted in [firestore.rules](firestore.rules) once real sign-in is added.

### GitHub Issues sync (optional)

Link a repo to a project and autom8 opens a **GitHub Issue** for every task, then ticks the
task off automatically when a commit/PR closes that issue (`fixes #12`). It needs a **GitHub
App** (`GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`, `GITHUB_APP_WEBHOOK_SECRET`) — full setup,
including the App's permissions and webhook, is in **[GITHUB-ISSUES.md](GITHUB-ISSUES.md)**.

> Because the repo is required and picked from the App, **creating a project needs the
> GitHub App configured**. Without it, the rest of the app works as before; projects made
> earlier just stay unlinked.

## Page structure

The page is composed top-to-bottom in [src/app/page.tsx](src/app/page.tsx), telling one
connected story from first task to final delivery:

1. **Navbar** — sticky, with mobile menu
2. **Hero** — headline + CTAs, featuring the live **Project Status** card
3. **Logo cloud** — social proof
4. **Features showcase** — three alternating rows, each pairing copy with a product mockup:
   - Task Assignment → task table
   - Real-Time Progress → stats + Task Management dashboard
   - Project Status → stage-by-stage progress card
5. **Stats band** — headline metrics
6. **Workflow** — how it works in three steps
7. **Testimonials**
8. **Pricing** — three tiers
9. **FAQ** — accordion
10. **CTA** — final conversion banner
11. **Footer**

All landing-page CTAs ("Get started", "Start for free", "Sign in") link through to the
app at `/dashboard`.

## App dashboard

The `/dashboard` area is a fully **functional** application — every control does
something, and the whole thing is driven by one shared state store.

**Single source of truth.** [DashboardProvider](src/components/dashboard/provider.tsx)
subscribes to **Firestore** (tasks, projects, team, activity log) with live `onSnapshot`
listeners and exposes them through React Context — so changes are cloud-persisted and sync
across tabs/devices in real time. Writes go straight to Firestore via
[src/lib/firestore.ts](src/lib/firestore.ts) and the UI updates from the snapshot. The only
thing kept in `localStorage` is which identity the **role-switcher** is viewing as.

**Role-based access.** There are three access roles, enforced by pure selectors in
[src/lib/access.ts](src/lib/access.ts):

| Role | Sees | Can do |
| --- | --- | --- |
| **Admin** | All projects & tasks | Create projects, assign a PM, manage anything |
| **PM** | Only the projects they own | Set project members, create tasks for them |
| **Member** | Only their projects & their own tasks | Complete tasks; create tasks (flagged *member-generated*) |

Because there's no backend, the sidebar user menu is an **identity switcher** — jump
between the Admin, the two PMs, and any Team Member to see each role's view instantly.

**What actually works:**

- **Switch identity** — the sidebar footer lets you view the app as any user; the nav,
  visible projects/tasks, and permissions all change with the selected role.
- **Create projects (Admin)** — a project dialog ([project-dialog.tsx](src/components/dashboard/project-dialog.tsx))
  to name a project, assign a PM, and pick the team. PMs reopen it to manage their members.
- **Create / edit / delete tasks** — a shared dialog ([task-dialog.tsx](src/components/dashboard/task-dialog.tsx))
  opened from the topbar or any board. Tasks are filed under a project and assigned to one
  of its members; Members self-assign and their tasks are flagged. Each action shows a toast
  and appends to the activity log.
- **Complete a task** — the checkbox toggles done **and** flips status to/from
  `Completed`, updating every derived number live.
- **Derived KPIs** — Team Members, Active Projects, Open Tasks, and Completion % are all
  computed from state (no hard-coded figures).
- **Edit your profile** — Settings updates the current user's name/email; the greeting,
  sidebar, and future activity entries reflect it instantly.
- **Search** — the topbar search routes to `/dashboard/tasks?q=…`; the board reads the
  query and filters by task, assignee, or project. Cards "View tasks" deep-link the same way.
- **Notifications** — the bell opens a dropdown fed by the live activity log.
- **Sidebar** — the Task badge shows the real open-task count for the current user; the
  user menu has the identity switcher, "Back to home", and "Reset demo data".

**Pages** (the primary nav is Dashboard / Project / Task):

| Route | What it does |
| --- | --- |
| `/dashboard` | Role-scoped overview — KPIs, weekly chart, activity, projects, task board |
| `/dashboard/projects` | Project cards with PM + team; create/manage by role |
| `/dashboard/tasks` | Task board scoped to the current user (search via `?q=`, CRUD) |
| `/dashboard/team` | **Admin-only** directory — access roles, titles, task counts |
| `/dashboard/settings` | Edit profile, see your access role, scoped workspace info, reset |

**How they connect:** the selected identity drives every view — projects, tasks, KPIs, and
the nav itself. Project cards "Tasks" deep-link to the board searched by project name.
Creating/editing a task updates the board, KPIs, team counts, and activity feed at once.

Seed data lives in [src/lib/dashboard-data.ts](src/lib/dashboard-data.ts); task data is
shared with the landing-page mockups via [src/lib/data.ts](src/lib/data.ts).

## Project layout

```
src/
├─ app/
│  ├─ layout.tsx          # fonts + metadata
│  ├─ globals.css         # theme tokens (orange brand) + utilities
│  ├─ page.tsx            # landing page — assembles all sections
│  └─ dashboard/
│     ├─ layout.tsx          # app shell (sidebar + topbar)
│     ├─ page.tsx            # overview
│     ├─ tasks/page.tsx      # task board (reads ?q= search)
│     ├─ projects/page.tsx   # project progress cards
│     ├─ calendar/page.tsx   # tasks on a month grid
│     ├─ team/page.tsx       # members + per-person tasks (reads ?role=)
│     ├─ roles/page.tsx      # roles derived from team
│     ├─ settings/page.tsx   # edit profile + workspace + reset
│     └─ help/page.tsx       # resources, FAQ, contact form
├─ components/
│  ├─ brand/logo.tsx      # autom8 wordmark
│  ├─ landing/            # one file per landing section
│  ├─ dashboard/          # provider (state), shell, sidebar, topbar,
│  │                      #   task-board, task-dialog, cards, chart, feed
│  ├─ mockups/            # the 3 product UI mockups (landing)
│  └─ ui/                 # shadcn/ui primitives
└─ lib/
   ├─ data.ts             # task seed, shared by mockups + dashboard
   ├─ dashboard-data.ts   # nav, projects, team, activity seed
   └─ utils.ts            # cn() helper
```

The mockups in [src/components/mockups/](src/components/mockups/) are presentational
recreations of the product screens and all read from the shared sample data in
[src/lib/data.ts](src/lib/data.ts), so the demo stays consistent across the page.

## Theming

Brand colors and design tokens live in [src/app/globals.css](src/app/globals.css).
The accent is a warm orange (`--primary` / `--brand`); adjust those CSS variables to
re-skin the whole site. Dark mode tokens are defined under `.dark`.
