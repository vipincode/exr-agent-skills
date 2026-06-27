# Feature plan: products list pagination (API binding)

> Status: draft — edit freely, then hand to frontend-module-builder. Add/remove any section.

## Overview
Bind the existing `products` design (`features/products/template/products-grid.tsx` + `components/product-card.tsx`, currently rendering hardcoded `SAMPLE` data) to the real `GET /api/products` list endpoint, and define the **pagination strategy**: page model, TanStack Query keys, caching, and loading/empty/error/end states. Planning only — no binding code here.

## API contract (observed)
> Source: monorepo backend source — `backend/src/modules/products/` (routes → controller → service → schema → model) + `backend/ARCHITECTURE.md` for the envelope. Mounted at `/api/products` (`backend/src/app.ts`).

**Success envelope:** `{ success: true, data: <shape>, message: string }` (helper `ok()` in `backend/src/lib/app-response.ts`, status 200)
**Error envelope:** `{ success: false, message: string, code: string }` — `NotFoundError→404`, `ConflictError→409`, `UnauthorizedError→401`, `ValidationError→422`.

| Method | Path | Auth | Request (query) | Response `data` shape |
|--------|------|------|-----------------|-----------------------|
| GET | /api/products | public | `page` (int ≥1, default 1), `limit` (int 1–100, default 20), `search?` (string), `category?` (string) | `{ items: Product[], total: number, page: number, limit: number }` |
| GET | /api/products/:id | public | params: `id` (24-hex ObjectId) | `Product` (out of scope for this plan) |
| POST | /api/products | admin | body: name, price, … | `Product` (out of scope) |

`Product` (DTO from `products.service.ts`) =
`{ id: string, name: string, slug: string, price: number /* cents */, currency: string /* ISO-4217, e.g. "USD" */, category: string, inStock: boolean, imageUrl?: string }`

### Pagination mechanism — OBSERVED (this is the anchor)
- **Offset / page-based.** The service runs `Product.find(filter).skip((page - 1) * limit).limit(limit)` (`products.service.ts:22`). There is **no cursor**, no `nextCursor`/`before`/`after`, no `Link` header.
- **Page is 1-indexed.** `page` defaults to 1, `limit` defaults to 20, `limit` is capped at 100 (`products.schema.ts`). Out-of-range / non-numeric query → 422 (Zod `validate`).
- **Meta returned:** `total` (full `countDocuments(filter)` for the active filter), plus the echoed `page` and `limit`. **`total` is the key fact** — it lets the client compute `totalPages = Math.ceil(total / limit)` and detect the last page, so both classic numbered pagination and "has more" for infinite scroll are derivable without a cursor.
- **Filtering is server-side and narrows `total`:** `search` → case-insensitive regex on `name`; `category` → exact match. So a filtered query returns its own `total`, and any filter change must reset `page` to 1.

## Decisions
- **Page model = offset/page-based (server only supports this).** Cursor pagination is NOT an option — the backend exposes no cursor. Stated as a fact, not a question.
- **Recommended UX = classic paged (numbered / prev-next) as the primary build.** _Why:_ the endpoint returns `total`, which makes a deterministic page count, "Page X of N", and jump-to-page trivial; offset paging is also more robust here than infinite scroll because skip/limit over a changing collection can duplicate or skip rows across appended pages, and a paged grid keeps each page a stable, independently-cached unit. Default page size = 20 (matches backend default).
- **Infinite scroll is fully supported by the same contract** (via `useInfiniteQuery` with a page-number `pageParam`) and is spec'd below as the documented alternative — see Open questions; flip the hook if product prefers it.
- _Assumption_: this binds the **existing** `products` route/screen (`ProductsGrid`), not a new page. The grid stays a grid; we add a pager control beneath it.
- _Assumption_: `price` is in **cents** (per model comment) — format to currency in the card; the design currently passes a pre-formatted `"$24.00"` string, so the card's prop type changes from `price: string` to `price: number` (+ `currency`) with formatting at the binding layer.
- _Assumption_: search/category filter UI is **out of scope** for this pagination plan, but the query key + hook are shaped to accept `search`/`category` so adding filters later doesn't change the cache contract.

