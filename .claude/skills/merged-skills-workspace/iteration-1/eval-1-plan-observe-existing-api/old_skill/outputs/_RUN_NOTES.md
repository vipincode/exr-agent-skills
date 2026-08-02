# Run notes — eval-1-plan-observe-existing-api (old_skill: frontend-feature-planner)

## Files created / modified

| File | Action |
|---|---|
| `frontend/_docs/FEATURE_PLAN_products.md` | **created** (the only artifact) |

`diff -rq` against the pristine fixture confirms **no other file was created, edited, or deleted** —
no binding code was written, the hardcoded `SAMPLE` was left in place, and no registry was touched.
That matches the skill's "plan, don't build" guardrail.

### Plan file location
The skill body (Step 6) says to write `_docs/FEATURE_PLAN_<name>.md` **under the frontend project dir**,
so it went to `frontend/_docs/`. Note this conflicts with `../LAYOUT.md`, which says all planning docs
live at the **repo root** under `_docs/features/<module>/`. I followed the SKILL.md instruction
(more specific, and its template repeats the project-dir placement three times); LAYOUT.md's
"Legacy `_docs/FEATURE_PLAN_<name>.md`" section acknowledges this older placement. **Flagging as a
real inconsistency between the skill and LAYOUT.md.**

## Contract resolution (Step 2)
Reached **rung 1 — monorepo backend source**, the highest-fidelity rung. Resolved `backend/` via
`.claude/workspace.json` and read the full chain: `src/app.ts` (mount) → `products.routes.ts` →
`products.controller.ts` → `products.service.ts` → `products.schema.ts` → `products.model.ts` →
`src/lib/app-response.ts`, plus `backend/ARCHITECTURE.md` for the envelope + error model. No rung 2–4
fallback was needed. Nothing in the contract section is guessed.

### Key observations that a guessed contract would have gotten wrong
- Envelope is `{ success, data, message }` — the `data` payload must be unwrapped before parsing.
- `price` is an **integer in cents**; the built `ProductCard` takes a pre-formatted `price: string`.
- The list `data` is `{ items, total, page, limit }`, not a bare array.
- The DTO exposes `id` (not `_id`) and **strips `createdAt`/`updatedAt`** — they are on the model but
  never returned.
- `GET /` is **public**; only `POST /` is `protect` + `requireRole("admin")`.
- `limit` is capped at 100 and `id` must match `/^[a-f0-9]{24}$/`.

## The blocker (most important finding)
**The user asked for admin delete, and `DELETE /api/products/:id` does not exist.** The router only
declares GET `/`, GET `/:id`, and POST `/`. There is no `remove` controller and no delete service fn.
Per the skill's "observed, not guessed" guardrail I did **not** invent its contract — the plan is
marked **PARTIALLY BLOCKED**, the endpoint row reads "❌ DOES NOT EXIST", Dependencies carries the
unblock path (`backend-feature-planner` → `backend-module-builder`), and the delete work is isolated
as build-order piece 7 so pieces 1–6 remain buildable today.

Secondary blockers flagged, not worked around:
- `useAuth` is a literal stub (`{ user: null }`) — the admin delete button can never render as-is.
- The BFF proxy's implementation is elided in the fixture, so I could not confirm it forwards
  `Authorization`; every `protect` route 401s without it.
- No `.env`/`.env.example` to confirm `BACKEND_URL` is set.

## Questions I would have asked (user was absent)
1. Scope — list + admin delete only, or create/edit too?
2. Pagination — prev/next pager, infinite scroll, or load-all? (API is paged, so load-all isn't real.)
3. Delete — optimistic removal + rollback, or invalidate-and-refetch? Confirm dialog needed?
4. Which route renders the grid — an existing page, or a new `app/products/page.tsx`?

Plus two forced by the missing endpoint: should the DELETE be built first, and is it a hard or soft
delete (the model has no `deletedAt`/`isActive`, which suggests hard, but that's inference)?

**Defaults applied**, each labelled `_Assumption_` in the plan's Decisions section: paged with
`limit: 20` (the server default), invalidate-on-success + confirm dialog, new `app/products/page.tsx`,
search/category filter UI out of scope, hard delete.

## Honoring "break it into pieces i can build one at a time"
The old skill's template has **no slicing/build-order section** — it produces one flat plan. Since the
user explicitly asked for buildable pieces, I added a **"Build order — the buildable pieces"** table
(7 pieces, each with its contract status and dependencies) while keeping every non-negotiable section
from `plan-template.md` intact. Worth noting for the skill comparison: this was an addition I had to
make myself, not something the skill provided.

## Could not do
- **Answer any question interactively** — user absent; recorded them in the plan and applied flagged defaults.
- **Give the delete endpoint a real contract** — it doesn't exist; deliberately left unfilled.
- **Confirm auth/token plumbing** — `useAuth` is a stub and the BFF proxy body is elided in the fixture.
- **Verify `BACKEND_URL`** — no env file in the fixture.
- **Check `src/lib/query-client.ts` and `app/providers.tsx`** — referenced by `ARCHITECTURE.md` and
  `MODULE_REGISTRY.md` but not present as files in the fixture. I cited them as reuse targets on the
  strength of the contract files (rung 2) rather than treating them as missing.
