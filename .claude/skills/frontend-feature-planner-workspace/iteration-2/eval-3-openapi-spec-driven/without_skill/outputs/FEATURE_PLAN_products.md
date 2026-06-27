# FEATURE PLAN — Bind the Products design to the backend API

**Status:** Plan only (no binding code written here).
**Ground truth:** `backend/openapi.json` (OpenAPI 3.0.3, `demo-api` v1.0.0). No backend source exists, so the spec IS the contract.
**Frontend conventions:** `frontend/ARCHITECTURE.md` + `frontend/MODULE_REGISTRY.md`.

---

## 1. What the backend actually exposes (from openapi.json)

Server base path: `/api` (matches the BFF/axios `baseURL: "/api"` — no path rewriting needed).

| Method & path | Auth | Purpose | Request | Success response |
|---|---|---|---|---|
| `GET /products` | public (`security: []`) | list, paginated + filter | query: `page` (int≥1, default 1), `limit` (int 1–100, default 20), `search` (string), `category` (string) | `200` → `ProductListEnvelope` |
| `POST /products` | `bearerAuth` (admin) | create product | body `CreateProductBody` | `201` → `ProductEnvelope`; `401` → `ErrorEnvelope` |
| `GET /products/{id}` | public | get one | path: `id` (string) | `200` → `ProductEnvelope`; `404` → `ErrorEnvelope` |

### Envelope shape (critical — every response is wrapped)
- `ProductEnvelope` = `{ success: boolean, data: Product, message?: string }`
- `ProductListEnvelope` = `{ success: boolean, data: { items: Product[], total, page, limit }, message? }`
- `ErrorEnvelope` = `{ success: boolean, message?: string, code?: string }`

> Implication: hooks must unwrap `.data.data` (envelope `data`, then list `data`). Don't bind the design straight to the axios `response.data`.

### `Product` schema (the real field contract)
required: `id, name, slug, price, currency, category, inStock`; optional: `imageUrl`.
- `id: string`
- `name: string`
- `slug: string`
- `price: integer` — **in CENTS** (e.g. `2400` = $24.00)
- `currency: string` (e.g. `"USD"`)
- `category: string`
- `inStock: boolean`
- `imageUrl?: string (uri)`

### `CreateProductBody`
required: `name, price (cents), category`; optional: `currency` (default `"USD"`), `inStock` (default `true`), `imageUrl`.

---

## 2. Gap analysis — design vs. API contract

The current design is "DESIGN ONLY" with hardcoded sample data. Mismatches to resolve when binding:

| Concern | Design today | API truth | Resolution |
|---|---|---|---|
| Price | `price: "$24.00"` (pre-formatted **string**) | `price: integer` in **cents** + separate `currency` | Add a `formatPrice(cents, currency)` formatter; card prop becomes `priceCents: number` + `currency`, or accept the raw `Product` and format internally. |
| Identity | card keyed by `name` | each product has `id` + `slug` | Key list by `id`; use `slug`/`id` for any future detail link. |
| Fields present | `name, price, imageUrl?, inStock` | also `id, slug, currency, category` | Extend the card's prop type (or have it accept `Product`) so `category`/`id` are available. |
| List shape | flat array `SAMPLE[]` | `{ items, total, page, limit }` envelope | Grid consumes `data.items`; `total/page/limit` drive pagination UI. |
| Filters | none | `search`, `category`, `page`, `limit` | Add filter/query state; feed into query key + request params. |
| Auth | none | GET public, POST admin-only (`bearerAuth`) | List/detail need no token. Create gates on `useAuth().user?.role === "admin"` + bearer header. |

---

## 3. Binding plan — files to add (follows feature module anatomy)

Per ARCHITECTURE.md, `features/products/` should own `types/ schema/ api/ hooks/`. Today it only has `components/ template/`. The BFF catch-all (`app/api/[...path]/route.ts`) already forwards `/api/products` — **no new BFF route needed**. Reuse the single axios (`lib/axios.ts`) and the single QueryClient. Types come from `z.infer` (no parallel interfaces).

```
src/features/products/
  schema/
    product.schema.ts      # Zod source of truth, mirrors openapi schemas
  types/
    product.types.ts       # export type Product = z.infer<...>, etc.
  api/
    products.api.ts        # axios fns, unwrap envelope
    products.queries.ts    # TanStack Query hooks (or hooks/)
  lib/ (or shared lib)
    format-price.ts        # cents+currency -> display string
  components/product-card.tsx   # EXTEND prop type to real Product fields
  template/products-grid.tsx    # REPLACE SAMPLE with useProductsQuery
  index.ts
```