## Reuse (do NOT recreate)
| What | Path | How it's used here |
|------|------|--------------------|
| axios instance | `src/lib/axios.ts` | all request fns go through it (`baseURL: "/api"`) |
| BFF proxy (catch-all) | `src/app/api/[...path]/route.ts` | already forwards `/api/products` → backend; **no new BFF route needed** |
| query client | `src/lib/query-client.ts` | single client, provided in `app/providers.tsx` |
| ProductCard | `src/features/products/components/product-card.tsx` | renders each `item`; prop type adjusted to `price: number` + `currency` |
| ProductsGrid | `src/features/products/template/products-grid.tsx` | swaps `SAMPLE` for live data + adds pager / loading / empty / error states |
| useAuth | `src/hooks/use-auth.ts` | not needed for the public list (would gate admin create only) |

## Types & schema
- `src/features/products/types/products.ts` — `Product` (mirror the DTO exactly: `id, name, slug, price, currency, category, inStock, imageUrl?`) and `ProductListResponse = { items: Product[]; total: number; page: number; limit: number }`. Types via `z.infer` where a schema exists; no parallel interfaces.
- `src/features/products/schema/products.schema.ts` — Zod schemas:
  - `productSchema` → `z.infer` = `Product`.
  - `productListResponseSchema` = `{ items: z.array(productSchema), total, page, limit }` — parse the envelope's `data` so a contract drift surfaces at the boundary.
  - `productListQuerySchema` = `{ page: int≥1 default 1, limit: int 1–100 default 20, search?, category? }` — mirrors `backend/products.schema.ts` so the client never sends a request the server would 422.

## Create
| File | Purpose |
|------|---------|
| `src/features/products/types/products.ts` | `Product`, `ProductListResponse` from observed `data` shape |
| `src/features/products/schema/products.schema.ts` | Zod product + list-response + list-query schemas |
| `src/features/products/api/products.api.ts` | `fetchProducts(params)` → `api.get("/products", { params })`, unwraps `data`, validates with `productListResponseSchema` |
| `src/features/products/hooks/use-products.ts` | `useProductsQuery` (paged) **and/or** `useInfiniteProductsQuery` (alt) |
| `src/features/products/components/products-pager.tsx` | prev/next + "Page X of N" control (new, domain-specific) |
| `src/features/products/components/products-grid-states.tsx` | skeleton grid + empty + error blocks (or inline in template) |
| `src/features/products/template/products-grid.tsx` | EDIT existing — bind to hook, render states + pager |
| `src/features/products/index.ts` | barrel for the module's public surface |
| `src/app/api/products/route.ts` | **OMIT** — catch-all proxy already covers `/api/products` |

## Data-binding map
| Component (path) | Hook | Fields bound | States |
|------------------|------|--------------|--------|
| `template/products-grid.tsx` | `useProductsQuery({ page, limit })` | `data.items` → grid; `data.total/page/limit` → pager | loading skeleton / empty / error / pending-next |
| `components/product-card.tsx` | (props from item) | `name`, `price`+`currency` (format cents→display), `inStock`, `imageUrl` | n/a (pure) |
| `components/products-pager.tsx` | derives from query result | `page`, `totalPages = ceil(total/limit)`, `hasPrev`, `hasNext` | disable prev on page 1 / next on last page |

`page` lives in component state (or URL search param `?page=` for shareable/back-button friendly pagination — recommended). Changing `search`/`category` later → reset `page` to 1.

## Query / mutation hooks

### Query key shape (namespaced, array, filter-bearing)
```
["products", "list", { page, limit, search, category }]   // paged — each page cached separately
```
- Include **every** server-affecting param (page, limit, search, category) in the key so each page+filter combo is its own cache entry and refetches correctly when any changes.
- Keep filters in a single object segment (stable key) rather than spread positionally.

