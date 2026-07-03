# Architecture — {{PROJECT_NAME}}

> Source of truth for **how this frontend is built**. Every frontend skill
> (`frontend-feature-planner`, `frontend-module-builder`, `frontend-test-writer`,
> `frontend-code-review`, and net-new ones like `font-theme-setup`, `api-binder`, `ux-designer`)
> reads this before writing or reviewing code. Keep it concrete and current — if a convention
> changes, change it here first. Pair it with `MODULE_REGISTRY.md` (the dedup ledger).

## Stack

- **Next.js (App Router)** — `src/` dir, TypeScript strict, import alias `@/*`. `cookies()`/`headers()` are async.
- **React 19** — Server Components by default; interactive/shared pieces are Client Components (`"use client"`).
- **Tailwind CSS v4** — CSS-first config (`@import "tailwindcss"`, `@theme`). Theme/font depth is owned by `font-theme-setup` (future skill), not changed ad hoc.
- **shadcn/ui** — primitives in `src/components/ui/` (CLI-managed, `cva`-based).
- **axios** — one instance, `src/lib/axios.ts`, same-origin `baseURL: "/api"`.
- **Zod 4** — validation (`import * as z from "zod"`, `z.treeifyError()`).
- **T3 Env** (`@t3-oss/env-nextjs`) — the single env definition in `src/lib/env.ts` (`createEnv`); enforces the server/client split. No raw `process.env` in app code.
- **TanStack Query v5** — server-state; one `QueryClient`, hooks per feature/service.
- **React Hook Form 7** + Zod resolver — all forms, always through the shared `*Field` components.

Install **latest**; confirm fast-moving APIs via context7 before generating new code.

## Project layout

```
src/
  app/                 routes (App Router). Server Components unless interactive.
    api/               BFF Route Handlers — the ONLY thing that talks to the backend.
    providers.tsx      QueryClientProvider (+ devtools), client component.
    layout.tsx         wraps children in <Providers>.
  components/
    ui/                shadcn primitives (CLI-managed). NEVER hand-duplicate.
    shared/            generic, domain-agnostic reusables built ON ui/. Grouped by purpose:
      form/            RHF *Field components (the only field UI definition).
      typography/      Text, Heading, Label (cva).
      overlay/         Modal (Dialog wrapper, inner content only); future Drawer/Sheet/ConfirmModal.
      layout/          Wrapper, Box, Container, Section, Stack (future skills).
      data-display/    Card, Chip, Tag, Badge wrappers (future skills).
  features/<name>/     a self-contained module — fixed anatomy below.
    types/             domain types (or types.ts).
    constants/         domain constants/enums/options (or constants.ts).
    hooks/             domain hooks incl. TanStack query/mutation hooks.
    api/               request fns hitting the BFF for this module.
    schema/            Zod schemas for this module (types via z.infer).
    components/        components that depend ONLY on this module.
    template/          full composed screens (login, register, …); page.tsx renders these.
    index.ts           barrel for the module's public surface.
  hooks/               cross-feature hooks (e.g. use-auth).
  lib/                 axios, query-client, env, auth/, cn — cross-cutting singletons/utils.
  services/            cross-feature API/query-hook modules (feature-local ones live in features/<name>/api).
  types/               shared TS types.
  proxy.ts             role-based route protection + redirects (Next 16+; `middleware.ts` on ≤15).
```

A feature folder owns its files and **never cross-imports another feature**; anything used by 2+
features goes to `components/shared`, `lib`, `hooks`, or `services` and **MUST be listed in
`MODULE_REGISTRY.md`**.

## Component placement (the strict rule that prevents duplication)

One home per component, decided by **what it depends on**:

- **`components/ui/`** — shadcn primitives. Added via the CLI, `cva`-based, never hand-edited beyond what the CLI generates, never duplicated. Need a primitive? `shadcn add` it.
- **`components/shared/`** — **generic / domain-agnostic** reusables, built by composing `ui/` primitives: wrappers, boxes, layout containers, modal wrappers (Dialog wrapper taking only inner content), cards, chips, tags, badges, form fields, typography. Grouped into the `form/`/`typography/`/`overlay/`/`layout/`/`data-display/` subfolders. If it doesn't depend on a single feature's domain, it is shared.
- **`features/<name>/components/`** — components that depend on a single feature's domain (its types/hooks/api). They stay here until a *second* feature needs them, then **move** to `components/shared` and get registered — never copied.

The bootstrap ships `overlay/Modal` as the canonical shared example (a Dialog wrapper callers fill
with inner content only). Full rules: see `references/module-structure.md` in the bootstrap skill.

Before creating any component/util/hook/type: **check `MODULE_REGISTRY.md` first**, then grep `components/shared`, `lib`, `hooks`, `services`. If a suitable piece exists, import it — never recreate.

