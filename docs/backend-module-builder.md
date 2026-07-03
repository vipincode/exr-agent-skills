# backend-module-builder

Builds a backend feature/module from an **approved FEATURE_PLAN**, with duplication actively prevented.

## What it does

- Reads `ARCHITECTURE.md` + `MODULE_REGISTRY.md` + the feature plan.
- Runs a **dedup gate**: searches for existing reusable code before creating any util, middleware, type, constant, or helper.
- Enforces **placement by reach**: module-local types/constants/helpers live in the module's `<name>.types.ts` / `<name>.constants.ts` / `<name>.utils.ts`; anything used by 2+ modules goes global (`src/types/`, `src/constants/`, `src/lib/`, `src/middleware/`) and is registered. No inline magic literals or ad-hoc inline types.
- Builds the module in your project's own paradigm, verifies it compiles/passes, then **updates `MODULE_REGISTRY.md`** in the same change so the next feature can reuse what it created.

## Example prompts

- "Build the auth module"
- "Implement FEATURE_PLAN_products.md"
- "Now build it" (right after approving a plan)
- "Code up the orders feature"

## Important

- **Needs a plan first** — it implements `_docs/FEATURE_PLAN_<name>.md`, it doesn't design features on the fly. No plan → run `backend-feature-planner`.
- Does **not** write tests (ask for `backend-test-writer` separately).
- If it built something that isn't in the registry afterwards, that's a bug — the registry update is part of the job.
