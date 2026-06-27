# Feature plan: products-create (API binding)

> Status: draft — edit freely, then hand to frontend-module-builder. Add/remove any section.

## Overview
Bind a new **admin-only create-product form** to the backend `POST /api/products` endpoint, making
the products feature able to add records (today the products feature is DESIGN ONLY — a card + grid
with hardcoded sample data, and **no create form exists yet**). Goal: a working create flow gated to
admins, that on success refreshes the products list.

## API contract (observed)
> Source: **Rung 1 — monorepo backend source** (`backend/src/modules/products/*` +
> `backend/src/app.ts` + `backend/src/lib/app-response.ts` + `backend/ARCHITECTURE.md`). Read directly,
> not guessed.

**Success envelope:** `{ success: true, data: <Product>, message: string }`
- `POST` returns **201** via `created(res, data, message)`; reads/list return **200** via `ok(...)`.

**Error envelope:** `{ success: false, message: string, code: string }` with HTTP status:
- **401** Unauthorized (no/invalid Bearer token — `protect`)
- **403/401** role failure (`requireRole('admin')` — not an admin)
- **422** ValidationError (Zod body validation fails)
- **404** NotFoundError, **409** ConflictError (slug is `unique` — a duplicate name → duplicate slug can 409)

| Method | Path | Auth | Request (params / query / body) | Response `data` shape |
|--------|------|------|----------------------------------|------------------------|
| GET | /api/products | public | query: `page=1`, `limit=20` (max 100), `search?`, `category?` | `{ items: Product[], total, page, limit }` |
| GET | /api/products/:id | public | params: `id` (24-hex ObjectId) | `Product` |
| **POST** | **/api/products** | **`protect` + `requireRole('admin')`** | **body (below)** | **`Product`** |

**POST body schema** (from `createProductBody` in `products.schema.ts` — the exact server validation):

| Field | Type / rule | Required | Notes |
|-------|-------------|----------|-------|
| `name` | string, min 1 | yes | |
| `price` | integer, positive | yes | **in cents** (e.g. $24.00 → `2400`) |
| `currency` | string, length 3 | no — default `"USD"` | ISO 4217 |
| `category` | string, min 1 | yes | |
| `inStock` | boolean | no — default `true` | |
| `imageUrl` | valid URL | no | optional |

`Product` (= `ProductDTO` from the service) = `{ id: string, name: string, slug: string, price: number, currency: string, category: string, inStock: boolean, imageUrl?: string }`.
- `id` and `slug` are **server-generated** (slug = lowercased, hyphenated name) — NOT in the request body.

## Decisions
- **Scope**: create only (single mutation). List/detail/edit/delete are out of scope here.
- **Auth gating (UI)**: gate on `useAuth().user?.role === "admin"` — render the form only for admins
  and otherwise hide it / show a not-authorized message; the backend independently enforces
  `protect + requireRole('admin')`, so the UI gate is UX, not security.
- **Cache strategy**: invalidate-on-success — `invalidateQueries(["products"])` so the (future) list
  refetches. No optimistic update (create returns a server-generated id/slug; nothing to predict).
- **Post-success**: success toast + reset the form; optional redirect to the products list/route.
- _Assumption_: this feeds a **new route** `app/admin/products/new/page.tsx` (admin-area create page)
  rather than an inline modal — correct me if a modal/drawer is preferred.
- _Assumption_: the form collects price in **dollars** and converts to **cents** (`× 100`, integer)
  before POSTing, since the backend stores/validates cents. _Currency_ defaults to USD (hidden or
  read-only) unless multi-currency UI is wanted.

## Reuse (do NOT recreate)
| What | Path | How it's used here |
|------|------|--------------------|
| axios instance | frontend/src/lib/axios.ts | the create request fn goes through it (`baseURL: "/api"`) |
| BFF proxy (catch-all) | frontend/src/app/api/[...path]/route.ts | already forwards `/api/products` → backend; **no new BFF route needed** |
| query client | frontend/src/lib/query-client.ts | provided in `app/providers.tsx`; mutation invalidation target |
| InputField | frontend/src/components/shared/form/input-field.tsx | `name`, `price`, `imageUrl` fields |
| SelectField | frontend/src/components/shared/form/select-field.tsx | `category` (and `currency` if shown) |
| CheckboxField | frontend/src/components/shared/form/checkbox-field.tsx | `inStock` toggle |
| TextareaField | frontend/src/components/shared/form/textarea-field.tsx | available if a description-style field is added (none in current schema) |
| useAuth | frontend/src/hooks/use-auth.ts | gate the admin-only form/route |
| ProductCard / ProductsGrid | frontend/src/features/products/components/product-card.tsx, .../template/products-grid.tsx | existing design — the list these reuse is the invalidation target post-create |

## Types & schema
- `frontend/src/features/products/types/products.ts` — `Product` (mirror `ProductDTO`) and the
  list-response type `{ items: Product[]; total: number; page: number; limit: number }`. Types via
  `z.infer` where a schema exists; no parallel hand-written interfaces.
