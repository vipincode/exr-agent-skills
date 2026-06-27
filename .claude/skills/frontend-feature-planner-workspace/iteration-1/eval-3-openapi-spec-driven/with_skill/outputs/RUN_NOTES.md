# RUN NOTES — frontend-feature-planner (eval-3: OpenAPI spec-driven)

## Backend source used: rung 3 — OpenAPI spec
The resolution ladder (references/reading-backend.md) fell through to **rung 3**:
- **Rung 1 (monorepo backend source):** unavailable. `.claude/workspace.json` has a `backend` entry
  (`backend/`, stack `express-ts`), but the folder contains **only `openapi.json`** — no `src/`, no
  route/controller/service/model chain to read.
- **Rung 2 (backend contract files):** unavailable. No backend `ARCHITECTURE.md` / `MODULE_REGISTRY.md`.
- **Rung 3 (OpenAPI / Swagger):** **USED.** Parsed `backend/openapi.json` (OpenAPI 3.0.3) — `paths`,
  `requestBody`, `responses`, and `components.schemas`.
- Rung 4 (user-pasted sample): not needed.

All API facts in the plan are cited to the spec. **No backend source code was read or claimed** — the
plan's "API contract (observed)" section explicitly names `backend/openapi.json` as the source and notes
field fidelity is limited to what the spec declares.

## Contract derived from the spec

**Server base:** `servers.url = /api` (matches frontend BFF `baseURL: "/api"` → catch-all proxy covers it).

**Success envelope:** `{ success: true, data: <shape>, message?: string }`
(`ProductEnvelope` / `ProductListEnvelope`).

**Error envelope:** `{ success: false, message: string, code?: string }` (`ErrorEnvelope`).
Documented statuses: 401 (POST unauthorized), 404 (GET one not found).

**Endpoints:**
| Method | Path | Auth | Request | Response `data` |
|--------|------|------|---------|-----------------|
| GET | /products | public (`security: []`) | query: page(int≥1, def 1), limit(int 1–100, def 20), search?, category? | `{ items: Product[], total, page, limit }` |
| GET | /products/{id} | public | path: id (string) | `Product` |
| POST | /products | bearer (admin only, per summary) | body: CreateProductBody | `Product` (201) |

**Product shape** (`components.schemas.Product`):
- `id` string (req), `name` string (req), `slug` string (req),
- `price` integer (req) — **price in CENTS**,
- `currency` string (req, e.g. "USD"), `category` string (req), `inStock` boolean (req),
- `imageUrl` string/uri (optional).

**CreateProductBody:** required `name`, `price` (cents), `category`; optional `currency` (def "USD"),
`inStock` (def true), `imageUrl`.

## Design ↔ data mapping
- Built design = `features/products/template/products-grid.tsx` (hardcoded SAMPLE) + `components/product-card.tsx`.
- `ProductCard` consumes `name`, `price` (as a **formatted string**), `imageUrl`, `inStock`.
- Mismatch handled in plan: API `price` is integer **cents** → needs a cents→currency formatter before
  reaching `ProductCard`. `slug`, `category`, `currency` are returned but unused by the current design.

## Output
- Plan written to `repo/frontend/_docs/FEATURE_PLAN_products.md` and copied here as `FEATURE_PLAN_products.md`.
- Planning only — no binding code written.

## Open questions (carried into the plan)
1. Scope: list-only (assumed — only built design) vs also detail + admin-create screens.
2. `GET /products` declares **no error response** in the spec — assumed generic `ErrorEnvelope` on failure;
   confirm against the real server (this fact is not in the spec).
3. Currency/locale formatting rules (per-product `currency`; design hardcoded "$").
4. Pagination UX: page buttons vs load-more/infinite (design has no control; assumed page-based).
5. `slug` is returned but unused — intended for detail routing? GET-one is keyed by `id` in the spec.
