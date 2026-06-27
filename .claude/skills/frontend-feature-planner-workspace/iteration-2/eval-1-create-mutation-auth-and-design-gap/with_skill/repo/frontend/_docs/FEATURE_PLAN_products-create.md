# Feature plan: products-create (API binding)

> Status: draft — edit freely, then hand to frontend-module-builder. Add/remove any section.
> The API contract is fully observed from backend source, so this is NOT blocked. There is,
> however, a real **design gap** (no create-form component exists yet) and a **dependency
> blocker** (`useAuth` is a stub returning null) — both called out below.

## Overview
Bind an **admin-only "create product" form** to the backend `POST /api/products` endpoint, making
the products feature able to add new products. The products feature today is DESIGN ONLY
(`product-card.tsx` + `products-grid.tsx`, both display-only with hardcoded data) — there is no
form component yet, so this plan binds a form that must be built (see Design gaps) and wires the
create mutation, admin UI gating, and cache invalidation of the existing products list.

## API contract (observed)
> Source: **Rung 1 — monorepo backend source** (`backend/src/modules/products/*` + `backend/src/lib/app-response.ts` + `backend/ARCHITECTURE.md`), resolved via `.claude/workspace.json` (`backend` → `backend/`). Mount base from `backend/src/app.ts`: `app.use("/api/products", productsRouter)`.

**Success envelope (create):** `201 { success: true, data: Product, message: string }`
— from `created(res, product, "Product created")` in `products.controller.ts` + `lib/app-response.ts`.

**Error envelope:** `{ success: false, message: string, code: string }` with HTTP status —
`UnauthorizedError → 401`, `ValidationError → 422`, `ConflictError → 409`, `NotFoundError → 404`
(from `backend/ARCHITECTURE.md`). A duplicate `slug` (derived from `name`) can surface as 409.

| Method | Path | Auth | Request body | Response `data` |
|--------|------|------|--------------|-----------------|
| POST | /api/products | `protect` + `requireRole("admin")` | see body schema below | `Product` (the created DTO) |

Supporting (already in the backend, for context / list invalidation):
| GET | /api/products | public | query: `page,limit,search?,category?` | `{ items: Product[], total, page, limit }` |
| GET | /api/products/:id | public | params: `id` (24-hex) | `Product` |

**POST body** (from `products.schema.ts` → `createProductBody`):
| Field | Type / rule | Notes |
|-------|-------------|-------|
| `name` | string, min 1 | required |
| `price` | number, **integer, positive** | **in CENTS** (model comment + schema) |
| `currency` | string, length **exactly 3** (ISO 4217) | defaults `"USD"` server-side |
| `category` | string, min 1 | required |
| `inStock` | boolean | defaults `true` server-side |
| `imageUrl` | string, **valid URL** | optional |

> Note: `slug` is **server-derived** from `name` (`name.toLowerCase().replace(/\s+/g,"-")`) — the
> client does NOT send it. `id` and `slug` are returned, never submitted.

`Product` (DTO from `products.service.ts` → `ProductDTO`) =
`{ id: string; name: string; slug: string; price: number; currency: string; category: string; inStock: boolean; imageUrl?: string }`.

## Decisions
- **Scope of this binding:** create only (the user asked for a create form). List/detail/edit/delete out of scope.
- _Assumption_ — **Route:** a new admin route `src/app/admin/products/new/page.tsx` rendering the form template (no existing route was found for this). Correct me if it should be a modal/drawer over the grid instead.
- _Assumption_ — **Auth gating:** gate in the UI via `useAuth()` (render the form only when `user?.role === "admin"`) AND rely on the backend `requireRole("admin")` as the real enforcement. The page should also be route-guarded once a real session exists. (See Dependencies — `useAuth` is currently a stub.)
- _Assumption_ — **Cache strategy:** invalidate-on-success (NOT optimistic) — on a successful create, invalidate `["products"]` so the existing grid refetches. A create has no obvious optimistic target since the grid is paginated/filtered.
- _Assumption_ — **Post-success UX:** show a success toast, reset the form, and redirect to the products list. Correct if it should stay on the form for rapid multi-entry.
- **Price units:** the form collects a human price; the binding converts **dollars → integer cents** before POST (e.g. `$24.00 → 2400`), because the API requires positive integer cents.

