---
name: module-builder
description: Build ONE slice of a planned module end to end — the backend endpoints and the frontend binding that consumes them — from an approved slice file, enforcing reuse so no duplicate utils, middleware, components, hooks, types, or schemas get created. Use this whenever the user wants to implement, build, or execute planned work: "build the register slice", "implement 01-register.md", "now build it", "code up the login slice", "build the next slice", "make this design functional", "wire the products screen to the API". It reads _docs/features/<module>/<module>-plan.md and the numbered slice file, plus ARCHITECTURE.md + MODULE_REGISTRY.md for each domain in scope, searches for existing reusable code BEFORE creating anything, builds the backend half in the project's paradigm, then writes the frontend binding layer and edits the ALREADY-BUILT design to consume it (dropping hardcoded samples), verifies both compile, updates the registries, marks the slice built, and suggests testing it. It builds one slice per run — not the whole module — so work is checkpointed and resumable. It does NOT plan (that is module-planner), does NOT design/redesign components from Figma or HTML (that is figma-to-component / html-to-component / project-to-component), and does NOT write tests (that is test-writer).
---

# module-builder

Execute **one slice** of an approved module plan into working code — the backend half, the frontend binding, and the wiring of the already-built design — following the project's conventions exactly and reusing what already exists instead of regenerating it.

Why one slice at a time: the plan was sharded precisely so the user can build, see it work, and stop. Building the whole module in one run throws that checkpoint away and produces a change too large to review. **Build the slice, verify it, hand off. Then the user decides whether to run the next one.**

Three failure modes this skill exists to prevent:

1. **Duplication** — recreating a util, middleware, component, hook, or type that already lives in `lib`, `middleware`, `components/shared`, `hooks`, or another module. The dedup gate is mandatory, not advisory.
2. **Rebuilding the design** — regenerating components that already exist instead of binding them. The plan mapped the design; realize it, don't re-decide it.
3. **Contract drift** — the frontend inventing a response shape. The slice already states the contract once; both halves follow that section, not their own memory.

## Step 0 — Pick the slice

Find `_docs/features/<module>/` at the repo root.

- **User named a slice** ("build the register slice", "implement 01-register.md") → that one.
- **User said "build it" / "next slice"** → the lowest-numbered slice whose `Status:` is not `built`. State which one you picked and why before starting, so a wrong guess is cheap to correct.
- **No plan folder exists** → stop and point the user at `module-planner`. Do not improvise a plan; an improvised plan defeats the review step the whole workflow is built around.
- **Slice `Status: blocked`** → do not build around the gap. Surface the blocker and the unblock path the slice already names, and stop.
- **Slice `Status: built`** → say so and ask whether they want it rebuilt or want the next one instead.
- **Dependencies unmet** — the slice's `Depends on` names an earlier slice that isn't `built` → flag it and recommend building that first. If the user says go anyway, honor it and note what may not work yet.

Build exactly one slice per run. If the user explicitly asks for several, build them in order, verifying each before starting the next — never interleaved.

## Step 1 — Load everything

Resolve the project dir for **each domain the slice touches** via `../LAYOUT.md` (`.claude/workspace.json`; legacy fallback is a root `ARCHITECTURE.md`). All `src/` paths, contract files, and registries below are relative to the matching project dir.

1. **The slice file** — the work order. Its **API contract** section is the single shape both halves implement.
2. **The master plan** (`<module>-plan.md`) — the data model, module-wide decisions, envelope conventions, and the reuse inventory. The slice assumes you've read this.
3. **`ARCHITECTURE.md`** per domain — paradigm, envelope, error model, validation flow, import convention, layout, auth primitives (backend); how the browser reaches the backend, HTTP instance, validation library, type derivation, server-state library and query-key style, form stack, feature-module anatomy, component placement (frontend). **Follow it literally.** If it contradicts the defaults below, ARCHITECTURE.md wins — it describes this repo; the defaults describe the common case.
4. **`MODULE_REGISTRY.md`** per domain — the catalog of shared pieces and existing modules.
5. **The built design** (frontend half) — read the actual files the slice binds (`features/<name>/template/*.tsx`, `features/<name>/components/*.tsx`). You're editing these, so read what's really there: the props, the hardcoded sample shape. Assuming their shape and then editing blind is how bindings break.

