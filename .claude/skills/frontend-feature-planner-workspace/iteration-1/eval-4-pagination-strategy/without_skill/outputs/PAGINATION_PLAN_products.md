# Pagination Plan — Products List

Planning doc only. No binding code is written here — this defines the strategy the
`frontend-module-builder` step would implement against the **real** products API.

---

## 1. Ground truth — how the products API actually paginates

Read from the backend source (not guessed):

- **Endpoint:** `GET /api/products` — public, no auth required (`products.routes.ts`).
  Browser reaches it same-origin through the BFF catch-all (`app/api/[...path]/route.ts`),
  via the shared axios instance (`baseURL: "/api"`). No new BFF route needed.
- **Query params** (`products.schema.ts`, `listProductsQuery`):
  | Param | Type | Rules |
  |---|---|---|
  | `page` | int | `min(1)`, default `1` |
  | `limit` | int | `min(1)`, `max(100)`, default `20` |
  | `search` | string | optional, case-insensitive name regex |
  | `category` | string | optional, exact match |
- **Pagination model:** **offset-based** — service does `.skip((page - 1) * limit).limit(limit)`
  and returns a **total count** (`products.service.ts`).
- **Response envelope** (`app-response.ts` → `ok`):
  ```json
  {
    "success": true,
    "message": "Products fetched",
    "data": { "items": ProductDTO[], "total": number, "page": number, "limit": number }
  }
  ```
- **ProductDTO:** `{ id, name, slug, price (int cents), currency, category, inStock, imageUrl? }`.
- **Errors:** `{ success: false, message, code }` with matching HTTP status.

**Key consequence:** The API is page/offset based and returns `total`. This is the single most
important fact for the decision below — it natively supports *both* numbered pages **and**
infinite scroll. There is no cursor; everything derives from `page`, `limit`, `total`.

---

## 2. Decision — Page-based (numbered) as default, infinite scroll as an opt-in variant

### Recommendation: **numbered page pagination** for the products grid.

Rationale, tied to the API and the UI:

1. **The API returns `total`.** That makes total page count knowable
   (`Math.ceil(total / limit)`), which is exactly what numbered pagination needs and what
   infinite scroll throws away. Use the strength the backend already gives you.
2. **Offset pagination is page-addressable and shareable.** `?page=3` can live in the URL,
   be bookmarked, linked, and restored on reload. Good for a catalog/admin grid.
3. **Stable, bounded memory.** Each page is its own cache entry; we never accumulate an
   ever-growing list in memory.
4. **The current design is a fixed grid** (`products-grid.tsx`, `grid-cols-2 md:grid-cols-4`),
   not a feed — a pager control fits it more naturally than an auto-loading sentinel.

