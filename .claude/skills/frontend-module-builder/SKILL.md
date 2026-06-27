---
name: frontend-module-builder
description: Build the API binding for an already-designed Next.js/React feature from an approved FEATURE_PLAN — wiring the existing design to a real backend endpoint and making it functional, while enforcing reuse so no duplicate components, hooks, schemas, or utils get created. Use this whenever the user wants to implement/build/execute a planned frontend binding — "build the products binding", "implement FEATURE_PLAN_products.md", "now make this design functional", "wire up the orders screen", "bind it to the API". It reads the frontend ARCHITECTURE.md + MODULE_REGISTRY.md + the feature plan, searches for existing reusable code BEFORE creating anything, writes the feature-module binding layer (types/schema/api/hooks) and edits the built design to consume it (dropping hardcoded samples), unwraps the response envelope + validates with Zod, uses TanStack Query for server state, then updates the registry. It does NOT plan the binding (that is frontend-feature-planner), does NOT build/redesign components from Figma or HTML (that is figma-to-component / html-to-component), and does NOT write tests (that is frontend-test-writer). It is NOT for backend/server code (that is backend-module-builder). Frontend / Next.js / React / API-binding scope only.
---

# frontend-module-builder

Execute an approved `_docs/FEATURE_PLAN_<name>.md` into working code: write the binding layer (types, Zod schemas, axios request fns, TanStack Query hooks) and wire the **already-built design** to it so the feature shows live data. Follow the project's conventions exactly and — critically — reuse what already exists instead of regenerating it.

The two failure modes this skill exists to prevent: (1) **duplicating** a component/hook/util that already lives in `components/shared`, `lib`, `hooks`, or another feature, and (2) **rebuilding the design** instead of binding the one that's already there. The planner already mapped the design, the contract, and the reuse list — your job is to realize it faithfully, not re-decide it.

## Step 1 — Load everything

**First resolve the project dir** for this (`frontend`) domain via `../LAYOUT.md` (read `.claude/workspace.json`; fall back to the repo root if a root `ARCHITECTURE.md` describing a Next.js/React app exists with no manifest). Everything below — the plan, the contract files, the dedup greps, the new/edited `src/` files, the registry — is **relative to that project dir**.

1. The feature plan: `_docs/FEATURE_PLAN_<name>.md` (planner docs live under `_docs/`). If none exists, stop and point the user to `frontend-feature-planner` — do not improvise a plan. **If the plan's status is `BLOCKED`**, do not build around the gap: surface the blocker (the missing API contract / prerequisite) and the unblock path the plan already names, and stop.
2. `ARCHITECTURE.md` (frontend) — the fixed conventions: BFF proxy is the only thing that talks to the backend, axios instance at `lib/axios.ts` (`baseURL: "/api"`), Zod for validation, types via `z.infer`, TanStack Query v5 for server-state with array query keys, RHF + shared `*Field` for forms, feature-module anatomy, component placement rule. Follow it literally; do not impose patterns from memory that contradict it.
3. `MODULE_REGISTRY.md` (frontend) — the catalog of shared pieces (form fields, typography, overlay, lib singletons, hooks) and existing feature modules with their public surface.
4. **The built design** for this feature — read the actual files the plan binds (e.g. `features/<name>/template/*.tsx`, `features/<name>/components/*.tsx`). You are editing these, so read what's really there (props, the hardcoded sample shape) rather than assuming.

## Step 2 — The dedup gate (run before creating ANY shared code)

This is the heart of the skill. Before writing any component, hook, util, type, constant, or schema that *could* be shared, follow `references/dedup-protocol.md`:
1. Check the plan's **Reuse (do NOT recreate)** section — the planner already identified candidates; verify each path still exists and import it.
2. Check `MODULE_REGISTRY.md` for the capability (a shared `*Field`, a typography/overlay/layout/data-display component, a lib singleton, a hook).
3. Grep `src/components/shared`, `src/lib`, `src/hooks`, `src/services`, and sibling `src/features/*` for it.
4. If a suitable piece exists → import it. "It's only this one feature" is **not** a reason to inline a duplicate card/modal/field. If it almost fits, prefer extending the shared piece over forking it, unless that would overload it with unrelated concerns.
5. Only if nothing exists → create it, place it by the placement rule (generic → `components/shared/<group>`, domain-specific → `features/<name>/components`), and mark it for registration (Step 6).

