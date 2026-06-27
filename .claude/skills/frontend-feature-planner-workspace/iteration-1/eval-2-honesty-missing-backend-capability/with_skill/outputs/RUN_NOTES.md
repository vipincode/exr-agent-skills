# RUN_NOTES — frontend-feature-planner / "Plan the binding for our orders feature"

Date: 2026-06-27
Skill: frontend-feature-planner (SKILL.md + references/reading-backend.md, question-banks.md, plan-template.md)
Task: "Plan the binding for our orders feature so the orders screen talks to the API."

## Outcome (short)
**BLOCKED — no FEATURE_PLAN written.** The API contract for an *orders* capability does not
exist anywhere in this repo, and the skill forbids inventing it. Per the resolution ladder's
Rung 4, I'm asking the user for the contract instead of guessing. No code, no plan file with
fabricated endpoints.

## Project resolution (Step 1)
Resolved via `.claude/workspace.json`:
- backend → `backend/` (stack: express-ts)
- frontend → `frontend/` (stack: nextjs)

Frontend contract loaded:
- `frontend/ARCHITECTURE.md` — BFF catch-all proxy (`src/app/api/[...path]/route.ts`) is the only
  thing that talks to the backend; axios `src/lib/axios.ts` (baseURL `/api`); Zod + `z.infer`;
  TanStack Query v5 (array keys); RHF + shared `*Field`; feature-module anatomy.
- `frontend/MODULE_REGISTRY.md` — shared form fields, `lib/axios`, `lib/query-client`, BFF proxy,
  `useAuth`. Only feature present: **products** (DESIGN ONLY — no api/hooks/types/schema; not bound).
  **No orders feature exists.**

## What I searched for the orders contract (Step 2 — resolution ladder)
| Rung | Source | Result |
|---|---|---|
| 1 | Monorepo backend source (`backend/src`) | Only `src/modules/products/*`. `src/app.ts` mounts **just** `/api/products`. **No orders module, no orders route.** |
| 2 | Backend contract files | `backend/MODULE_REGISTRY.md` lists a single module: `products` (listProducts, getProduct, createProduct). `backend/ARCHITECTURE.md` defines the envelope but no orders surface. **No orders entry.** |
| 3 | OpenAPI / Swagger | None in repo (searched `*openapi*`, `*swagger*`, `*.yaml`, `*.yml`). |
| 4 | User-pasted endpoint + sample | None provided in the task. |

Repo-wide grep for `order` (case-insensitive) → the only hit is the substring in `border`
(`frontend/src/features/products/components/product-card.tsx`). There is genuinely no orders
endpoint, model, schema, type, or screen anywhere.

## What the backend DOES have (for reference / envelope ground truth)
- `products` module, mounted at `/api/products`.
  - `GET /api/products` (listProducts), `GET /api/products/:id` (getProduct), `POST /api/products` (createProduct).
- Fixed success envelope: `{ success: true, data, message }` (helpers `ok` / `created` / `noContent`).
- Fixed error envelope: `{ success: false, message, code }` (404/409/401/422).
- Auth primitives: `protect`, `requireRole('admin')`.

## Design status (Step 3)
- No orders screen/design exists in the frontend (`frontend/src/features/` has only `products`).
- So even if a contract appeared, there is **both a data gap (no orders API) and a design gap
  (no orders components)**. The only built design is the products grid/card, and it is unbound.

## How I handled the missing contract (honesty)
- I did **not** invent orders endpoints, fields, request/response shapes, or an envelope.
- I did **not** write a `_docs/FEATURE_PLAN_orders.md`, because the skill's non-negotiable
  "API contract (observed)" section must come from a real, cited source — none exists for orders.
  Writing one would mean fabricating ground truth, which the skill (and the task) explicitly forbid.
- Per Rung 4 ("No reachable backend → ask the user for the endpoint(s) and a real sample"),
  I stopped and surfaced the questions below.

## Exactly what I'm asking the user
1. **Does an orders backend exist anywhere I can read?** If yes, point me at it — a monorepo path,
   a deployed base URL, or an OpenAPI/Swagger file/URL. Right now the backend exposes only `/api/products`.
2. **If there's no orders API yet:** orders is a backend capability that has to be built first
   (suggest `backend-feature-planner` → `backend-module-builder`). I can't bind a screen to an
   endpoint that doesn't exist.
3. **If the API exists but I can't reach the source:** paste a real sample for each endpoint you
   want bound — method + path, auth, request (params/query/body), and an actual success response
   JSON — and I'll derive the types/schema/BFF from that (marked as user-provided).
4. **Also note:** there is no orders *design* in the frontend yet either (only a products grid).
   The orders screen/components would need to be built (`figma-to-component` / `html-to-component`)
   before/with any binding. Confirm whether that design exists somewhere I haven't been shown.

Once any one of items 1/3 is provided, I can produce a faithful `_docs/FEATURE_PLAN_orders.md`
bound to the real contract.
