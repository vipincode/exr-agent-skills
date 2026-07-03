# MODULE_REGISTRY.md

Inventory of existing reusable code, seeded by scanning the repo. Check here **before** creating a new component, hook, schema, or util — extend/reuse an existing entry instead of duplicating it.

## UI primitives (`src/components/ui/`)

| Component | File | Notes |
|---|---|---|
| `Button` | `src/components/ui/button.tsx` | `cva` variants: `variant` (`default`, `outline`), `size` (`sm`, `md`). Extend variants here rather than adding a new button component. |
| `Input` | `src/components/ui/input.tsx` | Bare styled `<input>`. Not RHF-aware — use `InputField` (below) in forms. |

## Shared components (`src/components/shared/`)

| Component | File | Notes |
|---|---|---|
| `InputField` | `src/components/shared/form/input-field.tsx` (barrel: `form/index.ts`) | RHF-integrated text field: wraps `ui/Input` with `useController`, renders label + error message. **Every form input should go through this**, not a bare `<Controller>`/`ui/Input` pairing. |
| `Heading` | `src/components/shared/typography/heading.tsx` | `cva` variants: `level` (`h1`, `h2`, `h3`), default `h1`. Renders an `<h2>` DOM element regardless of `level` — be aware when reusing (visual size vs. semantic tag are decoupled). |

## Global hooks (`src/hooks/`)

| Hook | File | Notes |
|---|---|---|
| `useAuth` | `src/hooks/use-auth.ts` | `"use client"`. Currently a stub — `user` state is initialized to `null` and never set; returns `{ user, role }`. No real auth wiring yet; treat as a placeholder contract, not a working implementation. |

## Lib / infra (`src/lib/`)

| Module | File | Notes |
|---|---|---|
| `api` (axios instance) | `src/lib/axios.ts` | `baseURL: "/api"`, `withCredentials: true`. The **only** axios instance in the app — all feature API calls must import this, never create a new `axios.create(...)`. |
| `env` | `src/lib/env.ts` | `@t3-oss/env-nextjs`. Server-only `BACKEND_URL` (Zod `z.url()`). Add new env vars here, not via raw `process.env`. |
| `queryClient` | `src/lib/query-client.ts` | Single `QueryClient`, `defaultOptions.queries.staleTime = 60_000`. Provided app-wide via `src/app/providers.tsx`. Don't instantiate a second `QueryClient`. |
| `cn()` | `src/lib/utils.ts` | `clsx` + `tailwind-merge`. Use for all conditional/merged className logic instead of manual string concatenation. |

## Feature modules (`src/features/`)

### `products` (`src/features/products/`)

Public surface (import via barrel `@/features/products`, not internal paths):

| Export | Kind | File |
|---|---|---|
| `ProductList` | component (`"use client"`) | `components/product-list.tsx` |
| `useProducts` | hook (TanStack Query) | `hooks/use-products.ts` — `queryKey: ["products"]`, calls `fetchProducts` |
| `Product` | type | `types.ts` — `{ id: string; name: string; price: number }` |

Internal (not re-exported, but present — reuse before duplicating):

| Item | Kind | File |
|---|---|---|
| `ProductCard` | component | `components/product-card.tsx` — feature-internal, not in barrel |
| `fetchProducts` | api fn | `api/products.api.ts` — `GET /products`, unwraps `{ data: Product[] }` |
| `productSchema` / `ProductInput` | Zod schema / type | `schema.ts` — `{ name: string (min 1), price: number (positive) }`. Declared but not currently applied to `fetchProducts`' response (see ARCHITECTURE.md gap note). |

No other feature modules exist yet. `products` is the only precedent for feature-module structure and naming.

## Route entry points (`src/app/`)

| Route | File | Renders |
|---|---|---|
| `/` | `src/app/page.tsx` | `<ProductList />` from `@/features/products` |
| `/api/*` (catch-all) | `src/app/api/[...path]/route.ts` | BFF proxy to `env.BACKEND_URL` |

## Not yet present (do not assume these exist)

- No auth feature module, no protected-route pattern beyond the `useAuth` stub.
- No mutation examples (only one `useQuery` hook exists) — no established pattern yet for `useMutation` + optimistic updates/invalidation in this repo; first feature that adds one sets the precedent.
- No test files, no vitest config.
- No additional shared UI beyond `Button`, `Input`, `InputField`, `Heading`.
