---
name: project-onboard
description: Make any project ready for the backend toolkit (feature-planner, module-builder, test-writer) by establishing its contract files. Use this as the entry point whenever the user points the toolkit at a directory — "set up my existing API for this", "onboard this repo", "I want to use these skills on my current project", "get this project ready", or starting work in a folder that has no ARCHITECTURE.md / MODULE_REGISTRY.md yet. For an EXISTING codebase it scans the repo and generates a DESCRIPTIVE ARCHITECTURE.md plus a MODULE_REGISTRY.md seeded with all existing reusable code, so feature work reuses what's there instead of duplicating it (DRY). For an EMPTY directory it hands off to express-ts-bootstrap. It is non-destructive — it never refactors existing code, only writes the contract files. After onboarding, plan/build/test happen through the dedicated skills.
---

# project-onboard

The single entry point for pointing the toolkit at a directory. Its job is to produce the two contract files the rest of the toolkit depends on — `ARCHITECTURE.md` and `MODULE_REGISTRY.md` — accurately reflecting *this* project, then route the user into the normal plan → build → test flow.

It does **not** re-implement bootstrapping, planning, building, or testing — those are owned by `express-ts-bootstrap`, `feature-planner`, `module-builder`, and `test-writer`. This skill establishes the contract and delegates; that keeps the whole suite DRY instead of duplicating four skills into one.

## Step 0 — New or existing?

Inspect the target directory.
- **Empty, or no source code** (no `package.json` / `src`) → this is a new project. Hand off to **express-ts-bootstrap** (it scaffolds and writes the contract itself). Stop here.
- **Has existing code** → continue with the onboarding pass below.
- **Already has `ARCHITECTURE.md` + `MODULE_REGISTRY.md`** → it's already onboarded. Don't regenerate; offer to refresh the registry from the current codebase if it looks stale, otherwise route straight to feature-planner.

## Step 1 — Inventory (read-only scan)

Walk the repo and discover what's actually there. Use `references/inventory-checklist.md` for the full list and detection hints. At minimum determine:
- **Stack & versions** from `package.json` — Express major (4 vs 5 changes whether `asyncHandler` is needed), Mongoose, validation lib (zod/joi/express-validator/none), auth lib (jose/jsonwebtoken/passport), test framework.
- **TS config** — module resolution (decides the import-extension convention), strictness, ESM vs CJS.
- **Layout** — domain-module (`modules/<x>/`) vs layered (`controllers/`, `services/`, `routes/`, `models/`). Record whichever the repo actually uses.
- **Existing shared code** — every util, middleware, helper, error class, response helper, validation helper, auth guard, with paths.
- **Existing domains/modules** — their models and the service functions other code calls.
- **Response shape(s)**, **error handling** (central handler? AppError-like class? asyncHandler wrappers?), **env handling**, **logging**, **test conventions**.

This step is purely observational. Do not change any source file.

## Step 2 — Resolve only genuine ambiguities

Where the repo does something **consistently**, record it as the convention — no question needed. Where it does **conflicting** things (e.g. two or three response shapes, mixed `asyncHandler` usage, duplicate utilities that do the same job), surface a short list and ask the user which to treat as canonical going forward. Keep it tight — only real conflicts, presented as quick choices.

This is the only place the skill asks questions, and only when the codebase is genuinely ambiguous. A clean repo onboards with zero questions.

## Step 3 — Generate the contract (DESCRIPTIVE, not prescriptive)

This is the rule that makes onboarding safe: **the contract describes what the repo actually does, with the Step 2 decisions filled in — it does NOT import the bootstrap's defaults.** See `references/existing-vs-bootstrap.md` for mapping common existing patterns into the contract. Concretely:
- If the repo is Express 4 with `asyncHandler`, ARCHITECTURE.md records that wrappers are required — it does not tell future code to drop them.
- If the response envelope is `{ data, message }`, that's what gets recorded, not `ok()/created()`.
- If the layout is layered, the layout section says layered, so module-builder places files the layered way.
- If validation is Joi, the validation section says Joi.

Write `ARCHITECTURE.md` covering: stack/versions, layout, import convention, response shape, error model, validation approach, env handling, auth primitives that exist, logging, scripts, and the module-by-module workflow. Reuse the section structure the toolkit expects (same headings the bootstrap emits) so the other skills read it predictably.

Write `MODULE_REGISTRY.md` seeded with **every reusable piece found in Step 1** — each shared util/middleware/helper/error-class/auth-guard as a row with name, path, purpose; each existing module with its path, what it owns, and its public service surface. This seeding is what makes DRY work from the very first feature: feature-planner and module-builder will see all existing code and reuse it instead of recreating it. A registry that omits existing utilities is the main way duplication sneaks back in, so be thorough.

## Step 4 — Verify against reality & report

Spot-check the generated contract against two or three actual files — does the recorded response shape match what a controller really returns? Does a listed service function actually exist at that path? Fix drift.

Then report: the inventory found, conflicts resolved, and everything seeded into the registry. Also note — as **findings, not auto-fixes** — any pre-existing duplication or inconsistency you saw (e.g. "two date helpers do the same thing at X and Y"). Onboarding is non-destructive; cleaning up existing debt is a separate, explicit, opt-in task the user can request — never refactor it as a side effect.

## Step 5 — Route into the lifecycle

The project is now contract-ready. Tell the user the normal flow applies and the dedicated skills will read the contract just written:
- plan a feature → **feature-planner**
- build an approved plan → **module-builder** (its dedup gate now sees all the seeded existing code)
- write tests → **test-writer**

You can drive that loop for them if they ask, but each phase is owned by its skill — don't reimplement them here.

## Guardrails

- **Descriptive, not prescriptive.** The #1 failure is generating a contract that prescribes bootstrap defaults the repo doesn't follow; the other skills would then emit code that clashes with everything around it. Record reality.
- **Non-destructive.** Only `ARCHITECTURE.md`, `MODULE_REGISTRY.md`, and an optional onboarding report are written. Never edit source, never auto-dedupe existing code.
- **Seed the registry exhaustively.** Missing existing utilities = duplication returns.
- **Minimal questions.** Ask only to resolve genuine conflicts. Clean repo → no questions.
- **Delegate, don't duplicate.** Routing to the companion skills is the DRY-correct design; do not inline their logic.
