# RUN NOTES — frontend-feature-planner (products list binding)

## API source / rung used
**Rung 1 — Monorepo backend source.** `.claude/workspace.json` resolves `backend/` and `frontend/`.
Read the full chain for the products capability:
- `backend/src/app.ts` — mount point: `app.use("/api/products", productsRouter)`
- `backend/src/modules/products/products.routes.ts` — methods, paths, middleware
- `backend/src/modules/products/products.controller.ts` — response helpers used (`ok`/`created`)
- `backend/src/modules/products/products.service.ts` — `ProductDTO` and list `{ items, total, page, limit }`
- `backend/src/modules/products/products.schema.ts` — request query/body Zod shapes
- `backend/src/modules/products/products.model.ts` — persisted fields
- `backend/src/lib/app-response.ts` + `backend/ARCHITECTURE.md` — envelope confirmation

No need to fall back to contract files, OpenAPI, or a pasted sample — source was fully readable.

## Exact success envelope concluded
`{ success: true, data: <data>, message: string }`  (from `lib/app-response.ts`: `ok()` 200 / `created()` 201)

**Error envelope:** `{ success: false, message: string, code: string }`
(NotFound→404, Conflict→409, Unauthorized→401, Validation→422)

## Endpoints (observed)
| Method | Browser path (via BFF) | Auth | Request | `data` |
|--------|------------------------|------|---------|--------|
| GET | /api/products | public | query: page (def 1), limit (def 20, max 100), search?, category? | `{ items: Product[], total, page, limit }` |
| GET | /api/products/:id | public | params: id (24-hex) | `Product` (out of scope this pass) |
| POST | /api/products | protect + requireRole('admin') | body: name, price(cents int), currency, category, inStock, imageUrl? | `Product` (out of scope this pass) |

`Product` (= backend `ProductDTO`): `{ id, name, slug, price (int CENTS), currency (ISO-4217), category, inStock, imageUrl? }`

Path note: backend mounts under `/api/products`; frontend BFF catch-all forwards `/api/*` 1:1, axios `baseURL` is `/api`, so request fns call `/products`.

## Scope decision
User intent = "products grid showing hardcoded samples → bind to API for real data" → **list/grid binding only**.
Detail + admin create endpoints exist but are out of scope for this pass.

## Key finding (binding transform, not a data gap)
API returns `price` as an integer in **cents** + a separate `currency` code, but the built
`ProductCard` expects a pre-formatted `price` **string** (e.g. "$24.00"). Plan adds a
`formatPrice(cents, currency)` helper at the binding edge; design prop stays unchanged. Both
fields are available, so no data gap.

## Open questions raised (assumptions stated, proceeded without blocking)
1. Ship a search box / category filter? API supports `search`+`category` server-side; design has none. Assumed: plain grid.
2. Page 1 / limit 20 enough, or pager / infinite-scroll? Design has no pagination controls. Assumed: page 1.
3. Keep `ProductCard` taking a formatted price string (binding formats), vs. refactor to `price:number`+`currency`? Assumed: keep string prop.

## Design gaps flagged (→ figma-to-component / html-to-component)
- Pagination / "load more" control (none built; only page 1 shows)
- Search / category filter inputs (none built; API supports them)
- Loading skeleton + empty-state (not in current design)

Core grid + card are complete — no rebuild.

## Compliance
- Planning only: the single artifact written into the repo is
  `frontend/_docs/FEATURE_PLAN_products.md`. No binding/TypeScript code was written.
- Followed SKILL.md steps 1–7, reading-backend ladder (Rung 1), plan-template, and question-banks.
