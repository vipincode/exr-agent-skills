# Run notes — eval-1-plan-observe-existing-api (with_skill)

Skill under test: `module-planner` (`D:/SKILLS/exr-agent-skills/.claude/skills/module-planner/SKILL.md`)
Fixture: `fixtures/fx-observe-products` → copied to `with_skill/repo`

## Files created

All three are new; **no existing file in the repo was modified**
(`diff -rq fixture repo` reports only the new `_docs` directory).

| Path (relative to repo root) | What it is |
|---|---|
| `_docs/features/products/products-plan.md` | master module plan |
| `_docs/features/products/01-list-products.md` | slice 01 — bind the grid to the existing `GET /api/products` (observe mode, frontend-only) |
| `_docs/features/products/02-admin-delete-product.md` | slice 02 — new `DELETE /api/products/:id` + confirmed admin delete (design mode, fullstack) |

Reference files read: `SKILL.md`, `references/reading-backend.md`, `references/slicing-guide.md`,
`references/plan-template.md`, `references/slice-template.md`, `references/question-banks.md`, and
`../LAYOUT.md`. Project dirs resolved from `.claude/workspace.json` (`backend` → `backend/`,
`frontend` → `frontend/`); plan docs written at the **repo root** under `_docs/`, per LAYOUT.md.

## Questions I would have asked (user not present)

Per the skill's Step 4 (≤4 genuine unknowns), these survived the filter — everything the contract
files already answer (BFF vs direct, axios, Zod, TanStack Query, query-key style, envelope shape,
shared form fields, auth primitives) was **not** asked. Each is recorded in the plan's
`## Decisions` section with the default I proceeded on, flagged `_Assumption_`:

1. **Delete semantics — hard or soft?** → assumed **hard delete / 204**. The `Product` model has no
   `deletedAt` / `isActive` / `archived` field, so soft delete would need a schema change plus a
   filter on every existing read path.
2. **Cache strategy after delete — optimistic removal or invalidate-on-success?** → assumed
   **invalidate-on-success** on the `["products"]` key prefix; no rollback path, keeps `total` honest.
3. **Does delete need a confirm step?** → assumed **yes**, a confirm dialog (irreversible under hard
   delete, trigger sits on a grid card).
4. **Non-admin UI for the delete control — hide, disable, or route-guard?** → assumed **hide**
   (`useAuth().user?.role === "admin"`); the grid itself is public.

Plus one decision I derived from the user's own words rather than asking: **"list view for now"** →
page 1 only at the server default `limit` 20, **no pagination controls**, though the endpoint does
support `page` / `limit` / `search` / `category`. Also flagged as an assumption since the API's
capability exceeds what is being bound.

## What I could not do / open questions left in the plan

- **`requireRole('admin')`'s rejection status (403 vs 401) is unknown.** `backend/src/middleware/auth.ts`
  and `backend/src/lib/app-error.ts` are **imported by the real source but absent from this fixture**,
  and `backend/ARCHITECTURE.md`'s error map lists no `ForbiddenError`. Per the skill's "observed, not
  guessed" guardrail I did **not** invent a value: it is an open question in both the master plan and
  slice 02, and slice 02's frontend half handles 401 and 403 identically so the binding is correct
  under either answer. Those two file paths are still listed in the reuse table (sourced from the
  import statements at `products.routes.ts:2-3` and `products.controller.ts:3`) with that caveat noted.
- Nothing else was blocked — both slices are `Status: ready`. No slice needed a `blocked` banner.

## Notable fixture facts the plan had to get right (observe mode)

- Mount base is `/api/products` (`backend/src/app.ts:5`), not `/products`.
- List `data` is **`{ items, total, page, limit }`** — a wrapper object, not a bare array.
- Success envelope is `{ success, data, message }`; the **error envelope is flat**
  (`{ success, message, code }`), *not* `{ error: { code, message } }` as in the slice template's
  illustrative example.
- Wire shape is the service `ProductDTO` (`id`, no `createdAt`/`updatedAt`), not the Mongoose document.
- `price` is an **integer in cents** while the already-built `ProductCard` expects a pre-formatted
  `price: string` → the binding map records the cents→currency transform explicitly.
- `GET /api/products` is **public** (no `protect` on the route) — the plan does not gate the list.
- **No DELETE endpoint exists** anywhere (routes, controller, service, and `backend/MODULE_REGISTRY.md`
  all agree), so slice 02 is design mode within an otherwise observe-mode module — the mixed-mode case
  `reading-backend.md` describes.
- The BFF catch-all already forwards `/api/*`, so the plan explicitly calls for **no new BFF route**.