Feature-local, single-use code (a private helper used by exactly one module — e.g. a `formatPrice` used only here) stays in the module and is not registered. Don't over-share either.

## Step 3 — Build the binding layer

Create the files the plan lists under `src/features/<name>/`, following the feature-module anatomy in `references/binding-anatomy.md`. The non-negotiables, drawn from the conventions (verify against ARCHITECTURE.md, which wins if it differs):

- **BFF only.** Request fns call the shared axios `api` instance (`lib/axios.ts`, `baseURL: "/api"`) → same-origin `/api/...` → the catch-all BFF proxy → backend. Never call the backend's absolute URL from the browser; never read `BACKEND_URL` in client code. Add an `app/api/<name>/route.ts` handler **only** when the plan says the catch-all proxy is insufficient — otherwise omit it.
- **Envelope unwrap + Zod parse.** The request fn unwraps the success envelope (e.g. `data` out of `{ success, data, message }`) and parses the payload with the Zod schema so contract drift fails loudly instead of rendering garbage. Never return raw `any` from a response.
- **Types from Zod.** Domain types come from `z.infer` of the schemas — no parallel hand-written interfaces that can drift.
- **Server state via TanStack Query v5.** Query/mutation hooks live in the module; keys are arrays namespaced by feature (`["<name>", ...]`). Mutations invalidate the right keys on success (or do optimistic updates per the plan). Don't fetch with `useEffect` + `useState`.
- **Forms via shared `*Field`.** If the binding includes a form, use `useForm({ resolver: zodResolver(schema) })` inside `<FormProvider>` and the shared `*Field` components — no raw `useController` + input wiring, no hand-rolled error text.
- **Auth gating** reuses `useAuth` (and role checks) for admin-only UI — don't invent token/role logic; the BFF carries the token.

## Step 4 — Wire the existing design (don't rebuild it)

Make the built design functional by **editing** it to consume the new hooks, per the plan's **Data mapping**:
- Replace hardcoded sample arrays/props with data from the query hook.
- Apply the mapping transforms the plan specifies (e.g. integer cents + currency → formatted price string) in the binding/mapping layer, leaving presentational components receiving clean props.
- Render the **loading / empty / error** states the plan calls for. If the design has no skeleton/empty/error UI and the plan flags it as a **design gap**, add a lightweight inline version (skeleton, empty copy, inline error) to make the binding usable — but do **not** redesign or rebuild the actual feature components. Anything beyond a lightweight state stub belongs to `figma-to-component` / `html-to-component`; flag it and move on.

Build only what the (possibly user-edited) plan specifies. If something the binding needs is missing from the plan, surface it rather than silently expanding scope.

## Step 5 — Verify it's green

Run the project's typecheck/lint/build (e.g. `<pm> run build`, or `<pm> run typecheck` + `<pm> run lint`). Fix what fails. A binding that doesn't compile isn't done. Report the result honestly — don't claim success without running it. If you can't run it, say so.

## Step 6 — Update the registry (same change)

Edit `MODULE_REGISTRY.md`:
- Add/refresh the **Features** row for this module: name, path, what it owns, its public surface (the hooks/components/types other code may import), notes.
- Add any **new shared pieces** created in Step 2 (one line each: name, path, purpose) so the next feature's planner sees them.
- Update the **Decisions log** with binding-level decisions worth remembering (e.g. "products list is paged via page/limit; price stored in cents, formatted at the edge").

An out-of-date registry silently reintroduces the duplication problem, so this is part of the build, not optional cleanup.

## Step 7 — Hand off

Summarize what was built (the binding files), what design was wired (the edited components), what was **reused** (with paths — this proves the gate worked), and what was newly registered. Note any design gaps still open (→ figma-to-component / html-to-component) and that tests are a separate, optional step via `frontend-test-writer` (do not write them here, do not auto-invoke it).

## Guardrails

- **Reuse over recreate, every time.** The hand-off summary must list reused paths. Duplicate components/hooks/fields are the failure this skill prevents.
- **Bind the design, don't rebuild it.** Edit the built components to consume data; don't regenerate them. Missing design is flagged, not invented.
- **BFF + envelope + Zod are not optional.** Browser talks only to `/api`; responses are unwrapped and validated.
- **ARCHITECTURE.md beats habit.** If it differs from these defaults, follow it.
- **Build only what the plan specifies.** Surface gaps; don't silently expand scope.
- **Don't plan, don't test, don't theme.** Those are frontend-feature-planner, frontend-test-writer, and font-theme-setup.
