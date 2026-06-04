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

```bash
npm install
npm run dev      # http://localhost:3000
```

```bash
npm run build    # production build
npm run start    # serve the production build
```

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

The `/dashboard` route is a working application shell, not just a mockup:

- **Shell** — collapsible sidebar (grouped nav + user card) and a topbar with search,
  notifications, and breadcrumb title. Responsive: the sidebar becomes a drawer on mobile.
  See [src/components/dashboard/shell.tsx](src/components/dashboard/shell.tsx).
- **`/dashboard`** — overview: KPI cards, a weekly "tasks completed" bar chart, a recent
  activity feed, an active-projects progress list, and the task board.
- **`/dashboard/tasks`** — full Task Assignment board: **interactive** search, status
  filter tabs with live counts, and tasks you can check off (client state).

Dashboard data lives in
[src/lib/dashboard-data.ts](src/lib/dashboard-data.ts); the task data is shared with the
landing-page mockups via [src/lib/data.ts](src/lib/data.ts). The other sidebar links
(Projects, Calendar, Team, Roles, Settings) are placeholders for future pages.

## Project layout

```
src/
├─ app/
│  ├─ layout.tsx          # fonts + metadata
│  ├─ globals.css         # theme tokens (orange brand) + utilities
│  ├─ page.tsx            # landing page — assembles all sections
│  └─ dashboard/
│     ├─ layout.tsx       # app shell (sidebar + topbar)
│     ├─ page.tsx         # dashboard overview
│     └─ tasks/page.tsx   # task assignment board
├─ components/
│  ├─ brand/logo.tsx      # autom8 wordmark
│  ├─ landing/            # one file per landing section
│  ├─ dashboard/          # sidebar, topbar, cards, chart, task board
│  ├─ mockups/            # the 3 product UI mockups (landing)
│  └─ ui/                 # shadcn/ui primitives
└─ lib/
   ├─ data.ts             # sample data shared by mockups + task board
   ├─ dashboard-data.ts   # nav, KPIs, projects, activity, weekly chart
   └─ utils.ts            # cn() helper
```

The mockups in [src/components/mockups/](src/components/mockups/) are presentational
recreations of the product screens and all read from the shared sample data in
[src/lib/data.ts](src/lib/data.ts), so the demo stays consistent across the page.

## Theming

Brand colors and design tokens live in [src/app/globals.css](src/app/globals.css).
The accent is a warm orange (`--primary` / `--brand`); adjust those CSS variables to
re-skin the whole site. Dark mode tokens are defined under `.dark`.
