# SUMMARY — orders binding build (frontend-module-builder)

## Outcome: NO CODE BUILT — plan is BLOCKED (this is the correct action)

I followed the `frontend-module-builder` skill. Its first step (Step 1) says:

> **If the plan's status is `BLOCKED`**, do not build around the gap: surface the blocker
> (the missing API contract / prerequisite) and the unblock path the plan already names, and stop.

`_docs/FEATURE_PLAN_orders.md` is explicitly marked **`Status: BLOCKED`**, so I stopped and did
not generate any binding code. Inventing types/schemas/hooks for a non-existent API would violate
the skill's "observed, not guessed" guardrail; fabricating a design to bind to would violate
"bind the design, don't rebuild it."

## What I did

1. Read the skill and both references (`dedup-protocol.md`, `binding-anatomy.md`).
2. Resolved the project dir via `.claude/workspace.json` → `frontend` maps to `frontend/`.
3. Read `_docs/FEATURE_PLAN_orders.md` — status is **BLOCKED**.
4. Verified the blockers against the actual repo (not trusting the doc blindly):
   - **Backend orders module: does not exist.** `backend/src/modules/` contains only `products/`.
     `backend/src/app.ts` and `backend/MODULE_REGISTRY.md` reference only products. No orders
     route/controller/service/schema/model, no OpenAPI spec, no pasted sample.
   - **Orders API contract: unobtainable.** No module + no spec + no sample = endpoints, request
     shapes, `data` shape, and pagination meta all unknown.
   - **Orders frontend design: does not exist.** `frontend/src/features/` contains only `products/`
     (`components/product-card.tsx`, `template/products-grid.tsx`). No `features/orders/` to wire.
   - `useAuth` is a stub (`frontend/src/hooks/use-auth.ts` returns `{ user: null }`).

   All four match the plan's claims — the BLOCKED status is accurate, not a stale doc.

## Why I did not build

A binding needs two ground-truth inputs that are both absent: a **real API contract** (to derive
Zod schemas → `z.infer` types → request fns → query hooks) and a **built design** (to edit so it
consumes the hooks). Neither exists. There is nothing to faithfully realize, so the honest result
is to stop and report.

## Files created or modified

**None** — no code created, no files in `REPO\frontend` (or anywhere in the repo) modified. The
only artifact is this `SUMMARY.md` in OUTPUTS. There are no `frontend/...` files to copy into OUTPUTS.

## Unblock path (from the plan)

To unblock the orders binding, provide ONE of:
1. **Build the orders backend module** (recommended) via `backend-feature-planner` →
   `backend-module-builder`, mount it (e.g. `/api/orders`), then re-run `frontend-feature-planner`
   so the contract is read from real source; OR
2. **Paste a real orders sample** (endpoint(s) + actual request/response) to derive the contract
   at lower fidelity (flagged as user-provided).

And, to have something to bind:
3. **Build the orders design** (`figma-to-component` / `html-to-component`) — only `features/products/`
   exists today — or point to an existing screen this should feed.
4. **Confirm scope** — list only, or list + detail (and any create/cancel actions)?

Once a real contract and a built design exist and the plan is moved off BLOCKED, re-run
`frontend-module-builder`; it will produce `features/orders/{schema,types,api,hooks,template,index}`
reusing `lib/axios.ts`, the catch-all BFF proxy at `app/api/[...path]/route.ts`,
`lib/query-client.ts`, the shared `components/shared/form/*` fields, and `hooks/use-auth.ts` — no new
BFF route needed.
