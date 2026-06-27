---
name: frontend-feature-planner
description: Plan how an already-designed Next.js/React frontend feature will BIND to a backend API — before any binding code is written. Use this whenever the user has a built (or in-progress) design and wants to wire it to an endpoint: "plan the products API binding", "wire up the orders screen to the API", "bind this design to the auth endpoints", "how do I connect this page to the backend", "make this design functional with the API", or simply names an API/endpoint to hook a frontend feature to. Its signature move: it reads the REAL backend (monorepo source first, then the backend's contract files, then an OpenAPI/Swagger spec, then a user-pasted sample) to learn the actual endpoints, request/response envelope, auth, and validation — so the plan binds to ground truth instead of a guessed contract. It reads the frontend ARCHITECTURE.md + MODULE_REGISTRY.md, maps which existing design components consume which fields, and writes an editable _docs/FEATURE_PLAN_<name>.md (types, Zod schemas, BFF routes, axios api fns, TanStack Query hooks, data-binding map). It does NOT write binding code (that is frontend-module-builder), does NOT build the design/components (that is figma-to-component / html-to-component), does NOT write tests (frontend-test-writer), and is NOT for backend/server planning (that is backend-feature-planner). Frontend / Next.js / React / API-binding scope only.
---

# frontend-feature-planner

Turn "bind this design to the API" into a concrete, editable plan — with the fewest questions possible — by reading the **real backend** so the binding contract is observed, not invented.

The premise: the design already exists (built by `figma-to-component` / `html-to-component`), the project was scaffolded by `nextjs-bootstrap` (BFF proxy, axios, Zod, TanStack Query, RHF, shared `*Field` components), and now the user wants to make it *functional* against a backend endpoint. Generic planners guess the API shape and the frontend ends up with types that don't match what the server actually returns. This skill goes and looks.

The output is a markdown file the user reads and edits by hand before any code is generated. **This skill never writes binding code and never invokes `frontend-module-builder`.**

## Step 1 — Load the frontend contract (always first)

**Resolve the project dir** for the `frontend` domain via the protocol in `../LAYOUT.md`: read `.claude/workspace.json` and use the `frontend` entry's folder; if there's no manifest but an `ARCHITECTURE.md` describing a Next.js/React app sits at the repo root, that's the legacy single-project layout. All frontend paths below — the contract files, the `src/` greps, the `_docs/` output — are **relative to that project dir**.

Read, in this order:
1. `ARCHITECTURE.md` (frontend) — the fixed conventions: BFF proxy is the only thing that talks to the backend, axios instance at `lib/axios.ts` (`baseURL: "/api"`), Zod for validation, types via `z.infer`, TanStack Query v5 for server-state with array query keys, RHF + shared `*Field` for forms, feature-module anatomy (`types/ schema/ api/ hooks/ components/ template/ index.ts`), component placement rule (generic → `components/shared`, domain → `features/<name>/components`).
2. `MODULE_REGISTRY.md` (frontend) — what already exists: shared form fields, typography, overlay, lib singletons (axios/query-client/env/auth), hooks, and any existing feature modules with their public surface.
3. **Scan the existing design** for this feature: grep `src/features/<name>/` and `src/components/shared/`. You need to know which components are already built (so the plan binds *those*, by name and path) and which the design still needs (so you can flag the gap, not silently assume).

If the frontend contract files are missing, say so and offer to run `frontend-onboard` (or `nextjs-bootstrap` for an empty dir) first — don't invent frontend conventions.

## Step 2 — Learn the REAL API contract (the signature step)

This is what makes the binding accurate. Follow the resolution ladder in `references/reading-backend.md`, taking the **highest-fidelity source available**:

1. **Monorepo backend source** (best) — the `backend` entry in `.claude/workspace.json`. Read the route → controller → service → schema → model chain for the requested capability and extract, per endpoint: method + path, auth guard, request shape (path params, query, body), the **exact success envelope** (e.g. `{ success, data, message }`) and the `data` shape, status codes, and the error cases.
2. **Backend contract files** — if source isn't fully readable, read the backend's `ARCHITECTURE.md` (response envelope, error model) + `MODULE_REGISTRY.md` (the module's public surface) for the shape.
3. **OpenAPI / Swagger** — a spec file or URL: parse paths, request bodies, and response schemas.
4. **User-pasted endpoint + sample** — last resort: ask for the endpoint(s) and a real sample request/response.

**Record where each fact came from** (source path / spec / pasted) in the plan's API contract section. The frontend types, Zod schemas, and BFF must mirror this envelope exactly — a mismatch here is the #1 cause of broken bindings, so getting it from ground truth is the whole point. Never silently guess a field; if a fact is unavailable from every rung, flag it as an open question rather than inventing it.

**If the contract can't be obtained at all** (e.g. the capability doesn't exist in the backend yet, no spec, nothing pasted), do **not** invent it — but do **not** go silent either. You still write the plan file in Step 6, marked **BLOCKED**, with the missing pieces and the path to unblock spelled out (see Step 6). A predictable file with an honest BLOCKED banner is what downstream tools and the user expect; fabricating an envelope or skipping the file are both failures.

## Step 3 — Map design ↔ data

Cross-reference the observed API against the built design:
- Which existing components/screens render which response fields (name them by path).
- **Design gaps** — components the binding needs that aren't built yet → list them and point to `figma-to-component` / `html-to-component`. Plan the binding anyway (per the user's intent); don't block on the missing design.
- **Data gaps** — fields the design shows that the API doesn't return, or actions the design implies with no endpoint → flag as open questions.

