# Architecture — demo-web (frontend)

## Stack
Next.js App Router + TS + Tailwind v4 + shadcn/ui + axios + Zod 4 + TanStack Query v5 + RHF 7.
Types come from `z.infer` — no parallel interfaces.

## Backend connection — BFF proxy (never direct)
The browser only ever calls same-origin `/api/...`. The catch-all `src/app/api/[...path]/route.ts`
forwards every `/api/*` call to the backend (`BACKEND_URL`). axios instance: `src/lib/axios.ts`,
`baseURL: "/api"`. So a feature usually needs NO new BFF route — the catch-all covers it.

## Data fetching — TanStack Query v5
One QueryClient (`lib/query-client.ts`), provided in `app/providers.tsx`. Hooks (`useXQuery`,
`useXMutation`) live in `features/<name>/api` or `features/<name>/hooks`. Query keys are arrays,
namespaced by feature: `["products", filters]`.

## Forms — RHF + Zod via shared *Field only
Every field is a shared `*Field` from `components/shared/form`. Schemas are Zod; no bare useController.

## Feature module anatomy
`features/<name>/` owns: `types/ schema/ api/ hooks/ components/ template/ index.ts`. A feature never
cross-imports another feature. Generic pieces → `components/shared`; domain → `features/<name>/components`.
