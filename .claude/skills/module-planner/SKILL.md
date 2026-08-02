---
name: module-planner
description: Plan one module end to end — backend and frontend in a single plan — then shard it into small, ordered, buildable slices so the app gets built module by module instead of all at once. Use this whenever the user wants to design or plan a feature/module before code exists: "plan the auth module", "I want to build products", "design the orders feature", "how should I structure payments", "split the auth plan into register/login/logout", "shard this module", "plan how this screen binds to the API", "wire the products design to the endpoint". It reads ARCHITECTURE.md + MODULE_REGISTRY.md for every domain present (plus the prd-creator module brief if there is one), asks ONLY the questions those files can't already answer, and writes _docs/features/<module>/<module>-plan.md plus ordered slice files (01-register.md, 02-login.md, ...) whose numeric prefix IS the build order. Each slice declares the API contract ONCE and both halves follow it — the backend half implements it, the frontend half binds to it — which is what stops frontend types drifting from what the server actually returns. When the backend already exists and isn't being designed here, it reads the real source/OpenAPI spec instead and records the OBSERVED contract with its source. It writes markdown the user edits by hand; it never writes code (that is module-builder) and never writes tests (that is test-writer).
---

# module-planner

Turn a module idea into a plan the user can actually build from — **one module, planned once, sliced into small ordered pieces you build one at a time.**

Two problems this exists to solve:

1. **Planning a whole module and then building it in one go doesn't work.** "Auth" is register + login + logout + refresh + password reset. Planned as one blob it becomes a multi-day build with no checkpoint, and the plan goes stale halfway through. So the plan is **sharded**: one master plan for the module, then a numbered slice per shippable capability. The user builds slice 01, sees it work, then slice 02.

2. **Backend and frontend planned separately drift.** When the server feature and the client binding are designed by two passes, the frontend ends up with types that don't match the actual envelope — the single most common cause of broken bindings. Here the **contract is declared once per slice**, and both halves hang off it: the backend half implements it, the frontend half consumes it. One source of truth, no rediscovery.

The output is markdown the user reads and edits by hand before any code is generated. **This skill never writes code and never invokes `module-builder`.**

```
prd-creator          app     → modules            (optional, upstream)
module-planner       module  → ordered slices     ← you are here
module-builder       slice   → code               (one slice at a time)
test-writer / code-review    on demand, after a slice lands
```

## Step 0 — Work out what you're planning and for which domains

Establish three things before reading anything else:

- **Which module.** From the user's words ("plan auth"), or from a `prd-creator` brief. Check `_docs/features/<module>/<module>-module.md` — if a brief exists, read it: it carries the product-level scope, user stories, and acceptance criteria, and saves you re-asking what the module is for.
- **Which domains this module spans.** Resolve `.claude/workspace.json` per `../LAYOUT.md`. A repo may have `backend`, `frontend`, or both. Most product modules are **fullstack**; a webhook processor is backend-only; a marketing page is frontend-only. If only one domain's project exists, plan that half fully and mark the other half `not applicable` (or `deferred — no frontend project yet`), rather than pretending it doesn't exist.
- **Who owns the backend contract.** This decides how you get the API shape, and it's the fork that used to separate two different planner skills:
  - **Design mode** — the backend is ours and this module's endpoints don't exist yet. The plan **declares** the contract; the backend half implements it.
  - **Observe mode** — the backend already exists (built earlier, owned by another team, or a third-party API). The plan **observes** the contract from the real source and records where each fact came from. Follow the resolution ladder in `references/reading-backend.md`.
  - A module can be mixed: slices 01–02 observe an existing endpoint, slice 03 designs a new one. Decide per slice, not per module.

If there's already a `<module>-plan.md` and the user is asking for changes or for sharding, jump to "Re-planning an existing module" at the bottom.

## Step 1 — Load the contract for each domain in scope

Resolve each project dir via `../LAYOUT.md` (`.claude/workspace.json`; legacy fallback is a root `ARCHITECTURE.md`). All paths below are relative to the project dir for that domain.

For each domain in scope, read in this order:

1. **`ARCHITECTURE.md`** — the fixed conventions. Backend: paradigm, response envelope, error model, validation flow, import convention, auth primitives, layout. Frontend: how the browser reaches the backend (BFF proxy or direct), the HTTP instance, validation library, where types come from, server-state library and query-key style, form stack, feature-module anatomy, component-placement rule.
2. **`MODULE_REGISTRY.md`** — what already exists. Backend: shared utils/middleware/error classes/auth guards, existing modules and their public service surfaces, the decisions log. Frontend: shared components (form fields, typography, overlay, layout, data-display), hooks, lib singletons, existing feature modules and their public surface.
3. **Grep the code** for anything this module could reuse or collide with. Backend: `src/lib`, `src/middleware`, `src/types`, `src/constants`, sibling modules — look for models, services, schemas, middleware. Frontend: `src/features/<module>/`, `src/components/shared/`, `src/hooks`, `src/lib` — you need to know **which design components are already built** (so slices bind those by name and path) and which the design still lacks (so you flag the gap rather than silently assume it).

