# RUN NOTES — Plan orders screen → API binding (without_skill)

Date: 2026-06-27
Task: "Plan the binding for our orders feature so the orders screen talks to the API."
Mode: planning only (no code written).

## Approach
1. Read `.claude/workspace.json` → confirmed a two-project monorepo: `backend` (express-ts),
   `frontend` (nextjs).
2. Inspected the **backend** as ground truth (the right place to learn the real API contract):
   - `src/app.ts`, `src/modules/products/*`, `src/lib/app-response.ts`,
     `ARCHITECTURE.md`, `MODULE_REGISTRY.md`.
3. Inspected the **frontend**: `ARCHITECTURE.md`, `MODULE_REGISTRY.md`, the BFF catch-all
   route, `lib/axios.ts`, and the only feature present (`features/products/*`).
4. Ran a repo-wide case-insensitive search for `order`.

## Key findings
- **No backend orders capability.** Backend mounts only `/api/products`. The single module is
  `products`; `MODULE_REGISTRY.md` confirms it as the only module. No Order model/service/
  route/schema. Search for `order` → 0 real matches in backend.
- **No frontend orders screen.** Only `features/products` exists (and it is DESIGN ONLY, not
  yet bound). No `features/orders/` anywhere. Search for `order` → 0 matches in frontend
  (lone hit is the CSS class `border`).
- Therefore the request references a feature that exists on **neither** side of the stack.

## Conclusion (honesty)
I did **not** fabricate an `/api/orders` contract. A binding plan is only valuable when it
binds to the real backend; none exists for orders. I produced `FEATURE_PLAN_orders.md` that
explicitly marks the work **BLOCKED**, documents the missing capability, lists prerequisites
(build backend orders module → build frontend orders design → then bind), and points out
that the **products** feature is the one actually ready to bind today (real `/api/products`
endpoint + design-only product screen with hardcoded sample data). Recommended the user
confirm whether they meant products, or have the orders backend+design built first.

## Outputs
- `FEATURE_PLAN_orders.md` — the (blocked) plan + prerequisites + grounded products alternative.
- `RUN_NOTES.md` — this file.
