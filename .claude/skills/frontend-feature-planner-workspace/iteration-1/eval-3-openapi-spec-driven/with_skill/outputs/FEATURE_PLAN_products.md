# Feature plan: products (API binding)

> Status: draft — edit freely, then hand to frontend-module-builder. Add/remove any section.

## Overview
Bind the already-built products design (`features/products/template/products-grid.tsx` +
`features/products/components/product-card.tsx`, currently rendering hardcoded `SAMPLE` data) to the
backend products API. Goal: make the products grid functional by fetching the real product list,
with the binding contract derived from the backend's OpenAPI spec (the only backend artifact
available — there is no backend source code in this repo).

## API contract (observed)
> Source: **OpenAPI 3.0.3 spec — `backend/openapi.json`** (resolution ladder **rung 3**).
> Rung 1 (monorepo backend source) and rung 2 (backend ARCHITECTURE.md / MODULE_REGISTRY.md) were
> unavailable — `backend/` contains only the spec, no source. Field facts below are read from the
> spec's `components.schemas`, not from server code, so types are as fine-grained as the spec
> declares (e.g. `price` typed `integer`, documented "price in CENTS").
> `servers.url` = `/api`, which matches the frontend's BFF baseURL.

**Success envelope:** `{ success: true, data: <shape>, message?: string }`
(from `ProductEnvelope` / `ProductListEnvelope` — `success`, `data`, `message`)

**Error envelope:** `{ success: false, message: string, code?: string }`
(from `ErrorEnvelope`) — documented statuses: **401** (POST, unauthorized) / **404** (GET one, not found).

| Method | Path | Auth | Request (params / query / body) | Response `data` shape |
|--------|------|------|--------------------------------|------------------------|
| GET | /products | public (`security: []`) | query: `page` (int≥1, default 1), `limit` (int 1–100, default 20), `search?` (string), `category?` (string) | `{ items: Product[], total: int, page: int, limit: int }` |
| GET | /products/{id} | public (`security: []`) | path: `id` (string) | `Product` |
| POST | /products | bearer (`bearerAuth`) — "admin only" per summary | body: `CreateProductBody` | `Product` (201) |

`Product` (from `components.schemas.Product`):
- `id`: string **(required)**
- `name`: string **(required)**
- `slug`: string **(required)**
- `price`: integer **(required)** — **price in CENTS** (not a formatted string)
- `currency`: string **(required)** — e.g. `"USD"`
- `category`: string **(required)**
- `inStock`: boolean **(required)**
- `imageUrl`: string (uri) — optional

`CreateProductBody` (from `components.schemas.CreateProductBody`):
- required: `name` (string), `price` (integer cents), `category` (string)
- optional: `currency` (string, default `"USD"`), `inStock` (boolean, default `true`), `imageUrl` (uri)

## Decisions
- **Primary binding = the product list (GET /products) → `ProductsGrid` + `ProductCard`.** This is the
  only screen the design actually builds.
- _Assumption_: the user task ("bind the products design") refers to the built grid screen. The spec
  also exposes GET /products/{id} (detail) and POST /products (admin create), but **no design exists**
  for those, so they are listed under Design gaps / Out of scope rather than bound now — correct me if
  a detail page or admin create form was intended.
- _Assumption_: `price` is rendered via a cents→currency formatter (e.g. `(price/100)` with `currency`)
  because the API returns integer cents while `ProductCard` expects a pre-formatted `price: string`.
  The mapper lives in the feature, not the component (design stays untouched).
- _Assumption_: pagination is **page-based** (the spec gives `page`/`limit`/`total`), not infinite
  scroll — the design has no pagination control, so this is a Design gap; default `page=1, limit=20`.

