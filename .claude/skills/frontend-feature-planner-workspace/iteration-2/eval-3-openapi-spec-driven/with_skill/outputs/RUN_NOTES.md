# RUN NOTES — eval-3 (OpenAPI spec-driven binding plan)

## Skill
`frontend-feature-planner` — plan how the built-but-unbound **products** design binds to the backend API.
PLANNING ONLY; no code written. Project dirs resolved via `.claude/workspace.json`
(`backend → backend/`, `frontend → frontend/`).

## Resolution ladder — landed on Rung 3 (OpenAPI spec)
The backend has **only** an OpenAPI spec, no source. The ladder fell through as designed:
- **Rung 1 — monorepo backend source:** N/A. `backend/` contains only `openapi.json`; no
  `src/`, routes, controllers, services, or models to read.
- **Rung 2 — backend contract files:** N/A. No backend `ARCHITECTURE.md` / `MODULE_REGISTRY.md`.
- **Rung 3 — OpenAPI / Swagger:** ✅ **USED.** Parsed `backend/openapi.json` (openapi 3.0.3,
  `demo-api` v1.0.0). This is cited as the source in the plan's *API contract (observed)* section.
- **Rung 4 — pasted sample:** not needed.

**No claim of reading source code** is made anywhere — the plan states the contract is spec-derived
and that a live backend could drift (Zod catches it at runtime).

## Envelope derived (from spec components.schemas)
- **List:** `ProductListEnvelope` = `{ success: true, data: { items: Product[], total, page, limit }, message? }`
- **Single:** `ProductEnvelope` = `{ success: true, data: Product, message? }`
- **Error:** `ErrorEnvelope` = `{ success: false, message, code? }` — statuses 401 (POST), 404 (GET by id)

## Endpoints derived
| Method | Path | Auth | Request | Response data |
|--------|------|------|---------|---------------|
| GET | /products | public (`security: []`) | query: page(def 1), limit(def 20, max 100), search?, category? | `{ items, total, page, limit }` |
| GET | /products/{id} | public | path: id | `Product` / 404 |
| POST | /products | bearerAuth (admin) | body: CreateProductBody | `Product` (201) / 401 |

Spec `servers[0].url = "/api"` aligns with the frontend axios `baseURL: "/api"` + catch-all BFF,
so **no new BFF route** is needed.

## Product shape derived
`Product` (required: id, name, slug, price, currency, category, inStock; optional imageUrl):
- `id, name, slug, category, currency: string`
- `price: integer` — **in CENTS** (spec description) → format to currency for display
- `inStock: boolean`
- `imageUrl?: string` (uri)

`CreateProductBody` (required: name, price, category; optional currency=USD, inStock=true, imageUrl).

## Design ↔ data
- Built design: `features/products/template/products-grid.tsx` (hardcoded `SAMPLE`) +
  `features/products/components/product-card.tsx` (props: name, price:string, imageUrl?, inStock).
- Plan binds the **list** path: swap `SAMPLE` for `useProductsQuery`; map `price`(cents)+`currency`
  → formatted string for the card's existing `price: string` prop.
- **Design gaps:** product detail screen and admin create form are not built (endpoints exist) —
  flagged for figma-to-component / html-to-component, not invented.

## Assumptions made (skill would have asked; task says state + proceed)
- List-binding is the goal (only fully built design); detail + create are contract-ready but UI-deferred.
- `price` rendered via `Intl.NumberFormat` from cents + currency.
- `BACKEND_URL` assumed set (flagged to confirm).

## Open questions recorded in the plan
- Spec currency of truth (no live source verified).
- No `totalPages`/`hasNextPage` in list meta — derive client-side from total/limit; confirm acceptable.
- `search` vs `category` combination semantics; category free-text vs enum.
- Currency formatting locale / mixed currencies.
- Whether the admin create form should ship now (needs design + bearer-token flow first).

## Status
Plan written as **draft** (not BLOCKED) — the contract was fully obtainable from the spec.
Output: `outputs/FEATURE_PLAN_products.md` (copied from `repo/frontend/_docs/FEATURE_PLAN_products.md`).
