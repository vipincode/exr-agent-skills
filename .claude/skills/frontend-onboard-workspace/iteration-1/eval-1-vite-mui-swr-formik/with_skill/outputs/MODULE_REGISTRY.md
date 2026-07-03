# Module Registry — dashboard-client

The dedup ledger. **Check here FIRST** before creating any component, hook, util, type, or
schema. If a suitable piece exists, import it — never recreate. Every frontend skill reads
this; the builder skills update it. Seeded by `frontend-onboard` from a full scan of the
existing repo (see `ARCHITECTURE.md` for the narrative conventions).

## Component library / primitive source

No local `components/ui/` primitive layer — **MUI (`@mui/material`) is the primitive
source**. Compose MUI components directly (`TextField`, `Button`, `Typography`, `Box`,
`Card`, etc.); do not introduce shadcn or Tailwind alongside it. Theme: `src/theme/theme.ts`
(`createTheme`), provided via `<ThemeProvider>` in `src/main.tsx`.

| Installed | Notes |
| --- | --- |
| @mui/material v6 | primitive source — Card, CardContent, Typography, Box, TextField, Button, etc. |
| @emotion/react, @emotion/styled | MUI's styling engine (peer deps) |

## Shared components (src/components/)

Generic, domain-agnostic components at the top level of `components/`. No `ui/` vs
`shared/` split exists in this repo (that's a shadcn convention) — these ARE the shared
layer.

| Name | Path | Wraps | Purpose |
| --- | --- | --- | --- |
| Card | src/components/Card.tsx | MUI Card/CardContent/Typography | generic titled card wrapper — `{ title, children }` |
| PageHeader | src/components/PageHeader.tsx | MUI Typography/Box | page title header — `{ title }` |

## Forms (src/components/forms/)

No shared `*Field` wrapper layer exists — each form wires MUI inputs to Formik by hand
(see ARCHITECTURE.md Findings). Registered here as the existing pattern to follow, not as
a reusable field library.

| Name | Path | Form lib | Purpose |
| --- | --- | --- | --- |
| LoginForm | src/components/forms/LoginForm.tsx | Formik + Yup (`loginSchema`) | email/password login form, posts to `/auth/login` via `apiClient` |

## Schemas (src/schemas/)

Yup schemas. Types are not currently derived from them (no `yup.InferType` usage yet).

| Name | Path | Purpose |
| --- | --- | --- |
| loginSchema | src/schemas/userSchema.ts | validates `{ email, password }` for LoginForm |

## Hooks (src/hooks/)

SWR-based data hooks. Also currently the only place the `User` type is defined.

| Name | Path | Purpose |
| --- | --- | --- |
| useUsers | src/hooks/useUsers.ts | SWR hook for `/users` list; returns `{ users, error, isLoading }`; also exports the `User` interface |

## Lib (src/api/, src/theme/)

| Name | Path | Purpose |
| --- | --- | --- |
| apiClient | src/api/client.ts | the one configured axios instance, `baseURL: import.meta.env.VITE_API_URL` (direct-to-backend, no BFF) |
| fetcher | src/api/client.ts | `(url) => apiClient.get(url).then(r => r.data)` — the shared SWR fetcher, reused by every SWR hook |
| theme | src/theme/theme.ts | MUI `createTheme` instance, provided app-wide in `main.tsx` |

## Pages (src/pages/)

Route targets, composed from the shared components + hooks above. Not a "feature module" in
the toolkit's `features/<name>/` sense — this repo is type-grouped, so a page just imports
what it needs from the top-level folders.

| Page | Path | Route | Composes |
| --- | --- | --- | --- |
| UsersPage | src/pages/UsersPage.tsx | `/` | useUsers, Card, PageHeader |
| LoginPage | src/pages/LoginPage.tsx | `/login` | LoginForm, PageHeader |

## App infrastructure

| Name | Path | Purpose |
| --- | --- | --- |
| App (route table) | src/App.tsx | `<Routes>`/`<Route>` — currently `/` → UsersPage, `/login` → LoginPage. No route guards. |
| entry | src/main.tsx | mounts `<ThemeProvider><BrowserRouter><App /></BrowserRouter></ThemeProvider>` |

## Features

No `features/<name>/` tree exists in this repo — see ARCHITECTURE.md's "Project layout"
section. Do not create one implicitly; the type-grouped layout (`components/`, `hooks/`,
`schemas/`, `pages/`) is the recorded convention. If the user explicitly wants to migrate to
a feature-module layout, that's a separate, opt-in restructure.

## Decisions log

- Stack: Vite 6 + React 18 + TypeScript (strict, no import alias) + react-router-dom v6.
- Styling/components: MUI v6 (`@mui/material` + emotion) — no shadcn/Tailwind.
- Data fetching: SWR v2 through the one axios instance in `src/api/client.ts` — no TanStack Query.
- Backend connection: direct (`VITE_API_URL`), no BFF — expected for this Vite SPA.
- Forms: Formik 2 + Yup 1, wired by hand (no shared `*Field` layer).
- State: no global client-state library; server state via SWR only.
- Layout paradigm: type-grouped (`components/`, `hooks/`, `schemas/`, `pages/`, `theme/`, `api/`) — not feature-module.
- Env: raw `import.meta.env` reads, no typed env module.
- Auth: not implemented yet (no token/session handling, no route guards) — a genuine gap, not a convention to copy.
- Tests: jest + RTL declared but unconfigured — no config file, no test files yet.
- Project location: repo root (`.`). Package manager: unconfirmed (no lockfile present) — assume npm.
