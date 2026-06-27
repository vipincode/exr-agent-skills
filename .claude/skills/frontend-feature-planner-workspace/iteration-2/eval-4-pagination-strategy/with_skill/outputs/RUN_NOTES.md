# RUN NOTES — products-pagination (frontend-feature-planner)

## Observed pagination mechanism (from real backend source — Rung 1)
Source: `backend/src/modules/products/` (routes/controller/service/schema/model) +
`backend/src/lib/app-response.ts` + `backend/src/app.ts`.

- **OFFSET / PAGE-NUMBER based.** Service: `Product.find(filter).skip((page-1)*limit).limit(limit)`
  run alongside `countDocuments(filter)`.
- **No cursor.** No `nextCursor`, no `hasMore`, no `totalPages` — but `total` + `limit` make page
  count derivable: `totalPages = Math.ceil(total / limit)`.
- **Query params** (Zod `listProductsQuery`): `page` (int ≥1, default 1), `limit` (int 1–100,
  default 20), `search?` (name regex, case-insensitive), `category?` (exact). All **server-side**.
- **Returned `data` shape:** `{ items: Product[], total, page, limit }` (NOT a bare array).
- **Envelope:** `{ success: true, data, message }`, HTTP 200 via `ok()` helper.
- `Product` DTO: `{ id, name, slug, price (INTEGER CENTS), currency (ISO 4217), category, inStock,
  imageUrl? }`. The design's `ProductCard` wants a pre-formatted price string → binding must
  format cents → currency.
- List is **public** (no auth). Realistic error: 422 on bad query params; generic 5xx.

## Recommended approach + why
- **PAGED (numbered Prev/Next + "Page X of N") as the primary recommendation**, via `useQuery`
  with `placeholderData: keepPreviousData`.
- **Why:** the API is offset-based and returns `total`, which is exactly what numbered pagination
  needs. Offset pagination lacks a stable cursor, so "true" infinite scroll risks skipped/duplicated
  items at page seams when the set changes — paged is the most faithful and robust fit for *this*
  backend. Infinite scroll is still feasible (documented as an alt with `useInfiniteQuery` +
  `getNextPageParam` derived from `total`), so the one real UX unknown (paged vs infinite) is asked,
  with paged as the stated default assumption so planning proceeds.

## Query-key shape
- Paged (recommended): `["products", "list", { page, limit, search, category }]` — every
  result-affecting param in the key, so each page/filter combo caches independently;
  `keepPreviousData` smooths transitions; `staleTime ~30s`.
- Infinite (alt): `["products", "list", "infinite", { limit, search, category }]` — `page` lives in
  `pageParam`, not the key; `getNextPageParam = last.page*last.limit < last.total ? last.page+1 : undefined`.

## Loading / empty / error / end-of-pages handling
- **Loading (initial):** `isLoading` → skeleton grid (N = `limit` cells; new `product-card-skeleton`).
- **Loading (page change):** `isPlaceholderData` → keep previous page dimmed + disable pager.
- **Empty:** `total === 0` → empty-state message + clear-filters CTA.
- **Error:** `isError` → inline error + Retry (`refetch`); optional toast; no infinite retry.
- **End of pages:** Next disabled when `page >= Math.ceil(total/limit)`; infinite hides "Load more"
  when `getNextPageParam` returns `undefined`. Never fetch past the last page.
- **Drift guard:** api fn unwraps `data` and parses `productsPageSchema` so backend changes fail loudly.

## Artifacts
- Plan: `frontend/_docs/FEATURE_PLAN_products-pagination.md` (copied to this outputs/ dir).
- Status: `draft`. Planning only — no code written. Two new small design pieces flagged (pager +
  skeleton); grid/card already exist and just need the live data source.
