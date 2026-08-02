# project-onboard

Makes an **existing** repo ready for the toolkit by writing the contract files everything else depends on. Handles backend, frontend, or both in one pass.

## What it does

- Finds each project in the repo and works out its domain (backend / frontend) and where it lives.
- Scans it read-only: stack and versions, layout, conventions, and — most importantly — **every reusable util, middleware, component, hook, schema, and lib helper that already exists**.
- Asks about genuine conflicts only (two HTTP clients, two response shapes, duplicate card components). A consistent repo onboards with zero questions.
- Writes `ARCHITECTURE.md` + `MODULE_REGISTRY.md` in each project dir, and one merged `.claude/workspace.json` at the repo root.
- Spot-checks the result against real files, then reports findings — including pre-existing duplication — as observations, not fixes.

## Descriptive, not prescriptive

This is the rule that makes it safe. The contract records **what your repo actually does**, not what the bootstrap skills prefer:

- Express 4 with `asyncHandler` → recorded as required, so the builder keeps using it.
- Envelope is `{ data, message }` → recorded verbatim.
- Pages Router, SWR, Formik + Yup, CSS Modules + MUI → all recorded as-is.
- Browser calls the backend directly with no BFF → recorded as reality, and flagged as a *finding*.

Every later skill treats these files as literal truth, so a contract that lies produces code that clashes with everything around it.

## Example prompts

- "Set up my existing API for these skills"
- "Onboard this repo"
- "Onboard my Next.js app"
- "I want to use these skills on my current project"
- "Get this codebase ready"

## Important

- **Non-destructive.** It writes contract files and the manifest, nothing else. Never edits, moves, or refactors your code, never "upgrades" your stack.
- **Empty directory?** It hands off to `express-ts-bootstrap` / `nextjs-bootstrap` instead.
- **Already onboarded?** It won't regenerate — it offers to refresh a stale registry, or routes you straight to `module-planner`.
- The registry seeding is the most important output. Anything it misses is something a future feature might rebuild from scratch.
