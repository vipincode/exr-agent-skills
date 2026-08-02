# Module Registry — {{PROJECT_NAME}}

The dedup ledger. **Check here FIRST** before creating any component, hook, util, type, or service.
If a suitable piece exists, import it — never recreate. Every frontend skill reads this; the builder
skills update it.

## shadcn primitives (src/components/ui/)

CLI-managed. Never hand-duplicate; `shadcn add` more as needed and list them here.

| Installed | Notes |
| --- | --- |
| {{UI_PRIMITIVES}} | added via shadcn CLI at bootstrap |

## Shared form fields (src/components/shared/form/)

All render through shadcn's `Field` primitive + the matching `ui` primitive, bound to React Hook Form
via `useController`, with `cva` variants. **Every form field must use one of these** — no bare
`useController` wiring. The shared `FieldShell` (in `field-base.tsx`) is the one place the
label/description/error layout lives.

| Name | Path | Wraps | Purpose |
| --- | --- | --- | --- |
| FieldShell + types | components/shared/form/field-base.tsx | ui/field | shared layout shell, `cva` size variants, `FieldOption` type |
| InputField | components/shared/form/input-field.tsx | ui/input | text/email/password/number input |
| TextareaField | components/shared/form/textarea-field.tsx | ui/textarea | multi-line text |
| SelectField | components/shared/form/select-field.tsx | ui/select | single choice from a list |
| MultiSelectField | components/shared/form/multi-select-field.tsx | ui/popover+command+badge | multiple choices |
| ComboboxField | components/shared/form/combobox-field.tsx | ui/popover+command | searchable single choice |
| RadioField | components/shared/form/radio-field.tsx | ui/radio-group | one-of, all options visible |
| CheckboxField | components/shared/form/checkbox-field.tsx | ui/checkbox | single boolean / opt-in |
| SwitchField | components/shared/form/switch-field.tsx | ui/switch | boolean toggle |
| DateField | components/shared/form/date-field.tsx | ui/popover+calendar | date picker |
| UploadFileField | components/shared/form/upload-file-field.tsx | ui/input(file) | file upload |

Barrel: `components/shared/form/index.ts`.

## Shared typography (src/components/shared/typography/)

`cva`-based, ≥3 variants each. Compose shadcn where it exists; don't duplicate `Button`/`ui/label`.

| Name | Path | Purpose |
| --- | --- | --- |
| Text | components/shared/typography/text.tsx | body/paragraph/inline text, variants (size/tone/weight) |
| Heading | components/shared/typography/heading.tsx | section headings, variants (level/size) |
| Label | components/shared/typography/label.tsx | form/field labels, extends ui/label with variants |

Barrel: `components/shared/typography/index.ts`.

## Shared overlay (src/components/shared/overlay/)

Generic, domain-agnostic overlay wrappers built on shadcn primitives. Feature code composes these —
it never re-wires the underlying Dialog/Sheet primitive. Add new wrappers (Drawer, Sheet,
ConfirmModal) here and register them.

| Name | Path | Wraps | Purpose |
| --- | --- | --- | --- |
| Modal | components/shared/overlay/modal.tsx | ui/dialog | Dialog wrapper; callers pass only inner content (+ optional title/description/footer/trigger) |

Barrel: `components/shared/overlay/index.ts`.

## Shared library (src/lib/)

| Name | Path | Purpose |
| --- | --- | --- |
| api (axios instance) | lib/axios.ts | one configured axios, baseURL `/api` (same-origin BFF) |
| queryClient | lib/query-client.ts | single TanStack QueryClient + defaults |
| env | lib/env.ts | T3 Env (`@t3-oss/env-nextjs`) `createEnv` — single typed env, server/client split |
| cn | lib/utils.ts | className merge (shadcn) |
| getSession / setSession / clearSession | lib/auth/session.ts | httpOnly cookie read/set/clear (server) |
| ROLE_ROUTES / routeForRole | lib/auth/roles.ts | role → dashboard route map (extensible) |
| token helpers | lib/auth/tokens.ts | storage/transport for the chosen token strategy |

## App infrastructure

| Name | Path | Purpose |
| --- | --- | --- |
| Providers | app/providers.tsx | QueryClientProvider (+ devtools) |
| BFF proxy | app/api/[...path]/route.ts | forwards browser `/api/*` calls to the backend |
| login handler | app/api/auth/login/route.ts | logs in, applies token strategy |
| proxy (role routing) | proxy.ts | role-based route protection + redirects (Next 16+; `middleware.ts` on ≤15) |

## Hooks (src/hooks/)

| Name | Path | Purpose |
| --- | --- | --- |
| useAuth | hooks/use-auth.ts | current user/role accessor (placeholder; later skills extend) |

## Features (src/features/)

Each feature is a self-contained module under `features/<name>/` with a fixed anatomy: `types/`,
`constants/`, `hooks/`, `api/`, `schema/`, `components/` (feature-only components), `template/` (full
composed screens like login/register), and an `index.ts` barrel. A feature never cross-imports another
feature; shared needs move to `components/shared`/`lib`/`hooks`/`services` and get registered above.

| Feature | Path | Owns | Notes |
| --- | --- | --- | --- |
| _(none yet)_ | — | — | Feature modules are built by module-planner + module-builder |

> **No real feature modules exist yet.** Auth screens, dashboards, and CRUD are features for
> `module-planner` + `module-builder` (and the design builders). The bootstrap ships only infrastructure + shared components + a
> routing skeleton.

## Decisions log

- Stack: Next.js App Router + TS + Tailwind v4 + shadcn/ui + axios + Zod 4 + TanStack Query v5 + RHF 7.
- Paradigm: React function components + hooks; Server Components by default, `"use client"` for interactive.
- Project location: `{{PROJECT_PATH}}`. Package manager: **{{PACKAGE_MANAGER}}**.
- Backend connection: BFF proxy. Token strategy: {{TOKEN_STRATEGY_SHORT}}.
- Roles → routes: {{ROLE_ROUTES}}.
- Forms: RHF + Zod via shared `*Field` only. Typography: cva primitives, compose shadcn.
- Components: generic → `components/shared` (form/typography/overlay/layout/data-display); domain-specific → `features/<name>/components`. Env: T3 Env (`lib/env.ts`) only.
- Theming/fonts: deferred to `font-theme-setup`.
