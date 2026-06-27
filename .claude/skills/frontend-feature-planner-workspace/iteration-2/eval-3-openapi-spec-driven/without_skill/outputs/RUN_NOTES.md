# RUN NOTES — Plan products design → OpenAPI binding (without_skill)

## Task
Plan how to bind the already-built (unbound) products design in `frontend/` to the backend,
whose only available contract is `backend/openapi.json` (no backend source). Planning only —
no binding code written.

## Approach
1. Read `.claude/workspace.json` → confirmed two projects (backend express-ts spec-only, frontend nextjs).
2. Treated `backend/openapi.json` as ground truth (no source to cross-check). Extracted endpoints,
   auth, query params, the `Product` schema, `CreateProductBody`, and the three response envelopes.
3. Read the frontend contract files (`ARCHITECTURE.md`, `MODULE_REGISTRY.md`) to learn conventions:
   BFF catch-all proxy, single axios (`baseURL /api`), single QueryClient, TanStack Query v5,
   Zod-first types (`z.infer`), feature module anatomy, shared `*Field` forms.
4. Read the actual design source: `features/products/template/products-grid.tsx` (hardcoded SAMPLE)
   and `components/product-card.tsx` (props `name/price:string/imageUrl?/inStock`).
5. Did a design-vs-spec gap analysis, then wrote `FEATURE_PLAN_products.md` (types, Zod schemas,
   api fns, query hooks, data-binding map, auth, build order).

## Key findings
- **Base paths already align:** spec server is `/api`; axios `baseURL` is `/api`; BFF catch-all
  already forwards `/api/products`. So **no new BFF route is required** — only the feature's
  data layer (schema/types/api/hooks) is missing.
- **Envelope unwrapping is the main trap:** every response is wrapped (`{ success, data, message }`),
  and the list double-nests (`data.data.items`). Hooks must unwrap before the design sees it.
- **Price mismatch is the main transform:** API gives `price` as an **integer in cents** + a separate
  `currency`; the design expects a pre-formatted `"$24.00"` string. Needs a `formatPrice(cents, currency)`
  helper, and the card prop type must change.
- **Missing identity fields:** design keys by `name`; real products have `id` + `slug` (use `id` for
  keys/links). Card prop type should accept the real `Product` (adds `id, slug, currency, category`).
- **Auth split:** GET list/detail are public; POST create is admin-only (`bearerAuth`). `useAuth`
  currently returns `null`, so token source is an open question flagged to the backend owner.
- **No update/delete** endpoints exist — plan intentionally doesn't invent them.

## Deliverables (in this outputs/ folder)
- `FEATURE_PLAN_products.md` — the binding plan.
- `RUN_NOTES.md` — this file.

## Conclusion
The design can be bound without touching backend code or adding BFF routes. The work is a single
feature data layer (Zod schemas mirroring the spec → z.infer types → envelope-unwrapping axios fns →
TanStack Query hooks), one `formatPrice` cents→currency helper, an extended `ProductCard` prop type,
and replacing `SAMPLE` in `ProductsGrid` with `useProductsQuery` (plus loading/empty/error states and
filter/pagination wiring). One real blocker to resolve before the admin create path: where the bearer
token comes from.
