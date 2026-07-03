# Architecture — dashboard-client

> Source of truth for **how this frontend is built**. Every frontend skill
> (`frontend-feature-planner`, `frontend-module-builder`, `frontend-test-writer`,
> `frontend-code-review`) reads this before writing or reviewing code. This file is
> **descriptive**: it records what this repo actually does, not the frontend toolkit's
> greenfield defaults. Keep it concrete and current — if a convention changes, change it
> here first. Pair it with `MODULE_REGISTRY.md` (the dedup ledger).
>
> Onboarded from an existing codebase by `frontend-onboard`. No genuine conflicts were
> found in the scan (one HTTP client, one data-fetching lib, one form lib, consistent
> layout) so no questions were asked — see "Findings" at the bottom for divergences from
> the toolkit's greenfield conventions that are recorded as-is, not changed.

## Stack

- **Vite 6 + React 18** — plain React SPA, no meta-framework, no server layer. `src/main.tsx` mounts `<App />` into `#root`.
- **TypeScript** (`strict: true`), target `ES2020`, `moduleResolution: bundler`. **No import alias** — `tsconfig.json` has `baseUrl: "."` but no `paths` entry, so all cross-folder imports are relative (e.g. `../../schemas/userSchema`). New code should follow the same relative-import style unless an alias is added as an explicit, separate change.
- **react-router-dom v6** — client-side routing, `<BrowserRouter>` in `main.tsx`, routes declared in `src/App.tsx`.
- **MUI (Material UI) v6** (`@mui/material`, `@emotion/react`, `@emotion/styled`) — the component-library/primitive source. No shadcn, no Tailwind. A custom theme is created with `createTheme` in `src/theme/theme.ts` and provided via `<ThemeProvider>` in `main.tsx`.
- **SWR v2** — server-state / data fetching (`useSWR`), not TanStack Query.
- **axios** — one configured instance (`src/api/client.ts`), used both for direct calls and as the SWR fetcher.
- **Formik 2 + Yup 1** — forms and validation. Not React Hook Form / Zod.
- **Jest + @testing-library/react** — declared in `devDependencies` and wired as the `test` script, but **no jest config file and no test files exist yet** (see Findings).
- Package manager: no lockfile is present in this checkout, so it could not be positively identified; scripts are npm-style (`npm run dev`, etc.) — treat as npm until a lockfile says otherwise.

Confirm exact versions in `package.json` before assuming newer/older API surface.

## Project layout

```
src/
  api/
    client.ts        the one axios instance (apiClient) + the shared SWR fetcher
  components/
    Card.tsx          generic shared MUI Card wrapper (title + children)
    PageHeader.tsx     generic shared page title/header
    forms/
      LoginForm.tsx    feature-ish form component (Formik + Yup), currently the only form
  hooks/
    useUsers.ts        SWR data hook for the users list (also owns the `User` type)
  schemas/
    userSchema.ts      Yup schemas (currently `loginSchema`)
  pages/
    UsersPage.tsx      route target for "/"
    LoginPage.tsx      route target for "/login"
  theme/
    theme.ts           MUI theme (createTheme)
  App.tsx              route table (react-router-dom <Routes>/<Route>)
  main.tsx             app entry: ThemeProvider > BrowserRouter > App
```

