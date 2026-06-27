# Feature plan: products (API binding)

> Status: draft — edit freely, then hand to frontend-module-builder. Add/remove any section.

## Overview
Binds the already-built **products design** (`features/products/template/products-grid.tsx` +
`features/products/components/product-card.tsx`, currently rendering a hardcoded `SAMPLE` array)
to the backend products API. Goal: make the products grid render **live, paginated** data from
`GET /products`, with types/schemas/BFF that mirror the real response envelope. The admin
`POST /products` (create) and `GET /products/{id}` (detail) endpoints exist in the contract and are
planned here, but their UI is a **design gap** (no form / detail screen built yet).

## API contract (observed)
> Source: **Rung 3 — OpenAPI / Swagger spec**, `backend/openapi.json` (openapi 3.0.3, `demo-api` v1.0.0).
> No backend source code and no backend `ARCHITECTURE.md` / `MODULE_REGISTRY.md` were available
> (Rungs 1 & 2 not reachable), so all facts below are derived from the spec, not from source.
> `servers[0].url = "/api"`, matching the frontend BFF/axios `baseURL: "/api"`.

**Success envelope (single):** `{ success: true, data: Product, message?: string }` — `ProductEnvelope`
**Success envelope (list):** `{ success: true, data: { items: Product[], total, page, limit }, message?: string }` — `ProductListEnvelope`
**Error envelope:** `{ success: false, message: string, code?: string }` — `ErrorEnvelope`; statuses observed: **401** (POST, unauthorized), **404** (GET by id, not found).

| Method | Path | Auth | Request (params / query / body) | Response `data` shape |
|--------|------|------|--------------------------------|------------------------|
| GET | /products | public (`security: []`) | query: `page` (int, min 1, default 1), `limit` (int, min 1, max 100, default 20), `search?` (string), `category?` (string) | `{ items: Product[], total: int, page: int, limit: int }` (200) |
| GET | /products/{id} | public (`security: []`) | path: `id` (string) | `Product` (200) / `ErrorEnvelope` (404) |
| POST | /products | **bearerAuth** (admin) | body: `CreateProductBody` | `Product` (201) / `ErrorEnvelope` (401) |

**`Product`** (required: id, name, slug, price, currency, category, inStock):
- `id: string`
- `name: string`
- `slug: string`
- `price: integer` — **in CENTS** (per spec description) → format to currency for display
- `currency: string` (e.g. `"USD"`)
- `category: string`
- `inStock: boolean`
- `imageUrl?: string` (uri, optional)

**`CreateProductBody`** (required: name, price, category):
- `name: string`, `price: integer` (cents), `category: string`
- `currency?: string` (default `"USD"`), `inStock?: boolean` (default `true`), `imageUrl?: string` (uri)

## Decisions
- **Scope of this binding:** the **list** (`GET /products`) is the primary, in-scope binding — it
  replaces the hardcoded `SAMPLE` in `products-grid.tsx`. Detail + create hooks/types are planned
  from the contract but their UI is deferred (see Design gaps).
- **Existing route, not new:** binds the already-built `ProductsGrid` template; no new `page.tsx`.
- **Pagination:** server-side **paged** (the API only supports `page`/`limit`; not infinite scroll,
  not load-all) — driven directly by the observed query params.
- **Filtering/search:** server-side via `search` + `category` query params (observed). Wire the
  hook to accept them; UI controls for them are optional/out of scope for this pass.
- **Auth gating:** `POST /products` is bearer/admin-gated → the create action (when built) is
  hidden for non-admins via `useAuth`. No token plumbing exists yet (see Dependencies).
- _Assumption_: the skill would normally ask "list vs detail vs create, and which UI controls?"
  Per the task's standing instruction, I assumed **list-binding is the goal** (the only fully
  built design) and proceeded; detail/create are contract-ready but UI-deferred. Correct me if the
  create form was meant to be in scope now.
- _Assumption_: `price` is rendered as a formatted currency string from cents using `currency`
  (e.g. `2400` + `"USD"` → `"$24.00"`), matching the design's existing `price: string` prop.