## Step 2 — The dedup gate (before creating ANY shared code)

This is the heart of the skill. Before writing any util, middleware, component, hook, helper, type, constant, or schema that *could* be shared, run the procedure in `references/dedup-protocol.md`:

1. Check the plan's / slice's **Reuse** list — the planner already searched; verify each path still exists.
2. Check `MODULE_REGISTRY.md` for the capability.
3. Grep the codebase — the registry can lag, so don't trust it alone.
4. Found something? → **import it.** "It's only one feature" is not a reason to inline a duplicate. If it almost fits, extend the shared piece rather than fork it — unless extending would overload it with unrelated concerns.
5. Nothing exists → create it, place it by the placement rules in the protocol, and mark it for registration (Step 6).

Genuinely single-use code — a private helper used by exactly one module — stays local and is **not** registered. Over-sharing is its own failure mode; the gate is about capabilities that will be needed twice, not about hoisting everything.

## Step 3 — Build the backend half

Skip if the slice says `n/a`. Create the files the slice lists under `src/modules/<name>/`, following the paradigm in `ARCHITECTURE.md` and the anatomy in `references/backend-anatomy.md`. The non-negotiables (verify against ARCHITECTURE.md, which wins if it differs):

- **Implement the slice's contract exactly** — the paths, methods, guards, request shapes, status codes, and `data` shape written there. If the contract seems wrong, say so; don't quietly implement something else, because the frontend half is about to bind to what's written.
- **Responses** only via the shared envelope helpers (`ok`/`created`/`noContent`). Never hand-roll a success shape.
- **Errors** only by throwing the shared `AppError` subclasses. Controllers don't try/catch.
- **No `asyncHandler`** on Express 5 — it forwards async rejections natively. Plain async handlers. (Express 4 projects need the wrapper; ARCHITECTURE.md says which.)
- **Validation** via the shared `validate({...})` middleware with the module's schemas; controllers consume typed, validated input.
- **Types** derived from the schemas — no parallel hand-written interfaces that can drift.
- **Placement by reach** — non-schema types in `<name>.types.ts`, constants/enums in `<name>.constants.ts`, private helpers in `<name>.utils.ts`; anything used by 2+ modules goes global (`src/types/`, `src/constants/`, `src/lib/`) and gets registered. No inline magic literals, no ad-hoc inline types.
- **Imports** follow the project's extension convention exactly.
- **Auth** reuses the existing `protect` / `requireRole` / JWT helpers — never new token logic.
- **Mount the router** in `src/app.ts` at the marked insertion point.

## Step 4 — Build the frontend half and wire the design

Skip if the slice says `n/a`. Create the files the slice lists under `src/features/<name>/`, following `references/frontend-anatomy.md`. The non-negotiables:

- **Bind to the slice's contract section**, not to a re-reading of the backend. That section is why the plan is unified — the shape was settled once.
- **Client talks only to the app's own origin** when the project uses a BFF proxy: request fns call the shared HTTP instance → `/api/...` → the proxy → backend. Never call the backend's absolute URL from the browser, never read the backend URL in client code. Add a dedicated route handler only when the slice says the catch-all proxy is insufficient.
- **Unwrap the envelope, then validate.** The request fn pulls `data` out of the envelope and parses it with the schema, so contract drift fails loudly instead of rendering garbage. Never return raw `any`.
- **Types from the schemas** via inference — no parallel interfaces.
- **Server state through the project's query library.** Hooks live in the module; keys are namespaced by feature; mutations invalidate the keys the slice names (or do the optimistic update it specifies). Don't fetch with `useEffect` + `useState`.
- **Forms through the shared field components** and the project's resolver — no raw inputs wired by hand, no hand-rolled error text.
- **Auth gating** reuses the existing auth hook and role checks.

