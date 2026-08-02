# Inventory checklist (frontend)

The read-only scan. For each item: how to detect it and what to record. Everything here feeds the descriptive `ARCHITECTURE.md` and the seeded `MODULE_REGISTRY.md`. Do not modify any file while scanning.

## Stack & versions — `package.json`
- **Framework / router**: `next` (App Router if an `app/` dir exists, Pages Router if `pages/`; some apps have both during migration — record which one new code should follow). `vite` + `react`, CRA (`react-scripts`), `remix`/`react-router`, or plain React. Record the major version — it changes Server-vs-Client component rules, routing, and data APIs.
- **Language**: TypeScript (`typescript` dep + `tsconfig.json`) vs JavaScript. Record strictness if TS.
- **Styling**: `tailwindcss` (record v3 vs v4 — v4 is CSS-first `@import "tailwindcss"`/`@theme`, v3 uses `tailwind.config.js` + directives), CSS Modules (`*.module.css`), `styled-components`/`@emotion`, Sass, or vanilla CSS.
- **Component library**: `shadcn` (no dep — detect `components.json` + `components/ui/` + `cva`/`tailwind-merge`), `@mui/material`, `@chakra-ui/react`, `antd`, `@mantine/core`, Radix primitives, or none/bespoke.
- **Data fetching**: `@tanstack/react-query`, `swr`, `@reduxjs/toolkit` (RTK Query), Apollo/`urql` (GraphQL), or raw `fetch`.
- **HTTP**: `axios` (look for one configured instance) vs native `fetch`. Record the base URL strategy.
- **Forms**: `react-hook-form`, `formik`, `react-final-form`, or uncontrolled/manual.
- **Validation**: `zod`, `yup`, `valibot`, `joi`, or none.
- **State**: `@reduxjs/toolkit`/`redux`, `zustand`, `jotai`, `recoil`, `mobx`, or Context/server-state-only.
- **Env**: `@t3-oss/env-nextjs`/`@t3-oss/env-core`, raw `process.env`/`import.meta.env`, or a config module.
- **Test**: `vitest`, `jest`, `@testing-library/react`, `@playwright/test`, `cypress`. Record framework + setup file.
- **Scripts block** — record the real dev/build/start/lint/test commands and the package manager (from the lockfile: `pnpm-lock.yaml`/`package-lock.json`/`yarn.lock`/`bun.lockb`).

## TypeScript / module config — `tsconfig.json`
- **Import alias**: `compilerOptions.paths` (`@/*` → `src/*` is the toolkit default; record whatever's there). The builder must use the real alias.
- `baseUrl`, JSX setting, strictness flags (informational).

## Layout — directory shape
- **Feature-module**: `src/features/<x>/` (or `modules/<x>/`) each containing components/hooks/api/schema/types. The toolkit's preferred shape.
- **Type-grouped**: top-level `components/`, `hooks/`, `pages/`/`app/`, `services/`, `utils/`. Very common in existing React apps.
- **Flat / ad-hoc**: note it and pick the dominant grouping.
Record the pattern and where new features' files should go under it. Note where pages/routes live (`app/`, `pages/`, `src/routes/`) and where the `src/` boundary is.

## Component inventory (the DRY-critical part)
Walk the component tree and list, with paths, everything reusable — this is the heart of the registry:
- **Primitives / design-system layer** — `components/ui/` (shadcn), or the third-party lib's components in use. For shadcn, list the actual installed primitives (the files in `components/ui/`). For MUI/Chakra/etc., note the library is the primitive source (don't enumerate every import).
- **Shared / generic components** — `components/shared/**`, `components/common/**`, or top-level reusable components: buttons/wrappers, cards, modals/dialogs, layout containers, tables, headers/navbars, typography. Group by purpose where the repo already does (form / typography / overlay / layout / data-display).
- **Shared form fields** — a `*Field` / `FormInput` layer that wraps inputs + validation display, if one exists. Record each, what it wraps, and the form lib it binds.
- **Icon setup** — which icon library/libraries the repo uses (lucide-react, react-icons, heroicons, an icon font) and whether a central icon registry file (`components/shared/icons.tsx` or similar) exists. Register it if so; if icons are imported ad hoc from several libraries, record that as a finding.
Each becomes a `MODULE_REGISTRY.md` row: name, path, what it wraps/depends on, purpose.

## Hooks, schemas, lib, services
- **Hooks** — `hooks/**`, feature-local hooks, and especially data hooks (`useXQuery`/`useXMutation`/SWR keys). Record name, path, purpose.
- **Schemas** — Zod/Yup schema files (`schema/**`, `*.schema.ts`, validators). Record name, path, and whether types derive from them (`z.infer`).
- **Types** — shared `types/**` / `*.d.ts` reused across features.
- **Lib / utils** — the HTTP instance, query client, env module, `cn`/className helper, formatters, auth/session helpers, constants. Record each with path + purpose.
- **Services** — cross-feature API modules.

## Existing feature modules
For each feature/domain folder:
- Path and what it owns (its screens/components).
- Its public surface — the components, hooks, and api fns other code imports. Record these so cross-feature needs go through the shared layer, not a direct cross-feature import.

## Data fetching & HTTP
Read several pages/hooks. Determine: is there ONE configured HTTP instance (`lib/axios.ts`?) or scattered `fetch`? Is server-state managed by a library (TanStack Query/SWR/RTK Query) or hand-rolled `useEffect`+`useState`? Capture the dominant pattern exactly — the builder copies it. Multiple patterns → Step 2 conflict.

## Backend connection — BFF vs direct
- **BFF/proxy** — Next Route Handlers under `app/api/` (or a server proxy) that forward to the backend; the browser calls same-origin `/api`. Record the proxy path + how auth is attached.
- **Direct** — the browser hits the backend's absolute URL (env var like `NEXT_PUBLIC_API_URL`/`VITE_API_URL`). Record it as the reality, and flag "no BFF" as a finding (not a rewrite).

## Forms & validation
- Form lib (RHF/Formik/manual) and whether a shared field layer exists or each form wires inputs by hand.
- Validation lib and where schemas live. If forms wire `<Controller>`/inputs ad hoc with no shared field, record that and note it as a finding.

## Env & config
- Typed env module (T3 Env / a `config` module) vs raw `process.env`/`import.meta.env` scattered around. Record the approach and where vars are declared (`.env.example`?). Note the server/client split if one exists.

## Auth & routing
- How auth/session is stored (httpOnly cookies, localStorage token, NextAuth/Auth.js, Clerk, context) and read.
- Route protection — Next `middleware.ts`/`proxy.ts`, a route guard/HOC, or per-page checks. Record the role→route mapping if there is one.

## Tests
- Framework, RTL setup, file convention (colocated `*.test.tsx` vs `__tests__/`), and whether there are component/hook/e2e tests. test-writer will match this.

## Output of the scan
Two things: (1) the facts to write into `ARCHITECTURE.md` (using the toolkit's section headings, filled with this repo's reality), and (2) the exhaustive list of reusable pieces to seed `MODULE_REGISTRY.md`. Plus a findings note of any duplication, missing-BFF, ad-hoc forms, or scattered-env observed (reported, never auto-fixed).
