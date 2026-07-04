---
name: frontend-onboard
description: Make any existing frontend ready for the frontend toolkit (frontend-feature-planner, frontend-module-builder, frontend-test-writer, frontend-code-review) by establishing its contract files. Use this as the entry point whenever the user points the frontend toolkit at a directory — "set up my existing Next.js app for these skills", "onboard this React frontend", "I want to use these skills on my current UI", "get this client ready", or starting work in a frontend folder that has no ARCHITECTURE.md / MODULE_REGISTRY.md yet. For an EXISTING frontend it scans the repo and generates a DESCRIPTIVE ARCHITECTURE.md plus a MODULE_REGISTRY.md seeded with all existing reusable components, hooks, schemas, lib utils, and feature modules, so feature work reuses what's there instead of duplicating it (DRY). For an EMPTY directory it hands off to nextjs-bootstrap. It is non-destructive — it never refactors existing code, only writes the contract files. After onboarding, plan/build/test/review happen through the dedicated frontend skills. This is the FRONTEND twin of backend-onboard — do NOT use it on an Express/Mongoose API (that is backend-onboard).
---

# frontend-onboard

The single entry point for pointing the **frontend** toolkit at a directory. Its job is to produce the two contract files the rest of the frontend suite depends on — `ARCHITECTURE.md` and `MODULE_REGISTRY.md` — accurately reflecting *this* frontend, then route the user into the normal plan → build → test → review flow.

It does **not** re-implement scaffolding, planning, building, testing, or reviewing — those are owned by `nextjs-bootstrap`, `frontend-feature-planner`, `frontend-module-builder`, `frontend-test-writer`, and `frontend-code-review`. This skill establishes the contract and delegates; that keeps the whole suite DRY instead of duplicating five skills into one.

This is the frontend twin of `backend-onboard`. It mirrors that skill's philosophy exactly: **describe reality, never prescribe the bootstrap's defaults; seed the registry exhaustively so nothing gets built twice; touch nothing but the contract files.** Read `../NAMING.md` and `../LAYOUT.md` for how it coexists with a backend in one repo.

## Step 0 — Locate the project, then new-or-existing?

First resolve **where the frontend code lives** — the *project dir* — because everything below
reads and writes relative to it, while `.claude/` stays at the repo root. See `../LAYOUT.md`.
- The project dir is the repo root if the app sits at the root, or a subfolder (e.g.
  `frontend-<name>/` like `frontend-shoply/`, or `frontend/`, `web/`, `client/`, `apps/web/`) if
  the user already keeps it there. Detect by where `package.json`
  + a frontend framework (`next`, `react`, `vite`) and an `app/`/`pages/`/`src/` tree actually are;
  if ambiguous (e.g. a monorepo with several app folders), ask which folder to onboard.
- **Onboard is non-destructive: it never moves code.** It records the frontend *where it already
  is*. If the user wants root-level code relocated into `frontend/`, that's a separate, explicit
  restructure — out of scope here.

Then, inspecting that project dir:
- **Empty, or no frontend source** (no `package.json`, or a `package.json` with no React/Next/Vite
  dep) → this is a new project. Hand off to **nextjs-bootstrap** (it asks root-vs-`frontend/`,
  scaffolds, and writes the contract + manifest itself). Stop here.
- **Has an existing frontend** → continue with the onboarding pass below.
- **Already has `ARCHITECTURE.md` + `MODULE_REGISTRY.md`** → it's already onboarded. Don't
  regenerate; ensure `.claude/workspace.json` has a matching `frontend` entry (add one if missing),
  then offer to refresh the registry from the current codebase if it looks stale, otherwise route
  straight to frontend-feature-planner.

## Step 1 — Inventory (read-only scan)

Walk the repo and discover what's actually there. Use `references/inventory-checklist.md` for the full list and detection hints. At minimum determine:
- **Framework & router** from `package.json` + folder shape — Next.js App Router (`app/`) vs Pages Router (`pages/`) vs Vite/CRA/Remix/plain React. The router decides where pages live and whether there's a BFF layer. Record the actual major version.
- **Language & build** — TypeScript vs JS, the import alias (`@/*` or other), bundler, package manager (lockfile), and the real dev/build/start/lint/test scripts.
- **Styling & component library** — Tailwind (and version) vs CSS Modules / styled-components / Emotion / vanilla CSS; shadcn/ui vs MUI / Chakra / Ant / Mantine / headless / none. Where primitives live.
- **Data fetching & HTTP** — TanStack Query vs SWR vs RTK Query vs raw `fetch`/`axios`; whether one configured HTTP instance exists and where; whether calls go through a BFF/proxy or hit the backend directly.
- **Forms & validation** — React Hook Form vs Formik vs uncontrolled; Zod vs Yup vs none; whether a shared field-component layer exists.
- **State management** — Redux/RTK, Zustand, Jotai, Context, or server-state-only.
- **Folder paradigm** — feature-module (`features/<x>/`) vs type-grouped (`components/`, `hooks/`, `pages/`) vs flat. Record whichever the repo actually uses.
- **Existing shared code** — every reusable component, hook, schema, type, lib util, HTTP/query/env/auth helper, with paths.
- **Existing feature modules** — their components, hooks, api fns, and the public surface other code imports.
- **Env handling**, **auth/session approach**, **routing/route-protection**, **test conventions**.

This step is purely observational. Do not change any source file.

## Step 2 — Resolve only genuine ambiguities