If a domain's contract files are missing, say so and offer `project-onboard` (existing code) or the matching bootstrap (empty dir) first. Don't invent conventions — every downstream skill treats these files as literal truth.

## Step 2 — Establish the module's contract and data model (once, for the whole module)

Before slicing, settle the things the whole module shares, because slicing them apart is what causes the drift:

- **Data model** — the schema/collection this module owns: fields, types, required/default, indexes, relations to existing models. This belongs to the module, not to a slice. (Or "owns no data".)
- **Shared decisions** — the module-level choices every slice inherits: token transport, role model, ownership scoping, soft vs hard delete, pagination style. Anything a slice would otherwise re-decide inconsistently.
- **Reuse inventory** — the concrete paths this module will import rather than rebuild, from Step 1. Backend: `protect`, `requireRole`, `jwt.ts`, the `AppError` family, `validate`, existing models/services. Frontend: the HTTP instance, the BFF proxy, the query client, shared `*Field` components, `useAuth`, existing feature pieces. **List paths, not categories** — "reuse existing utilities" is worthless to the builder; `src/middleware/protect.ts` is actionable. This section is what commits the module to dedup before any code exists.
- **In observe mode**, the observed API contract: endpoints table (method, path, auth, request, response `data` shape), the **exact** success and error envelope, and the **source of each fact** (source file path / spec / user-pasted sample). Never silently guess a field — if a fact isn't obtainable from any rung of the ladder, it becomes an open question or a blocker, not an invention.

## Step 3 — Cut the module into slices

This is the judgment that makes or breaks the plan, so read `references/slicing-guide.md` for the rules and worked examples (auth, product catalog, orders). The short version:

**A slice is one vertically shippable capability** — enough backend and frontend that when it's built, the user can *demo something*. "Register" is a slice: an endpoint, its validation, and the form that calls it. Good slices are boring and obvious: register, login, logout, refresh, forgot-password.

Three failure modes to avoid, in order of how often they happen:

- **Horizontal slicing.** "01-user-model", "02-all-endpoints", "03-all-the-UI" is the instinct to avoid — none of those is demoable alone, and the user can't checkpoint. The data model belongs to the *module* plan (Step 2) and gets created as part of whichever slice first needs it, normally slice 01.
- **Too thin.** "Password reset email template" is not a slice, it's part of forgot-password. If a slice has no endpoint of its own, it's probably a task.
- **Too fat.** If a slice has more than ~5 endpoints, or touches more than a couple of screens, or you can't imagine finishing it in one sitting, split it.

Most modules land at **3–6 slices**. Twelve means you sliced too thin; one means it wasn't a module.

**Order them by dependency first, then by demo value.** Slice 01 should be the one that establishes the module's foundation (creates the model, sets the auth pattern) because everything after it reuses that. In auth, register comes before login because login needs users to exist. Where two slices are independent, put the one that unblocks the most other work first. **The numeric filename prefix is the build order** — `01-`, `02-`, `03-` — so the order is visible in a directory listing and there's no separate index to drift.

Tag each slice `backend` / `frontend` / `fullstack`, and record what it depends on (earlier slices, or another module entirely).

## Step 4 — Ask only the genuine unknowns

Cross off every question the contract files already settle, the way a teammate who knows the repo would. Don't ask what the architecture fixes: how the browser reaches the backend, which validation library, where types come from, how server state is managed, which form components, what the response envelope is, how tokens are verified when `protect`/`jwt.ts` already exist.

Then use `references/question-banks.md` for the module type and ask only the survivors — genuine product/UX decisions the codebase cannot infer. Aim for **≤4**, presented as quick choices, not an essay. Typical survivors: registration open vs invite-only, role model, pagination style, optimistic update vs invalidate-on-success, which destructive actions need confirmation, soft vs hard delete.

Honor anything the user already specified or the brief already decided. **Every question the contract could have answered is a failure of Step 1** — that's the whole value here.

## Step 5 — Write the plan files

Create `_docs/features/<module>/` at the **repo root** — not inside a project dir. A plan spanning backend and frontend can't live inside either one, and this is where `prd-creator` already puts the module brief, so everything about a module sits in one folder:

