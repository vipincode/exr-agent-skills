# Frontend Code Review — products binding

**Scope:** `frontend/src/features/products/` (API binding for the products feature)
**Type:** Static, read-only review. No source files were modified.
**Reviewed against:** `frontend/ARCHITECTURE.md`, `frontend/MODULE_REGISTRY.md`, and the real backend module (`backend/src/modules/products/*`, `backend/src/lib/app-response.ts`).

---

## Verdict: APPROVE (ship-ready) — minor, non-blocking nits only

This is a clean, conformant binding. The Zod schemas match the backend DTO field-for-field, the success envelope is correctly unwrapped and validated, server state goes through TanStack Query, the call uses the shared axios instance through the BFF catch-all, and types are derived via `z.infer` (no parallel interfaces). There are **no correctness, security, or contract-drift bugs.** The only items below are housekeeping/convention nits — none of them block shipping.

---

## Ground-truth conformance (verified, no action needed)

| Concern | Backend truth | Frontend binding | Match |
|---|---|---|---|
| Success envelope | `{ success: true, data, message }` (`lib/app-response.ts` `ok`) | `productsEnvelopeSchema` = `{ success: literal(true), data, message? }` | ✅ |
| List payload | `{ items, total, page, limit }` (`products.service.ts` `listProducts`) | `productListDataSchema` = `{ items, total, page, limit }` | ✅ |
| Product DTO | `{ id, name, slug, price, currency, category, inStock, imageUrl? }` (`ProductDTO`) | `productSchema` same 8 fields, `price` int cents, `imageUrl` optional url | ✅ |
| List query params | `page, limit, search, category` (`listProductsQuery`) | `productFiltersSchema` = same four, all optional | ✅ |
| Endpoint / method | `GET /api/products` (`products.routes.ts`) | `api.get("/products", { params })` | ✅ |
| Transport | same-origin `/api/*` via BFF catch-all + shared axios | `@/lib/axios` `api` (baseURL `/api`); no new BFF route | ✅ |

Other things done right:
- `fetchProducts` parses with Zod and returns `.data` — fails loudly on contract drift instead of trusting the wire (`products.api.ts:8`).
- Query key is the namespaced array convention `["products", filters]`; `keepPreviousData` is a sensible choice for paginated/filtered lists (`use-products.ts:7-9`).
- `ProductsGrid` handles all four states — loading (skeleton), error (`role="alert"`), empty, and data — and `<img>` has a real `alt` (`products-grid.tsx`). Good a11y.
- `format-price` correctly divides cents by 100 and uses `Intl.NumberFormat` with the per-product currency.
- No duplicate util/component/hook was introduced — `format-price` exists nowhere else in the tree, and nothing re-implements a shared form field.

---

## Findings (all minor / non-blocking)

### 1. MODULE_REGISTRY.md is now stale (housekeeping) — `frontend/MODULE_REGISTRY.md:31`
The registry still describes products as:
> `components/, template/ (DESIGN ONLY — no api/hooks/types/schema yet)` … `NOT yet bound to the API`

That is no longer true — this change adds `api/`, `hooks/`, `schema/`, and `types/`. The registry is the "check here FIRST" source of truth, so leaving it stale invites a future duplicate.
**Fix:** Update the products row to reflect that it now owns `api/ hooks/ schema/ types/` and is bound to `GET /api/products`. (Out of scope to edit here since this is read-only, but should accompany the change.)

### 2. Feature is missing its `index.ts` barrel (convention) — `frontend/src/features/products/`
ARCHITECTURE's feature module anatomy lists `… components/ template/ index.ts`. The feature has no `index.ts`, so consumers must deep-import `../template/products-grid`. Minor, but add a barrel exporting the public surface (e.g. `ProductsGrid`, `useProductsQuery`, types) for consistency with the documented anatomy.

### 3. `format-price.ts` sits at the feature root, not in a sub-module (convention) — `frontend/src/features/products/format-price.ts`
The anatomy groups files under `types/ schema/ api/ hooks/ components/ template/`. A loose util at the feature root is slightly off-pattern. Either move it under a feature `lib/`/`utils/` folder or, since currency formatting is generic and likely to be reused beyond products, promote it to `src/lib/` and register it. Not urgent today (it's the only consumer), but worth a note so the next feature doesn't copy-paste its own.

### 4. Stale "DESIGN ONLY … not wired to the API yet" comments (cosmetic)
- `components/product-card.tsx:1` and `template/products-grid.tsx`-adjacent comments still claim the pieces aren't wired. The grid is now wired and consumes the live query, so the comment is misleading. Trim it.

### 5. Type name `ProductListResponse` describes the inner data, not the response (naming nit) — `frontend/src/features/products/types/products.ts:5`
`ProductListResponse = z.infer<typeof productListDataSchema>` is actually the unwrapped `{ items, total, page, limit }` payload, not the full `{ success, data, message }` response. Consider `ProductList` / `ProductListData` to avoid future confusion about whether the envelope is included.

### 6. (Optional) No `staleTime` and filters aren't threaded through the UI yet
`useProductsQuery()` is called with no filters in `ProductsGrid`, and no `staleTime` is set (defaults to 0, so it refetches on remount/focus). Both are fine for an initial list binding; flagging only so it's a conscious choice when pagination/search get wired to the grid. Not a defect.

---

## Notes on things deliberately NOT flagged
- Frontend `currency: z.string()` is looser than backend `z.string().length(3)`, and frontend `price: z.number().int()` is stricter than the raw model number. Being lenient on inbound shape while asserting the invariants you actually depend on is reasonable for a read path — not an issue.
- `<img>` rather than `next/image`: ARCHITECTURE does not mandate `next/image`, so this is a possible perf optimization, not a convention violation.
