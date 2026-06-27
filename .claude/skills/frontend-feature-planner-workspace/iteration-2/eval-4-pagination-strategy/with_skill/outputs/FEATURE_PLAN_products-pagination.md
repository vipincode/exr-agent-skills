# Feature plan: products-pagination (API binding)

> Status: draft — edit freely, then hand to frontend-module-builder. Add/remove any section.

## Overview
Binds the existing **products grid** design (`features/products/template/products-grid.tsx` +
`components/product-card.tsx`, currently rendering a hardcoded `SAMPLE`) to the live
`GET /api/products` list endpoint, and decides the **pagination strategy** (page vs infinite),
query-key shape, caching, and loading/empty/error/end states — grounded strictly in how the
backend actually paginates.

## API contract (observed)
> Source: monorepo backend source — `backend/src/modules/products/` (routes, controller, service,
> schema, model) + `backend/src/lib/app-response.ts` + `backend/src/app.ts`. This is Rung 1 (highest
> fidelity). Mount base `/api/products` confirmed in `app.ts`.

**Pagination mechanism (the load-bearing fact): OFFSET / PAGE-NUMBER based.**
The service does `Product.find(filter).skip((page - 1) * limit).limit(limit)` alongside
`countDocuments(filter)` and returns `{ items, total, page, limit }`. There is **no cursor**, no
`nextCursor`, no `hasMore`, and no `totalPages` field — but `total` + `limit` make the page count
derivable (`totalPages = Math.ceil(total / limit)`). The frontend must bind to this exact shape;
a cursor style is not available and must not be invented.

**Success envelope:** `{ success: true, data: <shape>, message: string }` — HTTP 200 for list
(`ok()` helper). The list `data` is the pagination object below; it is **not** a bare array.

**Error envelope:** `{ success: false, message, code? }` (inferred from the `AppError` model;
`NotFoundError` → 404). For the list endpoint the realistic failure is **422** when query params
fail Zod `validate({ query: listProductsQuery })` (e.g. `limit > 100`, `page < 1`), plus generic
5xx. No auth error path on list — it is public.

| Method | Path | Auth | Request (query) | Response `data` shape |
|--------|------|------|-----------------|------------------------|
| GET | /api/products | public | `page` (int ≥1, default 1), `limit` (int 1–100, default 20), `search?` (string, name regex i), `category?` (string, exact) | `{ items: Product[], total: number, page: number, limit: number }` |
| GET | /api/products/:id | public | params: `id` (24-hex ObjectId) | `Product` |
| POST | /api/products | `protect` + `requireRole('admin')` | body: name, price, currency, category, inStock, imageUrl? | `Product` (201 `created()`) |

`Product` (from `ProductDTO` in service) = `{ id: string, name: string, slug: string, price: number /* INT CENTS */, currency: string /* ISO 4217, e.g. "USD" */, category: string, inStock: boolean, imageUrl?: string }`.

> Note: `price` is an **integer in cents** (model + create schema `z.number().int().positive()`),
> while the design's `ProductCard` expects a **pre-formatted string** (`price: "$24.00"`). The
> binding layer must format cents → currency string; see Data mapping.

## Decisions
- **Strategy — PAGED (numbered pagination) as the primary recommendation.** Grounded in the
  observed contract: the backend is offset-based and returns `total`, which is exactly what
  numbered pagination needs (`page X of N`, jump-to-page, a stable Next/Prev). Offset pagination is
  the wrong fit for "true" infinite scroll because rows can shift/duplicate across page boundaries
  when the underlying set changes (no stable cursor) — so a paged UI is both the most faithful and
  the most robust binding to *this* API.
- **Hook shape:** `useQuery` (not `useInfiniteQuery`) for the paged approach, with
  `placeholderData: keepPreviousData` so the grid keeps the previous page visible (no layout flash)
  while the next page loads.
- **Caching:** each page is cached under its own query key, so back/forward between pages is
  instant after first visit. `staleTime` ~30s (catalog data is not real-time).
- **Server-side filtering/sorting:** `search` and `category` are **server-side** query params
  (observed) — they belong in the query key, and changing them resets to `page: 1`.
- _Assumption_: this feeds the **existing** products screen (`products-grid.tsx`), not a new route.
  The pager UI is added below the grid.
- _Assumption (UX, please confirm — see Open questions)_: a numbered/Prev–Next pager is acceptable
  for the product catalog. If the product owner specifically wants infinite scroll on this API, see
  the "If infinite scroll is required" subsection below — it is implementable but with the offset
  caveats noted.

