# Feature plan: products (API binding)

> Status: draft — edit freely, then hand to frontend-module-builder. Add/remove any section.

## Overview
Binds the already-built products grid design (`features/products/template/products-grid.tsx`
+ `features/products/components/product-card.tsx`), which currently renders a hardcoded
`SAMPLE` array, to the real backend products list endpoint so it shows live data. Scope of
this pass is the **list/grid** (read-only). Detail and create are out of scope (see below).

## API contract (observed)
> Source: **Rung 1 — monorepo backend source**, `.claude/workspace.json` → `backend/`.
> Read chain: `src/app.ts` (mount) → `modules/products/products.routes.ts` →
> `products.controller.ts` → `products.service.ts` → `products.schema.ts` → `products.model.ts`,
> envelope confirmed against `backend/ARCHITECTURE.md` + `src/lib/app-response.ts`.

**Mount:** `app.use("/api/products", productsRouter)` — backend already serves under `/api`.
The frontend BFF catch-all forwards same-origin `/api/*` → backend, so the browser path is
`/api/products` (1:1, no path rewrite). axios `baseURL` is `/api`, so request fns use `/products`.

**Success envelope (exact, from `lib/app-response.ts`):**
`{ success: true, data: <data>, message: string }` — `ok()` = 200, `created()` = 201.

**Error envelope (from `backend/ARCHITECTURE.md`):**
`{ success: false, message: string, code: string }` — NotFound→404, Conflict→409,
Unauthorized→401, Validation→422.

| Method | Path | Auth | Request | Response `data` shape |
|--------|------|------|---------|------------------------|
| GET | /products | public | query: `page` (int≥1, default 1), `limit` (int 1–100, default 20), `search?` (string), `category?` (string) | `{ items: Product[], total: number, page: number, limit: number }` |
| GET | /products/:id | public | params: `id` (24-hex ObjectId) | `Product` — *out of scope this pass* |
| POST | /products | protect + requireRole('admin') | body: name, price, currency, category, inStock, imageUrl? | `Product` — *out of scope this pass* |

**`Product`** (the `ProductDTO` returned by the service, `products.service.ts`):
`{ id: string, name: string, slug: string, price: number (integer, CENTS), currency: string (ISO-4217, e.g. "USD"), category: string, inStock: boolean, imageUrl?: string }`

> Note on price: the API returns `price` as an **integer in cents** plus a `currency` code.
> The built `ProductCard` expects a pre-formatted `price` **string** (e.g. `"$24.00"`). The
> binding must format cents+currency → display string at the edge (e.g. `Intl.NumberFormat`),
> not change the design prop. No data gap — both fields are available.

## Decisions
- **Scope = list only.** User asked to make the grid show real data → bind the GET list. Detail
  page and admin create are explicitly out of scope for this pass.
- **Pagination = server-side, paged.** API only supports `page`/`limit` (no cursor/infinite). 
  - _Assumption_: fetch **page 1 at default limit (20)** and render it, since the built grid has
    no pagination controls. If more than 20 products must show, that needs a pager UI (design gap).
- **Search / category filter = deferred.** API supports `search` + `category` server-side, but the
  design has no search/filter inputs. Hook will accept an optional `filters` arg (future-proof) but
  the grid passes none for now. _Assumption — correct me if a search box should ship with this._
- **Route = existing.** The `ProductsGrid` template is already rendered by the products screen;
  binding wires data into it in place. No new `app/products/page.tsx` created here.
- **Price formatting** done in a small `formatPrice(cents, currency)` helper at the binding layer.

## Reuse (do NOT recreate)
| What | Path | How it's used here |
|------|------|--------------------|
| axios instance | src/lib/axios.ts | all request fns go through `api` (baseURL `/api`) |
| BFF proxy (catch-all) | src/app/api/[...path]/route.ts | already forwards `/api/products` → backend; **no new BFF route needed** |
| query client | src/lib/query-client.ts | provided in app/providers.tsx; powers the query hook |
| ProductCard (built) | src/features/products/components/product-card.tsx | bind real fields into it — do NOT rebuild |
| ProductsGrid (built) | src/features/products/template/products-grid.tsx | replace `SAMPLE` with query data — keep the layout/markup |
| useAuth | src/hooks/use-auth.ts | not needed for the public list; reserved for the out-of-scope admin create |

