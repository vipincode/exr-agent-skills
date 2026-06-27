# RUN_NOTES — Products pagination strategy (without_skill)

## Task
Plan how the frontend should paginate the products list (page vs infinite scroll, query keys,
caching, loading states), grounded in how the real products API works. Planning only — no
binding code.

## Approach
1. Read `.claude/workspace.json` to confirm the monorepo layout (backend express-ts, frontend nextjs).
2. Read the **backend** products module as ground truth rather than guessing the contract:
   - `products.routes.ts`, `products.schema.ts`, `products.service.ts`, `products.controller.ts`
   - `lib/app-response.ts` + backend `ARCHITECTURE.md` for the response envelope and error shape.
3. Read the **frontend** conventions to fit the plan to the project:
   - `ARCHITECTURE.md` (TanStack Query v5, BFF catch-all, query-key convention, feature anatomy)
   - `MODULE_REGISTRY.md` (axios instance, query client; products feature is DESIGN-ONLY, not bound)
   - `lib/axios.ts`, `app/api/[...path]/route.ts`, `features/products/template/products-grid.tsx`,
     `features/products/components/product-card.tsx`.

## Key findings about the API (the facts that drive the plan)
- `GET /api/products?page&limit&search&category` — public, reachable via the existing BFF
  catch-all + axios `baseURL: "/api"`; **no new BFF route required**.
- **Offset-based** pagination (`skip((page-1)*limit).limit(limit)`) that also returns **`total`**.
- Defaults: `page=1`, `limit=20` (max `100`). Envelope:
  `{ success, message, data: { items, total, page, limit } }`.
- `price` is integer **cents** + `currency`; card expects a preformatted string → format at the
  binding boundary.

## Conclusions
- The presence of `total` + offset paging means the API natively supports **both** numbered pages
  and infinite scroll. Recommendation: **numbered page pagination as the default** (page count is
  knowable, `?page=` is shareable/reload-safe, fits the fixed grid), with **infinite scroll as a
  ready opt-in** via `useInfiniteQuery` (`getNextPageParam` uses `total` to stop cleanly).
- **Query keys:** `["products","list",filters]` with `page` *in* the key for the page variant;
  `["products","infinite",filters]` with `page` as `pageParam` (not in the key) for infinite.
- **Caching:** `staleTime ~30s`, per-page cache entries, `keepPreviousData` (v5) for flash-free
  paging, prefetch next page; invalidate `["products"]` on admin create.
- **Loading states:** skeleton grid on first load, kept content during background refetch, disabled
  pager / sentinel spinner while paging, plus explicit empty and error+retry states.

## Output
- `PAGINATION_PLAN_products.md` — the full strategy (decision, types/schema, query keys, shared
  api fn, both hooks, caching, per-state loading table, URL ownership, implied file layout).
- No application code was written or modified.
