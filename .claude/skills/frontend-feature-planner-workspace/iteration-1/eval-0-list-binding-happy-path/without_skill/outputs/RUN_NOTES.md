# RUN NOTES — products API binding plan (without_skill arm)

## Task
Plan how to bind the already-built (design-only) products grid to the real backend API so it
shows live data instead of the hardcoded `SAMPLE` array. Planning only — no binding code written.

## Approach
1. Read `.claude/workspace.json` → confirmed a monorepo with `backend` (express-ts) + `frontend` (nextjs).
2. **Read the REAL backend** instead of guessing the contract:
   - `products.routes.ts` — endpoints + which are public vs admin.
   - `products.schema.ts` — query params + validation rules.
   - `products.service.ts` — the actual `ProductDTO` wire shape + list payload `{items,total,page,limit}`.
   - `products.model.ts` — confirmed `price` is **integer cents**, `currency` ISO 4217.
   - `lib/app-response.ts` + `backend/ARCHITECTURE.md` — the fixed success/error envelope.
3. Read the frontend ground truth:
   - `ARCHITECTURE.md` + `MODULE_REGISTRY.md` — stack, BFF-proxy rule, TanStack Query conventions,
     feature module anatomy, "types from z.infer" rule, reuse-first rule.
   - `template/products-grid.tsx` + `components/product-card.tsx` — what the design consumes.
   - `lib/axios.ts`, `app/api/[...path]/route.ts`, `hooks/use-auth.ts` — existing infra.
4. Mapped design props ↔ API fields, identified the gaps, and wrote `FEATURE_PLAN_products.md`.

## Key findings / conclusions
- **Endpoint is ready to consume as-is.** `GET /api/products` is public and the catch-all BFF proxy
  already forwards `/api/*`. No new BFF route, no auth, no backend change needed for the grid.
- **One real data-shape gap:** the API returns `price` as **integer cents** + a separate `currency`,
  but the `ProductCard` design expects a preformatted `price: string` ("$24.00"). The fix is a
  `formatPrice(cents, currency)` adapter applied in the mapping layer — keep the card presentational.
- **Envelope is double-nested for the list:** `res.data.data.items` (success envelope `data` →
  paged payload `{items,total,page,limit}`). The plan validates the envelope with Zod and returns
  only the payload from the api fn.
- **What to add** (all confined to `features/products/`, additive): `schema/` (Zod), `types/`
  (z.infer only), `api/` (axios getProducts), `hooks/` (useProductsQuery via TanStack Query v5),
  a `formatPrice` util, and an EDIT to `template/products-grid.tsx` to drop `SAMPLE` and render
  live data with loading/error/empty states.
- Followed the project's stated conventions: array query keys `["products", filters]`, types from
  `z.infer` (no parallel interfaces), reuse existing axios/QueryClient/BFF (checked the registry first).

## Deliverable
`FEATURE_PLAN_products.md` — full binding plan: real contract, gap analysis, file-by-file additions
with illustrative (non-final) code, a field→component data-binding map, auth note, and risks.

## What I deliberately did NOT do
- Did not write the actual binding code (planning task).
- Did not modify `ProductCard` or any backend / shared-infra file.
- Did not invoke a skill (this is the without_skill baseline arm) — did the discovery and planning manually.
