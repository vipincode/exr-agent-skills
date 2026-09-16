# Module Registry — {{PROJECT_NAME}}

The dedup ledger. **Check here FIRST** before creating any component, hook, util, type, constant, or
schema. If a suitable piece exists, import it — never recreate; extend rather than fork.

> **This file is a ledger, not a rulebook.** One row per entry: name, path, ≤8-word purpose. The
> *rules* about how these pieces are used live in `ARCHITECTURE.md` — never restate them here, or
> both files grow and drift. Rows stay terse because this file is read on every build.
>
> **Sharding:** past ~250 lines, keep the section headings + row counts here and move the rows into
> `_registry/<section>.md`, linking each heading to its shard. Skills then read this index plus only
> the shard they need. See `.claude/skills/LAYOUT.md`.

## shadcn primitives (src/components/ui/)

CLI-managed (`shadcn add`). Never hand-duplicated or forked.

| Installed |
| --- |
| {{UI_PRIMITIVES}} |

## Shared form fields (src/components/shared/form/)

| Name | Path | Wraps | Purpose |
| --- | --- | --- | --- |
| FieldShell + types | shared/form/field-base.tsx | ui/field | layout shell, cva sizes, `FieldOption` type |
| InputField | shared/form/input-field.tsx | ui/input | text/email/password/number |
| TextareaField | shared/form/textarea-field.tsx | ui/textarea | multi-line text |
| SelectField | shared/form/select-field.tsx | ui/select | single choice from a list |
| MultiSelectField | shared/form/multi-select-field.tsx | ui/popover+command+badge | multiple choices |
| ComboboxField | shared/form/combobox-field.tsx | ui/popover+command | searchable single choice |
| RadioField | shared/form/radio-field.tsx | ui/radio-group | one-of, all options visible |
| CheckboxField | shared/form/checkbox-field.tsx | ui/checkbox | single boolean / opt-in |
| SwitchField | shared/form/switch-field.tsx | ui/switch | boolean toggle |
| DateField | shared/form/date-field.tsx | ui/popover+calendar | date picker |
| UploadFileField | shared/form/upload-file-field.tsx | ui/input(file) | file upload |

Barrel: `components/shared/form/index.ts`.

## Shared typography (src/components/shared/typography/)

| Name | Path | Purpose |
| --- | --- | --- |
| Text | shared/typography/text.tsx | body/inline text — size/tone/weight variants |
| Heading | shared/typography/heading.tsx | section headings — level/size variants |
| Label | shared/typography/label.tsx | field labels — extends ui/label |

Barrel: `components/shared/typography/index.ts`.

## Shared overlay (src/components/shared/overlay/)

| Name | Path | Wraps | Purpose |
| --- | --- | --- | --- |
| Modal | shared/overlay/modal.tsx | ui/dialog | Dialog wrapper; callers pass inner content only |

Barrel: `components/shared/overlay/index.ts`.

## Shared library (src/lib/)

| Name | Path | Purpose |
| --- | --- | --- |
| api (axios instance) | lib/axios.ts | one configured axios, baseURL `/api` |
| queryClient | lib/query-client.ts | single TanStack QueryClient + defaults |
| env | lib/env.ts | T3 Env `createEnv` — typed server/client env |
| cn | lib/utils.ts | className merge (shadcn) |
| getSession / setSession / clearSession | lib/auth/session.ts | httpOnly cookie read/set/clear (server) |
| ROLE_ROUTES / routeForRole | lib/auth/roles.ts | role → dashboard route map |
| token helpers | lib/auth/tokens.ts | storage/transport for the token strategy |

## App infrastructure

| Name | Path | Purpose |
| --- | --- | --- |
| Providers | app/providers.tsx | QueryClientProvider (+ devtools) |
| BFF proxy | app/api/[...path]/route.ts | forwards `/api/*` to the backend |
| login handler | app/api/auth/login/route.ts | logs in, applies token strategy |
| proxy (role routing) | proxy.ts | role-based protection + redirects (`middleware.ts` on ≤15) |

## Hooks (src/hooks/)

| Name | Path | Purpose |
| --- | --- | --- |
| useAuth | hooks/use-auth.ts | current user/role accessor (placeholder) |

## Shared types / constants (src/types/, src/constants/)

| Name | Path | Purpose |
| --- | --- | --- |
| _(none yet)_ | — | created on first use by 2+ features |

## Features (src/features/)

| Feature | Path | Owns | Public surface |
| --- | --- | --- | --- |
| _(none yet)_ | — | — | built by module-planner + module-builder |

## Decisions log

- Project: `{{PROJECT_PATH}}` · PM **{{PACKAGE_MANAGER}}** · BFF proxy · token strategy {{TOKEN_STRATEGY_SHORT}}.
- Roles → routes: {{ROLE_ROUTES}}.
- Theming/fonts: deferred to `font-theme-setup`.
