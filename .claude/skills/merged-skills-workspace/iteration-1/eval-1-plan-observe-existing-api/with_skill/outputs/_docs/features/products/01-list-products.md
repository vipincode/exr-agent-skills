# 01 — List products

> Status: ready
> Domain: frontend  ← the backend endpoint already exists and is not changed by this slice
> Depends on: —
> Part of: [products](./products-plan.md)

## Goal

Replace the hardcoded `SAMPLE` array in the already-built products grid with real data from the
existing `GET /api/products`, including loading, empty, and error states.

## Done when

> The products grid renders the products the API actually returns, with a loading state while it
> fetches and a sensible message when the list is empty or the request fails.

---

## API contract (this slice)

**The single source of truth for this slice.** The frontend half binds to exactly this; nothing
below restates the shape.

| Method | Path | Auth | Request | Success `data` | Errors |
|--------|------|------|---------|----------------|--------|
| GET | /api/products | **public** | query: `page` `limit` `search` `category` (all optional) | `{ items: Product[], total, page, limit }` | 422 invalid query params |

**Query params** — observed from `backend/src/modules/products/products.schema.ts:2-7`:

| Param | Type | Default | Constraints |
|---|---|---|---|
| `page` | int (coerced from string) | `1` | min 1 |
| `limit` | int (coerced from string) | `20` | min 1, **max 100** |
| `search` | string, trimmed | — | optional; matches `name` case-insensitively (`$regex`) |
| `category` | string, trimmed | — | optional; exact match |

All four are coerced and defaulted **server-side**, so the client may omit them entirely and still
get page 1 / limit 20.

