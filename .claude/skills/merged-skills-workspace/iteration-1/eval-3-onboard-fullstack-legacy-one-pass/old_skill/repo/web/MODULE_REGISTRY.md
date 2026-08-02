# Module Registry — dashboard-client

The dedup ledger. **Check here FIRST** before creating any component, hook, schema, util, or
service. If a suitable piece exists, import it — never recreate. Every frontend skill reads this;
the builder skills update it.

> Seeded by `frontend-onboard` from a read-only scan. Paths are relative to `web/src/`.
> **Imports are relative — there is no `@/` alias.**
>
> This app is **Vite + React 18 + MUI 6 + Emotion + SWR + axios + Formik + Yup**, laid out
> **type-grouped**. The section names below mirror the toolkit's registry shape, but the contents
> are this repo's reality — there is **no `components/ui/` (shadcn), no `components/shared/`
> subtree, no `lib/`, and no `features/`**.

## Primitive layer — MUI 6 (`@mui/material`)

**MUI is the primitive source.** Not CLI-managed and not enumerated file-by-file — import
primitives directly from `@mui/material` (`Button`, `TextField`, `Card`, `CardContent`,
`Typography`, `Box`, …). **Never hand-roll a primitive, never add shadcn/Tailwind alongside it.**

| Layer | Source | Notes |
| --- | --- | --- |
| Primitives | `@mui/material` v6 | styled via Emotion; theme-aware |
| Styling engine | `@emotion/react`, `@emotion/styled` | MUI's `sx`/props are the styling API |
| Icons | **none installed** | no `@mui/icons-material`, no lucide/react-icons, and no icon registry file. First icon need should add **one** library (`@mui/icons-material` is the natural fit) and register it here. |

## Shared components (`src/components/`)

Generic, domain-agnostic, composed from MUI. Named exports, PascalCase filenames.

| Name | Path | Wraps | Purpose |
| --- | --- | --- | --- |
| `Card` | `components/Card.tsx` | MUI `Card` + `CardContent` + `Typography variant="h6"` | Titled content card. Props: `{ title: string; children: React.ReactNode }`. **The shared card — reuse it; do not wrap MUI `Card` again.** |
| `PageHeader` | `components/PageHeader.tsx` | MUI `Box mb={2}` + `Typography variant="h4"` | Screen title header. Props: `{ title: string }`. Used by both pages — **every new page should use it.** |

## Form components (`src/components/forms/`)

| Name | Path | Uses | Purpose |
| --- | --- | --- | --- |
| `LoginForm` | `components/forms/LoginForm.tsx` | `useFormik` + `loginSchema` (Yup) + MUI `TextField`/`Button` + `apiClient` | Email/password sign-in form. Posts `apiClient.post("/auth/login", values)` and **discards the response** (no token handling). Domain-specific (auth), not generic. |

> **There is no shared `*Field` layer.** Fields are MUI `TextField`s wired to Formik by hand
> (`value`/`onChange={formik.handleChange}`/`error`/`helperText`). New forms follow `LoginForm`'s
> pattern — and should remember the `error`/`helperText` props its password field is missing.

## Hooks (`src/hooks/`)

| Name | Path | Purpose |
| --- | --- | --- |
| `useUsers()` | `hooks/useUsers.ts` | SWR data hook — `useSWR<User[]>("/users", fetcher)`, returns `{ users, error, isLoading }`. **The template for every new data hook.** Note: the `/users` endpoint does not exist on `api/`, and the `User[]` type ignores the backend's `{ data, message }` envelope. |
| `User` (interface) | `hooks/useUsers.ts` | `{ id: string; name: string; email: string }` — the only shared domain type in the app; it lives **inside the hook file** (there is no `src/types/`). Import from here rather than redeclaring. |

**No mutation hooks exist.** Writes are inline `apiClient.post(...)` calls inside components.

## Schemas (`src/schemas/`) — Yup

