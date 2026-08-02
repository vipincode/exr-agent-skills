# 02 — Admin delete product

> Status: ready
> Domain: fullstack
> Depends on: 01 (the query key it invalidates, and the bound grid it renders into)
> Part of: [products](./products-plan.md)

## Goal

Add an admin-only `DELETE /api/products/:id` endpoint and a confirmed delete action on each card in
the bound grid.

## Done when

> An admin can delete a product from the grid after confirming, and it disappears from the list;
> everyone else never sees the control.

---

## API contract (this slice)

**The single source of truth for this slice.** The backend half implements it; the frontend half
binds to it.

| Method | Path | Auth | Request | Success `data` | Errors |
|--------|------|------|---------|----------------|--------|
| DELETE | /api/products/:id | `protect` + `requireRole('admin')` | path param `id` (24-hex ObjectId) — **no body** | **none — `204 No Content`** | 404 not found · 401 unauthenticated · 403 non-admin (see open question) · 422 malformed id |

**Success response** — `noContent(res)` → `204` with **no body at all**. This is deliberate: it
matches `backend/src/lib/app-response.ts:6` and the module's existing helpers. The client must not
attempt to parse a body or a `{ success, data }` envelope on this call.

**Error envelope** — the module-wide flat shape:

```json
{ "success": false, "message": "Product not found", "code": "NOT_FOUND" }
```

| Case | Thrown | Status |
|---|---|---|
| id doesn't match `/^[a-f0-9]{24}$/` | `validate({ params })` → `ValidationError` | 422 |
| no / invalid access token | `protect` → `UnauthorizedError` | 401 |
| valid token, `role !== 'admin'` | `requireRole('admin')` | **403 or 401 — unconfirmed, see below** |
| id is well-formed but no such product | `NotFoundError` | 404 |

Source: **declared here (design mode)** — `DELETE /api/products/:id` **does not exist**. I checked
`backend/src/modules/products/products.routes.ts` (only `GET /`, `GET /:id`, `POST /`),
`products.controller.ts` (only `list`, `getOne`, `create`), `products.service.ts` (only
`listProducts`, `getProduct`, `createProduct`), and `backend/MODULE_REGISTRY.md` (public surface:
`listProducts, getProduct, createProduct`). All four agree there is no delete.

Everything the new endpoint *reuses* is still **observed**: the envelope helper
(`backend/src/lib/app-response.ts:6`), the guard chain and its ordering
(`products.routes.ts:12` — `protect` before `requireRole('admin')`), the param schema
(`products.schema.ts:16`), and the error→status map (`backend/ARCHITECTURE.md`).

---

## Backend half

**Create** — no new files. Every change is an addition to an existing products file:

| File | Change |
|------|--------|
| `src/modules/products/products.service.ts` | add `deleteProduct(id)` |
| `src/modules/products/products.controller.ts` | add `remove(req, res)` |
| `src/modules/products/products.routes.ts` | add the DELETE route |

Do **not** create a second router, a second service, or a new param schema — see the reuse table.

**Validation** — reuse `productIdParam` from `products.schema.ts:16`
(`z.object({ id: z.string().regex(/^[a-f0-9]{24}$/) })`). It already does exactly this job for
`GET /:id`. No new schema.

**Service surface**

```ts
deleteProduct(id: string): Promise<boolean>   // true if a document was removed, false if none matched
```

Returning a boolean rather than throwing keeps the service HTTP-agnostic, matching `getProduct`,
which returns `ProductDTO | null` and lets the controller decide the status.

Implementation shape: `Product.findByIdAndDelete(id)` — hard delete, per the module decision. The
model has no soft-delete field.

**Controller**

```ts
export async function remove(req: Request, res: Response) {
  const deleted = await svc.deleteProduct(req.params.id);
  if (!deleted) throw new NotFoundError("Product not found");
  return noContent(res);
}
```

`noContent` must be added to the existing `app-response.js` import on line 2 (currently
`{ ok, created }`). `NotFoundError` is already imported on line 3.

**Route** — append to `products.routes.ts`, after the POST, with the guard order the file already
establishes:

```ts
// DELETE /api/products/:id     — admin only
productsRouter.delete("/:id", protect, requireRole("admin"), validate({ params: productIdParam }), ctrl.remove);
```

Order matters and is copied from line 12: guards first, `validate` last, controller last.

**Errors & edge cases**

- Well-formed but nonexistent id → 404. Do not return 204 for a no-op delete; the UI distinguishes
  "gone because you deleted it" from "was never there".
- Double-delete (two admins, same product): the second gets a 404. Acceptable — the frontend treats
  a 404 on delete as "already gone" and refetches rather than showing a hard error.
- No cascade concerns: nothing in this repo references `Product` by id.

**Reuse for this slice** — `protect`, `requireRole` (`src/middleware/auth.ts`) · `validate`
(`src/middleware/validate.ts`) · `productIdParam` (`products.schema.ts:16`) · `noContent`
(`src/lib/app-response.ts:6`) · `NotFoundError` (`src/lib/app-error.ts`).

**New shared pieces / env vars** — none.

**Registry update after build** — `backend/MODULE_REGISTRY.md`, products row: public surface becomes
`listProducts, getProduct, createProduct, deleteProduct`.

---

## Frontend half

**Types & schema** — there is **no success body to model**. Do not write a response schema for a
204; a schema that parses `undefined` is a symptom that the contract was misread. The only type
needed is the input: `deleteProduct(id: string): Promise<void>`.

**Create**

| File | Purpose |
|------|---------|
| `src/features/products/api/delete-product.ts` | `deleteProduct(id)` — `api.delete(`/products/${id}`)`, returns `void` |
| `src/features/products/hooks/use-delete-product.ts` | `useDeleteProduct()` — TanStack `useMutation` |