## Dependencies
What must be in place for this binding to actually work — distinct from Reuse (code we import).
| Dependency | Needed for | Status / unblock path |
|------------|-----------|------------------------|
| `GET /products` endpoint | list binding (in scope) | ✅ exists in spec (`backend/openapi.json`) |
| `GET /products/{id}` endpoint | detail (deferred) | ✅ exists in spec — UI not built |
| `POST /products` endpoint | admin create (deferred) | ✅ exists in spec — UI not built |
| `BACKEND_URL` env | BFF catch-all → backend | ⚠️ assumed set; confirm `.env` has it (spec `servers.url = /api` aligns with axios baseURL) |
| `useAuth` returns a real user+role | admin-gated create path | ⚠️ **stub returns `{ user: null }`** (`hooks/use-auth.ts`) — must be wired before the create path works; does not block the public list |
| Bearer token reaching the backend on `POST` | authorized create (401 otherwise) | ❌ no auth/token plumbing through the BFF yet — out of scope for the list, required before create works |
| Product **detail** screen + **create form** design | detail/create UI | ❌ not built — see Design gaps (figma-to-component / html-to-component) |
| Live backend behind `BACKEND_URL` matching this spec | runtime data | ⚠️ contract is spec-only (no source verified); Zod will catch drift at runtime |

