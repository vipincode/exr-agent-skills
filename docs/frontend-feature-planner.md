# frontend-feature-planner

Plans how an **already-built design** will bind to a **real backend API** — before any binding code is written.

## What it does

- Its signature move: reads the **real** backend contract instead of guessing — monorepo source first, then the backend's contract files, then an OpenAPI/Swagger spec, then a sample response you paste.
- Reads the frontend `ARCHITECTURE.md` + `MODULE_REGISTRY.md` and maps which existing design components consume which API fields.
- Writes an editable `_docs/FEATURE_PLAN_<name>.md`: types, Zod schemas, BFF routes, axios API functions, TanStack Query hooks, and the data-binding map.

## Example prompts

- "Plan the products API binding"
- "Wire up the orders screen to the API — plan it first"
- "Make this design functional with `/api/v1/products`"
- "How do I connect this page to the backend?"

## Important

- **Plans only** — the binding code is written by `frontend-module-builder` after you approve the plan.
- The design should already exist (built via `figma-to-component` / `html-to-component`); this skill doesn't build UI.
- The plan file is yours to edit before saying "build it".
- Not for backend/server planning — that's `backend-feature-planner`.
