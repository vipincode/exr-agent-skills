# module-builder

Builds **one slice** of a planned module into working code — the backend endpoints *and* the frontend binding that consumes them.

## What it does

- Picks the slice: the one you name, or the lowest-numbered slice that isn't `built` yet.
- Reads the slice file, the master plan, and `ARCHITECTURE.md` + `MODULE_REGISTRY.md` for each domain it touches.
- Runs the **dedup gate** before creating anything shared — checks the plan's reuse list, the registry, then greps the code. If a util, middleware, component, or hook already exists, it imports it instead of writing a second one.
- Builds the backend half (schemas, service, controller, routes, router mount) in your project's paradigm.
- Builds the frontend half (types, schemas, request fns, query hooks) and **edits the already-built design** to consume it — dropping the hardcoded samples, applying the slice's data-binding map, rendering loading/empty/error states.
- Runs typecheck/lint/build and reports what actually happened.
- Updates each registry, marks the slice `built`, and ticks the master plan's build-order table.
- Ends by showing the slice's **testing checklist** and offering `test-writer` and `code-review`.

## Why one slice at a time

The plan was sharded so you can build, see it work, and stop. One slice per run keeps the change small enough to actually review, and the `built` status is what lets you pick the work back up next week without re-reading everything.

## Example prompts

- "Build the register slice"
- "Implement 01-register.md"
- "Build the next slice"
- "Now build it"
- "Make this design functional"
- "Wire the products screen to the API"

## Important

- **Won't build a `blocked` slice.** It surfaces the blocker and the unblock path instead of coding around the gap.
- **Binds the design, doesn't rebuild it.** Missing components get flagged for `figma-to-component` / `html-to-component` / `project-to-component`, not invented.
- **Doesn't plan and doesn't test.** It suggests `test-writer` when a slice lands, but never runs it for you.
- Builds only what the slice specifies. If something's missing from the plan, it tells you rather than quietly widening scope — the plan is the thing you reviewed.
- `ARCHITECTURE.md` always wins over its defaults. On an Express 4 project that needs `asyncHandler`, or a frontend on SWR instead of TanStack Query, it follows your contract.
