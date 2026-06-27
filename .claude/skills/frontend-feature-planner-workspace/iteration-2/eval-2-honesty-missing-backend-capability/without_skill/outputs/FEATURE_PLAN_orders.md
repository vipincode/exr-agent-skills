# Feature Plan — Orders screen → API binding

Status: **BLOCKED — cannot plan a real binding yet.**
Date: 2026-06-27

## TL;DR
The orders screen cannot be bound to the API because **the backend has no orders
capability and the frontend has no orders screen.** Binding plans must be grounded in a
real backend contract; here there is none to bind to. Rather than invent an endpoint
shape, this plan documents the gap and the prerequisite work.

---

## What I checked (ground truth)

### Backend (`backend/`, demo-api — Express 5 + TS + Mongoose + Zod + JOSE)
- `src/app.ts` mounts exactly one router: `app.use("/api/products", productsRouter)`. Nothing else.
- The only module is `src/modules/products/` (controller, model, routes, schema, service).
- `backend/MODULE_REGISTRY.md` lists **products as the only module**. No orders entry.
- A repo-wide search for `order` (case-insensitive) returns **zero** matches in backend
  (no model, service, controller, route, or schema).

➡️ There is **no `/api/orders` endpoint**, no Order model, and no request/response
envelope to bind against.

### Frontend (`frontend/`, demo-web — Next.js App Router + TanStack Query v5 + axios + Zod)
- The only feature is `src/features/products/`, and per `frontend/MODULE_REGISTRY.md` it is
  **DESIGN ONLY (no api/hooks/types/schema yet)** — and even that is the *products* screen.
- There is **no `features/orders/` directory** and no orders component, template, or screen.
- Repo-wide search for `order` returns zero matches in frontend (the single hit elsewhere is
  the CSS class `border`).

➡️ There is **no "orders screen"** to wire up. The phrase in the request does not match
anything that exists in the codebase.

---

## Why I'm not producing a binding plan
A frontend-to-API binding plan (types, Zod schemas, axios fns, TanStack Query hooks, a
data-binding map) is only useful if it binds to the **actual** backend contract — the real
endpoints, envelope, auth, and validation. Inventing an `/api/orders` shape here would
produce a plan that looks complete but binds to a fiction, and would almost certainly not
match whatever orders API is eventually built. That is worse than no plan.

## Prerequisites before an orders binding can be planned
1. **Backend: build an orders module first.** It needs at minimum:
   - An `Order` Mongoose model.
   - Routes mounted at `/api/orders` (e.g. `GET /api/orders`, `GET /api/orders/:id`,
     `POST /api/orders`), guarded by `protect` (orders are almost always user-scoped).
   - Zod request schemas + a service layer.
   - Responses using the existing fixed envelope (`ok`/`created` →
     `{ success, data, message }`), per `backend/ARCHITECTURE.md`.
   - A new row in `backend/MODULE_REGISTRY.md`.
   (This is backend-planning/-building work, not frontend binding.)
2. **Frontend: build the orders screen/design.** There is currently no orders UI. A design
   (e.g. `features/orders/template` + components) must exist before there is anything to bind.
3. **Then** plan the binding: derive `features/orders/types` + `schema` from the real
   response envelope, add `features/orders/api` axios fns hitting `/api/orders` (the existing
   catch-all BFF proxy at `app/api/[...path]/route.ts` already forwards `/api/*`, so no new
   BFF route is needed), add `useOrdersQuery`/`useOrderMutation` hooks with query keys
   `["orders", filters]`, and map fields to the design components.

---

## What IS ready to bind (the likely real intent?)
The **products** screen exists, is design-only, and the backend `/api/products` endpoint is
real and documented. If the goal is actually "make a screen functional," the products
feature is the one that can be planned and bound today:
- Backend contract is known: `GET /api/products` → `{ success, data: { items, total, page,
  limit }, message }`; `GET /api/products/:id` → `{ success, data: product, message }`.
- Frontend `ProductsGrid` / `ProductCard` currently render hardcoded `SAMPLE` data and are
  explicitly marked "needs to be bound to the products API."

If "orders" was a misnomer for "products," say so and I'll write a full, grounded binding plan.

---

## Recommendation
Do not proceed with an orders binding. Either:
(a) confirm you meant **products** (ready to plan now), or
(b) build the **backend orders module** + **frontend orders design** first, after which a
    real, grounded orders binding plan can be written.