**Success envelope** — `ok(res, data, "Products fetched")`:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "665f1c2ab3d4e5f6a7b8c9d0",
        "name": "Aero Mug",
        "slug": "aero-mug",
        "price": 2400,
        "currency": "USD",
        "category": "drinkware",
        "inStock": true,
        "imageUrl": "https://…"
      }
    ],
    "total": 42,
    "page": 1,
    "limit": 20
  },
  "message": "Products fetched"
}
```

Notes that matter for the binding:
- `price` is an **integer in cents** (`2400` = $24.00). `products.model.ts:6` says so explicitly.
- `imageUrl` is **optional** — it can be absent from the object entirely.
- `slug` and `category` are returned but the built card does not use them. Keep them in the schema
  (they're real) and just don't bind them.
- `createdAt` / `updatedAt` exist on the document but are **not** in the DTO — do not expect them.

**Error envelope** — flat, not nested:

```json
{ "success": false, "message": "…", "code": "…" }
```

Only 422 (`ValidationError`) is reachable here, and only if the client sends a bad `page` / `limit`
(e.g. `limit=500`, over the max of 100). With no params sent, this endpoint does not fail by
contract.

Source: **observed** —
`backend/src/app.ts:5` (mount path) ·
`backend/src/modules/products/products.routes.ts:8` (method, path, public — no `protect`) ·
`backend/src/modules/products/products.controller.ts:5-8` (envelope helper + message) ·
`backend/src/modules/products/products.service.ts:17-26` (the `{ items, total, page, limit }` shape) ·
`backend/src/modules/products/products.service.ts:2-16` (`ProductDTO` fields) ·
`backend/src/modules/products/products.schema.ts:2-7` (query params) ·
`backend/ARCHITECTURE.md` (envelope + error model).

---

## Backend half

**n/a** — `GET /api/products` already exists, is public, and returns everything the grid needs. This
slice adds no backend files and changes no backend behavior.

---

## Frontend half

**Types & schema** — derived with `z.infer`, per `frontend/ARCHITECTURE.md` ("Types come from
`z.infer` — no parallel interfaces"). Mirror the contract above exactly:

- `productSchema` — `id`, `name`, `slug`, `price` (int), `currency`, `category`, `inStock`,
  `imageUrl` **optional**.
- `productListDataSchema` — `{ items: productSchema[], total, page, limit }`.
- `productListResponseSchema` — the full envelope: `{ success, data: productListDataSchema, message }`.
- `type Product = z.infer<typeof productSchema>`.

Parse the envelope with the schema in the request fn so a drifted payload throws loudly instead of
rendering garbage.

**Create**

| File | Purpose |
|------|---------|
| `src/features/products/schema/product.schema.ts` | `productSchema`, list-data + envelope schemas |
| `src/features/products/types/index.ts` | `export type Product = z.infer<…>` (+ `ProductFilters`) |
| `src/features/products/api/list-products.ts` | `listProducts(filters?)` — GET `/products` via `api`, parse envelope, return `data` |
| `src/features/products/hooks/use-products-query.ts` | `useProductsQuery(filters?)` — TanStack `useQuery` |
| `src/features/products/lib/format-price.ts` | `formatPrice(cents, currency)` → `"$24.00"` |
| `src/features/products/index.ts` | feature public surface (if not already present) |

**No BFF route** — `frontend/src/app/api/[...path]/route.ts` already forwards `/api/*`, and
`src/lib/axios.ts` has `baseURL: "/api"`, so the request path in code is just `"/products"`.

**Hooks**

| Hook | Key | Notes |
|---|---|---|
| `useProductsQuery(filters?)` | `["products", filters ?? {}]` | array key namespaced by feature, per `frontend/ARCHITECTURE.md`. Read-only — invalidates nothing. Slice 02's delete invalidates the `["products"]` prefix, which is why the key is shaped this way from the start. |

Call it with no filters this slice (server defaults to page 1 / limit 20), but keep the `filters`
parameter so pagination and search are additive later.

**Data binding map**

| Component (path) | Bound to | Notes |
|---|---|---|
| `src/features/products/template/products-grid.tsx` | `useProductsQuery()` → `data.items` | **delete the `SAMPLE` const and its usage.** Keep the existing `grid grid-cols-2 gap-4 md:grid-cols-4` layout untouched. |
| ↳ map key | `product.id` | currently keyed by `p.name` — switch to `id`; names are not unique |
| `src/features/products/components/product-card.tsx` → `name` | `product.name` | direct |
| ↳ `price` | `formatPrice(product.price, product.currency)` | **transform: integer cents → formatted string.** The card's prop is already `price: string`, so its signature does not change. |
| ↳ `imageUrl` | `product.imageUrl` | optional both sides — the card already handles `undefined` |
| ↳ `inStock` | `product.inStock` | direct |

`ProductCard`'s props need **no change** in this slice — the contract fields line up once price is
formatted. (Slice 02 does change it.)

**States**

- **Loading** — `isPending`: render a grid of placeholder cards in the same `grid-cols-2 md:grid-cols-4`
  layout so nothing shifts when data lands.
- **Empty** — `data.items.length === 0`: a centered "No products yet" message spanning the grid.
  Distinguish it from loading; do not render an empty grid silently.
- **Error** — `isError`: a short failure message plus a retry that calls `refetch()`. Read
  `message` off the flat error envelope (`error.response?.data?.message`), **not** `error.error.message`.
- The grid is a client component (TanStack Query), so it needs `"use client"` if it is not already
  under one.

**Design gaps** — the binding needs these, and they are not in
`frontend/MODULE_REGISTRY.md` or `src/components/shared/`:

| Gap | Suggested home | Who builds it |
|---|---|---|
| Card skeleton / loading placeholder | `components/shared/` (generic) | `figma-to-component` / `html-to-component` if a design exists |
| Empty-state block | `components/shared/` (generic) | same |
| Error / retry block | `components/shared/` (generic) | same |

**Do not block on these.** Build the binding with plain inline markup for the three states; swap in
designed components when they exist. The bound data flow is what this slice is for.

**Reuse for this slice** — `src/lib/axios.ts` · `src/lib/query-client.ts` (via the provider) ·
`src/app/api/[...path]/route.ts` (existing proxy) · the two already-built product components.

---

## Testing checklist

- [ ] `useProductsQuery()` requests `/products` with no query params and the server's defaults apply (page 1, limit 20)
- [ ] the response is envelope-unwrapped: the hook exposes `{ items, total, page, limit }`, not the raw `{ success, data, message }`
- [ ] the response is schema-parsed — a payload missing a required field (e.g. `price`) throws rather than rendering garbage
- [ ] a product with `price: 2400, currency: "USD"` renders as `$24.00` on the card
- [ ] a product with `currency: "EUR"` formats with the euro symbol, not a hardcoded `$`
- [ ] a product with no `imageUrl` renders without a broken image
- [ ] `inStock: false` renders the "Sold out" state
- [ ] cards are keyed by `id`, and two products sharing a `name` both render
- [ ] the grid shows a loading state on first render, never an empty grid
- [ ] `items: []` shows the empty message, which is visually distinct from the loading state
- [ ] a failing request shows the error state and retry refetches
- [ ] no `SAMPLE` array remains anywhere in `src/features/products/`

## Notes / open questions

- The endpoint returns `total` even though nothing renders it this slice. Keep it in the schema and
  the hook's return — the pagination slice will need it and re-deriving it later is how types drift.
