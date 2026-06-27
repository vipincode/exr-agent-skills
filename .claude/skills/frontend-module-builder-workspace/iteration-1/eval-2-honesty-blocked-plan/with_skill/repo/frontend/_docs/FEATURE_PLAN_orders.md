# Feature plan: orders (API binding)

> Status: **BLOCKED** — no `orders` API contract exists in the backend (only `products` is
> implemented), and no OpenAPI spec or sample response was provided. The binding cannot be
> planned against ground truth until the orders capability exists or a real sample is pasted.
> Every section below is still filled; the unobtainable parts say what's missing and how to unblock.

## Overview
Intended to bind an orders screen (list / detail of customer orders) in the Next.js frontend to a
backend orders API, making the design functional against live data. **Cannot proceed:** the orders
API does not exist in the backend, and the orders design does not exist in the frontend yet. This
plan records what was searched, what is missing, and the exact path to unblock.

## API contract (observed)
> Source attempted: monorepo backend source (rung 1) → none found. No OpenAPI/Swagger spec
> (rung 3). No user-pasted sample (rung 4). **Contract could not be obtained.**

**Could NOT be obtained — not invented.** Rungs tried, per `references/reading-backend.md`:

| Rung | Source | Result |
|------|--------|--------|
| 1 — monorepo backend source | `backend/` (resolved via `.claude/workspace.json`) | ❌ No `orders` module. `backend/src/app.ts` mounts only `/api/products`. `backend/src/modules/` contains only `products/`. `backend/MODULE_REGISTRY.md` lists only the `products` module. |
| 2 — backend contract files | `backend/ARCHITECTURE.md` + `backend/MODULE_REGISTRY.md` | ⚠️ Envelope + auth conventions known (see below), but **no orders public surface** documented. |
| 3 — OpenAPI / Swagger | repo scan | ❌ No spec file or `/docs` URL present. |
| 4 — user-pasted sample | task input | ❌ None provided. |

What IS known (backend-wide conventions, from `backend/ARCHITECTURE.md`) — these will apply to an
orders module *once it exists*, but they do **not** tell us the orders endpoints, request shapes, or
`data` shape:
- **Success envelope:** `{ "success": true, "data": <data>, "message": <string> }` (helpers `ok` / `created` / `noContent`).
- **Error envelope:** `{ "success": false, "message": <string>, "code": <string> }`; statuses NotFound→404, Conflict→409, Unauthorized→401, Validation→422.
- **Auth:** `protect` (Bearer access token) + `requireRole('admin')`.
- **Validation:** `validate({ body?, query?, params? })` with Zod.

The endpoints table is intentionally **empty** — fabricating `GET /api/orders`, an `Order` shape, or
pagination meta would violate the "observed, not guessed" guardrail.

| Method | Path | Auth | Request (params / query / body) | Response `data` shape |
|--------|------|------|--------------------------------|------------------------|
| _unknown_ | _unknown — orders module not implemented_ | _unknown_ | _unknown_ | _unknown_ |

`Order` = _unknown — to be defined by the backend model/service or a pasted sample._

## Decisions
- _Assumption_: orders likely needs at least a list (and probably a per-order detail) screen — **not confirmed**; the user named only "the orders screen."
- _Assumption_: orders are user-scoped and the read path will be `protect`-guarded (consistent with backend auth primitives) — **not confirmed** until the module exists.
- No transport/validation/state/form decisions are open: the frontend contract fixes them (BFF proxy + axios, Zod, TanStack Query v5, shared `*Field`).

## Dependencies
Blockers lead. This binding cannot work until these are resolved.

| Dependency | Needed for | Status / unblock path |
|------------|-----------|------------------------|
| **Orders backend module** (routes/controller/service/schema/model, mounted e.g. `/api/orders`) | the entire binding — every request | ❌ **BLOCKED — does not exist.** Build it via `backend-feature-planner` → `backend-module-builder`. Then re-run this planner to read the real route→controller→service→schema chain. |
| **Orders API contract** (endpoints, request shapes, exact `data` shape, pagination meta) | types, Zod schemas, hooks, data mapping | ❌ **BLOCKED.** Resolves automatically once the module exists; OR paste a real sample request/response (curl / network-tab JSON) to unblock at rung 4 (lower fidelity, flagged). |
| **Orders design/screen** in frontend (`src/features/orders/`) | something to bind the data to | ❌ Not built. Currently only `src/features/products/` exists (design-only). Build via `figma-to-component` / `html-to-component`. |
| `useAuth` returns a real user/role | guarding/scoping order reads to the signed-in user | ⚠️ Stub: `src/hooks/use-auth.ts` returns `{ user: null }`. Must be wired before any guarded orders call works. |
| `BACKEND_URL` env | BFF proxy → backend | ⚠️ Assumed set (per `frontend/ARCHITECTURE.md`); not verified in this fixture. |