### When to choose the infinite-scroll variant instead
Offer it (it's cheap to add because the same offset API supports it) if the product surface
is a long mobile-first browse feed where "load more" / scroll-to-load is the desired UX.
Because the API exposes `total`, `getNextPageParam` can stop cleanly at the end — infinite
scroll is fully supported, it's just not the default.

Both options below share the same types, schema, query-key namespace, and api function.

---

## 3. Types & schema (mirror the backend, no parallel hand-written interfaces)

Per ARCHITECTURE: types come from `z.infer`. Define in `features/products/schema/` +
`features/products/types/`:

```ts
// schema — request (mirrors listProductsQuery) and response
productListParamsSchema = {
  page: number().int().min(1).default(1),
  limit: number().int().min(1).max(100).default(20),
  search?: string,
  category?: string,
}

productSchema = { id, name, slug, price, currency, category, inStock, imageUrl? }

// envelope is generic; data payload:
productListDataSchema = { items: productSchema[], total, page, limit }
```

Derived helpers: `pageCount = Math.ceil(total / limit)`,
`hasNextPage = page * limit < total`.

---

## 4. Query keys

Namespaced array per ARCHITECTURE convention `["products", filters]`. Filters object
**must include every param that changes the result set** so caches don't collide:

```ts
const productKeys = {
  all:  ["products"] as const,
  list: (filters: { page?; limit?; search?; category? }) =>
        ["products", "list", filters] as const,
  // infinite-scroll variant drops `page` from the key (page becomes pageParam):
  infinite: (filters: { limit?; search?; category? }) =>
        ["products", "infinite", filters] as const,
  detail: (id: string) => ["products", "detail", id] as const,
};
```

- **Page variant:** `page` is part of the key → each page is a distinct cache entry.
- **Infinite variant:** `page` is **not** in the key (it's the `pageParam`); only the
  filters (`search`, `category`, `limit`) are. Changing a filter starts a fresh infinite list.
- Keep `list` and `infinite` as separate sub-namespaces so the two strategies never share
  entries.

---

## 5. The api function (one, shared by both strategies)

```ts
// features/products/api/get-products.ts
async function getProducts(params: ProductListParams): Promise<ProductListData> {
  const res = await api.get("/products", { params });  // axios baseURL "/api"
  return res.data.data;  // unwrap { success, data, message } envelope
}
```

Single source — both the page hook and the infinite hook call it.

---

## 6. Hooks

### 6a. Page-based (default) — `useProductsQuery`
```ts
function useProductsQuery(filters: ProductListParams) {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: () => getProducts(filters),
    placeholderData: keepPreviousData,   // v5: smooth page-to-page, no flash to empty
    staleTime: 30_000,                   // catalog data isn't volatile
  });
}
```
- `keepPreviousData` (TanStack Query v5 import) is the linchpin for numbered paging — the
  previous page stays on screen while the next loads, so the grid doesn't collapse.
- Drive `page` from URL search params (`?page=`, `?search=`, `?category=`) so state is
  shareable and survives reload.
- **Prefetch next page** on hover/idle with `queryClient.prefetchQuery(productKeys.list({...filters, page: page+1}))`
  for instant forward paging.

### 6b. Infinite-scroll variant — `useProductsInfiniteQuery`
```ts
function useProductsInfiniteQuery(filters: Omit<ProductListParams, "page">) {
  return useInfiniteQuery({
    queryKey: productKeys.infinite(filters),
    queryFn: ({ pageParam }) => getProducts({ ...filters, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page * lastPage.limit < lastPage.total ? lastPage.page + 1 : undefined,
    staleTime: 30_000,
  });
}
```
- `getNextPageParam` uses `total` to return `undefined` at the end → `hasNextPage` becomes
  false and the loader stops. This is why the offset API supports infinite scroll cleanly.
- Flatten with `data.pages.flatMap(p => p.items)` for the grid.
- Trigger `fetchNextPage()` from an IntersectionObserver sentinel at the list bottom.

---

## 7. Caching strategy

- **`staleTime: 30_000`** (≈30s) — product catalog changes slowly; avoids refetch storms when
  flipping pages back and forth. Tune per business needs.
- **`gcTime`** default (5 min) is fine; old pages drop out of cache after navigation.
- **Per-page cache entries** (page variant) mean returning to `page=2` is instant if still fresh.
- **Filter changes** (`search`/`category`) produce new keys → new fetch, old filter results
  stay cached briefly for quick back-and-forth.
- **Mutations** (admin create — `POST /api/products`): invalidate `productKeys.all` so every
  list/infinite entry refetches. Don't try to surgically patch a specific page.
- **Detail reuse:** `getOne` returns the same DTO shape; a list item can seed
  `productKeys.detail(id)` via `setQueryData` to skip a detail fetch.

---

## 8. Loading & error states (per state, mapped to the existing design)

The design components (`product-card.tsx`, `products-grid.tsx`) are presentational and
currently fed hardcoded `SAMPLE` data; binding replaces `SAMPLE` with hook data.

| State | Page variant | Infinite variant |
|---|---|---|
| First load (`isPending`) | Skeleton grid (N = `limit` placeholder cards) | Same |
| Background refetch (`isFetching`, has data) | Keep grid, subtle top progress / dim pager; data stays via `keepPreviousData` | Keep list |
| Paging (next page in flight) | Disable pager buttons + spinner on active page; old page visible | Sentinel shows `isFetchingNextPage` spinner |
| Empty (`items.length === 0`) | "No products match" empty state (esp. after search/filter) | Same |
| Error (`isError`) | Inline error card + Retry (`refetch`) | Keep loaded pages + "Failed to load more / Retry" at sentinel |
| End of list | Pager: disable Next when `page >= pageCount` | Hide sentinel when `!hasNextPage` |

Notes:
- Price is **integer cents** (`price`, `currency`) — format at the binding boundary
  (`$24.00` from `2400`), since `ProductCard` expects a preformatted `price: string`.
- Map `inStock`, `imageUrl`, `name` straight through; the card already handles missing image.

---

## 9. URL / state ownership (page variant)
Single source of truth = URL search params: `?page=2&search=mug&category=mugs&limit=20`.
A small controller component reads them, passes to `useProductsQuery`, and pager/filter
controls push updates via `router.replace`. Keeps pagination shareable and reload-safe and
keeps the cache key aligned to the URL.

---

## 10. Files this plan implies (for the builder step — not created here)
```
features/products/
  schema/products.schema.ts        # params + product + list-data zod
  types/products.types.ts          # z.infer exports
  api/get-products.ts              # shared api fn (envelope unwrap)
  hooks/use-products-query.ts      # page-based (default)
  hooks/use-products-infinite.ts   # infinite variant (optional)
  hooks/product-keys.ts            # query-key factory
  template/products-grid.tsx       # replace SAMPLE with hook data + states
  components/products-pager.tsx    # numbered pager (page variant)
```

## 11. Summary of the recommendation
- **Default to numbered page pagination** — the API is offset-based and returns `total`, which
  makes page counts and `?page=` URLs trivial; the fixed grid design fits a pager.
- **Infinite scroll is fully viable** on the same endpoint via `useInfiniteQuery` +
  `getNextPageParam` (stop using `total`); keep it as an opt-in for a feed-style surface.
- **Query keys:** `["products","list",filters]` (page in key) vs `["products","infinite",filters]`
  (page as `pageParam`, not in key).
- **Caching:** `staleTime ~30s`, per-page entries, `keepPreviousData` for smooth paging,
  invalidate `["products"]` on admin create.
- **Loading states:** skeleton on first load, `keepPreviousData`/kept-list on refetch,
  disabled pager or sentinel spinner while paging, explicit empty + error+retry states.
