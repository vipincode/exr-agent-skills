# Conventions (core)

The canonical conventions for a `nextjs-bootstrap` project, regardless of the chosen token strategy.
This is the substance distilled into the generated `ARCHITECTURE.md`. Read it before filling that
template so the generated doc is concrete, not aspirational.

## Project layout

```
src/
  app/                 App Router routes. Server Components by default.
    api/               BFF Route Handlers — the only code that talks to the backend.
      [...path]/route.ts   catch-all proxy
      auth/login/route.ts  login (applies token strategy)
      auth/refresh/route.ts refresh rotation (if enabled)
    providers.tsx      client providers (QueryClientProvider); wrapped in layout.tsx
    layout.tsx, page.tsx
  components/
    ui/                shadcn primitives (CLI-managed). Never hand-duplicated.
    shared/            generic, domain-agnostic reusables, grouped by purpose:
      form/            RHF *Field components (single definition of field UI)
      typography/      Text, Heading, Label (cva)
      overlay/         Modal (Dialog wrapper, inner content only); future Drawer/Sheet
      layout/          Wrapper, Box, Container, Section, Stack (future)
      data-display/    Card, Chip, Tag, Badge wrappers (future)
  features/<name>/     a self-contained module — fixed anatomy:
    types/ constants/ hooks/ api/ schema/   domain types, constants, hooks, requests, Zod
    components/        components depending ONLY on this module
    template/          full composed screens (login, register, …); page.tsx renders these
    index.ts           module barrel
  hooks/               cross-feature hooks (use-auth, …)
  lib/                 axios, query-client, env, auth/*, utils (cn)
  services/            cross-feature API/query-hook modules
  types/               shared TS types
  proxy.ts             role-based routing (Next 16+; `middleware.ts` on ≤15)
```

A feature is self-contained and **never cross-imports another feature**. It owns its files until a
second feature needs something — then that thing moves to `components/shared`, `lib`, `hooks`, or
`services` **and gets listed in `MODULE_REGISTRY.md`**. Full rules: `module-structure.md`.

## Component placement (strict — prevents duplication)

One home per component, decided by **what it depends on**:

- **`components/ui/`** — shadcn primitives only. Add via `shadcn add`. Never re-implement or fork one.
- **`components/shared/`** — **generic / domain-agnostic** reusables (wrappers, boxes, modal wrappers, cards, chips, tags, badges, form fields, typography), built by composing `ui/`. Grouped into the subfolders above.
- **`features/<name>/components/`** — components that depend on a single feature's domain. Not shared until a second feature needs them, then they **move** to `components/shared` (never copied) and get registered.

Before creating anything: check `MODULE_REGISTRY.md`, then grep `components/shared`, `lib`, `hooks`,
`services`. Import what exists.

## Forms

- `useForm({ resolver: zodResolver(schema) })` inside RHF's `<FormProvider {...form}>`. (Modern
  shadcn has no `<Form>` component — it ships a form-agnostic `Field` primitive instead; the shared
  `*Field` components bind RHF via `useController`.)
- **Every field is a shared `*Field`** (`components/shared/form`). No raw `useController` + input
  wiring in pages.
- Validation messages render via the field's built-in `FieldError`. Don't hand-roll error text.
- Types come from `z.infer<typeof schema>`. No parallel interfaces.

## Data fetching

- TanStack Query v5. One `QueryClient` (`lib/query-client.ts`), provided in `app/providers.tsx`.
- Query/mutation hooks live in `features/<name>/api` or `services/`. Keys are arrays namespaced by
  feature: `["products", "list", params]`.
- All requests use the `api` axios instance → same-origin `/api` (the BFF). Never call the backend's
  absolute URL from the browser.

## Backend connection — BFF only

- Browser → same-origin `/api/...` → Route Handler → backend (`BACKEND_URL`, server env).
- The catch-all proxy attaches the access token (cookie strategies) as a Bearer header.
- The backend URL and tokens never reach client JS.

## Environment

- `lib/env.ts` is the single env definition, built with **T3 Env** (`@t3-oss/env-nextjs`,
  https://env.t3.gg) via `createEnv` (`server` + `client` Zod schemas). It is the only way env is
  read — no raw `process.env` in app code.
- Server-only secrets go in `server` (no `NEXT_PUBLIC_` prefix); T3 Env blocks them from client code.
  Browser values go in `client` (`NEXT_PUBLIC_`-prefixed) and are mirrored in `experimental__runtimeEnv`.

## Naming

- Files: kebab-case (`input-field.tsx`, `use-auth.ts`). Components: PascalCase. Hooks: `useX`.
- Feature folders: kebab-case domain names under `features/`.
- Query keys: arrays starting with the feature name.

## Styling / theming

- Tailwind v4, shadcn defaults. Don't hand-tune the theme/fonts here — a future `font-theme-setup`
  skill owns that. Keep `globals.css` to what `create-next-app` + shadcn generate plus app tokens.

## Build & scripts

- Use the chosen package manager. `build` must pass typecheck + lint. `dev` for local. `start` for prod.

## Git hooks (husky + lint-staged)

The scaffold ships husky (v9+) and lint-staged as devDependencies so every project starts with working pre-commit checks instead of bolting them on later:

- `.husky/pre-commit` contains just `lint-staged` (husky v9 puts `node_modules/.bin` on the hook's PATH; no shebang or `husky.sh` sourcing — those are deprecated).
- `package.json` carries the lint-staged config: `"lint-staged": { "*.{ts,tsx,js,jsx}": "eslint --fix" }` — staged files only, so commits stay fast even as the repo grows.
- `"prepare": "husky || true"` in scripts activates the hooks on first install; the `|| true` keeps installs green where husky can't run (CI, Docker, `--omit=dev`).

If the project dir is not itself the git root (e.g. scaffolded into `frontend/` inside a monorepo), husky refuses to install from the subfolder — that's why `prepare` ends in `|| true`, so installs still succeed. To activate the hooks in that layout, change the prepare script to hop to the git root: `"prepare": "cd .. && husky frontend/.husky || true"` (adjust the path to match), and make the hook `cd frontend && npx lint-staged` (`npx`, because the hook now runs from the git root where `node_modules/.bin` isn't on PATH). When scaffolding into a subfolder, apply this adjusted form instead of the plain `husky` call.