Reuse `src/lib/axios.ts` (`baseURL: "/api"` → path is `/products/${id}`). The BFF catch-all already
forwards DELETE; **no new route handler**.

**Hooks**

| Hook | Key / invalidates | Notes |
|---|---|---|
| `useDeleteProduct()` | on success: `queryClient.invalidateQueries({ queryKey: ["products"] })` | prefix match, so it catches `["products", filters]` from slice 01 whatever the filters are. **Invalidate-on-success, not optimistic** — see the module decision. |

Also invalidate on a **404** error: the product is gone either way, and refetching resolves the
stale card. Only 401/403/500 are shown as real failures.

**Data binding map**

| Component (path) | Bound to | Notes |
|---|---|---|
| `src/features/products/components/product-card.tsx` | new optional `onDelete?: () => void` prop | **design edit.** Render the delete affordance only when `onDelete` is provided, so the card stays presentational and non-admin renders are byte-identical to slice 01. |
| `src/features/products/template/products-grid.tsx` | `useAuth()` + `useDeleteProduct()` | pass `onDelete` only when `user?.role === "admin"`; otherwise pass nothing |
| ↳ confirm dialog | `product.id`, `product.name` | name in the copy ("Delete *Aero Mug*?") so the admin can tell which card they hit |
| ↳ pending state | `mutation.isPending` + the id being deleted | disable that one card's control; the grid must not freeze wholesale |

`ProductCard` currently takes `{ name, price, imageUrl, inStock }` and has no `id`. Prefer passing
`onDelete` as a **pre-bound closure** from the grid over adding an `id` prop — the card has no other
use for an id, and keeping ids out of the presentational layer avoids a prop that later components
copy without needing.

**States**

- **Idle** — control hidden entirely for non-admins and logged-out visitors (`useAuth()` currently
  returns `{ user: null }`, so today nobody sees it — expected until auth is wired).
- **Confirming** — dialog open, naming the product; cancel closes with no request.
- **Pending** — that card's control disabled/spinner; the rest of the grid stays interactive.
- **Success** — dialog closes, list invalidates and refetches, the card disappears. A toast is
  optional (no toast primitive is registered — see design gaps).
- **Error** — 401/403 → "You don't have permission to delete products." (same copy for both, which
  is why the open question below isn't a blocker). 404 → close quietly and refetch. Anything else →
  generic failure, dialog stays open so retry is possible. Read `message` from the **flat** error
  envelope: `error.response?.data?.message`.

**Design gaps** — needed by this binding, absent from `frontend/MODULE_REGISTRY.md` and
`src/components/shared/`:

| Gap | Suggested home | Who builds it |
|---|---|---|
| Confirm / alert dialog (no overlay primitive is registered) | `components/shared/` — shadcn `AlertDialog` is the obvious base since the project already uses shadcn/ui | `html-to-component` / `figma-to-component`, or add the shadcn primitive directly |
| Delete affordance on the card (icon button / overflow menu) — the built card has no action area | `features/products/components/product-card.tsx` (domain-specific) | the design skills, if a design exists; otherwise a minimal button |
| Toast / notification primitive | `components/shared/` | optional — the list refetch is already visible feedback |

**Do not block on these.** Plan and build the mutation and the role gate; use a minimal confirm and
a plain button until designed components land. Register the dialog in
`frontend/MODULE_REGISTRY.md` if it is built as a shared piece.

**Reuse for this slice** — `src/lib/axios.ts` · `src/lib/query-client.ts` · `src/hooks/use-auth.ts` ·
`src/app/api/[...path]/route.ts` · slice 01's `["products", …]` query key · the built `ProductCard`
and `ProductsGrid`.

---

## Testing checklist

**Backend**

- [ ] `DELETE /api/products/:id` as an admin removes the document and returns **204 with no body**
- [ ] a valid-format id with no matching product returns 404 and the flat `{ success: false, message, code }` envelope
- [ ] a malformed id (`/api/products/abc`) is rejected by `validate({ params: productIdParam })` with 422, before any DB call
- [ ] no token returns 401 and the product still exists afterwards
- [ ] a non-admin token is rejected and the product still exists afterwards
- [ ] the deleted product no longer appears in `GET /api/products`, and `total` decreases by 1
- [ ] the route reuses the existing router, service, controller, and `productIdParam` — no duplicate files

**Frontend**

- [ ] the delete control is not rendered for a logged-out visitor or a non-admin user
- [ ] the control is rendered for `role === "admin"`
- [ ] clicking it opens a confirm naming the product; cancel fires **no** request
- [ ] confirming issues `DELETE /products/:id` exactly once, even on a double-click
- [ ] on success the `["products"]` query is invalidated and the card disappears from the grid
- [ ] the client does not try to parse a JSON body from the 204
- [ ] a 404 closes the dialog and refetches rather than showing a hard error
- [ ] a 401/403 shows the permission message and the card stays
- [ ] while pending, only the targeted card's control is disabled

## Notes / open questions

- **Unconfirmed:** the status `requireRole('admin')` returns for an authenticated non-admin.
  `backend/src/middleware/auth.ts` is not present in this snapshot (its path comes from the import at
  `products.routes.ts:2`), and `backend/ARCHITECTURE.md`'s error map lists no `ForbiddenError`. I
  have not guessed a value — the frontend handles **401 and 403 identically**, so the binding is
  correct either way. Confirm the value if you want the two cases to read differently.
- Hard delete is irreversible and there is no undo. If products are ever referenced by orders, this
  becomes a soft delete and this slice needs re-planning against a `deletedAt` field.
