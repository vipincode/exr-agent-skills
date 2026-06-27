# Feature plan: products (API binding)

> Status: draft — edit freely, then hand to frontend-module-builder. Add/remove any section.

## Overview
Bind the already-built products grid design (`features/products/template/products-grid.tsx` +
`features/products/components/product-card.tsx`, currently rendering a hardcoded `SAMPLE` array)
to the real backend products list endpoint so the grid shows live data. Scope is the **list
binding** (GET /api/products); the detail and create endpoints exist in the API but are out of
scope for this task (see Out of scope).

## API contract (observed)
> Source: **Rung 1 — monorepo backend source** (`backend/src/modules/products/*` and
> `backend/src/lib/app-response.ts`, confirmed against `backend/ARCHITECTURE.md`). Highest fidelity;
> field types read from the service `ProductDTO` and Mongoose model, not guessed.

**Success envelope:** `{ "success": true, "data": <data>, "message": string }` — 200 via `ok()`,
201 via `created()` (from `src/lib/app-response.ts`).
**Error envelope:** `{ "success": false, "message": string, "code": string }` — statuses:
401 (UnauthorizedError), 404 (NotFoundError), 409 (ConflictError), 422 (ValidationError).

| Method | Path | Auth | Request (params / query / body) | Response `data` shape |
|--------|------|------|----------------------------------|------------------------|
| GET | /api/products | public | query: `page` (int ≥1, default 1), `limit` (int 1–100, default 20), `search?` (string), `category?` (string) | `{ items: Product[], total: number, page: number, limit: number }` |
| GET | /api/products/:id | public | params: `id` (24-hex ObjectId) | `Product` |
| POST | /api/products | protect + requireRole('admin') | body: `name`, `price` (int cents, >0), `currency` (3-letter, default "USD"), `category`, `inStock` (bool, default true), `imageUrl?` (url) | `Product` (201) |

`Product` (the backend `ProductDTO`) =
`{ id: string, name: string, slug: string, price: number /* integer CENTS */, currency: string /* ISO-4217, e.g. "USD" */, category: string, inStock: boolean, imageUrl?: string }`

> Note the **price is integer cents** (e.g. `2400`) plus a separate `currency`. The built
> `ProductCard` expects a pre-formatted `price: string` (e.g. `"$24.00"`) — the binding owns the
> cents→formatted-string transform (see Data mapping). The API has no `createdAt/updatedAt` in the
> DTO (model has timestamps, but the DTO omits them) — don't bind fields the DTO doesn't return.

