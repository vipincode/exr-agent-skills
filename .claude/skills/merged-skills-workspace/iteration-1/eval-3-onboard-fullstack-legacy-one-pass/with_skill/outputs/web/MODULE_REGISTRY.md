# Module Registry — dashboard-client

The dedup ledger. **Check here FIRST** before creating any component, hook, schema, util, or
service. If a suitable piece exists, import it — never recreate. Every frontend skill reads
this; the builder skills update it.

> Seeded by `project-onboard` from a read-only scan of the existing code. Paths are relative
> to `web/src/`. Imports are **relative and extensionless** — there is no `@/` alias.

## Primitive layer — MUI 6 (`@mui/material`)

This project has **no `components/ui/` folder and no shadcn**. MUI *is* the primitive layer:
`Button`, `TextField`, `Card`/`CardContent`, `Typography`, `Box`, etc. are imported directly
from `@mui/material` and themed through `theme/theme.ts`.

Do not enumerate MUI's catalogue here, and do **not** install a second primitive library
(shadcn/Radix/Chakra) alongside it. Need a primitive that isn't wrapped yet? Import it from
`@mui/material` at the call site, and promote it to a wrapper in `components/` only when a
second screen needs the same composition.

## Shared components (`src/components/`)

| Name | Path | Wraps | Purpose |
| --- | --- | --- | --- |
| `Card` | `components/Card.tsx` | MUI `Card` + `CardContent` + `Typography` | Titled content card. Props: `{ title: string; children: ReactNode }`. Named export. The generic content container — reuse before wrapping MUI `Card` again. |
| `PageHeader` | `components/PageHeader.tsx` | MUI `Box` + `Typography variant="h4"` | Page title block with bottom margin. Props: `{ title: string }`. Named export. Every page starts with this. |

## Form components (`src/components/forms/`)

Formik + Yup. **There is no shared `*Field` layer** — each form wires MUI `<TextField>` to
`formik.values` / `formik.handleChange` / `formik.errors` by hand. Follow `LoginForm` as the
pattern, and see the findings below.

| Name | Path | Uses | Purpose |
| --- | --- | --- | --- |
| `LoginForm` | `components/forms/LoginForm.tsx` | `useFormik`, `loginSchema`, `apiClient`, MUI `TextField`/`Button` | Email + password sign-in form; `POST /auth/login` via `apiClient` in `onSubmit`. Named export. **Discards the response — no token handling.** |

## Hooks (`src/hooks/`)

| Name | Path | Returns | Purpose |
| --- | --- | --- | --- |
| `useUsers` | `hooks/useUsers.ts` | `{ users?: User[]; error; isLoading }` | SWR read hook, key `"/users"`, shared `fetcher`. **The canonical data-hook shape** — new read hooks mirror it. |
| `User` (interface) | `hooks/useUsers.ts` | `{ id: string; name: string; email: string }` | The shared user type. Exported from the hook file (there is no `types/` folder). Import it from here rather than redeclaring. |

## Schemas (`src/schemas/`)

Yup 1 — **not Zod**. Named `<thing>Schema`, named exports. Types are **not** inferred from
schemas today (they are hand-written interfaces).

| Name | Path | Shape | Purpose |
| --- | --- | --- | --- |
| `loginSchema` | `schemas/userSchema.ts` | `{ email: string().email().required(); password: string().min(8).required() }` | Sign-in validation, consumed by `LoginForm`. Extend this file for other user-domain schemas. |

## API / lib (`src/api/`)

| Name | Path | Purpose |
| --- | --- | --- |
| `apiClient` | `api/client.ts` | **The single axios instance.** `baseURL: import.meta.env.VITE_API_URL` (direct to backend, no BFF). All HTTP — reads and writes — goes through it. Never create a second instance, never use bare `fetch`. No interceptors configured yet. |
| `fetcher` | `api/client.ts` | The SWR fetcher: `(url) => apiClient.get(url).then(r => r.data)`. Pass it to every `useSWR` call. |

## Theme (`src/theme/`)

| Name | Path | Purpose |
| --- | --- | --- |
| `theme` | `theme/theme.ts` | The single MUI `createTheme(...)` (currently `palette.primary.main = "#1976d2"`). Provided by `<ThemeProvider>` in `main.tsx`. **All color/typography/spacing changes go here** — never hardcode hex values in components. |

