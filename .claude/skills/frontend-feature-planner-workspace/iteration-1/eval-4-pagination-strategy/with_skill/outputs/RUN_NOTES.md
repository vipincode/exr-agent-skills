# RUN NOTES — products list pagination plan

## Backend pagination mechanism (OBSERVED, not guessed)
Read from monorepo source: `backend/src/modules/products/` (routes → controller → service → schema → model), `backend/src/app.ts` (mount), `backend/src/lib/app-response.ts` + `backend/ARCHITECTURE.md` (envelope).

- **Endpoint:** `GET /api/products` — public, mounted at `/api/products` (`app.ts`).
- **Style: OFFSET / page-based.** Service runs `Product.find(filter).skip((page - 1) * limit).limit(limit)` (`products.service.ts:22`). **No cursor** — there is no `nextCursor`/`before`/`after` token and no Link header. Cursor pagination is therefore NOT an available option.
- **Request params** (`products.schema.ts`, validated by Zod `validate`, bad input → 422):
  - `page` — int ≥ 1, **default 1** (1-indexed)
  - `limit` — int 1–100, **default 20**
  - `search?` — string → case-insensitive regex on `name`
  - `category?` — string → exact match
- **Response meta:** envelope `{ success: true, data, message }` (helper `ok()`), where
  `data = { items: Product[], total, page, limit }`. `total` is the full `countDocuments(filter)` for the active filter; `page`/`limit` are echoed. **No `totalPages`/`hasMore`** — the client derives them from `total` (`totalPages = ceil(total/limit)`).
- **Product DTO:** `{ id, name, slug, price (cents), currency (ISO-4217), category, inStock, imageUrl? }`.
- **Error envelope:** `{ success: false, message, code }` — 404 / 409 / 401 / 422 (`backend/ARCHITECTURE.md`).

## Recommended frontend approach + why
- **Page model is fixed by the backend: offset/page-based.** Stated as a decision, not a question.
- **Primary recommendation: classic paged (numbered / prev-next), default page size 20.** Rationale grounded in the contract: the endpoint returns `total`, so a deterministic page count, "Page X of N", and jump-to-page are trivial; and offset `skip/limit` over a changing collection can duplicate/skip rows when pages are *appended* (infinite scroll), whereas a paged grid keeps each page a stable, independently cached unit.
- **Infinite scroll is fully supported by the same contract** and is spec'd as the documented alternative (`useInfiniteQuery`, page-number `pageParam`, `getNextPageParam` derived from `total`). Flagged as the one genuine UX/product unknown (Open question #1) — the hook can be swapped without changing types or the API fn.

## Query key shape
- **Paged (primary):** `["products", "list", { page, limit, search, category }]` — every server-affecting param in the key; each page+filter combo is its own cache entry. Use `placeholderData: keepPreviousData` for fl
icker-free page transitions, `staleTime` ~30–60s so revisiting a page is instant.
- **Infinite (alt):** `["products", "list", "infinite", { limit, search, category }]` — no `page` in the key; pages live inside the infinite cache.
- **Invalidation:** prefix `["products", "list"]` invalidates all pages/filters at once (used by a future admin create).

## Loading / empty / error / end-of-pages handling
- **Loading (first):** skeleton grid (~`limit` card placeholders), not a bare spinner.
- **Paging (subsequent):** `keepPreviousData` keeps current rows visible; subtle fetching indicator; pager disabled while `isFetching`.
- **Empty:** `total === 0` / `items.length === 0` → empty-state component (with clear-filters CTA when a filter is active); distinct from loading.
- **Error:** request or Zod envelope-parse failure → inline error block + Retry (`refetch`); optional toast.
- **End of pages:** paged → disable "Next" when `page >= totalPages`; infinite → `getNextPageParam` returns `undefined` (`hasNextPage === false`) → "End of results", stop observing.
- **Out-of-range page:** deep `?page=` beyond `totalPages` returns `items: []` with real `total` → snap back to last valid page.
- **401:** N/A for this public list (only relevant to admin create).

## Files
- Plan written to: `repo/frontend/_docs/FEATURE_PLAN_products-pagination.md`
- Copied to: `outputs/FEATURE_PLAN_products-pagination.md`

## Notes on skill adherence
- Resolved project dirs via `.claude/workspace.json` (backend → `backend`, frontend → `frontend`).
- API contract taken from Rung 1 (monorepo source) — highest fidelity; each fact cited.
- No binding code written (planning only). Design gaps (pager, skeleton/empty/error blocks, ProductCard `price: string`→`number` prop change) flagged, not built.
