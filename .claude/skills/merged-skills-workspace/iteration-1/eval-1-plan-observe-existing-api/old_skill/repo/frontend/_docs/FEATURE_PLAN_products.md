# Feature plan: products (API binding)

> Status: **PARTIALLY BLOCKED** — the *list* half is fully observed and ready to build.
> The *admin delete* half is **BLOCKED**: there is no `DELETE /api/products/:id` in the backend
> (`backend/src/modules/products/products.routes.ts` exposes only GET `/`, GET `/:id`, POST `/`).
> Everything below is plain markdown — edit freely, then hand to `frontend-module-builder`.

## Overview
Binds the already-built products design (`src/features/products/template/products-grid.tsx` +
`src/features/products/components/product-card.tsx`), which currently renders a hardcoded
`SAMPLE` array, to the real products API in `backend/src/modules/products`. Scope this pass:
**list view only** (no detail page) plus an **admin-only delete** action on each card — the
latter pending a backend endpoint that does not exist yet.

---

## API contract (observed)

> **Source: rung 1 — monorepo backend source.** Read via `.claude/workspace.json` →
> `backend/`: `src/app.ts` (mount), `src/modules/products/products.routes.ts`,
> `products.controller.ts`, `products.service.ts`, `products.schema.ts`, `products.model.ts`,
> `src/lib/app-response.ts`, and `backend/ARCHITECTURE.md` (envelope + error model).
> Nothing below is inferred; anything unobtainable is flagged, not filled in.

**Mount:** `app.use("/api/products", productsRouter)` — `backend/src/app.ts:5`.

**Success envelope** (`backend/src/lib/app-response.ts`, confirmed by `backend/ARCHITECTURE.md`):
```json
{ "success": true, "data": <data>, "message": "<string>" }
```
- `ok()`      → **200** with that envelope
- `created()` → **201** with that envelope
- `noContent()` → **204**, *no body* (helper exists, currently unused by the products module)

**Error envelope** (`backend/ARCHITECTURE.md`): `{ "success": false, "message": string, "code": string }`
with statuses: `NotFoundError`→**404**, `ConflictError`→**409**, `UnauthorizedError`→**401**,
`ValidationError`→**422** (the `validate()` middleware rejects bad query/body/params).

### Endpoints

| Method | Path | Auth | Request | Response `data` |
|---|---|---|---|---|
| GET | `/api/products` | public | query: `page` (int ≥1, **default 1**), `limit` (int 1–100, **default 20**), `search?` (string, name regex, case-insensitive), `category?` (string) | `{ items: Product[], total: number, page: number, limit: number }` |
| GET | `/api/products/:id` | public | params: `id` — must match `/^[a-f0-9]{24}$/` | `Product` (404 `"Product not found"` when absent) |
| POST | `/api/products` | `protect` + `requireRole("admin")` (Bearer token) | body: `name` (min 1), `price` (**positive int — CENTS**), `currency` (exactly 3 chars, default `"USD"`), `category` (min 1), `inStock` (bool, default `true`), `imageUrl?` (valid URL) | `Product`, status **201** |
| DELETE | `/api/products/:id` | — | — | ❌ **DOES NOT EXIST** — no route, controller, or service function. Not invented here. |

### `Product` (the DTO the API actually returns)
From `products.service.ts` `ProductDTO` / `toDTO()` — note it is **not** the raw Mongo document:

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | `_id.toString()` — 24-hex. **Not** `_id` |
| `name` | `string` | |
| `slug` | `string` | server-derived from name; design doesn't use it |
| `price` | `number` | **integer cents** (`products.model.ts:  price // in cents`) |
| `currency` | `string` | ISO 4217, defaults `"USD"` |
| `category` | `string` | |
| `inStock` | `boolean` | defaults `true` |
| `imageUrl` | `string \| undefined` | optional — the card must tolerate its absence (it already does) |

`createdAt` / `updatedAt` exist on the model but are **stripped by `toDTO()`** — they are not in the
response. Do not add them to the frontend type.

---

## Decisions

- **Scope:** list view only. No detail page/route this pass (user: "list view for now").
- **Envelope handling:** request fns unwrap `.data.data` and Zod-parse the inner payload, so
  envelope drift fails loudly at the boundary rather than silently rendering `undefined`.
- **Price:** API returns integer cents + `currency`; the design's `ProductCard` takes a
  pre-formatted `price: string`. Format at the binding edge with `Intl.NumberFormat` and keep the
  card's string prop — no card API change needed for price.
- **Transport:** BFF catch-all + `src/lib/axios.ts` (`baseURL: "/api"`), so `api.get("/products")`
  resolves to `/api/products` and the proxy forwards it. **No new BFF route needed.**