### Primary — `useProductsQuery(params)` (paged)
- `queryKey: ["products", "list", params]`, `queryFn: () => fetchProducts(params)`.
- **`placeholderData: keepPreviousData`** (TanStack Query v5) — on page change, keep the previous page's rows visible (no layout flash) while the next loads; pair with an `isPlaceholderData`/`isFetching` flag to dim the grid or show a thin top loader.
- `staleTime`: ~30s–60s so paging back to a visited page is instant from cache (no refetch storm); `gcTime` default (5m) is fine.
- Returns `{ data, isLoading, isError, error, isFetching, isPlaceholderData }`; expose derived `totalPages`, `hasNext`, `hasPrev`.

### Alternative — `useInfiniteProductsQuery(params)` (infinite scroll)
- `useInfiniteQuery`, `queryKey: ["products", "list", "infinite", { limit, search, category }]` (no `page` in the key — pages live inside the infinite cache).
- `initialPageParam: 1`, `queryFn: ({ pageParam }) => fetchProducts({ ...params, page: pageParam })`.
- `getNextPageParam: (lastPage) => lastPage.page * lastPage.limit < lastPage.total ? lastPage.page + 1 : undefined` — derives "has more" from `total`; returning `undefined` is the end-of-pages signal.
- Flatten with `data.pages.flatMap(p => p.items)`; trigger `fetchNextPage()` via an IntersectionObserver sentinel; gate on `hasNextPage && !isFetchingNextPage`.
- Caveat to surface in review: offset paging over a mutating collection can duplicate/skip rows between appended pages — acceptable for a low-churn catalog, riskier if products are added frequently.

### Invalidation
- Admin create (`POST /api/products`, separate plan) should `queryClient.invalidateQueries({ queryKey: ["products", "list"] })` — the `["products","list"]` prefix invalidates every page/filter at once.

## Design gaps (build before/with binding)
- **`products-pager.tsx`** (numbered / prev-next control) — not built; small, build with the binding. Or, for the infinite variant, a scroll sentinel + "Loading more…" row instead.
- **Loading skeleton + empty + error blocks** — not in the current design; build as part of the binding (skeleton grid of N card placeholders; empty-state copy/CTA; inline error with retry).
- `ProductCard` prop change (`price: string` → `price: number` + `currency`) — minor edit, formatting moves to the binding layer.
- Otherwise the grid/card design is complete.

## Edge cases & states
- **Loading (first load):** skeleton grid (≈`limit` card placeholders), not a bare spinner — preserves layout.
- **Paging (subsequent):** `keepPreviousData` keeps current rows; show a subtle fetching indicator (dim grid / top bar). Disable the pager's next/prev while `isFetching`.
- **Empty list:** `total === 0` (or `items.length === 0`) → empty-state component (e.g. "No products found", plus clear-filters CTA when a search/category is active). Distinct from loading.
- **Error:** request/parse failure → inline error block with a Retry button (`refetch`); optional toast. Zod parse failure of the envelope = treat as error (contract drift) and log.
- **End of pages:** paged → disable "Next" when `page >= totalPages`; infinite → `hasNextPage === false` (getNextPageParam returned `undefined`) renders an "End of results" sentinel and stops observing.
- **Out-of-range page:** if a deep `?page=` exceeds `totalPages` (e.g. after filtering), backend returns `items: []` with the real `total` — detect and snap back to `totalPages` (or page 1).
- **422 from bad query:** client schema mirrors the server's, so this shouldn't happen from our own UI; if it does, surface as a generic error, don't crash.
- **401:** not applicable to this public list (would only affect admin create).

## Out of scope
- Search / category **filter UI** (hooks/keys are filter-ready, but the controls aren't planned here).
- Product **detail** (`GET /:id`) and **create** (`POST`) bindings — separate plans.
- Sorting (backend exposes no `sort` param — would need a backend change first).
- Currency/price formatting utility design beyond "format cents using `currency`".

## Open questions
1. **Paged vs infinite scroll — product/UX call.** Both are supported by the observed contract. This plan recommends **classic paged** (because `total` makes numbered pagination clean and offset paging is safer per-page than appended); the infinite-scroll hook is fully spec'd if you'd rather. Pick one before build.
2. **Page state location:** component state vs **URL `?page=`** (recommended for shareable links + browser back). Confirm.
3. **Default page size:** keep backend default **20**, or a different grid-friendly number (e.g. 24 for a 4-col grid)? `limit` max is 100.
