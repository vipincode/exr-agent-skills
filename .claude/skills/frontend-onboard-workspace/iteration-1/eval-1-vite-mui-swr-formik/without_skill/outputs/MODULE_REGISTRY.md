# Module Registry

Seeded inventory of existing reusable code, generated during onboarding. Check here BEFORE creating a new component, hook, schema, or API helper — extend or reuse an existing entry instead of duplicating it. Update this file whenever new reusable code is added.

## Shared / Generic Components (`src/components/`)

| Name | Path | Purpose | Notes |
|---|---|---|---|
| `Card` | `src/components/Card.tsx` | Generic titled content card, thin wrapper around MUI `Card`/`CardContent`/`Typography` | Props: `title: string`, `children: ReactNode`. Reuse for any "titled box" UI instead of wrapping MUI `Card` again. |
| `PageHeader` | `src/components/PageHeader.tsx` | Page title banner (MUI `Typography` variant `h4` in a `Box`) | Props: `title: string`. Use at the top of every page component. |

## Feature / Domain Components

| Name | Path | Purpose | Notes |
|---|---|---|---|
| `LoginForm` | `src/components/forms/LoginForm.tsx` | Login form: Formik + `loginSchema` (yup) + posts to `/auth/login` via `apiClient` | Domain-specific auth component. Pattern to copy for new forms: `useFormik` + a matching `src/schemas/<name>Schema.ts` + manual MUI field wiring. |

## Hooks (`src/hooks/`)

| Name | Path | Purpose | Notes |
|---|---|---|---|
| `useUsers` | `src/hooks/useUsers.ts` | SWR-backed fetch of `/users`; returns `{ users, error, isLoading }` | Also exports the `User` interface (`id`, `name`, `email`) inline — this is the only place that type currently lives. Follow this file's shape for new resource hooks (one hook per resource, `useSWR` + shared `fetcher`). |

## Schemas (`src/schemas/`)

| Name | Path | Purpose | Notes |
|---|---|---|---|
| `loginSchema` | `src/schemas/userSchema.ts` | Yup validation for login form (`email`, `password` min 8) | Validation library is **yup**, not zod — do not introduce zod into this app. |

## API / Lib Utilities (`src/api/`)

| Name | Path | Purpose | Notes |
|---|---|---|---|
| `apiClient` | `src/api/client.ts` | Shared axios instance, `baseURL` = `VITE_API_URL` | Single source of truth for the HTTP client — reuse this instance, do not create additional `axios.create(...)` calls. |
| `fetcher` | `src/api/client.ts` | `(url) => apiClient.get(url).then(r => r.data)` — SWR fetcher | Pass to every new `useSWR` call needing a plain GET. |

## Theme (`src/theme/`)

| Name | Path | Purpose | Notes |
|---|---|---|---|
| `theme` | `src/theme/theme.ts` | MUI theme object (currently only `palette.primary.main`) applied via `ThemeProvider` in `src/main.tsx` | Extend this object for new theme tokens rather than applying ad-hoc inline styles/colors. |

## Pages (`src/pages/`)

| Name | Path | Purpose | Notes |
|---|---|---|---|
| `LoginPage` | `src/pages/LoginPage.tsx` | Route `/login`; composes `PageHeader` + `LoginForm` | |
| `UsersPage` | `src/pages/UsersPage.tsx` | Route `/`; composes `PageHeader` + `Card` list from `useUsers` | |

## Explicitly Absent (do not assume these exist)

- No `components/ui/` (shadcn) — this app is MUI-based, not shadcn.
- No `features/<name>/` module folders — structure is flat (`components/`, `hooks/`, `pages/`, `schemas/`).
- No shared `types/` directory — types are inline per hook (see `useUsers.ts`).
- No BFF/API-route proxy layer (`app/api/...`) — this is a Vite SPA calling the backend directly.
- No TanStack Query, no React Hook Form, no Zod — this app uses SWR, Formik, and Yup respectively; do not mix in the other libraries.
- No barrel/`index.ts` re-export files anywhere under `src/`.