## Dependencies
| Dependency | Needed for | Status / unblock path |
|------------|-----------|------------------------|
| `GET /api/products` paginated endpoint | the entire list binding | ✅ exists — `backend/src/modules/products` (offset/page, returns `{items,total,page,limit}`) |
| BFF catch-all proxy | browser → `/api/products` → backend | ✅ exists — `app/api/[...path]/route.ts` forwards `/api/*`; no per-feature BFF route needed |
| axios instance (`baseURL:/api`) | request fn transport | ✅ exists — `src/lib/axios.ts` |
| `BACKEND_URL` env | proxy target | ⚠️ must be set in frontend env for the proxy to reach the backend |
| TanStack QueryClient provider | all hooks | ✅ `lib/query-client.ts` + `app/providers.tsx` (per ARCHITECTURE.md) |
| `useAuth` real user+role | **only** the admin POST create path (out of scope here) | ⚠️ stub returns `{ user: null }`; irrelevant to the public list/pagination work |
| A pager UI component | rendering page controls / "Load more" | ❌ not built — small **design gap** (see Design gaps); plan binds around it |

## Reuse (do NOT recreate)
| What | Path | How it's used here |
|------|------|--------------------|
| axios instance | `src/lib/axios.ts` | the products list request fn goes through it (`api.get("/products", { params })`) |
| BFF proxy (catch-all) | `src/app/api/[...path]/route.ts` | already forwards `/api/products?page=…&limit=…` — no new route |
| query client | `src/lib/query-client.ts` | the `useProductsQuery` hook uses the app-wide client |
| ProductCard (design) | `src/features/products/components/product-card.tsx` | bound to each `Product`; receives a **formatted price string** |
| ProductsGrid (design) | `src/features/products/template/products-grid.tsx` | swap hardcoded `SAMPLE` for live data + add pager |
| useAuth | `src/hooks/use-auth.ts` | not needed for the public list; listed only to confirm pagination is unauth |

## Types & schema
- `src/features/products/types/products.ts`
  - `Product` = `z.infer` of the product schema below (id, name, slug, price, currency, category,
    inStock, imageUrl?). **No parallel interface.**
  - `ProductsPage` = `{ items: Product[]; total: number; page: number; limit: number }` — mirrors
    the observed list `data` exactly.
- `src/features/products/schema/products.schema.ts` (Zod 4)
  - `productSchema` — validates one product from the API (price `z.number().int()` to assert cents).
  - `productsPageSchema` — `{ items: z.array(productSchema), total, page, limit }`; the api fn
    parses the unwrapped `data` through this so backend drift fails loudly.
  - `productsFilterSchema` — the UI's query inputs: `page` (default 1), `limit` (default 20, max 100),
    `search?`, `category?` — mirrors `listProductsQuery` so the client never sends an invalid request.
  - `envelopeSchema(dataSchema)` helper — `{ success: z.literal(true), data: dataSchema, message: z.string() }`
    to unwrap `data` consistently.

## Create
| File | Purpose |
|------|---------|
| `src/features/products/types/products.ts` | `Product`, `ProductsPage` from `z.infer` |
| `src/features/products/schema/products.schema.ts` | product / page / filter Zod schemas + envelope unwrap |
| `src/features/products/api/products.api.ts` | `fetchProducts(filters)` → `api.get("/products",{params})`, unwrap envelope, parse `productsPageSchema` |
| `src/features/products/hooks/use-products.ts` | `useProductsQuery(filters)` (paged) — see hooks section |
| `src/features/products/components/products-pager.tsx` | **new** Prev/Next + "Page X of N" control (design gap) |
| `src/features/products/components/product-card-skeleton.tsx` | **new** loading skeleton cell for the grid |
| `src/features/products/template/products-grid.tsx` | **edit** — remove `SAMPLE`, consume `useProductsQuery`, render states + pager |
| `src/features/products/index.ts` | barrel for the module's public surface |
| BFF route under `app/api/` | **none** — catch-all proxy already covers `/api/products` |

## Data mapping
| Component (path) | Hook | Fields bound | States |
|------------------|------|--------------|--------|
| `features/products/template/products-grid.tsx` | `useProductsQuery({page,limit,search,category})` | `data.items` → list; `data.total/page/limit` → pager math | skeleton grid (first load) / dimmed grid (`isPlaceholderData`) / empty / error |
| `features/products/components/product-card.tsx` | (rendered by grid) | `name`, `imageUrl`, `inStock` direct; **`price` = formatCents(item.price, item.currency)** e.g. `2400,"USD"→"$24.00"` | per-card image fallback already handled by design |
| `features/products/components/products-pager.tsx` | reads grid's page state | `page`, `totalPages = Math.ceil(total/limit)` | Prev disabled on page 1; Next disabled on last page |

