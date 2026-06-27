# Build summary — products list binding

Executed the approved `_docs/FEATURE_PLAN_products.md` (not BLOCKED) with the
**frontend-module-builder** skill: wired the already-built products grid design to the live
backend list endpoint (`GET /api/products`) so it shows real data instead of the hardcoded
`SAMPLE` array. Scope = list binding only (detail/create out of scope per the plan).

## What was done
- Built the feature-module binding layer for `products` (schema → types → api → hook → format util → barrel).
- Edited the existing `ProductsGrid` template to consume the new query hook and render loading / empty / error states (lightweight stubs; design has none — flagged as design gaps in the plan).
- Left presentational `ProductCard` untouched; it receives clean, already-mapped props.
- Updated `MODULE_REGISTRY.md` (Features row + new Decisions log).

## Conventions followed
- BFF only: request fn calls shared axios `api` (`@/lib/axios`, baseURL `/api`) → same-origin `/api/products` → catch-all proxy. No new BFF route (catch-all covers it).
- Envelope unwrap + Zod parse: `productsEnvelopeSchema.parse(res.data).data` — drift fails loudly.
- Types from Zod via `z.infer` — no parallel interfaces.
- Server state via TanStack Query v5: key `["products", filters]`, default `{ page: 1, limit: 20 }`.
- Price transform at the edge: integer cents + currency → `"$24.00"` via `Intl.NumberFormat` in `formatPrice`, before `ProductCard`.

## Files created (relative to frontend/)
- `src/features/products/schema/products.schema.ts` — Zod: productSchema, productListDataSchema, productsEnvelopeSchema, productFiltersSchema
- `src/features/products/types/products.ts` — Product, ProductListResponse, ProductFilters (z.infer)
- `src/features/products/api/products.api.ts` — fetchProducts(filters?), unwrap + Zod-parse
- `src/features/products/hooks/use-products.ts` — useProductsQuery(filters?), key ["products", filters]
- `src/features/products/lib/format-price.ts` — feature-local formatPrice(cents, currency)
- `src/features/products/index.ts` — barrel (public surface)

## Files modified (relative to frontend/)
- `src/features/products/template/products-grid.tsx` — removed SAMPLE; "use client", consumes useProductsQuery(), maps data.items → ProductCard via formatPrice, loading/empty/error states
- `MODULE_REGISTRY.md` — products Features row updated + Decisions log added

## Reused (NOT recreated) — dedup gate
- axios `api` — `src/lib/axios.ts`
- BFF catch-all proxy — `src/app/api/[...path]/route.ts` (no new route)
- ProductCard (built) — `src/features/products/components/product-card.tsx` (unchanged)
- ProductsGrid (built) — `src/features/products/template/products-grid.tsx` (edited, not rebuilt)
- TanStack Query useQuery — `@tanstack/react-query`
Skipped correctly (no form in list binding): shared `*Field` (`src/components/shared/form/*`) and `useAuth` (`src/hooks/use-auth.ts`) — reserved for future create path.

## Created new shared pieces
None. Only feature-local code added; formatPrice is single-use (not registered). No new MODULE_REGISTRY shared entries.

## Verification
Typecheck/lint/build NOT run: fixture has no node_modules (per task). Code written to compile in an installed project.

## Design gaps still open (→ figma-to-component / html-to-component)
- Pagination / load-more / infinite-scroll UI (binding fetches page 1 only).
- Search / filter / category controls (hook accepts the filters already).
- Loading/empty/error here are lightweight inline stubs, not designed components.

## Out of scope (not built, per plan)
- GET /api/products/:id detail and POST /api/products admin create.
- Wiring real auth into useAuth.
- Tests (separate optional step via frontend-test-writer).