- `frontend/src/features/products/schema/products.schema.ts` — Zod schemas mirroring the **observed**
  server validation:
  - `createProductFormSchema` — the form-facing shape (price likely in **dollars** as a number, then
    transformed to cents on submit). Fields: `name` (min 1), `price` (positive), `category` (min 1),
    `inStock` (boolean, default true), `imageUrl` (url, optional), `currency` (length 3, default USD).
  - `createProductBodySchema` — the exact wire body sent to the API (price as positive **integer
    cents**), kept in lockstep with backend `createProductBody`.
  - `productSchema` / `productsListResponseSchema` for parsing responses.

## Create
| File | Purpose |
|------|---------|
| frontend/src/features/products/types/products.ts | `Product` + list-response types from the observed `data` shape |
| frontend/src/features/products/schema/products.schema.ts | Zod form + request-body + response schemas |
| frontend/src/features/products/api/products.api.ts | `createProduct(body)` (POST `/api/products`), unwraps `{success,data}`; later `listProducts` etc. |
| frontend/src/features/products/hooks/use-products.ts | `useCreateProductMutation()` (and a `useProductsQuery` stub the invalidation refreshes) |
| frontend/src/features/products/components/product-form.tsx | **NEW** create form (RHF + shared `*Field`) — see Design gaps |
| frontend/src/features/products/template/product-create.tsx | composed admin create screen, gated by `useAuth`, rendered by the route page |
| frontend/src/features/products/index.ts | barrel for the module's public surface |
| frontend/src/app/admin/products/new/page.tsx | route entry rendering the create template (assumption — see Decisions) |
| ~~src/app/api/products/route.ts~~ | **omit** — the catch-all BFF proxy already forwards `/api/products` |

## Data-binding map
| Component (path) | Hook | Fields bound | States |
|------------------|------|--------------|--------|
| features/products/components/product-form.tsx | useCreateProductMutation | `name`, `price` (→ cents), `category`, `inStock`, `imageUrl`, `currency` → POST body | submitting/disabled, field validation (422), conflict (409), submit error |
| features/products/template/product-create.tsx | useAuth | role gate (`admin`) around the form | non-admin → hidden / not-authorized message |
| features/products/template/products-grid.tsx (existing) | useProductsQuery | list re-renders after invalidation | loading / empty (once bound) |

## Query/mutation hooks
- `useCreateProductMutation()` — `mutationFn` = `createProduct(body)`; **on success** `invalidateQueries({ queryKey: ["products"] })`, fire success toast, reset form, optional redirect. No optimistic update.
- `useProductsQuery(filters)` — key `["products", filters]`; not the focus of this binding but is the
  invalidation target so a fresh create appears. (Full list binding can be a follow-up plan.)
- Loading = `isPending` disables submit; error = map envelope `message`/`code` to a toast/inline error;
  422 → surface field errors; 401/403 → re-auth / not-authorized.

## Design gaps (build before/with binding)
- **MISSING: a create-product form component.** The products feature currently has only
  `product-card.tsx` and `products-grid.tsx` (display). There is **no form** to collect input.
  → Build `product-form.tsx` (and the create template/page) via **figma-to-component** or
  **html-to-component** before/with this binding. This plan defines the fields, schema, and wiring it
  must satisfy; it does not build the component.

## Edge cases & states
- **Not authenticated (401)** — `protect` rejects; surface re-auth / login prompt.
- **Not admin (401/403)** — UI hides the form; if a non-admin somehow submits, show not-authorized.
- **Validation (422)** — map server field errors back onto the RHF fields (mirror Zod messages).
- **Conflict (409)** — duplicate name → duplicate unique slug; show "a product with this name already exists".
- **Submitting** — disable submit, show pending state; guard against double-submit.
- **Success** — toast, reset form, invalidate `["products"]`, optional redirect.
- **Network/5xx** — generic error toast; keep form values so the user can retry.

## Out of scope
- List/detail/edit/delete bindings (this is the create mutation only).
- Image upload (schema takes an `imageUrl` string, not a file).
- Multi-currency UX beyond defaulting/validating the 3-letter `currency`.
- Building the missing form component (flagged above; belongs to figma-to-component / html-to-component).

## Open questions
- **Route vs modal** — new `app/admin/products/new` page (assumed) or an inline modal/drawer on the
  products screen?
- **Price entry unit** — collect dollars and convert to cents (assumed), or have admins enter raw cents?
- **Category source** — free-text input or a fixed `SelectField` list? The API accepts any non-empty
  string and exposes no category enum/endpoint, so the option list (if any) must come from product UX,
  not the backend. (Data gap — no categories endpoint observed.)
- **Role failure status** — backend doc lists 401 for `UnauthorizedError`; confirm whether
  `requireRole('admin')` returns 401 or 403 so the UI maps the right message.
- **Currency field visibility** — hidden/defaulted to USD, or a user-selectable field?
