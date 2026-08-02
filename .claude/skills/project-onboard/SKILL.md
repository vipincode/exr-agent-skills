---
name: project-onboard
description: Make an existing repo ready for this toolkit — backend, frontend, or both — by scanning it and writing the contract files (ARCHITECTURE.md + MODULE_REGISTRY.md) the other skills depend on. Use this as the entry point whenever the user points the toolkit at a directory that already has code: "set up my existing API for these skills", "onboard this repo", "onboard my Next.js app", "I want to use these skills on my current project", "get this codebase ready", or when work starts in a project with no ARCHITECTURE.md / MODULE_REGISTRY.md yet. It detects which domains are present and onboards each one — a fullstack repo gets both contracts and one .claude/workspace.json in a single pass. The contract it writes is DESCRIPTIVE: it records what the repo actually does (Express 4 + asyncHandler, Pages Router, SWR, Formik, whatever is really there), never the bootstrap's preferred stack. The MODULE_REGISTRY is seeded with every existing reusable util, middleware, component, hook, and schema so later feature work reuses them instead of duplicating them. Non-destructive — it writes only contract files and never edits, moves, or refactors source. For an EMPTY directory it hands off to express-ts-bootstrap / nextjs-bootstrap instead. After onboarding, plan/build/test/review happen through module-planner, module-builder, test-writer, and code-review.
---

# project-onboard

The single entry point for pointing this toolkit at a directory that already contains code. Its job is to produce the contract files every other skill reads — `ARCHITECTURE.md` and `MODULE_REGISTRY.md`, one pair per project — accurately reflecting *this* repo, then route the user into the normal plan → build → test → review flow.

It handles **backend, frontend, or both**. The onboarding shape is domain-independent (locate → inventory → resolve conflicts → describe → verify → route); only *what you look for* changes per domain, and that lives in the reference files. A fullstack monorepo therefore onboards in one pass with one manifest, instead of two disconnected runs that each half-write `.claude/workspace.json`.

It does **not** re-implement scaffolding, planning, building, testing, or reviewing — those belong to `express-ts-bootstrap` / `nextjs-bootstrap`, `module-planner`, `module-builder`, `test-writer`, and `code-review`. Establish the contract and delegate.

## Step 0 — Find the projects, and decide new-vs-existing for each

Everything below reads and writes relative to a **project dir**, while `.claude/` stays at the repo root. Read `../LAYOUT.md` if you're unsure how these relate.

Scan the repo and identify each project dir and its domain:

- **Backend** — a `package.json` with Express (or similar server framework) plus a `src/` tree. Typically the repo root, or a subfolder like `backend-<name>/`, `backend/`, `server/`, `api/`, `apps/api/`.
- **Frontend** — a `package.json` with `next` / `react` / `vite` plus an `app/`, `pages/`, or `src/` tree. Typically the repo root, or `frontend-<name>/`, `frontend/`, `web/`, `client/`, `apps/web/`.

A repo may hold one, both, or several candidates. If it's ambiguous (a monorepo with three app folders), ask which to onboard rather than guessing — onboarding the wrong folder writes a contract that misleads every later skill.

For each project dir you found, classify it:

- **Empty, or no matching source** → new project. Hand off to **`express-ts-bootstrap`** (backend) or **`nextjs-bootstrap`** (frontend); they ask about folder placement, scaffold, and write the contract + manifest themselves. Don't onboard an empty folder.
- **Has existing code** → run the onboarding pass below on it.
- **Already has both contract files** → already onboarded. Don't regenerate. Make sure `.claude/workspace.json` has a matching entry (add it if missing), then offer to refresh the registry if it looks stale relative to the code; otherwise route straight on to `module-planner`.

**Onboarding never moves code.** It records each project *where it already is*. If the user wants root-level code relocated into `backend-<name>/`, that's a separate explicit restructure, out of scope here.

When both domains exist, do the full pass for each, then write **one** merged manifest in Step 4.

## Step 1 — Inventory (read-only scan)

