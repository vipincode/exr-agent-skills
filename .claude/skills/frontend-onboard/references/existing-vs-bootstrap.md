# Mapping existing frontend patterns into the contract (descriptive, not prescriptive)

The contract must describe what the frontend *does*. If it instead prescribes `nextjs-bootstrap`'s fixed stack, `frontend-module-builder` will generate code that clashes with the surrounding codebase. Below: how to faithfully record common existing patterns, and how the other frontend skills then adapt because they are contract-driven.

## The governing rule
Record reality + the user's Step 2 decisions. Never silently "upgrade" the repo's conventions into the contract. If something is genuinely worth changing (Pages Router → App Router, direct backend calls → BFF, raw `process.env` → typed env, ad-hoc forms → shared field layer), raise it as a **finding/recommendation** in the report — do not bake the change into the contract unless the user opts in.

The bootstrap's stack — Next.js App Router + Tailwind v4 + shadcn/ui + axios + Zod 4 + T3 Env + TanStack Query v5 + React Hook Form — is the *target greenfield* stack, not a requirement to impose on an existing app. Onboarding's job is to capture the existing app accurately so the toolkit works *with* it.

## Framework & router
- **Next.js App Router** (`app/`): record Server Components default + `"use client"` for interactive, Route Handlers as the BFF, async `cookies()`/`headers()`. Closest to the bootstrap.
- **Next.js Pages Router** (`pages/`): record `pages/` routing, `getServerSideProps`/`getStaticProps`, `_app`/`_document`, API routes under `pages/api`. The builder writes Pages-style code; don't tell it to use App Router.
- **Vite / CRA / plain React SPA**: no server layer — record client-side routing (`react-router`), where the app mounts, and that data fetching is fully client-side. There's no BFF; the app talks to the backend via an env'd base URL (flag "no BFF" only as a finding, since an SPA has no server to host one).
- **Remix / React Router (framework)**: record loaders/actions as the data layer.

## Styling & component library
- **Tailwind**: record v3 (`tailwind.config.js` + `@tailwind` directives) vs v4 (CSS-first `@theme`). The builder writes utilities the same way the repo does.
- **CSS Modules / styled-components / Emotion / Sass**: record it; the builder styles new components that way, not with Tailwind.
- **shadcn/ui**: record `components/ui/` as the CLI-managed primitive layer and **list the installed primitives** as registry rows — the builder composes them and `shadcn add`s more.
- **MUI / Chakra / Ant / Mantine**: record the library as the primitive source; the builder composes its components and follows its theming. Do **not** introduce shadcn/Tailwind alongside it.
- **None / bespoke**: record the hand-rolled primitives that exist and treat them as the shared layer.

## Data fetching & HTTP
- **TanStack Query**: record the query client location, query-key convention, and hook placement. Matches the bootstrap.
- **SWR**: record `useSWR` keys/fetcher; the builder writes SWR hooks, not Query hooks.
- **RTK Query / Redux**: record the API slice + endpoints pattern; new data access goes through slices.
- **Apollo / urql (GraphQL)**: record the client + generated-types/codegen setup; the builder writes GraphQL operations, not REST calls.
- **Raw `fetch`/`useEffect`**: record the pattern as-is; recommend (as a finding) centralizing into a hook layer, but don't force a library.
- **HTTP instance**: one configured `axios` instance → register it (path) and the builder reuses it. Scattered `fetch` with no base instance → record that, recommend a shared client as a finding.

## Backend connection
- **BFF proxy** (Next Route Handlers / a server proxy): record the proxy route and that the browser calls same-origin `/api`. Matches the bootstrap.
- **Direct to backend**: record the real base-URL env (`NEXT_PUBLIC_API_URL`, `VITE_API_URL`) and that the browser calls the backend directly. Flag "no BFF — backend URL/tokens exposed to the browser" as a **finding** for Next apps; for pure SPAs it's expected, so note it without alarm.

## Forms & validation
- **React Hook Form + Zod**: record it; if a shared `*Field` layer exists, register every field. If forms wire `<Controller>` + raw inputs ad hoc, record that and recommend a shared field layer as a finding.
- **Formik + Yup**: record Formik form pattern + Yup schemas; the builder writes Formik forms. Don't switch to RHF/Zod.
- **Manual / uncontrolled**: record it; recommend a form lib as a finding.
- **Validation**: register the existing schema layer (Zod/Yup) and whether types derive from it. The builder reuses these schemas.

## State management
- **Redux/RTK, Zustand, Jotai, Context**: record which, where the store/atoms live, and the access pattern. New global state follows it. Server-state-only (Query/SWR) → record that there's no client store.

## Env
- **Typed env (T3 Env / config module)**: record the module and that new vars go through it. Matches the bootstrap.
- **Raw `process.env` / `import.meta.env`**: record it (and the framework's public-prefix rule — `NEXT_PUBLIC_`/`VITE_`); recommend centralizing into a typed module as a finding.

## Auth & routing
- **httpOnly cookies + middleware/proxy**: record the session helpers and the route-protection file; register the role→route map. Matches the bootstrap.
- **NextAuth/Auth.js, Clerk, Auth0**: record the provider and its session hook/helpers; new auth-aware code uses them.
- **localStorage token + interceptor**: record it (note the security tradeoff as a finding), and register the interceptor/guard.
- **Per-page guards / HOC**: record the guard pattern so new protected pages follow it.

## What goes in the registry vs the report
- **Registry**: every reusable thing that EXISTS and should be reused (ui primitives / library, shared components, form fields, hooks, schemas, types, lib utils, HTTP instance, query client, env module, auth helpers, feature module surfaces).
- **Report (findings)**: things that diverge from the toolkit's conventions or are duplicated and might warrant cleanup (duplicate buttons/cards, no BFF on a Next app, ad-hoc forms with no shared field, scattered `process.env`, raw `fetch` everywhere, Pages Router on an EOL Next). These are recommendations the user can act on later — onboarding never changes them automatically.