### 3a. Zod schemas (`schema/product.schema.ts`) — mirror the spec exactly
```ts
export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  price: z.number().int(),        // CENTS
  currency: z.string(),
  category: z.string(),
  inStock: z.boolean(),
  imageUrl: z.string().url().optional(),
});

export const productListDataSchema = z.object({
  items: z.array(productSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
});

// Generic envelope helper
const envelope = <T extends z.ZodTypeAny>(data: T) =>
  z.object({ success: z.boolean(), data, message: z.string().optional() });

export const productEnvelopeSchema = envelope(productSchema);
export const productListEnvelopeSchema = envelope(productListDataSchema);

export const createProductBodySchema = z.object({
  name: z.string().min(1),
  price: z.number().int(),
  currency: z.string().default("USD"),
  category: z.string().min(1),
  inStock: z.boolean().default(true),
  imageUrl: z.string().url().optional(),
});

export const productFiltersSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  category: z.string().optional(),
});
```

### 3b. Types (`types/product.types.ts`) — from z.infer only
`Product`, `ProductListData`, `CreateProductBody`, `ProductFilters` = `z.infer<typeof ...>`.

### 3c. API functions (`api/products.api.ts`) — unwrap the envelope
```ts
// GET /products?page&limit&search&category  -> returns ProductListData (already unwrapped)
listProducts(filters): validate response with productListEnvelopeSchema -> return env.data
// GET /products/{id} -> return productEnvelopeSchema.parse(res.data).data
getProduct(id)
// POST /products (admin) -> body validated by createProductBodySchema; axios attaches bearer token
createProduct(body)
```
All calls go through `api` (`lib/axios.ts`, baseURL `/api`). Validate responses with the Zod schemas so the design never receives a shape the spec didn't promise.

### 3d. Query hooks (`api/products.queries.ts`)
- `useProductsQuery(filters)` — key `["products", filters]` (namespaced array per ARCHITECTURE). Returns `{ items, total, page, limit }`.
- `useProductQuery(id)` — key `["products", id]`, `enabled: !!id`.
- `useCreateProductMutation()` — `onSuccess` invalidates `["products"]`. Guard the calling UI on admin role.

### 3e. Price formatter
`formatPrice(cents: number, currency: string)` → `new Intl.NumberFormat(undefined, { style: "currency", currency }).format(cents / 100)`. Place in `features/products/lib` (or `src/lib` if it becomes shared). Register in MODULE_REGISTRY if shared.

---

## 4. Data-binding map (design field → API source)

`ProductCard`:
| Prop | Source |
|---|---|
| `name` | `product.name` |
| price text | `formatPrice(product.price, product.currency)` |
| `imageUrl` | `product.imageUrl` (optional → keep fallback) |
| `inStock` | `product.inStock` |
| `key` / link | `product.id` / `product.slug` |

`ProductsGrid`:
- delete `SAMPLE`; call `useProductsQuery(filters)`.
- map `data.items` → `<ProductCard key={p.id} product={p} />`.
- add loading / empty / error states (error → read `ErrorEnvelope.message`).
- wire `search` / `category` / pagination (`total`, `page`, `limit`) to filter state.

---

## 5. Auth handling
- `GET /products` and `GET /products/{id}` are public — no token, render for everyone.
- `POST /products` requires `bearerAuth`. Only surface create UI when `useAuth().user?.role === "admin"`; axios must send `Authorization: Bearer <token>`. Handle `401 ErrorEnvelope` by showing `message`.

## 6. Out of scope / open questions for backend owner
- Where does the bearer token come from? (`useAuth` currently returns `null`.) Confirm token source before building create.
- `imageUrl` may be absent — design already guards it; keep the fallback.
- No update/delete endpoints in the spec — don't design for them yet.
- Confirm `search` semantics (name-only vs. full text) — affects UX copy only, not the binding.

## 7. Suggested build order (handoff to module-builder)
1. schema → types (z.infer)
2. api fns (envelope unwrap + Zod validate)
3. query hooks
4. formatPrice
5. extend ProductCard prop type
6. bind ProductsGrid (states + filters)
7. update MODULE_REGISTRY.md (mark products as bound; add formatPrice if shared)
