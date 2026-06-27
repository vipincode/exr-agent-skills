# SUMMARY — products-create API binding

Bound the admin "create product" form to `POST /api/products` per
`frontend/_docs/FEATURE_PLAN_products-create.md`. Built the binding layer
(types/schema/api/hooks), the new form + admin screen, the route, and the
feature barrel, then updated the registry. No install/build/typecheck was run
(no node_modules); code is written to compile.

## Files created (relative to `frontend/`)
- `src/features/products/schema/products.schema.ts` — Zod `createProductInput` (form; `price` in dollars, `currency` len-3 default USD, `inStock` default true, `imageUrl` optional/url) + `productSchema` (response). Types via `z.infer`.
- `src/features/products/types/products.ts` — `Product` (from `productSchema`) + `ProductListResponse` (list-cache context).
- `src/features/products/api/products.api.ts` — `createProduct(input)`: POST `/products` through the shared axios instance; converts dollars -> positive integer cents (`Math.round(price*100)`); omits blank `imageUrl`; never sends `id`/`slug`; unwraps `{success,data,message}` and validates `data` with `productSchema`.
- `src/features/products/hooks/use-products.ts` — `useCreateProductMutation()`; on success `invalidateQueries({ queryKey: ["products"] })` (invalidate-on-success, no optimistic).
- `src/features/products/components/product-form.tsx` — NEW RHF + Zod create form composed ONLY from the shared `*Field` set; resets on success; maps server errors (422 -> per-field, 409 -> `name`, 401 -> root re-auth, 5xx/network -> root).
- `src/features/products/template/product-create.tsx` — admin-gated screen (`user.role==="admin"`); owns success side effects (toast via `sonner` + redirect to `/admin/products`).
- `src/features/products/index.ts` — feature barrel (public surface).
- `src/app/admin/products/new/page.tsx` — admin route rendering `ProductCreate`.

## Files modified (relative to `frontend/`)
- `MODULE_REGISTRY.md` — products feature now lists its bound surface (was "DESIGN ONLY"); added a products-surface table.

## Existing code reused (not recreated)
- `src/lib/axios.ts` — shared axios `api` (baseURL `/api`) for the POST.
- `src/app/api/[...path]/route.ts` — existing catch-all BFF proxy; NO per-feature BFF route added.
- `src/components/shared/form/{InputField,SelectField,CheckboxField}` (via `@/components/shared/form` barrel) — all form fields; no raw inputs created.
- `src/hooks/use-auth.ts` — `useAuth` for the admin gate.
- `src/features/products/components/product-card.tsx` & `template/products-grid.tsx` — untouched (re-exported); new product appears after `["products"]` refetch.
- TanStack Query (`useMutation`/`useQueryClient`) against the existing single QueryClient/provider.

## Assumptions / notes
- Shared `*Field` components are not physically present in this fixture (only the barrel is). They were used with a `control`-based RHF API (`control`, `name`, `label`, `options` for select), consistent with "no bare useController" in ARCHITECTURE.md.
- Success toast uses `sonner` (standard shadcn toast lib).
- Per the plan's known blockers (NOT introduced here): `useAuth` is a stub returning `{ user: null }`, so the form is hidden until a real session/role is wired, and the guarded POST needs the BFF to forward credentials.
- `slug`/`id` are server-derived and never submitted.
