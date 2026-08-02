# Module plan: products

> Status: draft — edit freely, then build slice by slice with module-builder.
> Domains: fullstack (backend + frontend)   ·   Slices: 2
> Mode: **mixed** — slice 01 *observes* the existing list endpoint; slice 02 *designs* a new delete endpoint.

## Overview

The products grid design is already built (`frontend/src/features/products/`) but renders a
hardcoded `SAMPLE` array. This module binds that design to the **existing** products API and adds
an admin-only delete. No product detail page, create, or edit in this pass — list view only, as
requested.

No `prd-creator` brief exists for this module; scope comes from the user's request.

## Build order

| # | Slice | Domain | Depends on | Status |
|---|-------|--------|-----------|--------|
| 01 | [List products](./01-list-products.md) | frontend | — | ready |
| 02 | [Admin delete product](./02-admin-delete-product.md) | fullstack | 01 | ready |

Build these in order — the number is the order. Slice 01 is frontend-only because the list endpoint
already exists; it establishes the schema, the envelope unwrap, and the `["products", …]` query-key
namespace that slice 02 invalidates. `module-builder` updates the Status column as each slice lands.

## Decisions (module-wide)

Questions I would have asked (the user was not available), with the default I proceeded on —
**correct me by editing these lines**:

- **Delete semantics: hard vs soft?** → _Assumption_: **hard delete**, `204 No Content`.
  The `Product` model has no `deletedAt` / `isActive` / `archived` field, so a soft delete would
  require a schema migration plus a filter on every existing read path. Hard delete is the change
  that fits the model as it stands.
- **Cache strategy after delete: optimistic removal, or invalidate-on-success?** → _Assumption_:
  **invalidate-on-success** (`queryClient.invalidateQueries({ queryKey: ["products"] })`). It needs
  no rollback path and keeps `total` honest, at the cost of one refetch. Switch to optimistic later
  if the refetch flicker is annoying.
- **Does delete need a confirm step?** → _Assumption_: **yes** — a confirm dialog. Under hard delete
  the action is irreversible and the trigger sits on a grid card where mis-taps are easy.
- **Non-admin UI for the delete control: hide, disable, or route-guard?** → _Assumption_: **hide it
  entirely** via `useAuth().user?.role === "admin"`. The grid itself is public, so a disabled button
  would only advertise an action most visitors can never take. The server guard is the real security
  boundary either way; this is cosmetic.
- **Pagination:** the user said "list view for now", so: fetch **page 1 only** with the server's
  default `limit` (20), and render **no pagination controls**. The endpoint is paged and the hook is
  written with `filters` in the query key, so adding controls later is additive, not a rewrite.
  _Assumption_ — flagged because the API does support paging.
- **Currency formatting** happens client-side: `price` is an integer in **cents** plus a `currency`
  ISO code; the built `ProductCard` already expects a pre-formatted `price: string`.

## Data model

**Owns no data** — the `Product` model already exists and is not modified by this module.

Observed at `backend/src/modules/products/products.model.ts`:

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | exposed to clients as `id: string` by the service DTO |
| `name` | string | required |
| `slug` | string | required, unique, indexed — derived from `name` on create |
| `price` | number | required — **integer, in cents** |
| `currency` | string | ISO 4217, default `"USD"` |
| `category` | string | required, indexed |
| `inStock` | boolean | default `true` |
| `imageUrl` | string | optional |
| `createdAt` / `updatedAt` | Date | `{ timestamps: true }` — **not** in the client DTO |

The wire shape is the service DTO, not the document: `ProductDTO` at
`backend/src/modules/products/products.service.ts:2-11` drops `createdAt` / `updatedAt` and
stringifies `_id` → `id`.

## API contract conventions

- **Base path**: `/api/products` — mounted at `backend/src/app.ts:5`.
- **Success envelope** (`backend/src/lib/app-response.ts`):
  - `ok(res, data, message?)` → `200 { "success": true, "data": <data>, "message": <string> }`
  - `created(res, data, message?)` → `201`, same shape
  - `noContent(res)` → `204`, **no body at all**
