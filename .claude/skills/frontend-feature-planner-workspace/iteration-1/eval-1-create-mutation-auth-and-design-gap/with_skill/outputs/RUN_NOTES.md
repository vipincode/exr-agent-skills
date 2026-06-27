# RUN_NOTES — eval-1-create-mutation-auth-and-design-gap (with_skill)

Skill: **frontend-feature-planner**. Task: "I want an admin-only create product form wired up to the
backend. Plan it." Planning only — the sole artifact created in the repo is
`frontend/_docs/FEATURE_PLAN_products-create.md` (copied here). No code written.

## Project resolution
- Read `.claude/workspace.json`: `frontend → frontend/`, `backend → backend/`. All frontend paths
  resolved under `frontend/`; backend read under `backend/`.

## API source / rung used
- **Rung 1 — monorepo backend source** (highest fidelity, no guessing). Files read:
  - `backend/src/app.ts` (mount: `app.use("/api/products", productsRouter)`)
  - `backend/src/modules/products/products.routes.ts` (methods, middleware chain)
  - `backend/src/modules/products/products.controller.ts` (`created(...)` for POST)
  - `backend/src/modules/products/products.service.ts` (`ProductDTO` = the `data` shape)
  - `backend/src/modules/products/products.schema.ts` (`createProductBody` = exact body validation)
  - `backend/src/modules/products/products.model.ts` (price in cents, slug unique)
  - `backend/src/lib/app-response.ts` + `backend/ARCHITECTURE.md` (envelope + error model)

## Create endpoint — auth concluded
- `POST /api/products` → middleware chain **`protect` + `requireRole('admin')`** + `validate({ body: createProductBody })`.
- So: requires a valid Bearer access token AND `admin` role. UI gates via `useAuth().user?.role === "admin"`
  (UX only); backend enforces independently.

## Create endpoint — body schema concluded (exact, from createProductBody)
- `name`: string, min 1 — required
- `price`: integer, positive — required — **in cents** (e.g. $24.00 → 2400)
- `currency`: string, length 3 — optional, default `"USD"`
- `category`: string, min 1 — required
- `inStock`: boolean — optional, default `true`
- `imageUrl`: valid URL — optional
- Server-generated, NOT in body: `id`, `slug` (slug = lowercased/hyphenated name).
- Success: **201** `{ success: true, data: Product, message }`. Errors: `{ success: false, message, code }`
  with 401 (auth), 422 (validation), 404, 409 (slug-unique conflict on duplicate name).

## Missing form design — FLAGGED: yes
- The products feature is **DESIGN ONLY**: it has `product-card.tsx` + `products-grid.tsx` (display
  with hardcoded sample), but **no create-form component**. Flagged in the plan's "Design gaps"
  section with a pointer to **figma-to-component / html-to-component** to build `product-form.tsx`
  (+ create template/page). Binding was planned anyway per the user's intent (not blocked).

## Reuse anchored (no recreation)
- axios `frontend/src/lib/axios.ts`; catch-all BFF `frontend/src/app/api/[...path]/route.ts`
  (no per-feature BFF route needed); shared `*Field` set; `useAuth`; existing product card/grid as
  the invalidation target.

## Open questions raised
- Route page vs modal/drawer for the create form (assumed `app/admin/products/new`).
- Price entry unit: dollars→cents conversion (assumed) vs raw cents.
- Category input: free-text vs fixed SelectField — no categories endpoint exists (data gap).
- Role-failure status: 401 vs 403 from `requireRole('admin')` — confirm for correct UI mapping.
- `currency` field: hidden/default USD vs user-selectable.

## Assumptions made (stated, not blocked on)
- New admin route page; invalidate-on-success (no optimistic update); dollars→cents conversion;
  toast + reset (+ optional redirect) on success.
