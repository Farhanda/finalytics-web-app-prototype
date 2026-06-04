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
holds tasks, projects, team, an activity log, and the user **profile** in React Context,
**persisted to `localStorage`** so your changes survive a refresh. Every widget reads from
it and every action writes to it, so the UI stays in sync end-to-end.

**What actually works:**

- **Create / edit / delete tasks** — a shared dialog ([task-dialog.tsx](src/components/dashboard/task-dialog.tsx))
  opened from the topbar or any board. Deletes ask for confirmation. Each action shows a
  toast and appends to the activity log.
- **Complete a task** — the checkbox toggles done **and** flips status to/from
  `Completed`, updating every derived number live.
- **Derived KPIs** — Team Members, Active Projects, Open Tasks, and Completion % are all
  computed from state (no hard-coded figures).
- **Edit your profile** — Settings updates your name/email; the greeting, sidebar, and
  future activity entries reflect it instantly.
- **Search** — the topbar search routes to `/dashboard/tasks?q=…`; the board reads the
  query and filters. Team cards' "View tasks" deep-link the same way.
- **Notifications** — the bell opens a dropdown fed by the live activity log.
- **Sidebar** — the Tasks badge shows the real open-task count; the user menu has
  "Back to home" and "Reset demo data".

**Pages** (everything in the nav is a real, connected page):

| Route | What it does |
| --- | --- |
| `/dashboard` | Overview — KPIs, weekly chart, activity feed, projects, task board |
| `/dashboard/tasks` | Full task board (search via `?q=`, filter tabs, CRUD) |
| `/dashboard/projects` | Project progress cards + status summary |
| `/dashboard/calendar` | Tasks placed on their due dates; click a task to edit it |
| `/dashboard/team` | Members + per-person task counts; filter via `?role=` |
| `/dashboard/roles` | Roles derived from the team, with per-role workload → Team |
| `/dashboard/settings` | Edit profile (live across the app), workspace info, reset |
| `/dashboard/help` | Resources, FAQ, and a contact form (knows your email) |

**How they connect:** Roles → "View members" deep-links to Team filtered by role →
"View tasks" deep-links to the task board searched by name. Creating/editing a task
updates the board, calendar, KPIs, team counts, role workload, and activity feed at once.

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
