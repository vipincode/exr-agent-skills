# Architecture

## Purpose

This folder is being onboarded to build an **admin UI**. At onboarding time the
folder contained only a scratch `package.json` (Express-oriented) and a
one-line `README.md` — no frontend code existed yet. This document records the
decisions made to stand up a frontend workspace by hand (no scaffolding CLI /
installs were run), and is the source of truth for future frontend work here.

## Important existing-file conflict (read first)

`package.json` already exists in this folder and declares:

```json
{
  "name": "scratch",
  "version": "1.0.0",
  "scripts": { "start": "node index.js" },
  "dependencies": { "express": "^4.21.0" }
}
```

This looks like an unrelated backend/scratch manifest, not a frontend one. Per
the ground rules for this onboarding pass, **pre-existing files are not
modified**, so `package.json` was left untouched. That means the scaffold
files added below (TypeScript/Next.js config, App Router files, Tailwind
config, etc.) are **not yet wired to a working `npm run dev`** — there is no
`next`, `react`, `typescript`, or `tailwindcss` dependency declared, and no
`dev`/`build` scripts exist.

**Action needed from you before this runs:** either

1. Replace `package.json`'s contents with a frontend manifest (name, Next.js
   scripts, and the dependencies listed under "Assumed stack" below), or
2. Confirm this folder is meant to be a combined workspace and tell me how you
   want the Express bits and the new admin UI to coexist (e.g. move Express
   into a `server/` subfolder).

Nothing was installed and no generator (`create-next-app`, etc.) was run —
only hand-written files were added.

## Assumed stack

No stack was specified, so the following defaults were chosen as a
conventional, low-friction baseline for an admin UI:

- **Next.js (App Router)** + **TypeScript** — file-based routing, good default
  for an admin dashboard with multiple screens.
- **Tailwind CSS** — utility-first styling, fast to build admin layouts with.
- **shadcn/ui conventions** — `components.json` + `lib/utils.ts` (`cn` helper)
  are pre-wired so shadcn components can be added later without extra setup.
- App Router structure (`app/`) rather than the legacy `pages/` directory.

If a different stack (Vite, CRA, Remix, plain React, etc.) is actually wanted,
these scaffold files should be deleted/replaced.

## Folder structure (current)

```
.
├── app/
│   ├── layout.tsx      # Root layout, imports globals.css
│   ├── page.tsx         # Placeholder home page
│   └── globals.css      # Tailwind entrypoint + base styles
├── lib/
│   └── utils.ts          # cn() helper (clsx + tailwind-merge), shadcn convention
├── components.json        # shadcn/ui CLI config (paths, aliases)
├── next.config.mjs
├── tailwind.config.ts
├── postcss.config.mjs
├── tsconfig.json
├── next-env.d.ts
├── .gitignore
├── ARCHITECTURE.md        # this file
├── MODULE_REGISTRY.md     # seeded, currently empty — no components exist yet
├── package.json            # PRE-EXISTING, unmodified — see conflict note above
└── README.md                # PRE-EXISTING, unmodified
```

## Conventions for future work

- Reusable, generic UI (buttons, cards, tables, sidebar, top nav, etc.) goes
  under `components/` (to be created) at the project root, one file per
  component.
- Admin-domain-specific screens/features (e.g. "users admin", "orders admin")
  should live under `app/<route>/` with any feature-local components
  colocated in a `components/` subfolder of that route.
- Shared helpers go in `lib/`.
- Path alias `@/*` is configured in `tsconfig.json` and `components.json` so
  imports can use `@/components/...`, `@/lib/...` once those folders exist.
- Every new reusable component/hook/util should be added to
  `MODULE_REGISTRY.md` so later feature work reuses it instead of duplicating
  it.

## Decisions log

- No package manager install/scaffolding command was run (explicit
  constraint) — all config/source files were hand-written to match what
  `create-next-app` + `shadcn init` would normally produce.
- `package.json` and `README.md` were left untouched because they pre-existed;
  see the conflict note above for what's needed to make the app runnable.
- Testing framework was not set up — no test runner was specified and adding
  one wasn't requested.
- No routes/pages beyond a placeholder home page were created, since no
  specific admin screens were described yet.