This is a **type-grouped** layout (`components/`, `hooks/`, `schemas/`, `pages/`), not the
toolkit's feature-module (`features/<name>/`) shape. New pages/components/hooks/schemas
should be added under the matching top-level folder (e.g. a new page under `pages/`, a new
data hook under `hooks/`), not under a `features/` tree — there isn't one here. `components/`
mixes generic shared components (`Card.tsx`, `PageHeader.tsx`) directly at its top level and a
`forms/` subfolder for form components; there is no `components/ui` vs `components/shared`
split (that's a shadcn/Tailwind-project convention, not used here).

## Component placement

- **Generic / reusable** (not tied to one page's data) → top level of `components/` (e.g. `Card.tsx`, `PageHeader.tsx`).
- **Form components** → `components/forms/` (currently `LoginForm.tsx`).
- **Page-level composition** → `pages/` — a page imports shared components + a data hook and lays them out; it does not itself contain business logic.
- Before creating any component: check `MODULE_REGISTRY.md`, then scan `src/components/` — reuse `Card`/`PageHeader` rather than re-implementing generic display wrappers.

## Data fetching — SWR through one axios instance

- Server-state is managed by **SWR** (`useSWR`), not TanStack Query. Data hooks live in `src/hooks/` (e.g. `useUsers.ts`) and follow the shape `{ data, error, isLoading }` renamed to domain names (`{ users, error, isLoading }`).
- All HTTP calls — both direct axios calls and the SWR fetcher — go through the single configured instance in `src/api/client.ts` (`apiClient`, `fetcher`). New data hooks should import `fetcher` from there rather than creating a new axios instance or calling `fetch` directly.
- SWR keys today are plain path strings (`"/users"`); keep that convention rather than switching to array keys (which is a TanStack Query idiom).

## Backend connection — direct, no BFF

- The browser calls the backend's **absolute URL directly** — `apiClient` is created with `baseURL: import.meta.env.VITE_API_URL`. There is no Next.js-style Route Handler / server proxy layer (this is a Vite SPA — there's no server to host one).
- **Finding, not a rewrite:** the backend base URL is exposed to the browser via `VITE_API_URL`. This is expected for a pure SPA and is recorded as-is; introducing a BFF would require a server runtime this project doesn't have.

## Forms & validation — Formik + Yup, wired by hand

- Forms use **Formik** (`useFormik`) with **Yup** schemas from `src/schemas/`. Types are not derived from the schemas (Yup, not Zod) — there's no `InferType` usage yet, so add one if a form needs a typed value.
- `LoginForm.tsx` wires MUI `TextField`s to Formik by hand (`value={formik.values.x}`, `onChange={formik.handleChange}`, `error`/`helperText` from `formik.errors`) — **there is no shared `*Field` wrapper layer**. New forms should follow this same by-hand wiring pattern for consistency (see Findings for the recommendation to centralize it).

## State management

- No global client-state library (no Redux/Zustand/Jotai/Context store). Server state lives in SWR; local/UI state is component-local `useState`/Formik state. New global state needs would be a genuinely new pattern for this repo — flag it rather than silently picking a library.

## Environment

- Env vars are read directly via `import.meta.env.VITE_API_URL` (Vite's raw env access) — **no typed env module**. `.env.example` at the repo root lists the one variable: `VITE_API_URL`.
- Vite's public-prefix rule applies: only `VITE_`-prefixed vars are exposed to client code.

## Auth & routing

- **No session/token handling exists yet.** `LoginForm` posts credentials to `/auth/login` via `apiClient.post` but the response is not read, stored, or used anywhere (no cookie, no localStorage, no auth context).
- **No route protection.** `App.tsx` declares `/` (`UsersPage`) and `/login` (`LoginPage`) as plain, unguarded routes — there is no guard/HOC and no `middleware`-equivalent (Vite SPAs have no server middleware). Anyone can hit `/` without being authenticated.
- Any future auth feature needs to establish this from scratch; do not assume a token/session convention exists to reuse.

## Naming

- Component files: PascalCase matching the exported component (`Card.tsx`, `PageHeader.tsx`, `LoginForm.tsx`, `UsersPage.tsx`).
- Hooks: `useX.ts` camelCase exporting `useX` (`useUsers.ts` → `useUsers`).
- Schemas: `xSchema.ts` camelCase (`userSchema.ts` exporting `loginSchema`).

## Build & scripts

- Scripts (from `package.json`): `dev` → `vite`, `build` → `tsc && vite build`, `preview` → `vite preview`, `lint` → `eslint .`, `test` → `jest`.
- Package manager: unconfirmed (no lockfile in this checkout) — assume npm.

## Findings (recorded, not auto-fixed)

These diverge from the frontend toolkit's greenfield conventions or are gaps in the current
repo. They are recommendations for the user to opt into later — onboarding does not change
any of them:

1. **No BFF / direct backend calls.** Expected for a Vite SPA (no server layer available); noted without alarm, per the toolkit's SPA guidance.
2. **No typed env module.** `import.meta.env.VITE_API_URL` is read directly in `src/api/client.ts`. Only one variable exists today, but there's no central place to add more as the app grows.
3. **No auth/session handling.** Login posts credentials but nothing is done with the response; `/` is unprotected. A real auth feature would need to design token storage and route guarding from scratch.
4. **No shared form-field layer.** `LoginForm` wires Formik + MUI `TextField` by hand. Fine at one form; worth centralizing (`*Field` components) if more forms are added.
5. **Test tooling declared but unused.** `jest` + `@testing-library/react` are dependencies and `test: jest` is a script, but there is no jest config file and no `*.test.*`/`*.spec.*` files anywhere in the repo. `frontend-test-writer` will need to add jest config (e.g. `jest.config.ts` + a `ts-jest`/`babel-jest` transform, since this is a Vite/ESM project) the first time it's invoked.
6. **No import alias.** `tsconfig.json` sets `baseUrl` but no `paths`; all imports are relative. Consistent throughout the repo — recorded as the convention, not a gap.