Then make the design functional by **editing** it per the slice's data-binding map:

- Replace hardcoded sample arrays and props with data from the hooks.
- Apply the mapping transforms the slice specifies (cents → formatted price, timestamps → display format) in the binding layer, so presentational components keep receiving clean props.
- **Tabular data defaults to the project's data-table pattern** (column defs, sorting, pagination) rather than static table markup, unless the slice says otherwise — bound API data almost always grows into needing sorting and paging, and retrofitting later costs more than starting with column defs. Flag the choice if it's ambiguous.
- Render the **loading / empty / error** states the slice calls for. If the design lacks them and the slice flags a **design gap**, add a lightweight inline version (skeleton, empty copy, inline error) so the binding is usable — but do **not** redesign or rebuild the feature's actual components. Anything beyond a state stub belongs to `figma-to-component` / `html-to-component` / `project-to-component`; flag it and move on.

Build only what the (possibly user-edited) slice specifies. If something the binding needs is missing from it, surface that rather than silently expanding scope — the plan is the reviewed artifact, and quiet additions bypass the review.

## Step 5 — Verify it's green

Run the project's typecheck / lint / build for each domain you touched (`<pm> run typecheck`, `<pm> run build`, `<pm> run lint`). Fix what fails. Code that doesn't compile isn't done. Do a quick boot or route sanity check if feasible.

**Report the result honestly.** If a check fails and you couldn't fix it, say which and why. If you couldn't run them at all, say that instead of implying they passed.

## Step 6 — Update the registries and the slice status (same change)

For each domain you touched, edit `MODULE_REGISTRY.md`:

- Add or refresh the **module/feature row**: name, path, what it owns, its public surface (the service functions, hooks, components, and types other code may import), notes.
- Add any **new shared pieces** from Step 2 — one line each: name, path, purpose — so the next slice's planner and dedup gate see them.
- Update the **decisions log** with anything worth remembering ("tokens via httpOnly cookie; single role", "price stored in cents, formatted at the edge").

Then update the plan docs:

- Set the slice file's `Status:` to `built`.
- Tick that slice's row in the master plan's **Build order** table.

Do both in the same change. An out-of-date registry silently reintroduces the duplication problem; an out-of-date status means the next session can't tell what's left. These are part of the build, not optional cleanup.

## Step 7 — Hand off, and suggest testing this slice

Close with:

1. **What was built** — the backend files, the binding files, and which design components were wired.
2. **What was reused**, with paths. This is the proof the dedup gate actually ran; a summary without paths isn't evidence.
3. **What was newly registered.**
4. **Verification result** — what you ran and what it said.
5. **Test this slice now.** The slice carries a **Testing checklist** that was written as its definition of done. Surface it — show the checklist — and offer `test-writer`, which reads that checklist as its spec. This is the natural moment: the behavior is fresh, the slice is small, and coverage that gets deferred to "after the whole module" is coverage that doesn't get written. Offer `code-review` alongside it for a conformance check.
6. **What's next** — the next unbuilt slice by number, and any design gaps still open (→ the to-component skills).

**Suggest; never auto-run.** Don't invoke `test-writer`, `code-review`, or the next slice's build yourself. The user decides when each runs — that's the checkpoint the whole sharded workflow exists to give them.

## Guardrails

- **One slice per run.** Checkpointing is the point. Don't drift into building the next slice because it seemed small.
- **Reuse over recreate, every time.** The hand-off summary must list reused paths.
- **Bind the design, don't rebuild it.** Edit built components to consume data; missing design is flagged, not invented.
- **The slice's contract section is authoritative** for both halves. Don't let the frontend describe a different shape than the backend implements.
- **ARCHITECTURE.md beats habit.** If it differs from the defaults here, follow it.
- **Build only what the slice specifies.** Surface gaps rather than silently expanding scope.
- **Update the registry and the status.** Both, in the same change.
- **Don't plan, don't design, don't test, don't theme.** Those are `module-planner`, the to-component skills, `test-writer`, and `font-theme-setup`.
