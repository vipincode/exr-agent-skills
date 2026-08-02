# module-planner

Plans one module **end to end — backend and frontend in a single plan** — then shards it into small, ordered slices you build one at a time.

## What it does

- Reads `ARCHITECTURE.md` + `MODULE_REGISTRY.md` for every domain in your repo (and the `prd-creator` brief if there is one), then asks **only** the questions those files can't answer.
- Writes a master plan plus one file per slice, all in the module's folder:

```
_docs/features/auth/
  auth-module.md        ← prd-creator's product brief (if you ran it)
  auth-plan.md          ← the module plan: data model, decisions, reuse list, build order
  01-register.md        ← build this first
  02-login.md
  03-logout.md
  04-forgot-password.md
```

- **The number is the build order.** No separate index to fall out of sync.
- Each slice states the **API contract once** — the backend half implements it, the frontend half binds to it. That's what stops frontend types drifting from what the server actually returns.
- Each slice also carries a **testing checklist** (its definition of done, and later the spec `test-writer` works from) and a `Status:` line (`ready` / `blocked` / `built`).

## Two modes, decided per slice

- **Design mode** — the backend is yours and doesn't exist yet. The plan *declares* the contract.
- **Observe mode** — the API already exists (an earlier module, another team, a third party). The plan *reads* the real source, OpenAPI spec, or a sample you paste, and records **where each fact came from**. It never guesses an envelope.

## Example prompts

- "Plan the auth module"
- "I want to build product search with filters — plan it"
- "Split the auth plan into register, login, logout"
- "Design the orders module"
- "Plan how the products grid binds to the API"
- "Wire this design to the endpoint"

## Important

- **Writes no code and no tests** — those are `module-builder` and `test-writer`.
- Everything it writes is plain markdown you own. Edit, reorder, merge, or delete slices before building.
- Plans live at the **repo root** under `_docs/features/`, not inside `backend-<name>/` or `frontend-<name>/` — a plan covering both halves can't belong to either one.
- If a slice's prerequisite is missing, it still gets a file, marked `blocked`, with the unblock path spelled out. It never invents a contract to fill the gap.
- Requires the contract files — if they're missing, run `project-onboard` (existing code) or a bootstrap skill (empty dir) first. It will offer.