| Name | Path | Shape | Purpose |
| --- | --- | --- | --- |
| `loginSchema` | `schemas/userSchema.ts` | `{ email: string().email().required(), password: string().min(8).required() }` | Formik `validationSchema` for `LoginForm`. **Reuse for any login/credentials form.** Types are **not** inferred from schemas — hand-write interfaces. |

## Shared library / API (`src/api/`)

There is no `src/lib/` — the cross-cutting singletons live in `src/api/client.ts`.

| Name | Path | Purpose |
| --- | --- | --- |
| `apiClient` | `api/client.ts` | **The single axios instance** — `axios.create({ baseURL: import.meta.env.VITE_API_URL })`. Direct-to-backend (no BFF). **All HTTP goes through it**; never call `fetch` or `axios` directly. No interceptors, no auth header, no error normalization. |
| `fetcher` | `api/client.ts` | `(url) => apiClient.get(url).then(r => r.data)` — **the SWR fetcher** every data hook passes to `useSWR`. |

**Absent, do not assume:** `cn`/className util, query client, typed env module, auth/session
helpers, token storage, date/number formatters, constants file, `src/types/`, `src/services/`.

## Theme (`src/theme/`)

| Name | Path | Purpose |
| --- | --- | --- |
| `theme` | `theme/theme.ts` | MUI `createTheme({ palette: { primary: { main: "#1976d2" } } })`. Applied once in `main.tsx` via `<ThemeProvider>`. **The only design-token source** — extend this object (typography/spacing/shape/component overrides) rather than hardcoding colors in components. No `CssBaseline`, no dark mode. |

## App infrastructure

| Name | Path | Purpose |
| --- | --- | --- |
| entry | `main.tsx` | `createRoot(#root)` → `<ThemeProvider theme={theme}>` → `<BrowserRouter>` → `<App />`. **No `SWRConfig`, no ErrorBoundary, no auth provider.** |
| route table | `App.tsx` | `<Routes>`: `/` → `UsersPage`, `/login` → `LoginPage`. **Register every new route here.** No guards, no layout route, no 404 route. |

## Pages (`src/pages/`) — route screens

Default-exported, PascalCase filenames. This is where screens go (there is no `features/` or
`template/` folder).

| Page | Path | Route | Composes | Notes |
| --- | --- | --- | --- | --- |
| `UsersPage` | `pages/UsersPage.tsx` | `/` | `useUsers`, `PageHeader`, `Card` | **The canonical bound-screen example** — imitate its hook → loading-guard → render shape. Renders `<p>Loading…</p>`; ignores `error`. |
| `LoginPage` | `pages/LoginPage.tsx` | `/login` | `PageHeader`, `LoginForm` | Thin composition shell — pages stay thin, logic lives in the form/hook. |

## Features (`src/features/`)

**None — this project does not use feature modules.** The layout is type-grouped; new work is
distributed across `pages/`, `hooks/`, `components/`, `schemas/`, and `api/` as described in
`ARCHITECTURE.md`. **Do not create `src/features/<name>/`.**

## Decisions log

- Seeded by `frontend-onboard` (read-only scan) — no source file was created, edited, or moved.
- Primitives: **MUI 6 + Emotion**. No shadcn, no Tailwind, no `components/ui/`.
- Layout: **type-grouped**; components split only into `components/` and `components/forms/`.
- Data: **SWR** hooks in `hooks/` over the one **axios** instance in `api/client.ts`; keys are
  URL strings. No mutation-hook layer.
- Forms: **Formik `useFormik` + Yup**; MUI fields wired inline, no shared `*Field` layer.
- Backend connection: **direct** via `VITE_API_URL` — no BFF (SPA, no server).
- Imports: **relative, no `@/` alias**.
- No state library, no icon library, no typed env, no auth/session layer, no tests configured.
- Project location: `web/`. Package manager: npm.
