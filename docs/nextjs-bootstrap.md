# nextjs-bootstrap

Scaffolds a **new** production-grade frontend from scratch: Next.js (App Router) + TypeScript + Tailwind + shadcn/ui, wired to a separate API backend via a **BFF proxy**, with axios, Zod, TanStack Query, and React Hook Form. Runs **once per project**.

## What it does

- Creates the full frontend structure — app routes, BFF layer, shared components tree, features tree, query/form infrastructure.
- Asks only a small set of decision-gate questions before scaffolding.
- Generates the two contract files the frontend toolkit depends on: `ARCHITECTURE.md` and `MODULE_REGISTRY.md`.

## Example prompts

- "Bootstrap a new Next.js frontend for the orders API"
- "Set up a new admin dashboard UI"
- "New React app with shadcn, call it `storefront`"

## Important

- **New projects only.** Adding a page/feature to an existing project is `module-planner` + `module-builder`.
- **Stack is fixed.** It won't bootstrap Vite, CRA, Remix, Vue, Svelte, or Angular — and not backends either (that's `express-ts-bootstrap`).
- After scaffolding, typical next steps: `font-theme-setup` (theme), then `figma-to-component` / `html-to-component` (design).