## Dependencies
What must be in place for this binding to actually work — distinct from Reuse (code we import).
| Dependency | Needed for | Status / unblock path |
|------------|-----------|------------------------|
| `POST /api/products` endpoint | the create request | ✅ exists (`backend/src/modules/products`, admin-guarded) |
| BFF catch-all proxy | browser → backend for `/api/products` | ✅ exists (`src/app/api/[...path]/route.ts`) — no new BFF route needed |
| `BACKEND_URL` env | proxy → backend | ⚠️ assumed set for the proxy (impl elided in fixture) — confirm in `.env` |
| **`useAuth` returns a real user + role** | admin UI gating + a session/token reaching the guarded POST | ❌ **stub** — `hooks/use-auth.ts` returns `{ user: null }`. Until a real session/role is wired, the form is always hidden and the POST has no Bearer token (→ 401). Wire auth before this binding is functional. |
| Token forwarded by the BFF on the POST | passing `protect` on the backend | ⚠️ depends on how the proxy attaches the session cookie/Bearer — verify the proxy forwards credentials for guarded calls. |
| **Create-form component (design)** | the actual form UI | ❌ does NOT exist — only `product-card.tsx` + `products-grid.tsx` (display) are built. Build via figma-to-component / html-to-component (see Design gaps). |

## Reuse (do NOT recreate)
| What | Path | How it's used here |
|------|------|--------------------|
| axios instance | src/lib/axios.ts | the create request fn goes through it (`baseURL: /api`) |
| BFF proxy (catch-all) | src/app/api/[...path]/route.ts | already forwards `/api/products` POST → backend; no per-feature route |
| query client | src/lib/query-client.ts (registry) | provides `useMutation` / `invalidateQueries` context |
| InputField | src/components/shared/form/input-field.tsx | `name`, `price`, `currency`, `category`, `imageUrl` fields |
| SelectField | src/components/shared/form/select-field.tsx | `category` (if a fixed list) and/or `currency` |
| CheckboxField | src/components/shared/form/checkbox-field.tsx | `inStock` toggle |
| useAuth | src/hooks/use-auth.ts | gate the admin-only form/route (see Dependencies — stub today) |
| ProductCard | src/features/products/components/product-card.tsx | unchanged display piece; the created product appears via list refetch |

## Types & schema
- `src/features/products/types/products.ts` — `Product` type mirroring the observed `ProductDTO`
  (`id, name, slug, price (cents), currency, category, inStock, imageUrl?`) and the list-response
  type `{ items: Product[]; total; page; limit }`. Derived via `z.infer` where a schema exists; no
  parallel hand-written interfaces.
- `src/features/products/schema/products.schema.ts` — Zod schemas:
  - `createProductInput` — the **form** schema. Mirrors `createProductBody` but models the price as a
    user-entered value, then a transform/refinement maps it to a positive integer (cents) for the
    request. Fields: `name` (min 1), `price` (positive), `currency` (length 3, default "USD"),
    `category` (min 1), `inStock` (boolean, default true), `imageUrl` (url, optional).
  - `productSchema` — response shape for runtime validation of the unwrapped `data`.
  - Types via `z.infer<typeof ...>`.

## Create
| File | Purpose |
|------|---------|
| src/features/products/types/products.ts | `Product` + list-response types from the observed `data` shape |
| src/features/products/schema/products.schema.ts | Zod `createProductInput` (form) + `productSchema` (response) |
| src/features/products/api/products.api.ts | `createProduct(input)` → `api.post("/products", body)`; unwrap `data`; validate with `productSchema` |
| src/features/products/hooks/use-products.ts | `useCreateProductMutation()` (TanStack) — invalidates `["products"]` on success |
| src/features/products/components/product-form.tsx | **NEW** create form (RHF + shared `*Field`); see Design gaps |
| src/features/products/template/product-create.tsx | composed admin screen: gate by role, render `product-form`, wire mutation + toast/redirect |
| src/features/products/index.ts | barrel exporting the feature's public surface |
| src/app/admin/products/new/page.tsx | route rendering `product-create` template (admin route) |
| ~~src/app/api/products/route.ts~~ | NOT needed — catch-all BFF proxy already covers `POST /api/products` |