## App infrastructure

| Name | Path | Purpose |
| --- | --- | --- |
| entry | `main.tsx` | `createRoot` → `<ThemeProvider theme={theme}><BrowserRouter><App /></BrowserRouter></ThemeProvider>`. Add global providers here. `<CssBaseline/>` is **not** mounted. |
| route table | `App.tsx` | `<Routes>` — `/` → `UsersPage`, `/login` → `LoginPage`. Every new screen adds a `<Route>` here. No guards/protected routes. |

## Pages (`src/pages/`)

One file per route, PascalCase, **default** export. Pages compose hooks + components only.

| Page | Path | Route | Composes |
| --- | --- | --- | --- |
| `UsersPage` | `pages/UsersPage.tsx` | `/` | `useUsers`, `PageHeader`, `Card`. Renders `<p>Loading…</p>` while loading; **no error branch**. |
| `LoginPage` | `pages/LoginPage.tsx` | `/login` | `PageHeader`, `LoginForm`. |

## Features

There is **no `src/features/` tree** — this app is type-grouped (see `ARCHITECTURE.md`).
New domain work goes into the existing kind folders (`pages/`, `components/`, `hooks/`,
`schemas/`), not into a parallel feature-module layout.

## Icons

**No icon library is installed** (no lucide-react, no react-icons, no @mui/icons-material)
and no icon registry file exists. If icons become necessary, add **one** library —
`@mui/icons-material` is the natural fit for an MUI app — and register a single re-export
module here rather than importing ad hoc from several sets.

## Known gaps & findings (not auto-fixed)

- **No shared form-field layer.** `LoginForm` wires MUI `TextField` to Formik by hand, and
  the password field has no `error`/`helperText` binding at all, so its validation errors are
  invisible. A `components/forms/FormTextField.tsx` wrapping the Formik binding once is the
  recommended cleanup.
- **Auth is unimplemented.** `LoginForm` posts to `/auth/login` and discards the response —
  no token storage, no axios interceptor, no session/user context, no logout, and no route
  protection on `/`. The backend expects `Authorization: Bearer <token>`.
- **Frontend/backend contract mismatch.** `useUsers` fetches `"/users"` and `LoginForm`
  posts `"/auth/login"`, but the backend (`api/`) only exposes `/api/products` and
  `/health` — no users endpoint and no auth endpoints exist. `VITE_API_URL`
  (`https://api.example.com`) also carries no `/api` prefix.
- **`Card` has an untyped-import gotcha** — `components/Card.tsx` uses `React.ReactNode`
  without importing `React`. It compiles under `jsx: react-jsx` only because of the global
  React UMD type; prefer an explicit `import type { ReactNode } from "react"` in new files.
- **No error UI convention.** `UsersPage` handles `isLoading` but ignores `error`; SWR's
  `error` is returned by the hook and dropped. Establish an error branch when the first real
  screen is built.
- **No `<CssBaseline/>`** and no global stylesheet — MUI's baseline reset is not applied.
- **`npm run lint` will fail** — the script is `eslint .` but no ESLint config is committed.
- **No tests** despite jest + `@testing-library/react` being installed, and jest has no
  TS/JSX transform configured.

## Decisions log

- Stack: **Vite 6 + React 18 + react-router 6 + MUI 6/Emotion + SWR 2 + axios + Formik 2 +
  Yup 1**. Not Next.js / Tailwind / shadcn / TanStack Query / RHF / Zod.
- Paradigm: React function components + hooks; **every component is a client component** —
  no `"use client"` directives.
- Project location: `web/`. Package manager: **npm** (assumed — no lockfile committed).
- Layout: type-grouped (`pages/`, `components/`, `components/forms/`, `hooks/`, `schemas/`,
  `api/`, `theme/`). Relative extensionless imports, no path alias.
- Primitives: MUI. Shared wrappers: `components/`. Theme: `theme/theme.ts`.
- Data: SWR read hooks (`{ users, error, isLoading }` shape) + `apiClient` for writes;
  one axios instance, one `fetcher`.
- Backend connection: direct via `VITE_API_URL` — no BFF (pure SPA).
- Env: raw `import.meta.env`, centralized in `api/client.ts`.
- Planner docs live in `_docs/` at the **repo root**; `ARCHITECTURE.md` and
  `MODULE_REGISTRY.md` live here in `web/`.
