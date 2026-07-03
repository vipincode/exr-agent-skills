# backend-onboard

The **entry point** for using the backend toolkit on an **existing** API. It establishes the contract files (`ARCHITECTURE.md` + `MODULE_REGISTRY.md`) that every other backend skill reads.

## What it does

- Scans the repo (read-only) and writes a **descriptive** `ARCHITECTURE.md` — how your project actually works, not how it "should".
- Seeds `MODULE_REGISTRY.md` with all existing reusable code (utils, middleware, types, helpers) so future features reuse instead of duplicating.
- If the directory is empty, hands off to `express-ts-bootstrap` instead.
- Handles monorepos — finds where the backend actually lives (root or e.g. `backend/`).

## Example prompts

- "Onboard this repo for the backend skills"
- "Set up my existing API so I can use the toolkit here"
- "Get this project ready for the feature planner"

## Important

- **Non-destructive** — it never refactors or touches your app code, only writes the two contract files.
- Run it **once per project**, before planning/building anything.
- It asks questions only for genuine ambiguities it can't resolve from the code.