## Reuse (do NOT recreate)
These exist today and the orders binding will import them rather than rebuild — confirmed once the
contract lands, but the paths are already fixed by the frontend contract:

| What | Path | How it's used here |
|------|------|--------------------|
| axios instance | `src/lib/axios.ts` | all orders request fns go through it (`baseURL: /api`) |
| BFF proxy (catch-all) | `src/app/api/[...path]/route.ts` | already forwards `/api/orders/*` → backend; **no new BFF route needed** |
| query client | `src/lib/query-client.ts` | provided in `app/providers.tsx` |
| shared form fields | `src/components/shared/form/*` (`InputField`, `SelectField`, `TextareaField`, `CheckboxField`) | any orders form/filters (if needed) |
| useAuth | `src/hooks/use-auth.ts` | gate/scope orders reads in the UI (needs wiring — see Dependencies) |

## Types & schema
**Pending the contract** — cannot define without the observed `data` shape. Once unblocked:
- `src/features/orders/types/orders.ts` — `Order`, order list-response type, **derived via `z.infer`** from the schema (no parallel interfaces), mirroring the envelope `data`.
- `src/features/orders/schema/orders.schema.ts` — Zod schemas for the order shape + any request/filter inputs.

No field names, types, or shapes are committed here — they come from the backend model/service or a pasted sample.

## Create
**Pending the contract** — intended files following feature-module anatomy, to be filled once the
orders API shape is known:

| File | Purpose |
|------|---------|
| `src/features/orders/types/orders.ts` | domain types from the observed `data` shape (pending) |
| `src/features/orders/schema/orders.schema.ts` | Zod request/response schemas (pending) |
| `src/features/orders/api/orders.api.ts` | request fns hitting `/api/orders` via axios (pending) |
| `src/features/orders/hooks/use-orders.ts` | TanStack query/mutation hooks (pending) |
| `src/features/orders/components/*.tsx` | feature components — **design not built yet** (see Design gaps) |
| `src/features/orders/template/orders-*.tsx` | composed screen(s) rendered by `page.tsx` (pending design) |
| `src/features/orders/index.ts` | barrel for the module's public surface |
| BFF route under `app/api/` | **not needed** — catch-all proxy already covers `/api/orders/*` |

## Data mapping
**Pending the contract AND the design.** Cannot map component ↔ hook ↔ fields because neither the
orders response fields nor the orders components exist yet. To be completed once both land.

| Component (path) | Hook | Fields bound | States |
|------------------|------|--------------|--------|
| _pending — orders design not built_ | _pending — hook not defined_ | _pending — fields unknown_ | loading / empty / error |

## Query/mutation hooks
**Pending the contract.** Intended shape once unblocked:
- `useOrdersQuery(filters?)` — key `["orders", filters]`; pagination style TBD (depends on whether the API returns pagination meta — unknown).
- (If detail screen) `useOrderQuery(id)` — key `["orders", id]`.
- loading / empty / error handling per hook.

No invalidation scope or optimistic strategy is committed — there are no observed mutations.

## Design gaps (build before/with binding)
- **Entire orders design is missing.** No `src/features/orders/` exists; only `src/features/products/`
  (itself design-only). Build the orders list/detail screen via `figma-to-component` /
  `html-to-component` before (or alongside) binding.

## Edge cases & states
To be honored once unblocked (standard for this stack): loading skeleton, empty list, request error
(toast/inline), 401 → re-auth, end-of-pagination (if paged), 404 on a missing order detail. Specifics
depend on the observed contract.

## Testing checklist
Behavior a correct binding must satisfy — handoff target for `frontend-test-writer`. Cannot be made
concrete until the contract + design exist; provisional:
- [ ] Orders list renders live data from `/api/orders` (no hardcoded sample).
- [ ] Loading, empty, and error states each render correctly.
- [ ] Response envelope `{ success, data, message }` is unwrapped and `data` passes the Zod schema (drift fails loudly).
- [ ] Reads are scoped/guarded to the signed-in user; a 401 is handled gracefully.
- [ ] Query keys (`["orders", …]`) are correct and any mutations invalidate them.

## Out of scope
- Building the orders backend module (that is `backend-feature-planner` → `backend-module-builder`).
- Building the orders design/components (that is `figma-to-component` / `html-to-component`).
- Writing the binding code (that is `frontend-module-builder`) and tests (`frontend-test-writer`).

## Open questions
To unblock this plan, the user needs to provide ONE of:
1. **Build the orders backend module** (recommended) via `backend-feature-planner` →
   `backend-module-builder`, then re-run this planner so the contract is read from real source; OR
2. **Paste a real orders sample** — the endpoint(s) and a real request/response (curl output or
   network-tab JSON) so the contract can be derived at rung 4 (flagged as user-provided).

And, to bind anything:
3. Confirm **scope** — list only, or list + detail (and any create/cancel actions)?
4. Confirm the **orders design** will be built (via `figma-to-component` / `html-to-component`), or
   point to an existing screen this should feed.