Discover what's actually there. Open the checklist for the domain you're onboarding — `references/backend-inventory.md` or `references/frontend-inventory.md` — which carries the full list and the detection hints. The headlines:

**Backend:** stack + versions from `package.json` (Express 4 vs 5 decides whether `asyncHandler` wrappers are required); TS module resolution (decides the import-extension convention); layout (domain-module `modules/<x>/` vs layered `controllers/`+`services/`); every shared util, middleware, error class, response helper, auth guard, with paths; existing domains and the service functions other code calls; response shape(s), error handling, env handling, logging, test conventions.

**Frontend:** framework + router (App Router vs Pages Router vs Vite/CRA/Remix) and major version; language, import alias, bundler, package manager, real scripts; styling and component library (Tailwind/shadcn vs MUI/Chakra/CSS Modules/styled-components); data fetching + HTTP (TanStack Query vs SWR vs RTK Query vs raw fetch; one configured instance or many; BFF/proxy or direct-to-backend); forms + validation (RHF/Formik, Zod/Yup, shared field layer or hand-wired); state management; folder paradigm (feature-module vs type-grouped vs flat); every reusable component, hook, schema, type, lib util; existing feature modules and their public surface; env handling, auth/session, route protection, test conventions.

This step is purely observational. Do not change any source file.

## Step 2 — Resolve only genuine ambiguities

Where the repo does something **consistently**, record it as the convention — no question needed. Where it does **conflicting** things, surface a short list and ask which to treat as canonical going forward. Real conflicts look like: two response shapes; mixed `asyncHandler` usage; two HTTP clients (`fetch` and `axios`); duplicate button/card components; both TanStack Query and hand-rolled `useEffect` fetching; two date helpers doing the same job.

This is the only place the skill asks questions, and only when the codebase is genuinely ambiguous. A clean repo onboards with zero questions.

## Step 3 — Generate the contract (DESCRIPTIVE, not prescriptive)

This is the rule that makes onboarding safe: **the contract describes what the repo actually does, with the Step 2 decisions filled in — it does NOT import the bootstrap's defaults.** The mapping tables in `references/backend-existing-vs-bootstrap.md` / `references/frontend-existing-vs-bootstrap.md` show how common existing patterns translate into contract language.

Why this matters so much: every later skill treats `ARCHITECTURE.md` as literal truth. If you record `ok()/created()` envelope helpers into a repo that returns `{ data, message }` by hand, `module-builder` will emit code that clashes with everything around it, and `code-review` will flag correct code as wrong. Concretely:

- Express 4 with `asyncHandler` → record that wrappers are **required**; don't tell future code to drop them.
- Envelope is `{ data, message }` → that's what gets recorded, not the bootstrap's `{ success, data, message }`.
- Layout is layered → the layout section says layered, so the builder places files the layered way.
- Validation is Joi → the validation section says Joi.
- Router is **Pages Router** → record Pages Router and where `getServerSideProps` lives; don't prescribe App Router/Server Components.
- Data fetching is **SWR** or raw `fetch` → record it; the builder writes SWR hooks, not TanStack Query.
- Styling is **CSS Modules + MUI** → record it; the builder composes MUI, it does not introduce shadcn/Tailwind.
- Forms are **Formik + Yup** → record it; don't switch to RHF + Zod.
- The browser calls the backend **directly** with no BFF → record that reality, and note "no BFF proxy" as a *finding*, not a silent rewrite.

**`ARCHITECTURE.md`** covers, per domain: stack/versions, layout, import convention, and then the domain-specific spine — for backend, response shape, error model, validation approach, env, auth primitives, logging, scripts, module workflow; for frontend, router, import alias, styling + component-library approach, component-placement rule, data-fetching + HTTP approach, backend-connection (BFF or direct), forms + validation, state management, env, auth + route protection, naming, build scripts.

Reuse the **section structure the toolkit expects** — the same headings the matching bootstrap emits (`express-ts-bootstrap/assets/ARCHITECTURE.template.md`, `nextjs-bootstrap/assets/ARCHITECTURE.template.md`) — so the other skills parse it predictably. Only the *contents* differ, to reflect this repo.

