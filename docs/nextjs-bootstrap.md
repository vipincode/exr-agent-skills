# nextjs-bootstrap

Scaffolds a **new** production-grade frontend from scratch: Next.js (App Router) + TypeScript + Tailwind + shadcn/ui, wired to a separate API backend via a **BFF proxy**, with axios, Zod, TanStack Query, and React Hook Form. Runs **once per project**.

## What it does

- Creates the full frontend structure — app routes, BFF layer, shared components tree, features tree, query/form infrastructure.
- Asks only a small set of decision-gate questions before scaffolding.
- **Matches the backend's contract out of the box.** `BACKEND_URL` points at the `/api/v1` prefix, and shared helpers (`lib/api/envelope.ts`, `lib/api/errors.ts`) parse the `{ success, data, meta }` envelope and put the backend's validation errors straight onto form fields. The BFF forwards the client IP and a request id, so rate limits work per user and requests can be traced end to end.
- **Enforces the folder rules with ESLint.** A feature can't import another feature, shared code can't depend on a feature, icons come only from the icon registry, and there's one HTTP client and one env reader. All of these are lint errors, and the pre-commit hook runs lint.
- Ships the same **generated code map** as the backend (`codemap/`), with a route table (URL → file), so AI finds components and pages without opening files.
- Ships a working **test setup** (Vitest + React Testing Library + MSW) with passing example tests, and mock helpers that produce the backend's exact responses.
- Installs every library at its **latest** version (always with `@latest`, so an older copy already in the tree never sneaks in).
- Generates the contract files the frontend toolkit depends on: `ARCHITECTURE.md`, `MODULE_REGISTRY.md`, and an always-loaded `CLAUDE.md`.

## Example prompts

- "Bootstrap a new Next.js frontend for the orders API"
- "Set up a new admin dashboard UI"
- "New React app with shadcn, call it `storefront`"

## Important

- **New projects only.** Adding a page/feature to an existing project is `module-planner` + `module-builder`.
- **Stack is fixed.** It won't bootstrap Vite, CRA, Remix, Vue, Svelte, or Angular — and not backends either (that's `express-ts-bootstrap`).
- After scaffolding, typical next steps: `font-theme-setup` (theme), then `figma-to-component` / `html-to-component` (design).
- Pairs with an `express-ts-bootstrap` backend: run the backend with `TRUST_PROXY=1` behind this BFF.