- _Assumption_ — **Pagination: paged** (server-side `page`/`limit`, default `limit: 20`), rendered
  with a simple prev/next pager. The server only supports paged access, so "load all" isn't an
  option; infinite scroll is possible but I picked paged as the smaller first step.
- _Assumption_ — **Route: a new `src/app/products/page.tsx`** that renders `<ProductsGrid />`.
  No page currently imports the grid anywhere in the repo.
- _Assumption_ — **Delete cache strategy: invalidate-on-success**, not optimistic. Safer while the
  endpoint's exact response is unconfirmed; switch to optimistic once it's real.
- _Assumption_ — **Delete is guarded by a confirm step** (destructive + irreversible).
- _Assumption_ — **`search` / `category` filter UI is out of scope** this pass, even though the API
  supports both. Say the word and it's a small addition to the same query key.

---

## Dependencies

| Dependency | Needed for | Status / unblock path |
|---|---|---|
| `GET /api/products` (paginated list) | the entire list binding | ✅ exists — `backend/src/modules/products/products.routes.ts:8` |
| `DELETE /api/products/:id` | the admin delete action | ❌ **BLOCKED — does not exist.** Unblock: build it via `backend-feature-planner` → `backend-module-builder` (suggested shape: `productsRouter.delete("/:id", protect, requireRole("admin"), validate({ params: productIdParam }), ctrl.remove)` returning `noContent(res)` → 204, 404 when absent). Then confirm the response and update this plan's contract table. |
| `useAuth` returns a real user + role | hiding/showing the admin delete button | ⚠️ **stub** — `src/hooks/use-auth.ts` returns `{ user: null }` literally. With it as-is the delete button is **never** visible. Must be wired to a real session before the admin path is testable. |
| Bearer token reaching the backend | any `protect`-guarded call (POST, future DELETE) | ⚠️ **unverified** — `src/app/api/[...path]/route.ts` has its proxy impl elided ("proxy impl elided in fixture"), so I could not confirm it forwards `Authorization`. Verify before building the delete half; a `protect` route 401s without it. |
| `BACKEND_URL` env | BFF proxy → backend | ⚠️ referenced by the proxy comment; no `.env`/`.env.example` in the repo to confirm it's set. |
| `ProductCard` accepts an `id` + delete affordance | per-row delete | ⚠️ design gap — see *Design gaps*. |
| Confirm dialog / overlay component | delete confirmation | ⚠️ none in `MODULE_REGISTRY.md` (it lists form fields only). Add shadcn `AlertDialog` or build via `figma-to-component`. |

## Reuse (do NOT recreate)

| What | Path | How it's used here |
|---|---|---|
| axios instance | `src/lib/axios.ts` | every request fn goes through `api` (`baseURL: "/api"`) |
| BFF proxy (catch-all) | `src/app/api/[...path]/route.ts` | already forwards `/api/products*` — **do not add a per-feature BFF route** |
| queryClient | `src/lib/query-client.ts` | provided in `app/providers.tsx`; hooks use it implicitly |
| `useAuth` | `src/hooks/use-auth.ts` | gate the admin-only delete button in the UI |
| `ProductCard` | `src/features/products/components/product-card.tsx` | **reuse the built design** — extend props, do not rewrite |
| `ProductsGrid` | `src/features/products/template/products-grid.tsx` | **edit in place** — swap `SAMPLE` for the query hook; keep the existing grid markup/classes |
| `InputField` / `SelectField` / `TextareaField` / `CheckboxField` | `src/components/shared/form/*` | not needed this pass (no form in scope); listed so no one recreates them if filters land later |

## Types & schema

