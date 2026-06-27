# Frontend Code Review — `features/products/`

**Scope:** `frontend/src/features/products/` (products list binding)
**Mode:** Read-only static review. No source files modified.
**Contract:** Reviewed against `frontend/ARCHITECTURE.md` + `frontend/MODULE_REGISTRY.md`.

---

## Verdict

**Not production-ready.** The "wired up" list bypasses the project's entire API-binding standard: it `fetch`es the backend directly from a client component using `process.env.BACKEND_URL` — which is both a Critical bug (that env var is `undefined` in the browser, so the request goes to `undefined/products...` and never works) and an architecture violation (it bypasses the BFF the whole stack is built around). On top of that there is no TanStack Query, no Zod validation, no error/loading/empty handling, and `any` typing throughout. The feature also has no `api/ hooks/ types/ schema/` layer — the binding was crammed into the template. This needs to be rebuilt through the standard binding path before merge.

---

## Findings by severity

### Critical

**Critical — `template/products-grid.tsx:11` — Direct backend `fetch` from a client component using `process.env.BACKEND_URL`**
The component is `"use client"`, so it runs in the browser. `process.env.BACKEND_URL` is a server-only variable (only `NEXT_PUBLIC_*` vars are inlined into client bundles), so at runtime this resolves to `fetch("undefined/products?page=1&limit=20")` — the list silently never loads. It also bypasses the BFF proxy that `ARCHITECTURE.md` mandates ("The browser only ever calls same-origin `/api/...`"; "BFF proxy (never direct)"), and references the backend origin from client code. Even if the var were exposed it would break on CORS and leak the backend URL.
*Fix:* Never call the backend directly from the client. Route through the shared axios instance (`lib/axios.ts`, `baseURL: "/api"`), which the catch-all BFF (`app/api/[...path]/route.ts`) already forwards — no new BFF route needed. e.g. `api.get("/products", { params: { page, limit } })` inside a feature `api`/`hooks` module.

### High

**High — `template/products-grid.tsx:9-14` — Server state managed with `useEffect` + `useState` instead of TanStack Query**
`ARCHITECTURE.md` ("Data fetching — TanStack Query v5") requires server state in `useQuery`/`useMutation` hooks living in `features/products/api` or `features/products/hooks`, with array query keys namespaced by feature (`["products", filters]`). The manual effect+state pattern gives no caching, no dedupe, no refetch, and forces hand-rolled loading/error.
*Fix:* Add a `useProductsQuery(filters)` hook using `useQuery({ queryKey: ["products", filters], queryFn })` and consume it in the template.

**High — `template/products-grid.tsx:13` — Response consumed raw as `any`; no envelope unwrap + Zod validation**
`json.data.items` is read untyped (`useState<any[]>`, `p: any`) and trusted blindly. The contract requires types from `z.infer` and that responses be parsed with a Zod schema so backend drift fails loudly instead of rendering garbage. There is no `schema/` or `types/` for the feature at all.
*Fix:* Define a `Product` Zod schema + envelope schema in `features/products/schema`, parse the response (`schema.parse(...)`), and derive types via `z.infer`. Drop all `any`.

**High — `template/products-grid.tsx:9-14` — No error, loading, or empty states**
The `.then` chain has no `.catch`, so a failed request is an unhandled rejection and the user sees a permanently blank grid; there is no pending indicator and an empty result also renders blank with no message. The checklist requires `isPending`/`isError`/empty each handled.
*Fix:* With TanStack Query, render `isPending`, `isError`, and an empty-list state explicitly.

### Medium

**Medium — `features/products/` (whole feature) — Binding logic placed in `template/` instead of the feature module layer**
Per "Feature module anatomy", a bound feature owns `types/ schema/ api/ hooks/`. Here the data access lives inline in `products-grid.tsx`; the registry still lists products as "DESIGN ONLY — no api/hooks/types/schema yet". The template should stay presentational and consume a hook.
*Fix:* Create `features/products/{types,schema,api,hooks}`, move fetching there, and update `MODULE_REGISTRY.md` once bound.

### Low

**Low — `components/product-card.tsx:6` — Raw `<img>` instead of `next/image`**
Minor; misses Next.js image optimization. `alt={name}` is correctly present, so this is not an a11y blocker.

**Low — `template/products-grid.tsx:22` — Price formatting done ad hoc (`` `$${p.price}` ``)**
String-concatenating currency in the template is fragile (no locale/decimals). Prefer formatting in a mapper or a small shared util once the schema defines `price` as a number.

---

## What's good

- The presentational `ProductCard` is clean and correctly kept design-only: it has a real `alt`, and stock status is conveyed by **text** ("In stock"/"Sold out") in addition to color, so it passes the color-only-signal a11y check.
- Uses a stable `p.id` as the list `key` (not array index) — correct reconciliation.
- The shared infra it *should* have used is already in place (`lib/axios.ts` baseURL `/api`, the catch-all BFF, `query-client`), so the correct binding is a small, well-supported change — no new plumbing required.