> Shared `*Field` form components are NOT used in this pass (no form — list only).

## Types & schema
- `src/features/products/types/product.ts` — `Product` (mirror `ProductDTO` exactly) and
  `ProductsListResponse` = `{ items: Product[]; total: number; page: number; limit: number }`.
  Prefer deriving from the Zod schemas via `z.infer` (no parallel interfaces).
- `src/features/products/schema/product.schema.ts` — Zod:
  - `productSchema` — id, name, slug, price (int), currency, category, inStock, imageUrl?(url) →
    `Product = z.infer<typeof productSchema>`.
  - `productsListResponseSchema` — `{ items: productSchema[], total, page, limit }`.
  - `productFiltersSchema` — `{ page?, limit?, search?, category? }` (the GET query, all optional
    on the client; defaults mirror the backend: page 1, limit 20).
  - The hook should validate the **`data`** payload (after unwrapping the envelope) against
    `productsListResponseSchema` so a contract drift fails loudly.

## Create
| File | Purpose |
|------|---------|
| src/features/products/types/product.ts | `Product`, `ProductsListResponse` (from `z.infer`) |
| src/features/products/schema/product.schema.ts | Zod product + list-response + filters schemas |
| src/features/products/api/products.api.ts | `fetchProducts(filters)` → `GET /products`, unwraps `{data}`, validates |
| src/features/products/hooks/use-products.ts | `useProductsQuery(filters?)` TanStack hook |
| src/features/products/lib/format-price.ts | `formatPrice(cents, currency)` → display string (Intl.NumberFormat) |
| src/features/products/index.ts | barrel for the module's public surface |
| ~~src/app/api/products/route.ts~~ | NOT needed — catch-all BFF proxy already covers `/api/products` |

## Data-binding map
| Component (path) | Hook | Fields bound | States |
|------------------|------|--------------|--------|
| features/products/template/products-grid.tsx | `useProductsQuery()` | `data.items` → maps to ProductCard; remove `SAMPLE` | loading skeleton grid / empty state / error message |
| features/products/components/product-card.tsx | (via grid props) | `name`, `inStock`, `imageUrl`; `price`+`currency` → `formatPrice()` string; `key={id}` | renders as-is (design unchanged) |

## Query/mutation hooks
- `useProductsQuery(filters?)` — key `["products", filters ?? {}]`; calls `fetchProducts`; returns
  `items/total/page/limit`. No mutations in this pass.
  - loading → render skeleton cards in the grid.
  - empty (`items.length === 0`) → empty-state copy ("No products yet").
  - error → inline error message (toast optional); query retries per QueryClient defaults.

## Design gaps (build before/with binding)
- **Pagination / "load more" control** — none built; only page 1 shows. Build via
  figma-to-component / html-to-component if >20 products must be browsable.
- **Search / category filter inputs** — none built; API supports them server-side. Build if needed.
- **Loading skeleton + empty-state** — not in the current design; small additions needed for the
  states above (can be simple inline placeholders).
- Core grid + card: **complete** — no rebuild.

## Edge cases & states
- Loading: skeleton grid while the query is pending.
- Empty: `items` empty → friendly empty state instead of a blank grid.
- Request error: inline error (and/or toast); offer retry.
- Price/currency formatting: guard against missing/zero; format cents → currency string.
- `imageUrl` absent: card already handles (conditional `<img>`).
- 401: list is public, so not expected here; relevant only to the out-of-scope admin create.
- End-of-pagination: N/A until a pager exists (single page for now).

## Out of scope
- GET `/products/:id` detail screen/binding.
- POST `/products` admin create form (would use shared `*Field` + `useAuth` role gating + 401/409 handling).
- Update/delete (no backend endpoints exist for them).
- Search/filter UI and pagination UI (data supported; design not built).

## Open questions
1. Should a **search box and/or category filter** ship with this binding (API already supports
   `search` + `category`), or is the plain first-page grid enough for now? (Assumed: plain grid.)
2. Is **page 1 / limit 20** acceptable for launch, or is a pager / infinite-scroll required? (Assumed: page 1.)
3. Confirm `ProductCard` should keep taking a **formatted price string** (binding formats cents),
   vs. refactoring the card to take `price:number` + `currency`. (Assumed: keep the string prop.)