## Decisions
- **Scope of this binding:** list only — replace the `SAMPLE` array in `products-grid.tsx` with live
  data from GET /api/products. (Detail/create endpoints exist but aren't part of "show real data".)
- **Pagination:** the server only supports **paged** queries (`page`/`limit`). _Assumption_: bind the
  first page with the API default `limit` (20) and no pager UI for now, since the design has no
  pagination control. A pager / infinite-scroll is a follow-up (see Design gaps + Open questions).
- **Filtering/search:** server-side `search` + `category` query params are available but the design
  has no search/filter UI. _Assumption_: not wired in this pass; the query hook accepts a `filters`
  arg so it's a drop-in once the UI exists.
- **Route:** _Assumption_: `ProductsGrid` is rendered by an existing products page/route; this binding
  swaps its data source and does not create a new route.
- **Price formatting:** format `price` (cents) + `currency` into the `ProductCard` `price: string`
  via `Intl.NumberFormat` in the mapping layer; the card component stays as-is.

## Dependencies
What must be in place for this binding to actually work — distinct from Reuse (code we import).
| Dependency | Needed for | Status / unblock path |
|------------|-----------|------------------------|
| GET /api/products endpoint | the list query | ✅ exists — `backend/src/modules/products` (public, paged) |
| BFF catch-all proxy forwards `/api/*` | browser → backend transport | ✅ exists — `src/app/api/[...path]/route.ts` (covers `/api/products`; no per-feature route needed) |
| `BACKEND_URL` env | proxy → backend target | ⚠️ verify it's set in the frontend `.env` (proxy impl is elided in the fixture) |
| Auth / `useAuth` real user+role | only the admin-gated POST create | ⚠️ `useAuth` stub returns `{ user: null }`. **Not required for this list binding** (GET is public); becomes a blocker only if/when the create path is bound. |
| Built design (grid + card) | rendering live data | ✅ exists — `ProductsGrid`, `ProductCard`. Loading/empty/error + pager states are NOT built (see Design gaps). |

## Reuse (do NOT recreate)
| What | Path | How it's used here |
|------|------|--------------------|
| axios instance (`api`) | src/lib/axios.ts | the products request fn goes through it (baseURL `/api`) |
| BFF proxy (catch-all) | src/app/api/[...path]/route.ts | already forwards `/api/products` → backend; no new BFF route |
| queryClient | src/lib/query-client.ts | provides TanStack Query (in app/providers.tsx) |
| ProductCard (built) | src/features/products/components/product-card.tsx | bound, unchanged — fed mapped props |
| ProductsGrid (built) | src/features/products/template/products-grid.tsx | edited to consume the query hook instead of `SAMPLE` |
| useAuth | src/hooks/use-auth.ts | only if the admin create path is later bound — not used by this list binding |
| Shared `*Field` set | src/components/shared/form/* | not used here (no form in the list binding); reserved for the future create form |

## Types & schema
- `src/features/products/types/products.ts` — `Product` (mirror the DTO exactly: `price` is cents
  `number`, `currency` string) and `ProductListResponse` = `{ items: Product[]; total: number;
  page: number; limit: number }`. Types via `z.infer` of the schemas below — **no parallel interfaces.**
- `src/features/products/schema/products.schema.ts` — Zod schemas mirroring the observed envelope:
  - `productSchema` → `{ id, name, slug, price (int), currency, category, inStock, imageUrl? }`
  - `productListDataSchema` → `{ items: productSchema[], total, page, limit }`
  - `productsEnvelopeSchema` → `{ success: literal(true), data: productListDataSchema, message }`
    (parse the response so envelope/field drift fails loudly).
  - `productFiltersSchema` (optional) → `{ page?, limit?, search?, category? }` for the query arg.

## Create
| File | Purpose |
|------|---------|
| src/features/products/types/products.ts | `Product`, `ProductListResponse` from the observed `data` shape (via z.infer) |
| src/features/products/schema/products.schema.ts | Zod schemas: product, list-data, success envelope, filters |
| src/features/products/api/products.api.ts | `fetchProducts(filters)` → `api.get("/products", { params })`, unwrap + Zod-parse `data` |
| src/features/products/hooks/use-products.ts | `useProductsQuery(filters)` TanStack hook (key `["products", filters]`) |
| src/features/products/lib/format-price.ts | `formatPrice(cents, currency)` → `"$24.00"` via `Intl.NumberFormat` (cents/100) |
| src/features/products/index.ts | barrel exporting the module's public surface |
| ~~src/app/api/products/route.ts~~ | **omit** — the catch-all BFF proxy already covers `/api/products` |

(Edit, not create: `template/products-grid.tsx` to consume `useProductsQuery` and drop `SAMPLE`.)

## Data mapping
| Component (path) | Hook | Fields bound | States |
|------------------|------|--------------|--------|
| features/products/template/products-grid.tsx | `useProductsQuery()` | maps each `data.items[]` → `<ProductCard>`; `name`→name, `formatPrice(price,currency)`→price, `imageUrl`→imageUrl, `inStock`→inStock | loading skeleton / empty state / error message |
| features/products/components/product-card.tsx | (props from grid) | `name`, `price` (formatted string), `imageUrl?`, `inStock` | static — receives mapped props; unchanged |

Transform: `price` (integer cents) + `currency` → display string via `formatPrice` before it reaches
`ProductCard`. `slug`, `category`, `total/page/limit` are fetched but not rendered by the current card
(category/pager are design gaps).

## Query/mutation hooks
- `useProductsQuery(filters?)` — key `["products", filters]`; calls `fetchProducts`, returns the
  Zod-validated `{ items, total, page, limit }`. Default filters `{ page: 1, limit: 20 }`.
  - loading → grid renders skeleton cards; empty (`items.length === 0`) → empty-state copy;
    error → inline error message (toast optional).
- No mutation hooks in this pass (create is out of scope). When added: `useCreateProductMutation()`
  would invalidate `["products"]` on success and be gated by `useAuth().user?.role === "admin"`.

## Design gaps (build before/with binding)
- **Loading / empty / error states** — the grid has no skeleton, empty-state, or error UI. Build
  lightweight versions (skeleton card, empty copy, inline error) → figma-to-component / html-to-component,
  or stub inline as part of the binding.
- **Pagination control** — no pager / "load more" / infinite-scroll UI exists; needed to reach pages
  beyond the first. Out of scope here; flag for a follow-up design pass.
- **Search / filter / category UI** — API supports `search` + `category`; no controls built.
- Otherwise the core grid + card design is complete and ready to bind.

## Edge cases & states
- **Loading** — skeleton grid while the query is pending.
- **Empty list** — `items` empty → empty-state message, not a blank grid.
- **Request error** — network/5xx or envelope `success: false` → inline error (retry affordance).
- **Zod drift** — response failing `productsEnvelopeSchema` throws → surfaced as an error, never
  silently rendered.
- **End of pagination** — only relevant once a pager exists; first page only for now.
- **401 / auth** — not applicable to the public list GET; relevant only to the future admin create.

## Testing checklist
Behavior a correct binding must satisfy — handoff target for frontend-test-writer. Checkboxes, not test code.
- [ ] Grid renders live products from GET /api/products (hardcoded `SAMPLE` removed).
- [ ] Loading, empty, and error states each render correctly.
- [ ] Response envelope is unwrapped (`data`) and passes `productsEnvelopeSchema` — drift fails loudly.
- [ ] Price displays correctly: integer cents + currency → formatted string (e.g. `2400`/`USD` → `"$24.00"`).
- [ ] `inStock` renders the correct In stock / Sold out state per item.
- [ ] Query uses key `["products", filters]` and requests page 1 / limit 20 by default.
- [ ] Browser calls only same-origin `/api/products` (through the BFF proxy), never the backend directly.

## Out of scope
- GET /api/products/:id detail view and POST /api/products admin create (endpoints exist; not part of
  "show real data" for the grid).
- Pagination, search, filter, and category UI (no design yet — see Design gaps).
- Wiring real auth into `useAuth` (only needed for the create path).

## Open questions
- **Pager strategy** when we go past page 1: paged controls, "load more", or infinite scroll? (Drives
  the final query-hook shape — currently single-page.)
- **`BACKEND_URL`** confirmed set in the frontend env? (Proxy impl is elided in the fixture.)
- **Currency display** — assume one currency (USD) per the model default, or must the formatter handle
  mixed currencies per item? (Formatter already takes `currency` per item, so mixed is supported.)
- Is `ProductsGrid` rendered by an existing route/page, or does a `app/products/page.tsx` still need
  to mount it?
