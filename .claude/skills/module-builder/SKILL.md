---
name: module-builder
description: Build a backend feature/module from an approved FEATURE_PLAN, enforcing reuse so no duplicate utils, middleware, types, or helpers get created. Use this whenever the user wants to implement, build, or generate a planned feature — "build the auth module", "implement FEATURE_PLAN_products.md", "now build it", "code up the orders feature". It reads ARCHITECTURE.md + MODULE_REGISTRY.md + the feature plan, searches for existing reusable code BEFORE creating anything, builds the module in the project's paradigm, then updates the registry. It does NOT plan features (that is feature-planner) and does NOT write tests (that is test-writer). Works in any project in the Express/TS convention family with the contract files.
---

# module-builder

Execute an approved `FEATURE_PLAN_<name>.md` into working code, following the project's conventions exactly and — critically — reusing what already exists instead of regenerating it. Duplicate utils/middleware are the failure mode this skill exists to prevent, so the search-before-create gate is mandatory, not advisory.

## Step 1 — Load everything

1. The feature plan: `FEATURE_PLAN_<name>.md`. If none exists, stop and point the user to feature-planner — do not improvise a plan.
2. `ARCHITECTURE.md` — paradigm, response envelope, error model, validation flow, **import convention** (e.g. NodeNext `.js` extensions), layout, auth primitives. Follow it literally; do not impose patterns from memory that contradict it.
3. `MODULE_REGISTRY.md` — the catalog of shared pieces and existing modules.

## Step 2 — The dedup gate (run before creating ANY shared code)

This is the heart of the skill. Before writing any util, middleware, helper, type, constant, or model that *could* be shared, follow `references/dedup-protocol.md`:
1. Check the plan's **Reuse** section (the planner already identified candidates).
2. Check `MODULE_REGISTRY.md`.
3. Grep `src/lib`, `src/middleware`, and sibling modules for the capability.
4. If a suitable piece exists → import it. "It's only one feature" is **not** a reason to inline a duplicate. If it almost fits, prefer extending the shared piece over forking it, unless that would overload it.
5. Only if nothing exists → create it, and mark it for registration (Step 5).

Module-local, single-use code (a private helper used by exactly one module) stays in the module and is not registered — don't over-share either.

## Step 3 — Build the module

Create the files listed in the plan under `src/modules/<name>/`, following the paradigm in ARCHITECTURE.md and `references/module-anatomy.md`. Hard rules drawn from the conventions (verify against ARCHITECTURE.md, which wins if it differs):
- **No `asyncHandler`** — Express 5 forwards async rejections. Plain async handlers.
- **Responses** only via the shared envelope helpers (`ok`/`created`/`noContent`). Never hand-roll a success shape.
- **Errors** only by throwing the shared `AppError` subclasses. Controllers don't try/catch.
- **Validation** via the shared `validate({...})` middleware with the module's Zod schemas; controllers consume typed, validated input.
- **Types** derived from Zod schemas with `z.infer` — no parallel interfaces.
- **Imports** follow the project's extension convention exactly.
- **Auth** reuses `protect`/`requireRole`/`jwt.ts` — never new token logic.
- Mount the new router in `src/app.ts` at the marked insertion point.

## Step 4 — Verify it's green

Run the project's typecheck and build (e.g. `<pm> run typecheck` / `<pm> run build`). Fix anything that fails. Do a quick boot/route sanity check if feasible. Report the result honestly — don't claim success without running it.

## Step 5 — Update the registry (same change)

Edit `MODULE_REGISTRY.md`:
- Add a **Modules** row: module name, path, what it owns, its public service surface (the functions/methods other modules may call), notes.
- Add any **new shared pieces** created in Step 2 (one line each: name, path, purpose) so the next feature's planner sees them.
- Update the **Decisions log** with feature-level decisions worth remembering (e.g. for auth: "tokens via httpOnly cookie; single role").

An out-of-date registry silently reintroduces the duplication problem, so this step is part of the build, not optional cleanup.

## Step 6 — Hand off

Summarize what was built, what was reused (with paths — this proves the gate worked), and what was newly registered. Note that tests are a separate step via test-writer (do not write them here, do not auto-invoke it).

## Guardrails

- Build only what the (possibly user-edited) plan specifies. If the plan omits something needed, surface it rather than silently expanding scope.
- Reuse over recreate, every time. The hand-off summary must list reused paths.
- ARCHITECTURE.md beats habit. If it says something different from these defaults, follow it.
- Don't plan, don't test.
