# backend-feature-planner

Plans a backend feature or module **before any code is written**. The BMAD replacement.

## What it does

- Reads `ARCHITECTURE.md` + `MODULE_REGISTRY.md` first, then asks **only** the questions those files don't already answer.
- Writes an editable plan to `_docs/FEATURE_PLAN_<name>.md` — endpoints, models, validation, what gets reused vs created.
- Hands off to `backend-module-builder` once you approve the plan.

## Example prompts

- "Plan the auth feature"
- "I want to build product search with filters — plan it"
- "Design the orders module for this API"
- "How should I structure file uploads here?"

## Important

- **Writes no feature code and no tests** — those are `backend-module-builder` and `backend-test-writer`.
- The plan file is yours to edit: fix anything directly in `_docs/FEATURE_PLAN_<name>.md` before saying "build it".
- Requires the contract files — if they're missing, run `backend-onboard` first (the skill will offer to).