```
_docs/features/auth/
  auth-module.md     ← product brief (prd-creator, if it ran)
  auth-plan.md       ← master module plan (this skill)
  01-register.md     ← build first
  02-login.md
  03-logout.md
  04-forgot-password.md
```

Write the **master plan** following `references/plan-template.md`, and **one file per slice** following `references/slice-template.md`. Both structures are load-bearing: `module-builder` reads them, so a slice missing its contract section or its status line makes the build guess.

Split the content this way, and don't duplicate across the boundary — duplicated facts drift:

**Master plan owns** what's true for the whole module: overview, domains in scope, decisions and assumptions, the data model, the reuse inventory, the **slice table** (order, name, domain, depends-on, status), module-level out-of-scope, and open questions.

**Each slice owns** what it takes to build that one capability:
- **Status** — `ready`, `blocked`, or `built`. This is how the user and the builder resume across sessions; `module-builder` flips it to `built` and ticks the master's slice table in the same change.
- **API contract (this slice)** — the endpoints this slice covers: method, path, auth guard, request shape, the **exact** success envelope and `data` shape, error cases and status codes. **Declared** in design mode, **observed with sources** in observe mode. This single section is what both halves below follow — it exists so the frontend never has to re-derive what the backend returns.
- **Backend half** — files to create by path, validation schemas, service surface, errors/edge cases, any new shared piece, new env vars, where the router mounts. (Or "n/a".)
- **Frontend half** — types and schemas **mirroring the contract above** (derived from schemas, never parallel hand-written interfaces), request functions, server-state hooks with their keys and what each invalidates, the **data-binding map** (which already-built component consumes which field, by path, plus transforms like cents→formatted price), loading/empty/error states, and **design gaps** — components the binding needs that aren't built yet, pointed at `figma-to-component` / `html-to-component` / `project-to-component`. Plan the binding anyway; don't block on missing design. (Or "n/a".)
- **Testing checklist** — a short, concrete, behavior-focused list of what a correct build must satisfy, as checkboxes. Not test code. This is the hand-off target for `test-writer` after the slice lands, and it's also the slice's definition of done.
- **Done when** — the demoable outcome. If you can't write this in one sentence, the slice is sliced wrong.

**Always write the files, even when something is missing.** If a slice's contract can't be obtained in observe mode, or a hard prerequisite doesn't exist, mark that slice `blocked`, state plainly what's missing and why, and give the unblock path (e.g. "no orders API yet → plan and build the orders module first", or "paste a sample response"). A predictable file with an honest blocked banner is what the user and the builder expect. Fabricating an envelope and skipping the file are both failures — honesty and a predictable artifact are not in tension.

## Step 6 — Hand off

Show the created file tree and the build order, and tell the user:

- It's plain markdown they own — edit, reorder, merge, or delete slices freely before building.
- The recommended next step is **`module-builder`** on **slice 01** — one slice at a time, not the whole module.
- After a slice is built, `test-writer` can cover it from that slice's testing checklist, and `code-review` can check it against the contract. Both are on demand.

Do not build. Do not auto-run anything.

## Re-planning an existing module

When `<module>-plan.md` already exists:

- **Sharding an unsharded plan** → read it, apply Steps 3 and 5, and write the slice files without re-asking decisions the plan already records.
- **Adding a capability** → add a new slice at the right position in the order. If it must run before existing slices, renumber and say so explicitly. Otherwise append.
- **Changing a decision** → edit the master plan, then update only the slices that decision touches.
- **A slice already marked `built`** → never silently rewrite it. Add a `> ⚠ Changed after this slice was built — re-check the code against this plan` note at the top and tell the user, so they can decide whether to revise the code.

## Guardrails

- **Contract declared once.** The slice's contract section is the single source of truth both halves follow. A frontend half that describes a different response shape than its own backend half is the exact bug this skill exists to prevent.
- **Observed, not guessed.** In observe mode every contract fact carries its source. A guessed envelope defeats the point of reading the backend at all.
- **Always produce the files; never fabricate to fill them.** Blocked is a status, not a reason to skip writing.
- **Slices are vertical and ordered.** Each one is demoable on its own, the number is the build order, and the foundation lives in slice 01 rather than a non-shippable slice-0.
- **Minimal questions.** Anything `ARCHITECTURE.md`, `MODULE_REGISTRY.md`, or the brief answers must not be asked.
- **Reuse must be specific.** Paths, not categories.
- **Plan, don't build.** No implementation code beyond illustrative field lists, endpoint signatures, or hook signatures. Don't build missing design components — flag them.