## Data mapping
| Component (path) | Hook | Fields bound | States |
|------------------|------|--------------|--------|
| features/products/components/product-form.tsx | useCreateProductMutation | `name`→name, price input→`price` (dollars→cents int), `currency`→currency, `category`→category, `inStock` checkbox→inStock, `imageUrl`→imageUrl | submitting/disabled, field errors (422), submit error |
| features/products/template/product-create.tsx | useAuth + useCreateProductMutation | gates render on `user.role==="admin"`; on success → toast + redirect to list | unauthorized (no admin) / submitting / success / error |
| features/products/template/products-grid.tsx (existing) | (existing list query, separate plan) | re-renders new product after `["products"]` invalidation | — |

## Query/mutation hooks
- `useCreateProductMutation()` — `mutationFn: createProduct(input)`; **on success** `queryClient.invalidateQueries({ queryKey: ["products"] })` so the grid refetches; surfaces `isPending` for the submit button and `error` for inline/toast messaging. No optimistic update (invalidate-on-success).
- (Context) the list hook `useProductsQuery(filters)` with key `["products", filters]` is a separate binding (the grid is display-only today); this create plan only needs to invalidate the `["products"]` namespace.

## Design gaps (build before/with binding)
- **`product-form.tsx` does NOT exist.** The products design only ships `product-card.tsx` (display)
  and `products-grid.tsx` (display, hardcoded sample). There is no create/edit form UI. Build the
  form component (inputs for name/price/currency/category/inStock/imageUrl + submit) via
  **figma-to-component** or **html-to-component**, composed from the shared `*Field` set. This plan
  specifies the binding so the form is functional the moment it's built; it does not block on it.
- (Optional) an admin layout/route shell for `app/admin/*` if one doesn't exist yet.

## Edge cases & states
- **Not admin / not logged in:** form hidden or route-guarded (gate via `useAuth`); backend also returns 401 if a non-admin/token-less request slips through.
- **401 from POST:** session expired or token not forwarded → prompt re-auth / redirect to login; do not show a generic error.
- **422 validation:** map field errors back onto the RHF fields (name empty, price not positive int, currency not length-3, bad imageUrl).
- **409 conflict:** duplicate `slug` (derived from `name`) → surface "a product with this name already exists" on the `name` field.
- **Submitting:** disable submit, show pending state; prevent double-submit.
- **Success:** toast, reset form, redirect to list; new product visible after `["products"]` refetch.
- **Network/5xx:** non-field toast error, keep form values for retry.

## Testing checklist
Behavior a correct binding must satisfy — handoff target for frontend-test-writer. Checkboxes, not test code.
- [ ] Form submits to `POST /api/products` through the BFF proxy (no direct backend call).
- [ ] Price is converted from the user value to a **positive integer in cents** before POST.
- [ ] `currency` defaults to `"USD"` and is enforced as a 3-char code; `inStock` defaults to `true`.
- [ ] `slug` and `id` are NOT sent in the request body (server-derived).
- [ ] The 201 response envelope is unwrapped and the `data` passes the Zod `productSchema` (drift fails loudly).
- [ ] On success the form resets, a toast shows, and `["products"]` is invalidated so the grid reflects the new product.
- [ ] Admin-only: the form/route is hidden or guarded for non-admins; a 401 is handled with re-auth, not a generic error.
- [ ] 422 maps to per-field errors; 409 surfaces a duplicate-name message on `name`.

## Out of scope
- List/detail binding for the products grid (separate plan — the grid still renders hardcoded `SAMPLE`).
- Edit and delete product mutations.
- Building the form UI component itself (that's figma-to-component / html-to-component — see Design gaps).
- Implementing real authentication / session (the `useAuth` stub) — a dependency, planned elsewhere.
- Image upload (the API takes an `imageUrl` string, not a file).

## Open questions
- **Auth is a stub** (`useAuth` returns `{ user: null }`). Who wires real session + role, and does
  the BFF proxy forward the credential/Bearer on guarded POSTs? Until then the create path returns 401.
- **Route shape:** dedicated admin page (`/admin/products/new`) vs a modal/drawer over the existing grid?
- **Category input:** free-text `InputField`, or a `SelectField` with a fixed category list? (API accepts any non-empty string; no categories endpoint observed.)
- **Currency:** fixed to USD (hide the field) or user-selectable? (API requires a 3-char code, defaults USD.)
- **Post-success:** redirect to list vs stay-and-add-another for bulk entry?
