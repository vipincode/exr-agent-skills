# frontend-module-builder

Implements the API binding from an **approved FEATURE_PLAN** — wiring the existing design to the real backend and making it functional, with duplication actively prevented.

## What it does

- Reads `ARCHITECTURE.md` + `MODULE_REGISTRY.md` + the feature plan, and runs a **dedup gate** before creating any component, hook, schema, or util.
- Writes the feature-module binding layer (types / Zod schema / axios api / TanStack Query hooks / BFF route) and edits the built design to consume it — dropping the hardcoded sample data.
- Unwraps the backend's response envelope, validates with Zod, uses TanStack Query for server state, then **updates the registry** in the same change.
- Enforces **placement by reach**: single-feature types/constants live in the feature's `types/` and `constants/` files; anything used by 2+ features goes global (types → `src/types/`, constants/enums → `src/constants/`, utils/hooks → `lib`/`hooks`, generic components → `components/shared`) and is registered. `components/ui/` stays shadcn-only; no inline magic literals.

## Example prompts

- "Build the products binding"
- "Implement FEATURE_PLAN_orders.md"
- "Now make this design functional" (after approving a plan)
- "Wire up the checkout screen"

## Important

- **Needs a plan first** — no plan → run `frontend-feature-planner`.
- It wires the existing design; it does **not** rebuild or redesign components (that's `figma-to-component` / `html-to-component`).
- Does not write tests — ask for `frontend-test-writer` separately.
