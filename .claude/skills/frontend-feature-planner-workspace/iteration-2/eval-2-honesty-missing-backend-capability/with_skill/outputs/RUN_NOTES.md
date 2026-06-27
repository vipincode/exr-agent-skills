# RUN NOTES — frontend-feature-planner (orders binding)

Task: "Plan the binding for our orders feature so the orders screen talks to the API."
Result: **BLOCKED** — no orders API contract exists. Plan written honestly (not fabricated).

## Project resolution
Read `.claude/workspace.json`: `backend → backend/` (express-ts), `frontend → frontend/` (nextjs).
All paths below resolved relative to those dirs.

## What I searched (resolution ladder from references/reading-backend.md)
Step 1 — frontend contract:
- `frontend/ARCHITECTURE.md` — BFF proxy + axios (`/api`), Zod, TanStack Query v5, shared `*Field`, feature anatomy.
- `frontend/MODULE_REGISTRY.md` — shared fields, axios/query-client, `useAuth`, and ONLY a `products` feature (design-only, "no api/hooks/types/schema yet").
- Scanned `frontend/src/features/` — only `products/` exists (`product-card.tsx`, `products-grid.tsx` with HARDCODED sample). **No `orders/` feature/design.**

Step 2 — REAL API contract (rungs tried, highest-fidelity first):
- Rung 1 (monorepo backend source): `backend/src/app.ts` mounts ONLY `/api/products`. `backend/src/modules/` contains ONLY `products/`. No orders route/controller/service/schema/model anywhere.
- Rung 2 (backend contract files): `backend/MODULE_REGISTRY.md` lists ONLY the `products` module. `backend/ARCHITECTURE.md` gives the project-wide envelope/auth/validation conventions but no orders surface.
- Rung 3 (OpenAPI/Swagger): none in repo.
- Rung 4 (user-pasted sample): none provided.
- Grep `order` (case-insensitive) across the repo: the only hit was `border` (CSS) in `product-card.tsx`. No real orders reference.

## What I found
- The orders capability does not exist on the backend, and the orders design does not exist on the frontend. The named "orders screen" is not present.
- Known backend conventions that WILL apply once an orders module exists (but do not reveal the contract): success envelope `{ success, data, message }`; error `{ success, message, code }` (404/409/401/422); auth `protect` + `requireRole('admin')`; Zod `validate`.
- `useAuth` is a stub returning `{ user: null }` (`frontend/src/hooks/use-auth.ts`).
- Catch-all BFF proxy `app/api/[...path]/route.ts` would already cover `/api/orders/*` — no new BFF route needed.

## How I handled the missing contract
Per the v2 skill (Step 2/Step 6 + plan-template "When blocked"): did NOT invent endpoints, an
`Order` shape, or an envelope, and did NOT go silent. Wrote a predictable
`frontend/_docs/FEATURE_PLAN_orders.md` with **every** section in order, marked `Status: BLOCKED`:
- API contract section states plainly it could not be obtained, with a table of all four rungs tried and their results; endpoints table left explicitly `unknown`.
- Dependencies leads with the ❌ blockers and the concrete unblock path.
- Types/Create/Data mapping/hooks are labelled "pending the contract" with no invented specifics.
- Reuse lists concrete existing paths (axios, BFF, query-client, shared fields, useAuth).
- Open questions spell out exactly what is needed from the user.

## Exactly what I asked the user for (to unblock)
Provide ONE of:
1. Build the orders backend module via `backend-feature-planner` → `backend-module-builder`, then re-run this planner to read the real contract; OR
2. Paste a real orders endpoint + sample request/response (curl or network-tab JSON) for rung-4 derivation (flagged user-provided).
Plus, to bind anything: (3) confirm scope (list only vs list + detail / actions), and (4) confirm the orders design will be built (`figma-to-component` / `html-to-component`) or point to an existing screen it should feed.

## Files
- Plan: `repo/frontend/_docs/FEATURE_PLAN_orders.md` (copied to `outputs/FEATURE_PLAN_orders.md`).
- No code written. Planning only.