Where the repo does something **consistently**, record it as the convention — no question needed. Where it does **conflicting** things (e.g. two HTTP clients, both `fetch` and `axios`, two date-format helpers, mixed Query-vs-`useEffect` fetching, duplicate button/card components), surface a short list and ask the user which to treat as canonical going forward. Keep it tight — only real conflicts, presented as quick choices.

This is the only place the skill asks questions, and only when the codebase is genuinely ambiguous. A clean repo onboards with zero questions.

## Step 3 — Generate the contract (DESCRIPTIVE, not prescriptive)

This is the rule that makes onboarding safe: **the contract describes what the repo actually does, with the Step 2 decisions filled in — it does NOT import nextjs-bootstrap's fixed stack.** See `references/existing-vs-bootstrap.md` for mapping common existing frontend patterns into the contract. Concretely:
- If the app is **Pages Router**, ARCHITECTURE.md records Pages Router and where pages/`getServerSideProps` live — it does not tell future code to use App Router/Server Components.
- If data fetching is **SWR** (or raw `fetch`), record that; frontend-module-builder writes SWR hooks, not TanStack Query.
- If styling is **CSS Modules + MUI**, record that; the builder composes MUI, it does not introduce shadcn/Tailwind.
- If forms use **Formik + Yup**, record that; don't switch to RHF + Zod.
- If the browser calls the backend **directly** (no BFF), record that reality — and note "no BFF proxy" as a *finding*, not a silent rewrite.
- If the folder paradigm is **type-grouped** (`components/`, `hooks/`, `pages/`), the layout section says so, and the builder places new files that way.

Write `ARCHITECTURE.md` covering: stack/versions, router, project layout, import alias, styling & component-library approach, component-placement rule (as the repo actually organizes it), data-fetching & HTTP approach, backend-connection (BFF or direct), forms & validation, state management, env handling, auth & routing, naming, and build/scripts. **Reuse the section structure the toolkit expects** (the same headings `nextjs-bootstrap` emits — see `assets/ARCHITECTURE.template.md` in that skill) so the other frontend skills read it predictably; fill each section with the repo's reality instead of the bootstrap's defaults.

Write `MODULE_REGISTRY.md` seeded with **every reusable piece found in Step 1** — each shared component (grouped by purpose where one exists: form / typography / overlay / layout / data-display), each hook, each Zod/Yup schema, each lib util (HTTP instance, query client, env, auth/session, `cn`), and each existing feature module with its path, what it owns, and its public surface (components/hooks/api). This seeding is what makes DRY work from the very first feature: frontend-feature-planner and frontend-module-builder will see all existing code and reuse it instead of recreating it. A registry that omits existing components is the main way duplication sneaks back in, so be thorough — and match the section layout of `nextjs-bootstrap`'s `MODULE_REGISTRY.template.md` so the builder's dedup gate reads it predictably.

Both contract files go in the **project dir** (the folder located in Step 0), not necessarily the repo root.

**Record the location in the manifest.** Create or update `.claude/workspace.json` at the repo root with this project's entry — `{ "domain": "frontend", "path": "<project dir relative to repo root, or '.'>", "stack": "<detected, e.g. nextjs / vite-react>" }` — merging rather than clobbering any `backend` (or other domain's) entry. This is what lets the other skills find a frontend that lives in a subfolder; see `../LAYOUT.md`.

## Step 4 — Verify against reality & report

Spot-check the generated contract against two or three actual files — does the recorded HTTP/data-fetching pattern match what a real page/hook does? Does a listed shared component actually exist at that path with that surface? Does the import alias resolve? Fix drift.

Then report: the inventory found, conflicts resolved, and everything seeded into the registry. Also note — as **findings, not auto-fixes** — any pre-existing duplication or divergence from the toolkit's conventions you saw (e.g. "two button components at X and Y", "browser calls the backend directly — no BFF", "forms wire `<Controller>` by hand instead of a shared field layer", "raw `process.env` reads instead of a typed env module"). Onboarding is non-destructive; aligning the codebase to the toolkit's conventions is a separate, explicit, opt-in task the user can request — never refactor it as a side effect.

## Step 5 — Route into the lifecycle

The project is now contract-ready. Tell the user the normal flow applies and the dedicated skills will read the contract just written:
- design a screen from Figma / HTML → **figma-to-component** / **html-to-component**
- plan an API binding → **frontend-feature-planner**
- build an approved plan → **frontend-module-builder** (its dedup gate now sees all the seeded existing code)
- write tests → **frontend-test-writer**
- review code → **frontend-code-review**

You can drive that loop for them if they ask, but each phase is owned by its skill — don't reimplement them here.

## Guardrails

- **Descriptive, not prescriptive.** The #1 failure is generating a contract that prescribes the bootstrap's fixed stack (App Router, shadcn, axios+Zod+TanStack Query+RHF, BFF) when the repo uses something else; the other skills would then emit code that clashes with everything around it. Record reality.
- **Non-destructive.** Only `ARCHITECTURE.md`, `MODULE_REGISTRY.md`, `.claude/workspace.json`, and an optional onboarding report are written. Never edit or move source, never auto-dedupe existing components, never "upgrade" the stack.
- **Seed the registry exhaustively.** Missing existing components/hooks/schemas = duplication returns. This is the most important output.
- **Minimal questions.** Ask only to resolve genuine conflicts. Clean repo → no questions.
- **Match the toolkit's contract shape.** Use the same section headings and registry layout `nextjs-bootstrap` emits, so the planner/builder/test/review skills parse it predictably — only the *contents* differ to reflect this repo.
- **Delegate, don't duplicate.** Routing to the companion skills is the DRY-correct design; do not inline their logic.