## Step 4 — Decide what's already answered

Cross off every question the frontend contract already settles, the way a teammate who knows the repo would. Examples:
- Don't ask "how do we call the backend" — it's the BFF proxy + axios instance, always.
- Don't ask "what validation library" or "where do types come from" — Zod + `z.infer`, fixed.
- Don't ask "how do we manage server state" — TanStack Query v5, array query keys namespaced by feature.
- Don't ask "what form components" — the shared `*Field` set, always.

## Step 5 — Ask only the genuine unknowns

Use `references/question-banks.md`, then **filter against Step 4** — ask only the survivors. Keep it tight (aim for ≤3–4 real decisions). These are product/UX choices the codebase can't answer: e.g. list vs detail vs both, pagination/infinite-scroll/filter UI, optimistic update vs invalidate-on-success, which mutations need a confirm modal, cache-invalidation scope, whether this feeds an existing route or a new one. If the user already specified some, honor those and don't re-ask.

## Step 6 — Write `_docs/FEATURE_PLAN_<name>.md` (always)

Always write the plan to `_docs/FEATURE_PLAN_<name>.md` under the **frontend project dir** — create `_docs/` if needed — **even when blocked**. A predictable, consistently-named, consistently-structured file is the whole point of this skill: `frontend-module-builder` and the user should never have to guess whether a plan exists or where its sections are. Only `ARCHITECTURE.md` / `MODULE_REGISTRY.md` stay at the project-dir root; planner docs live under `_docs/`. Follow `references/plan-template.md` exactly. The non-negotiable sections:
- **Status banner** — `draft` normally, or **`BLOCKED`** when the API contract or a hard prerequisite is missing. A blocked plan still has every section; the unobtainable ones say what's missing and why, and Dependencies carries the unblock path.
- **API contract (observed)** — the ground truth from Step 2: an endpoints table (method/path/auth/request/response-data shape) and the **exact success + error envelope**, each with its source. This anchors everything downstream. If unobtainable, state that plainly here (don't fabricate) and reflect it in Status + Dependencies.
- **Dependencies** — what this binding needs in place to actually work, beyond reused code: prerequisite endpoints/features that must exist, the auth/session state a guarded call needs (e.g. `useAuth` returning a real user/role, a token reaching the backend), required env (`BACKEND_URL`), and any design pieces it relies on. This is where blockers live — list each missing dependency and the path to resolve it (e.g. "no orders API → build via backend-feature-planner → backend-module-builder", or "paste a sample response").
- **Reuse (do NOT recreate)** — explicit paths the binding will import rather than rebuild: the axios instance, BFF proxy, query-client, shared `*Field` components, `useAuth`, and any existing feature pieces / shared components from the registry. This commits the feature to dedup before code exists.
- **Types & schema** — the TS types and Zod schemas mirroring the observed envelope (types via `z.infer`, never parallel interfaces).
- **Create** — the new files by path, following feature-module anatomy, plus any BFF route handlers under `app/api/` (note when the catch-all proxy already covers it).
- **Data mapping** — component ↔ query/mutation hook ↔ fields. The concrete wiring (what each built component binds to, and any transform like cents→formatted price).
- **Query/mutation hooks** — query keys, what each invalidates, loading/empty/error states.
- **Design gaps** — components still to build (→ figma-to-component / html-to-component), or "none".
- **Edge cases & states** — loading, empty, error, end-of-pagination, auth-expired/401, optimistic rollback.
- **Testing checklist** — a short, concrete list of what a correct binding must satisfy, as checkboxes (e.g. "list renders live data; loading/empty/error states show", "price formats from cents", "pager stops at last page", "admin-only action hidden for non-admins; 401 handled", "envelope unwrapped + Zod catches drift"). This is the handoff target for `frontend-test-writer` — keep it behavior-focused, not test code.
- **Out of scope** and **Open questions** — including any data gaps from Step 3.

## Step 7 — Hand off

Tell the user the plan is written, it's plain markdown they can edit freely, and that when they're happy `frontend-module-builder` executes it to write the binding code and make the design functional. Mention tests are a separate, optional step via `frontend-test-writer`. Do not build, do not auto-run anything.

## Guardrails

- **Observed, not guessed.** The API contract section must come from a real source with the source cited. Reading the backend is the entire value — a guessed envelope defeats the skill.
- **Always produce the file; never fabricate to fill it.** The plan is written every time, consistently named and structured, even when blocked — but a missing contract is documented as BLOCKED with the unblock path in Dependencies, never invented. Honesty and a predictable artifact are not in tension; deliver both.
- **Minimal questions.** Every question the frontend contract could have answered is a failure of Step 1/Step 4.
- **Reuse must be specific.** List paths (axios instance, BFF, shared fields, registry entries), not "reuse existing utilities".
- **Plan, don't build.** No binding code beyond illustrative type/schema field lists or hook signatures. Don't build missing design components — flag them.
- **Frontend scope.** This plans the client-side binding. Server-side feature design is `backend-feature-planner`.
