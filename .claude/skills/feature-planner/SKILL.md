---
name: feature-planner
description: Plan a backend feature or module before any code is written. Use this whenever the user wants to add a feature, design a module (auth, products, orders, payments, search, file upload, etc.), or says things like "I want to build X", "plan the auth feature", "design the product module", or "how should I structure Y" for a server-side API. This is the BMAD replacement — it reads the project's ARCHITECTURE.md and MODULE_REGISTRY.md first, asks ONLY the questions those files don't already answer, and writes an editable FEATURE_PLAN markdown file. It does NOT write feature code (that is module-builder) and does NOT write tests (that is test-writer). Works in any project in the Express/TS convention family that has the contract files, or offers to create them for an existing repo.
---

# feature-planner

Turn a feature idea into a concrete, editable plan with the fewest questions possible. The reason this exists: generic planners interrogate the user every time because they have no memory of the codebase. This one reads the project's source of truth first, so it only asks what genuinely isn't decided yet.

The output is a markdown file the user reads and edits by hand before any code is generated. **This skill never writes feature code and never invokes module-builder.**

## Step 1 — Load the contract (always first)

Read, in this order:
1. `ARCHITECTURE.md` — the project's conventions (paradigm, response envelope, error model, validation flow, import convention, auth primitives, layout).
2. `MODULE_REGISTRY.md` — what already exists: shared utils/middleware, existing modules and their public service surfaces, and the decisions log.
3. **Grep the codebase** for anything related to the requested feature: `src/lib`, `src/middleware`, and sibling modules. Look for models, services, schemas, or middleware the feature could reuse.

If `ARCHITECTURE.md`/`MODULE_REGISTRY.md` are missing (a non-bootstrapped repo), say so and offer to generate a lightweight `ARCHITECTURE.md` by scanning the codebase before planning. Do not invent conventions silently.

## Step 2 — Decide what is already answered

Cross off every question that the contract or existing code already settles. Examples:
- If the registry shows `protect`/`requireRole` and `jwt.ts` exist, do not ask "how will you verify tokens" — that's decided; the auth feature reuses them.
- If ARCHITECTURE.md fixes the response envelope and error model, never ask about response shapes.
- If a `User` model already exists, a feature needing users references it, not a new one.

The goal is to walk in already knowing most of the answer, the way a teammate familiar with the repo would.

## Step 3 — Ask only the genuine unknowns

Use `references/question-banks.md` to pick the right scoped questions for the feature type, then **filter them against Step 2** — ask only the survivors. Keep it tight (aim for ≤3–4 real decisions). These are feature-shaped product/design choices the codebase can't answer, e.g. for auth: token transport (cookie vs bearer), role model (single role vs RBAC list), whether registration is open or invite-only, refresh-token rotation. Present them as quick choices, not an essay.

If the user already specified some in their request, honor those and don't re-ask.

## Step 4 — Write `_docs/FEATURE_PLAN_<name>.md`

Write the plan to `_docs/FEATURE_PLAN_<name>.md` — create the `_docs/` folder at the project root if it doesn't exist yet. Planner docs live under `_docs/`; only `ARCHITECTURE.md` and `MODULE_REGISTRY.md` stay at the project root. Follow `references/plan-template.md` exactly. The non-negotiable sections are:
- **Decisions** — resolved choices, and any assumptions made (flagged as assumptions so the user can correct them).
- **Reuse (from registry / existing code)** — an explicit list with paths of what this feature will import rather than create. This section is the whole point: it commits the feature to dedup *before* code exists. If Step 1 found a usable util/middleware/model, it goes here.
- **Create** — the new files, by path, each with a one-line purpose.
- **Data model** — Mongoose schema additions or new model (fields, indexes), or "none".
- **Endpoints** — method + path + auth guard + validation schema + brief description, in a table.
- **Edge cases & failure modes** — the ones worth handling explicitly.
- **Out of scope** — what this feature deliberately does not include.
- **Open questions** — anything still genuinely undecided for the user to resolve.

## Step 5 — Hand off

Tell the user the plan is written and is plain markdown they can edit — add or delete sections freely. Mention that when they're happy, module-builder executes it. Do not proceed to build. Do not auto-run anything.

## Guardrails

- Minimal questions is the entire value — every question the contract could have answered is a failure of Step 1.
- The Reuse section must be honest and specific; "reuse existing utilities" without paths defeats the dedup workflow.
- Plan, don't build. No code in the plan beyond illustrative schema field lists or endpoint signatures.
