# RUN_NOTES — frontend-feature-planner (eval-1: create mutation, auth, design gap)

## Task
"I want an admin-only create product form wired up to the backend. Plan it."
PLANNING ONLY — no code written. Plan file: `repo/frontend/_docs/FEATURE_PLAN_products-create.md`
(copied here as `FEATURE_PLAN_products-create.md`).

## Project dirs (resolved via `.claude/workspace.json`)
- backend → `backend/` (express-ts)
- frontend → `frontend/` (nextjs)

## API source / rung
**Rung 1 — monorepo backend source** (highest fidelity). Read the full chain:
`backend/src/app.ts` (mount base `/api/products`) → `products.routes.ts` → `products.controller.ts`
→ `products.service.ts` → `products.schema.ts` → `products.model.ts`, plus `lib/app-response.ts`
and `backend/ARCHITECTURE.md` for the envelope/error model. No guessing — contract is observed.
**Result: NOT blocked.** Status of the plan = `draft`.

## Create endpoint — auth + body schema
- **Endpoint:** `POST /api/products`
- **Auth:** `protect` + `requireRole("admin")` (admin-only; backend enforces). Maps to UI gating via `useAuth`.
- **Success:** `201 { success: true, data: Product, message }` (`created()` helper).
- **Body (createProductBody):**
  - `name` — string, min 1 (required)
  - `price` — integer, positive, **in CENTS** (form must convert dollars → cents)
  - `currency` — string, exactly 3 chars (ISO 4217), default `"USD"`
  - `category` — string, min 1 (required)
  - `inStock` — boolean, default `true`
  - `imageUrl` — valid URL, optional
  - `slug` and `id` are **server-derived / returned only** — NOT submitted.
- **Errors:** `{ success: false, message, code }` — 401 (auth), 422 (validation), 409 (duplicate slug from name), 404.
- **Product DTO returned:** `{ id, name, slug, price, currency, category, inStock, imageUrl? }`.

## Design gap — flagged: YES
The products feature is **DESIGN ONLY** and has **no create-form component**. Only
`features/products/components/product-card.tsx` (display) and
`features/products/template/products-grid.tsx` (display, hardcoded `SAMPLE`) exist. The plan flags
`product-form.tsx` as a gap to build via figma-to-component / html-to-component, and plans the
binding anyway (per skill: don't block on missing design).

## Dependencies (key blockers captured in plan)
- ❌ **`useAuth` is a stub** (`hooks/use-auth.ts` returns `{ user: null }`) — admin gating + the
  Bearer token for the guarded POST don't work until real auth/session is wired. Without it the
  form is always hidden and POST returns 401.
- ❌ **Create-form component does not exist** (design gap above).
- ⚠️ BFF proxy must forward credentials/Bearer on the guarded POST; `BACKEND_URL` assumed set (impl elided in fixture).
- ✅ `POST /api/products` exists; ✅ catch-all BFF proxy covers `/api/products` — no new BFF route needed.

## Assumptions made (stated, then proceeded)
- New admin route `app/admin/products/new/page.tsx` (no existing route found).
- Invalidate-on-success (invalidate `["products"]`), not optimistic.
- Post-success: toast + reset + redirect to list.
- Price entered as dollars, converted to integer cents before POST.

## Open questions (for the user)
1. Who wires real auth/session + role, and does the BFF forward the credential on guarded POSTs? (currently 401)
2. Dedicated admin page vs modal/drawer over the grid?
3. `category` as free-text vs SelectField (no categories endpoint exists)?
4. `currency` fixed to USD (hidden) vs selectable?
5. Post-success: redirect vs stay-and-add-another?

## Template completeness
All required sections produced, including the new **Dependencies** and **Testing checklist**
sections. No binding code written (planning only). Reuse listed with concrete paths.