- **Error envelope** (`backend/ARCHITECTURE.md`): `{ "success": false, "message": <string>, "code": <string> }`
  — note it is **flat**, not `{ error: { … } }`. Status map: `NotFoundError`→404,
  `ConflictError`→409, `UnauthorizedError`→401, `ValidationError`→422.
- **Auth**: `protect` (Bearer access token, attaches `req.user`), then `requireRole('admin')`.
- **Source**: **observed** from `backend/src/` + `backend/ARCHITECTURE.md` (Rung 1) for everything
  that exists today. The `DELETE` endpoint in slice 02 does not exist and is **declared** there.

## Reuse (do NOT recreate these)

| What | Path | How it's used here |
|------|------|--------------------|
| products router | backend/src/modules/products/products.routes.ts | add the DELETE route here — do not create a second router |
| products service | backend/src/modules/products/products.service.ts | add `deleteProduct` alongside `listProducts` / `getProduct` / `createProduct` |
| products controller | backend/src/modules/products/products.controller.ts | add the `remove` handler |
| `productIdParam` schema | backend/src/modules/products/products.schema.ts:16 | already validates a 24-hex ObjectId — reuse for DELETE, do not write a new one |
| `ok` / `noContent` | backend/src/lib/app-response.ts | every response goes through these |
| `NotFoundError` | backend/src/lib/app-error.ts | thrown for a missing id (path known from the controller's import, line 3) |
| `protect`, `requireRole` | backend/src/middleware/auth.ts | guard the DELETE route (path known from `products.routes.ts:2`) |
| `validate` | backend/src/middleware/validate.ts | params validation on DELETE (path from `products.routes.ts:3`) |
| BFF catch-all proxy | frontend/src/app/api/[...path]/route.ts | forwards `/api/products*` already — **no new BFF route needed** |
| axios instance | frontend/src/lib/axios.ts | `baseURL: "/api"`, so request fns use `"/products"` |
| QueryClient | frontend/src/lib/query-client.ts | the single client; hooks use it via the provider |
| `useAuth` | frontend/src/hooks/use-auth.ts | role gate for the delete control |
| `ProductCard` | frontend/src/features/products/components/product-card.tsx | already built — bind it, don't rebuild it |
| `ProductsGrid` | frontend/src/features/products/template/products-grid.tsx | already built — replace `SAMPLE`, keep the layout |
| shared form fields | frontend/src/components/shared/form | not needed this pass (no forms) — listed so a later create/edit slice reuses them |

## New shared pieces (→ register after build)

- **None planned.** `formatPrice` starts feature-local at
  `frontend/src/features/products/lib/format-price.ts`. If a second feature needs it, promote it to
  `src/lib/` and register it then — not before.

## New env vars

None. `BACKEND_URL` already exists for the BFF proxy.

## Out of scope (module-wide)

Deliberately excluded so it doesn't creep back in slice by slice — each is a future slice, not a
task inside these two:

- Product **detail** page (`GET /api/products/:id` exists and is unbound — a future `03-product-detail`).
- Admin **create** / **edit** (`POST /api/products` exists and is unbound; there is no `PATCH`/`PUT` at all).
- Pagination controls, search box, category filter UI — the endpoint supports `page` / `limit` /
  `search` / `category`, but no design exists for the controls.
- Cart, checkout, reviews, images upload.
- Optimistic UI and undo-delete.

## Open questions

1. **What status does `requireRole('admin')` return for a logged-in non-admin — 403 or 401?**
   `backend/src/middleware/auth.ts` is not present in this snapshot (its path is known only from the
   import at `products.routes.ts:2`), and `backend/ARCHITECTURE.md`'s error map lists no
   `ForbiddenError`. I have **not** guessed: slice 02 handles 401 and 403 with the same UI message,
   which is correct under either answer. Confirm and tighten if it matters.
2. Should deleting the last product on a page (once pagination lands) refetch the previous page?
   Not an issue while slice 01 fetches page 1 only.