## Query/mutation hooks
**Primary (paged):**
- `useProductsQuery(filters)` where `filters = { page, limit, search?, category? }`
  - **Query key:** `["products", "list", { page, limit, search, category }]` — feature-namespaced
    array; every param that changes the result is in the key so each page/filter combo caches
    independently.
  - `queryFn`: calls `fetchProducts(filters)` (BFF → backend), unwraps `data`, validates with
    `productsPageSchema`.
  - **`placeholderData: keepPreviousData`** (TanStack v5) — keeps the current page on screen while
    the next loads; pair with `isPlaceholderData` to dim/disable the pager mid-fetch.
  - `staleTime: 30_000`; `total` from the response drives `totalPages` and the Next-disabled logic.
  - Changing `search`/`category` resets `page → 1` (handled in the grid's state, not the hook).
  - **Optional prefetch:** on render, `queryClient.prefetchQuery` for `page + 1` when not on the
    last page, so Next is instant. Nice-to-have, not required.

**If infinite scroll is required instead (offset-based, feasible with caveats):**
- `useInfiniteQuery` with **query key** `["products", "list", "infinite", { limit, search, category }]`
  (note: `page` is NOT in the key — it lives in `pageParam`).
  - `initialPageParam: 1`; `queryFn({ pageParam })` calls `fetchProducts({ ...filters, page: pageParam })`.
  - **`getNextPageParam:`** derive from observed meta — `(last) => last.page * last.limit < last.total ? last.page + 1 : undefined`.
    (Returning `undefined` is what stops "end of pages".) This works because the API returns `total`;
    there is no `hasMore`/`nextCursor` to lean on.
  - **Caveat (why paged is recommended):** offset pagination has no stable cursor, so if products are
    added/removed between fetches, an item can be skipped or repeated at a page seam. Acceptable for a
    low-churn catalog; flag it if the data is volatile.

No mutations in scope (the create path is admin-gated and separate).

## Design gaps (build before/with binding)
- **Pager control** (`products-pager.tsx`) — Prev/Next + "Page X of N" (or a "Load more" button for
  the infinite variant). Not in the current design → build a small one, or generate via
  figma-to-component / html-to-component if a design exists.
- **Loading skeleton cell** (`product-card-skeleton.tsx`) — to fill the grid on first load.
- Everything else (grid + card) already exists — only the data source and these two controls are new.

## Edge cases & states
- **Initial loading:** `isLoading` → render a skeleton grid (N = `limit` skeleton cells).
- **Page change loading:** `isPlaceholderData` true → keep previous page rendered but dimmed, and
  disable the pager to prevent double-advance.
- **Empty list:** `data.total === 0` (or `items.length === 0`) → empty-state message + clear-filters
  CTA (common when `search`/`category` matches nothing).
- **Error:** `isError` → inline error block with a Retry (calls `refetch`); optionally a toast.
- **End of pages:** Next disabled when `page >= Math.ceil(total/limit)`; for infinite,
  `hasNextPage === false` hides "Load more". Never fetch past the last page.
- **Invalid params (422):** the client Zod `productsFilterSchema` clamps `limit ≤ 100` / `page ≥ 1`
  before sending, so a 422 should be unreachable in normal use; if it still occurs, surface as a
  generic error (do not infinite-retry).
- **No auth concerns:** the list is public — no 401 path; do not gate the grid behind `useAuth`.
- **Envelope/shape drift:** api fn unwraps `data` and parses `productsPageSchema`; a backend change
  (e.g. renaming `items`) throws at parse time rather than rendering `undefined`.

## Testing checklist
- [ ] Grid renders live data from `GET /api/products` (hardcoded `SAMPLE` removed).
- [ ] Response envelope is unwrapped (`data`) and `productsPageSchema` validates it; drift fails loudly.
- [ ] `price` (int cents) formats to a currency string via the card (`2400,"USD" → "$24.00"`).
- [ ] Query key includes `page`, `limit`, `search`, `category`; each combination caches separately.
- [ ] Paging Next/Prev advances pages and **stops at the last page** (`page >= ceil(total/limit)`); no fetch past end.
- [ ] `keepPreviousData` keeps the previous page visible (no flash) and the pager disables mid-fetch.
- [ ] Loading (skeleton), empty (`total === 0`), and error (retry) states each render correctly.
- [ ] Changing `search`/`category` resets to page 1 and refetches.
- [ ] List works without auth (no 401 gate); pagination params never exceed `limit ≤ 100` / `page ≥ 1`.
- [ ] (If infinite variant) `getNextPageParam` returns `undefined` at the end and "Load more" disappears.

## Out of scope
- The admin **create** product binding (POST, `requireRole('admin')`) and any auth/session wiring.
- Product **detail** (`GET /api/products/:id`) binding.
- Server-side **sort** controls — the API exposes no sort param, so sorting is not plannable here.
- Currency-formatting utility design (assumed a small `formatCents` helper; not a pagination concern).

## Open questions
- **Paged vs infinite (the one genuine UX choice):** the backend supports both (offset + `total`),
  but the styles differ in feel and robustness. Recommendation is **numbered/Prev–Next paging**
  (best fit for offset + a stable, jump-to-page UX). Confirm, or say "infinite scroll" and the hook
  swaps to the `useInfiniteQuery` variant documented above (with the offset-seam caveat).
- **Page size:** default `limit` is 20 (backend default). Confirm the grid's desired page size
  (≤ 100 per the API cap).
- **Filter UI:** `search` and `category` are server-side and ready to bind — is a search box /
  category filter part of this work, or pagination only? (Plan supports both; grid wiring differs.)