## Reuse (do NOT recreate)
| What | Path | How it's used here |
|------|------|--------------------|
| axios instance | src/lib/axios.ts | all request fns go through it (baseURL `/api`) |
| BFF proxy (catch-all) | src/app/api/[...path]/route.ts | already forwards `/api/products*` → backend; **no new BFF route needed** |
| query client | src/lib/query-client.ts | provided in app/providers.tsx |
| ProductCard (design) | src/features/products/components/product-card.tsx | bound as-is; receives mapped `{ name, price(string), imageUrl, inStock }` |
| ProductsGrid (design) | src/features/products/template/products-grid.tsx | swap hardcoded `SAMPLE` for `useProductsQuery` data |
| useAuth | src/hooks/use-auth.ts | only if an admin create form is added later (gate POST) |
| shared *Field (Input/Select/Textarea/Checkbox) | src/components/shared/form/* | only if the admin create form is built later |

## Types & schema
- `src/features/products/types/products.ts` — `Product` (mirror the spec `Product` schema, `price: number`
  in cents), `ProductListData = { items: Product[]; total: number; page: number; limit: number }`,
  and the envelope generics `{ success: boolean; data: T; message?: string }`. Types via `z.infer`
  where a schema exists; no parallel interfaces.
- `src/features/products/schema/products.schema.ts` — Zod schemas:
  - `productSchema` (matches `Product`; `price` integer, `imageUrl` optional url),
  - `productListEnvelopeSchema` / `productEnvelopeSchema` (validate the success envelope),
  - `productFiltersSchema` (`page`, `limit`, `search?`, `category?`),
  - `createProductSchema` (mirrors `CreateProductBody`; only if the admin form is built).

## Create
| File | Purpose |
|------|---------|
| src/features/products/types/products.ts | domain types from the observed spec `Product` / list `data` |
| src/features/products/schema/products.schema.ts | Zod product + envelope + filters (+ create) schemas |
| src/features/products/api/products.api.ts | `getProducts(filters)`, `getProduct(id)` (+ `createProduct(body)` later) via axios |
| src/features/products/hooks/use-products.ts | `useProductsQuery(filters)` (+ `useProductQuery(id)`, `useCreateProductMutation()` later) |
| src/features/products/lib/format-price.ts (or util) | cents→currency formatter used by the grid mapper |
| src/features/products/index.ts | barrel for the module's public surface |
| ~~src/app/api/products/route.ts~~ | **omit** — catch-all BFF proxy already covers `/api/products*` |

## Data-binding map
| Component (path) | Hook | Fields bound | States |
|------------------|------|--------------|--------|
| features/products/template/products-grid.tsx | `useProductsQuery(filters)` | `data.items[]` → maps each to ProductCard props; uses `data.total/page/limit` for pagination | loading skeleton grid / empty ("no products") / error |
| features/products/components/product-card.tsx | (rendered by grid) | `name`, `price` ← `formatPrice(price, currency)`, `imageUrl`, `inStock` | n/a (presentational) |

Field note: `slug`, `category`, `currency` are returned by the API but **not consumed** by the current
design (`ProductCard` shows name/price/image/stock only). They are available for filters/links later.

## Query/mutation hooks
- `useProductsQuery(filters)` — key `["products", filters]` (filters = `{ page, limit, search?, category? }`);
  selects `data` (the `{ items, total, page, limit }` object); page-based pagination from `total`/`limit`.
- `useProductQuery(id)` — key `["products", id]` — only if a detail screen is added.
- `useCreateProductMutation()` — POST /products, sends bearer token (admin); on success invalidates
  `["products"]` — only if an admin create form is added. Optimistic vs invalidate-on-success: TBD (see
  Open questions).

## Design gaps (build before/with binding)
- **Pagination / "load more" control** — API paginates (`page`/`limit`/`total`) but the grid has no
  control → build via figma-to-component / html-to-component.
- **Search + category filter UI** — API accepts `search` & `category` query params; no inputs exist.
- **Product detail screen** — GET /products/{id} exists; no design.
- **Admin create form** — POST /products exists; no design (would reuse shared *Field + useAuth gate).
- **Loading skeleton / empty / error states** — not present in the design.

## Edge cases & states
- Loading: skeleton cards while `useProductsQuery` is pending.
- Empty: `data.items.length === 0` → "No products found" (esp. when `search`/`category` filters applied).
- Error: `ErrorEnvelope` → inline message / toast; 404 only applies to detail; list has no error schema
  in the spec beyond a generic failure (flagged below).
- 401: only on POST (admin create) — gate the action with `useAuth`; not relevant to the public list.
- End-of-pagination: `page * limit >= total` → disable "next/load more".
- Price formatting: guard against `price` being cents (divide by 100) — never render raw integer.

## Out of scope
- Detail page binding (GET /products/{id}) and admin create binding (POST /products) — endpoints exist
  but no design; bind once those screens are built.
- Any backend changes — this is client-side binding only.
- Building the missing design pieces (pagination, filters, detail, form) — that's figma-to-component /
  html-to-component.

## Open questions
- **Scope confirmation**: bind only the list grid now, or also stand up detail + admin-create screens?
  (Assumed list-only — the only built design.)
- **List error shape**: the spec declares no error response for `GET /products` (only the 200 envelope).
  Assumed the generic `ErrorEnvelope` on failure — confirm against the real server, since this fact is
  not in the spec.
- **Currency display**: `currency` is per-product (`"USD"` example). Confirm formatting locale/symbol
  rules (the design's `SAMPLE` hardcoded `"$"`).
- **Pagination UX**: page buttons vs "load more"/infinite scroll — design has none; assumed page-based.
- **`slug` usage**: returned but unused; intended for product detail routing (`/products/[slug]` vs
  `/products/[id]`)? GET-one is keyed by `id` in the spec, so detail routing would use `id`.