## Reuse (do NOT recreate)
| What | Path | How it's used here |
|------|------|--------------------|
| axios instance | src/lib/axios.ts | all request fns go through it (`baseURL: "/api"`) |
| BFF proxy (catch-all) | src/app/api/[...path]/route.ts | already forwards `/api/products*` → backend; **no new BFF route needed** |
| query client | src/lib/query-client.ts | single QueryClient, provided in app/providers.tsx |
| InputField / SelectField / CheckboxField / TextareaField | src/components/shared/form/* | the create/edit form fields (when that UI is built) |
| useAuth | src/hooks/use-auth.ts | gate admin-only create mutation in the UI |
| ProductCard | src/features/products/components/product-card.tsx | reused as-is; bind real fields (name, formatted price, imageUrl, inStock) |
| ProductsGrid | src/features/products/template/products-grid.tsx | reused; swap hardcoded `SAMPLE` for `useProductsQuery` data |

## Types & schema
- `src/features/products/types/product.ts` — `Product` and `ProductListData` (`{ items, total, page, limit }`)
  mirroring the envelope `data`. Types via `z.infer` from the schema below — **no parallel interfaces**.
- `src/features/products/schema/products.schema.ts` — Zod schemas:
  - `productSchema` — id, name, slug, price (int/cents), currency, category, inStock, imageUrl optional.
  - `productListDataSchema` — `{ items: productSchema[], total, page, limit }`.
  - `productEnvelopeSchema` / `productListEnvelopeSchema` — `{ success, data, message? }` wrappers (validated, then `data` unwrapped).
  - `createProductSchema` — name, price (int), category required; currency/inStock/imageUrl optional with defaults — for the create form (deferred UI).
  - `productFiltersSchema` — `{ page, limit, search?, category? }` for the query hook.

## Create
| File | Purpose |
|------|---------|
| src/features/products/types/product.ts | domain types from the observed `data` shape (via z.infer) |
| src/features/products/schema/products.schema.ts | Zod request/response/form schemas |
| src/features/products/api/products.api.ts | request fns: `getProducts(filters)`, `getProduct(id)`, `createProduct(body)` — hit `/api/products*` via axios, validate + unwrap envelope |
| src/features/products/hooks/use-products.ts | `useProductsQuery`, `useProductQuery`, `useCreateProductMutation` |
| src/features/products/index.ts | barrel for the module's public surface |
| ~~src/app/api/products/route.ts~~ | **OMIT** — catch-all BFF already proxies `/api/products` |
| src/features/products/components/product-form.tsx | _deferred design gap_ — create form (admin) |
| src/features/products/template/product-detail.tsx | _deferred design gap_ — single-product screen |

## Data mapping
| Component (path) | Hook | Fields bound | States |
|------------------|------|--------------|--------|
| features/products/template/products-grid.tsx | useProductsQuery(filters) | iterates `data.items`; passes each to ProductCard; uses `total/page/limit` for pager | loading skeleton / empty / error |
| features/products/components/product-card.tsx | (rendered by grid) | `name`; `price` ← format(price cents, currency); `imageUrl`; `inStock` | n/a (presentational) |
| features/products/components/product-form.tsx (deferred) | useCreateProductMutation | name, price, category, currency?, inStock?, imageUrl? → POST body | submit/disabled/error; admin-only |

**Transforms:** `price` (cents int) + `currency` → formatted string (e.g. `2400,"USD"` → `"$24.00"`)
before passing to `ProductCard` (whose `price` prop is already a `string`). `slug` available for
detail links; `category` available for filtering.

## Query/mutation hooks
- `useProductsQuery(filters)` — key `["products", filters]` where `filters = { page, limit, search?, category? }`;
  paged via `page`/`limit`; `keepPreviousData` for smooth page transitions.
- `useProductQuery(id)` — key `["products", "detail", id]`; enabled when `id` present.
- `useCreateProductMutation()` — on success invalidates `["products"]`; invalidate-on-success
  (not optimistic — list is paginated/server-filtered). Gated by `useAuth` admin role in the UI.
- loading / empty / error handled per hook (see Edge cases).

## Design gaps (build before/with binding)
- **Product detail screen** — `GET /products/{id}` exists but no detail template/route is built → figma-to-component / html-to-component.
- **Create product form** — `POST /products` exists but no admin form is built → figma-to-component / html-to-component (then reuse shared `*Field`).
- The **list** path has no design gap — `ProductsGrid` + `ProductCard` are built and ready to bind.

## Edge cases & states
- **Loading:** grid shows skeleton cards while `useProductsQuery` is pending.
- **Empty:** `data.items.length === 0` → empty-state message (e.g. "No products found").
- **Error:** request/envelope failure → inline/toast error; Zod validation failure surfaces loudly (drift from spec).
- **Pagination:** advance via `page`; stop when `page * limit >= total` (no fetch past last page).
- **401 (create):** unauthorized POST → ErrorEnvelope; handle re-auth / hide action for non-admins.
- **404 (detail):** `GET /products/{id}` not found → `notFound()` / inline message (deferred with detail UI).
- **Envelope drift:** if the live backend's shape differs from the spec, the Zod parse fails — caught, not silently rendered.

## Testing checklist
Behavior a correct binding must satisfy — handoff target for frontend-test-writer. Checkboxes, not test code.
- [ ] Products grid renders live data from `GET /products` (hardcoded `SAMPLE` removed from `products-grid.tsx`).
- [ ] Loading, empty, and error states each render correctly.
- [ ] `ProductListEnvelope` is unwrapped and `data` passes the Zod schema (drift fails loudly).
- [ ] `price` displays correctly: cents integer + `currency` → formatted currency string (e.g. `2400` → `$24.00`).
- [ ] Pagination advances and stops at the last page (no fetch past `total`); `keepPreviousData` avoids flicker.
- [ ] `search` / `category` query params reach the API and refetch with a new query key.
- [ ] Admin-only create action is hidden/disabled for non-admins (`useAuth`); a 401 is handled gracefully.
- [ ] Create mutation invalidates `["products"]` and the list reflects the new product.

## Out of scope
- Building the **create form** and **product detail** screens (design gaps — separate figma/html-to-component pass).
- Auth/token plumbing through the BFF to satisfy the bearer-guarded `POST` (no token flow exists yet).
- Writing the binding code itself (that is frontend-module-builder) and tests (frontend-test-writer).
- Backend/server changes — this is client-side binding only.

## Open questions
- **Source fidelity:** the contract is from `openapi.json` only (no backend source verified). If a
  live backend diverges from the spec, Zod will catch it — but confirm the spec is current.
- **Pagination meta:** spec returns `total/page/limit` but **no `totalPages` / `hasNextPage`** — derive
  client-side from `total`/`limit`. Confirm that's acceptable, or whether the API adds a meta field.
- **`search` vs `category` semantics:** spec lists both as independent string filters; confirm whether
  they combine (AND) server-side and whether `category` should be a fixed enum/select vs free text.
- **Currency formatting:** assumed `Intl.NumberFormat` from `price`(cents)+`currency`. Confirm locale and
  whether multiple currencies appear in one list.
- **Is the create form in scope now?** Assumed deferred. If the admin create UI should ship with this
  binding, it needs a design first (figma/html-to-component) plus the bearer-token flow.
