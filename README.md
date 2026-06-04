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

## Project layout

```
src/
├─ app/
│  ├─ layout.tsx          # fonts + metadata
│  ├─ globals.css         # theme tokens (orange brand) + utilities
│  └─ page.tsx            # assembles all sections
├─ components/
│  ├─ brand/logo.tsx      # autom8 wordmark
│  ├─ landing/            # one file per page section
│  ├─ mockups/            # the 3 product UI mockups
│  └─ ui/                 # shadcn/ui primitives
└─ lib/
   ├─ data.ts             # sample data shared by the mockups
   └─ utils.ts            # cn() helper
```

The mockups in [src/components/mockups/](src/components/mockups/) are presentational
recreations of the product screens and all read from the shared sample data in
[src/lib/data.ts](src/lib/data.ts), so the demo stays consistent across the page.

## Theming

Brand colors and design tokens live in [src/app/globals.css](src/app/globals.css).
The accent is a warm orange (`--primary` / `--brand`); adjust those CSS variables to
re-skin the whole site. Dark mode tokens are defined under `.dark`.