## Forms — React Hook Form + Zod, always via shared fields

- A form is a `useForm({ resolver: zodResolver(schema) })` wrapped in RHF's `<FormProvider>`. Modern
  shadcn has **no** `<Form>` component — it ships a form-library-agnostic `Field` primitive, so the
  shared fields bind RHF themselves via `useController`.
- **Every field is a shared `*Field`** from `components/shared/form` (e.g. `InputField`, `SelectField`, `MultiSelectField`, `RadioField`, `CheckboxField`, `TextareaField`, `SwitchField`, `DateField`, `ComboboxField`, `UploadFileField`). They render through shadcn's `Field`/`FieldLabel`/`FieldDescription`/`FieldError` and the matching `ui` primitive, take `cva` variants, and show validation messages consistently.
- No bare `useController` + raw input wiring in pages. If a needed field type doesn't exist, add it to `components/shared/form` and register it.
- Schemas are Zod; types come from `z.infer` — no parallel interfaces.

## Typography — cva primitives, compose don't duplicate

- `Text`, `Heading`, `Label` live in `components/shared/typography`, built with `cva` (≥3 variants each).
- `Button` and shadcn's `ui/label` already carry their own variants — **extend/compose them, never re-skin or re-implement**. Our `Label` builds on `ui/label`.

## Data fetching — TanStack Query through the BFF

- Server-state via TanStack Query v5. Construct the client once in `lib/query-client.ts`; provide it in `app/providers.tsx`.
- Hooks (`useXQuery`, `useXMutation`) live in `features/<name>/api` or `services/`. Query keys are arrays, namespaced by feature.
- All requests use the `axios` instance (`lib/axios.ts`) → same-origin `/api` → BFF Route Handler → backend.

## Backend connection — BFF proxy (never direct)

- The browser only ever calls **same-origin `/api/...`**. Route Handlers under `app/api/` forward to the backend (`BACKEND_URL`, server-only env).
- This hides the backend URL, keeps tokens out of JS, and gives one place to attach auth.

## Auth & routing

- **Token strategy:** {{TOKEN_STRATEGY}}{{REFRESH_NOTE}}
- **Session:** `lib/auth/session.ts` reads/sets the auth cookies (httpOnly, server-side) for cookie strategies; `lib/auth/tokens.ts` holds the storage/transport details for the chosen strategy.
- **Login:** `app/api/auth/login/route.ts` performs the login against the backend and applies the strategy.
- **Role routing:** `proxy.ts` (Next 16+ name for the old `middleware.ts`) reads the session and redirects by role using the map in `lib/auth/roles.ts`. Default roles → routes: {{ROLE_ROUTES}}. Add a role by adding a map entry — no proxy rewrite.

## Environment

- `lib/env.ts` is the single env definition, built with **T3 Env** (`@t3-oss/env-nextjs`, https://env.t3.gg) via `createEnv` (`server` + `client` schemas, Zod). It is the **only** way env is read — no raw `process.env` in app code.
- Server-only secrets (`BACKEND_URL`, cookie names) go in `server` with **no** `NEXT_PUBLIC_` prefix; T3 Env throws if they're touched from client code. Browser-exposed values go in `client`, are `NEXT_PUBLIC_`-prefixed, and are mirrored in `experimental__runtimeEnv` (Next.js inlines them at build).
- `.env.example` lists every variable. Copy to `.env.local` to run.

## Naming

- Component files: kebab-case (`input-field.tsx`); the exported component is PascalCase (`InputField`).
- Hooks: `use-*.ts` exporting `useX`. Query keys: `["feature", ...]`.
- Feature folders: kebab-case domain name under `features/`.

## Build & scripts

- Package manager: **{{PACKAGE_MANAGER}}**. Common scripts: `{{PM}} run dev`, `{{PM}} run build`, `{{PM}} run start`, `{{PM}} run lint`.
- `build` must pass typecheck + lint. CI runs `build`.
- Git hooks: husky (v9) + lint-staged, installed via the `prepare` script on
  `{{PM}} install`. `.husky/pre-commit` runs `lint-staged` → `eslint --fix` on
  staged `*.ts`/`*.tsx`/`*.js`/`*.jsx` (config in `package.json` under `"lint-staged"`).

## Decisions log

- Stack: Next.js App Router + TS + Tailwind v4 + shadcn/ui + axios + Zod 4 + T3 Env + TanStack Query v5 + RHF 7.
- Project location: `{{PROJECT_PATH}}`. Package manager: **{{PACKAGE_MANAGER}}**.
- Backend connection: BFF proxy (`app/api/` → backend). Token strategy: {{TOKEN_STRATEGY_SHORT}}.
- Roles → routes: {{ROLE_ROUTES}}.
- Theming/fonts: deferred to a future `font-theme-setup` skill (shadcn defaults for now).