- `src/features/products/types/product.ts` — types via `z.infer` only, no parallel interfaces:
  - `Product` — `{ id, name, slug, price, currency, category, inStock, imageUrl? }`, mirroring `ProductDTO`.
  - `ProductListData` — `{ items: Product[], total, page, limit }` (the envelope's `data`, not the envelope).
- `src/features/products/schema/product.schema.ts`:
  - `productSchema` — Zod object matching `Product` (`price` = `z.number().int()`, `imageUrl` optional).
  - `productListDataSchema` — `{ items: z.array(productSchema), total, page, limit }`.
  - `productFiltersSchema` — `{ page: number ≥1 default 1, limit: number 1–100 default 20, search?, category? }`,
    mirroring the backend's `listProductsQuery` bounds so bad requests fail client-side, not with a 422.
  - _(pending the delete contract)_ no delete body/response schema — DELETE takes only a path param;
    if it returns 204 there is nothing to parse.

## Create

| File | Purpose |
|---|---|
| `src/features/products/types/product.ts` | `Product`, `ProductListData` via `z.infer` |
| `src/features/products/schema/product.schema.ts` | Zod schemas above |
| `src/features/products/api/products.api.ts` | `fetchProducts(filters)`, `deleteProduct(id)` _(pending endpoint)_ — unwrap envelope + parse |
| `src/features/products/hooks/use-products.ts` | `useProductsQuery`, `useDeleteProductMutation` _(pending endpoint)_ |
| `src/features/products/lib/format-price.ts` | cents + currency → display string (`Intl.NumberFormat`) |
| `src/features/products/components/product-card.tsx` | **EDIT** — add `id`, optional `onDelete`, `isDeleting` |
| `src/features/products/template/products-grid.tsx` | **EDIT** — drop `SAMPLE`, consume the hook, render states + pager |
| `src/features/products/index.ts` | barrel: `ProductsGrid`, `useProductsQuery`, `Product` |
| `src/app/products/page.tsx` | route that renders `<ProductsGrid />` _(assumption — see Decisions)_ |
| `src/app/api/products/route.ts` | ❌ **do NOT create** — the catch-all proxy already covers it |

## Data mapping

| Component (path) | Hook | Fields bound | States |
|---|---|---|---|
| `features/products/template/products-grid.tsx` | `useProductsQuery(filters)` | `data.items` → cards; `data.total`/`page`/`limit` → pager | skeleton grid / empty copy / error message + retry |
| `features/products/components/product-card.tsx` | (props from parent) | `name`→`name`; `price` + `currency` → **`formatPrice(price, currency)`** → the existing `price: string` prop; `inStock`→`inStock`; `imageUrl`→`imageUrl`; **`id`→ new `id` prop** | delete button: rendered only when `user?.role === "admin"`; disabled + spinner while `isDeleting` |
| delete confirm dialog _(new — design gap)_ | `useDeleteProductMutation()` | `id` → `DELETE /api/products/:id` | open/confirm/cancel; error toast on failure |

**Unused by the design:** `slug`, `category` come back from the API and nothing renders them. Keep
them on the type (they're really returned) but don't invent UI for them.

## Query/mutation hooks

- **`useProductsQuery(filters)`** — key `["products", "list", filters]` (filters = `{ page, limit, search?, category? }`,
  so paging swaps the key and caches per page). Calls `api.get("/products", { params: filters })`,
  unwraps `res.data.data`, parses with `productListDataSchema`. Use `placeholderData: keepPreviousData`
  so the grid doesn't flash empty between pages. Returns loading/empty/error to the template.
- **`useDeleteProductMutation()`** _(pending the endpoint)_ — `mutationFn: (id) => api.delete(\`/products/${id}\`)`;
  `onSuccess` invalidates `["products"]` (the whole feature namespace, so every cached page refetches);
  invalidate-on-success rather than optimistic (see Decisions). Surface `isPending` per row so only
  the clicked card shows the busy state.

## Design gaps (build before/with binding)

Not blockers for the list half — but the delete half needs these:
1. **`ProductCard` has no `id` and no delete affordance.** Current props are
   `{ name, price: string, imageUrl?, inStock }`. Needs `id` and an admin-only delete button
   (icon button, top-right of the card is the obvious spot). Small edit — `frontend-module-builder`
   can do it, or `figma-to-component` if the button has a real design.
2. **No confirm dialog exists** anywhere in `MODULE_REGISTRY.md`. Add shadcn `AlertDialog` to
   `components/shared/overlay/` (generic → shared, per the placement rule) or design one.
3. **No loading / empty / error states** in the grid — it only knows how to render an array.
4. **No pagination control** in the design; the API is paged, so a prev/next pager needs designing
   (or accept a plain one from the builder).

## Edge cases & states

- **Loading:** skeleton cards in the existing grid layout; `keepPreviousData` avoids a flash on page change.
- **Empty:** `items: []` with `total: 0` → empty-state copy (distinct from "filtered to nothing" if search lands later).
- **Error:** the error envelope is `{ success: false, message, code }` — surface `message`, not a generic string.
- **422:** the server validates `page`/`limit` (`limit` max 100). Client-side schema bounds prevent this.
- **End of pagination:** disable "next" when `page * limit >= total`; never fetch past the end.
- **`imageUrl` missing:** already handled by the card (renders no `<img>`).
- **Zod drift:** if the API's `data` stops matching, the parse throws at the boundary — treat as an error state, don't render partial.
- **401 on delete:** token expired or `protect` rejected → surface a re-auth prompt; don't silently drop the row.
- **Delete of an already-deleted product:** expect 404 → refetch the list rather than showing a stale row.
- **Non-admin:** delete button not rendered at all (`useAuth().user?.role !== "admin"`); the server is the real guard.

## Testing checklist

Behavior a correct binding must satisfy — the handoff target for `frontend-test-writer`.

- [ ] Grid renders live data from `GET /api/products`; the hardcoded `SAMPLE` array is gone.
- [ ] The `{ success, data, message }` envelope is unwrapped and the inner `data` passes `productListDataSchema` (drift fails loudly).
- [ ] Price renders from **integer cents + currency** (`2400` + `"USD"` → `"$24.00"`), not from a raw number.
- [ ] Loading (skeleton), empty (`items: []`), and error (server `message` shown) states each render.
- [ ] Cards missing `imageUrl` render without a broken image.
- [ ] `inStock: false` renders the "Sold out" treatment.
- [ ] Pager advances pages, changes the query key, and disables "next" at `page * limit >= total`.
- [ ] Requests go through the axios instance to `/api/products` (BFF), never straight to `BACKEND_URL`.
- [ ] Delete button is absent for non-admin / null user, present for `role === "admin"`.
- [ ] Delete asks for confirmation before firing.
- [ ] A successful delete invalidates `["products"]` and the row disappears.
- [ ] A failed delete (401/404) surfaces the server's `message` and leaves the list consistent.

## Out of scope

- Product **detail** view / route (user: "list view for now").
- Create and edit (`POST /api/products` exists and is admin-guarded, but wasn't asked for).
- Search / category filter UI, even though the API supports both query params.
- Sorting — the API exposes **no** sort param; adding one is a backend change.
- Building the DELETE endpoint itself (backend work — `backend-feature-planner` → `backend-module-builder`).
- Wiring real auth into `useAuth`.

---

## Build order — the buildable pieces

You asked to break this into pieces you can build one at a time. Each is independently shippable;
the numbers are the order.

| # | Piece | Contract status | Depends on |
|---|---|---|---|
| **1** | **Types, schemas, price formatter** — `types/product.ts`, `schema/product.schema.ts`, `lib/format-price.ts`. Pure, no UI. | ✅ observed | — |
| **2** | **API fn + query hook** — `api/products.api.ts` (`fetchProducts`), `hooks/use-products.ts` (`useProductsQuery`). Envelope unwrap + Zod parse. | ✅ observed | 1 |
| **3** | **Bind the grid (drop `SAMPLE`)** — `products-grid.tsx` consumes the hook; `product-card.tsx` gains `id`; price formatted at the edge. Add `app/products/page.tsx`. | ✅ observed | 2 |
| **4** | **Loading / empty / error states** in the grid. | ✅ observed | 3 |
| **5** | **Pagination** — prev/next pager driving `filters.page`, `keepPreviousData`, disabled at the end. | ✅ observed | 3 |
| **6** | **Admin gating (UI only)** — delete button rendered behind `useAuth().user?.role === "admin"`, wired to a no-op. Makes the design complete and reviewable while the endpoint is missing. | ✅ observable now | 3, + `useAuth` stub caveat |
| **7** | **Delete mutation** — `deleteProduct(id)`, `useDeleteProductMutation`, confirm dialog, invalidate `["products"]`. | ❌ **BLOCKED** — no `DELETE /api/products/:id` | 6 + the backend endpoint |

Pieces 1–6 can be built today against the real contract. Piece 7 waits on the backend.

## Open questions

1. **The delete endpoint doesn't exist.** Should I have the backend built first
   (`DELETE /api/products/:id`, `protect` + `requireRole("admin")`, → 204 via the existing
   `noContent` helper), or is there a delete route somewhere I couldn't see? Everything about
   piece 7 above is provisional until this is real — **I did not invent its contract.**
2. **Hard delete or soft delete?** The model has no `deletedAt`/`isActive` field, which points at a
   hard delete, but that's an inference, not an observation.
3. **`useAuth` is a stub** returning `{ user: null }`. Until it returns a real user+role, the
   admin delete button can never appear. Who wires it — is there an auth module planned?
4. **Does the BFF proxy forward the `Authorization` header?** Its implementation is elided in this
   repo, and every `protect` route 401s without it.
5. **`slug` and `category`** are returned but unrendered — should the card show category (a badge),
   or should the card link to `/products/[slug]` later?
6. **Pager vs infinite scroll** — I assumed a prev/next pager. Infinite scroll is the same hook with
   `useInfiniteQuery`; say so and I'll revise.

---

### Questions I would have asked before writing this
_(recorded because this ran non-interactively — the answers above are my defaults, flagged as
assumptions.)_

1. This binding covers list + admin delete — anything else (create/edit) in this pass, or just those two?
2. Pagination: prev/next pager, infinite scroll, or load-all? (The API is paged, so load-all isn't real.)
3. Delete: optimistic removal with rollback, or invalidate-and-refetch? And does it need a confirm dialog?
4. Which route should render this grid — an existing page, or a new `app/products/page.tsx`?

---

**Next:** edit anything above, then hand this file to `frontend-module-builder` to write the
binding code (start with piece 1). Tests are a separate, optional step via `frontend-test-writer`,
using the Testing checklist as the spec.