**`MODULE_REGISTRY.md`** is seeded with **every reusable piece found in Step 1**: each shared util / middleware / error class / auth guard (backend) or each shared component grouped by purpose, hook, schema, and lib singleton (frontend), as a row with name, path, purpose; plus each existing module/feature with its path, what it owns, and its public surface. Match the layout of the matching bootstrap's `MODULE_REGISTRY.template.md`.

This seeding is what makes DRY work from the very first feature: `module-planner` and `module-builder` read the registry to find what exists before creating anything. **A registry that omits existing code is the single main way duplication sneaks back in**, so be thorough — an hour of careful inventory here saves every future feature from rebuilding a component that was already sitting in `components/shared`.

Both contract files go in the **project dir**, not necessarily the repo root.

## Step 4 — Write the manifest

Create or update `.claude/workspace.json` at the repo root with an entry per onboarded project:

```json
{
  "projects": [
    { "domain": "backend",  "path": "backend-shoply",  "stack": "express-ts" },
    { "domain": "frontend", "path": "frontend-shoply", "stack": "nextjs" }
  ]
}
```

`path` is relative to the repo root (`"."` if the project is at the root). **Merge, never clobber** — if a manifest already exists with a `backend` entry and you just onboarded the frontend, add the frontend entry and leave the backend one alone. This file is how every other skill finds a project that lives in a subfolder; see `../LAYOUT.md`.

## Step 5 — Verify against reality & report

Spot-check the generated contract against two or three actual files. Does the recorded response shape match what a controller really returns? Does the recorded data-fetching pattern match what a real page or hook does? Does a listed service function or shared component actually exist at that path with that surface? Does the import alias resolve? Fix any drift you find — a contract that's subtly wrong is worse than no contract, because the other skills trust it completely.

Then report: what was found per domain, which conflicts were resolved and how, and what got seeded into each registry. Also note — as **findings, not auto-fixes** — any pre-existing duplication or divergence you saw: "two date helpers do the same thing at X and Y", "two button components at X and Y", "browser calls the backend directly — no BFF", "forms wire `<Controller>` by hand instead of a shared field layer", "raw `process.env` reads instead of a typed env module".

Onboarding is non-destructive. Aligning the codebase to the toolkit's conventions is a separate, explicit, opt-in task the user can request — never a side effect.

## Step 6 — Route into the lifecycle

The project is now contract-ready. Tell the user the normal flow applies, and that the dedicated skills will read the contract you just wrote:

- scope a whole product first → **`prd-creator`** (app → modules)
- plan a module → **`module-planner`** (module → ordered slices, backend + frontend in one plan)
- build the next slice → **`module-builder`** (its dedup gate now sees everything you seeded)
- design screens from a source → **`figma-to-component`** / **`html-to-component`** / **`project-to-component`**
- tests → **`test-writer`** · review → **`code-review`** (both on demand)

You can drive that loop for them if they ask, but each phase is owned by its skill — don't reimplement them here.

## Guardrails

- **Descriptive, not prescriptive.** The #1 failure is a contract that prescribes bootstrap defaults the repo doesn't follow. Record reality.
- **Non-destructive.** Only `ARCHITECTURE.md`, `MODULE_REGISTRY.md`, `.claude/workspace.json`, and an optional onboarding report get written. Never edit or move source, never auto-dedupe existing code, never "upgrade" the stack.
- **Seed the registry exhaustively.** Missing existing utilities and components = duplication returns. This is the most important output.
- **Minimal questions.** Ask only to resolve genuine conflicts, and only about which of two real patterns is canonical. Clean repo → no questions.
- **Match the toolkit's contract shape.** Same headings and registry layout the bootstraps emit, so downstream skills parse predictably.
- **One manifest, merged.** Onboarding the second domain must not erase the first domain's entry.
- **Delegate, don't duplicate.** Route to the companion skills; do not inline their logic.
