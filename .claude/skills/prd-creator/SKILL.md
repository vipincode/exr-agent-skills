---
name: prd-creator
description: Turn an app idea into a production-grade PRD, then shard it into per-module briefs that feed the feature-planner skills. Use this whenever the user wants to plan a whole app or product — "I want to build a blog / e-commerce app / SaaS", "create a PRD", "help me plan this app", "scope my product idea", "divide the PRD into modules", "shard the PRD" — or describes a product vision spanning multiple features, even if they never say "PRD". It takes the user's points, suggests improvements and standard production features they missed (auth, payments, admin, SEO — the user keeps or rejects each), writes _docs/prd/PRD.md, and on approval shards it into _docs/features/<module>/<module>-module.md briefs tagged backend/frontend/fullstack. Also use it to MODIFY an existing PRD (change scope, add features, re-shard). It does NOT do technical feature planning (that is backend-feature-planner / frontend-feature-planner), does NOT write code, and does NOT scaffold projects — product scope only, upstream of the whole toolkit.
---

# prd-creator

Turn a raw app idea into two artifacts: a **PRD** the user owns and edits, and a set of **module briefs** that plug directly into `backend-feature-planner` / `frontend-feature-planner`. This is the product-level front door of the toolkit — everything downstream (feature plans, module builds, tests, reviews) starts from what gets decided here.

The core stance: **the user is the product owner; you are the experienced PM across the table.** They bring the idea and their thoughts; you bring pattern knowledge of what production apps of that type actually need. Every suggestion you make is theirs to keep or reject — never silently add scope, and never silently drop something they asked for.

Pipeline position (this skill never auto-invokes the next stage):

```
prd-creator  →  backend-/frontend-feature-planner  →  module-builder  →  test-writer / code-review
   (product scope)        (technical plan)              (code)
```

## Step 0 — Detect the mode

Check for `_docs/prd/PRD.md` (repo root — the PRD is product-level and spans domains, so it lives at the repo-root `_docs/`, not inside a `backend/`/`frontend/` project dir):

- **No PRD exists** → new-PRD mode (Steps 1–4), then offer sharding (Step 5).
- **PRD exists and the user wants changes** → modify mode (see "Modifying an existing PRD").
- **PRD exists and the user asks to split/shard it** → go straight to Step 5.

Also glance at context that changes your suggestions: `.claude/workspace.json`, `ARCHITECTURE.md`, or existing `_docs/FEATURE_PLAN_*.md` files mean parts of the product already exist — the PRD must describe reality plus the delta, not a fantasy greenfield.

## Step 1 — Capture the idea

Let the user talk first. Extract: the app type (e-commerce, blog, SaaS, marketplace, …), the audience, the features they explicitly want, and any constraints they stated (stack, budget, timeline, solo vs team). Restate it back in one short paragraph so they can correct you cheaply before anything gets written.

Then open `references/app-type-playbooks.md` and read the **Universal baseline** section plus the playbook matching the app type (or the nearest one — a recipe-sharing site reads the blog/CMS + social playbooks). The playbook is your pattern knowledge: standard modules, production rules, and the decision questions for that kind of product.

## Step 2 — Propose improvements (the keep-or-reject pass)

This is the heart of the skill. Compare what the user asked for against the playbook and present, in one organized message:

1. **Their features, refined** — sharpened wording, split where one "feature" is really three, merged where they overlap.
2. **Suggested additions** — standard modules/features of this app type that they didn't mention (e.g. they described e-commerce without order tracking, refunds, or an admin panel). For each: one line on *why production apps need it*.
3. **Standard production rules** — the cross-cutting baseline from the playbook (auth/security, validation, error handling, admin, legal pages, etc.) that applies regardless of features.
4. **Pushback where warranted** — if something they proposed is a scope trap or has a simpler standard alternative, say so and offer the alternative.

Present each suggestion as an explicit keep/reject choice, grouped by theme so it's a handful of decisions rather than thirty. If the `AskUserQuestion` tool is available, use it (multi-select works well for "which of these additions do you want?"); otherwise a compact numbered list works. **The user's rejection is final** — record notably-rejected items under "Out of scope" so future sessions don't re-suggest them, and don't re-argue.

If the user's message already contains detailed decisions (or they can't respond interactively), honor everything they specified, apply the playbook's defaults for the rest, and clearly flag every assumption in the PRD's Decisions section so they can overturn any of them by editing the file.

## Step 3 — Ask only the genuine unknowns

After Step 2, most of the product is decided. Ask only what's still open **and** changes the PRD's shape — aim for ≤4 questions, taken from the playbook's decision-questions list. Typical survivors: monetization model, single-vendor vs multi-vendor, open vs invite-only registration, guest checkout, content workflow (draft/review/publish vs direct). Skip anything the user already answered, anything with an obvious default (state the default instead), and anything that's a *technical* choice — database, framework, hosting belong to the feature planners and bootstrap skills, not the PRD.

## Step 4 — Write `_docs/prd/PRD.md`

Write the PRD to `_docs/prd/PRD.md` (create folders as needed), following `references/prd-template.md` exactly. Key qualities:

- **Decisions over descriptions.** "Guest checkout: yes, with post-purchase account nudge" beats a paragraph about checkout philosophy.
- **Every assumption flagged** with `(assumed — overturn by editing)` so the user can scan for them.
- **MVP vs Later split.** A full-featured PRD is not "everything in v1" — mark each module MVP or Later so the build order is obvious.
- **Module map included** — the PRD ends with the proposed module breakdown (name, one-liner, domain, MVP/Later), which Step 5 turns into files.

Tell the user the PRD is plain markdown they own — edit anything, then come back to shard it. Pause here for their review unless they already asked for the full run in one go.

## Step 5 — Shard into module briefs

When the user approves (or asks to "divide/split/shard" the PRD), turn the module map into files:

```
_docs/features/<module-name>/<module-name>-module.md
```

One folder per module, kebab-case (`auth/auth-module.md`, `product-catalog/product-catalog-module.md`). Each brief follows `references/module-template.md` exactly.

Getting the boundaries right matters more than the file writing:

- **A module = one team-sized unit of ownership** — auth, product catalog, cart, orders, payments, admin. Not one file's worth ("password reset" is part of auth), not half the app ("backend" is not a module).
- **Domain tag** every module `backend` / `frontend` / `fullstack` — this routes it to the right feature planner. Most product modules are `fullstack`; things like a webhook processor are `backend`, a marketing landing page `frontend`.
- **Dependencies are explicit** — orders depends on auth + catalog + cart. From these, derive and state a **suggested build order** (topological: auth almost always first).
- **Briefs stay at product altitude.** Scope, user stories, functional requirements, acceptance criteria, edge cases — but *no* endpoint tables, no schemas, no component trees. That's the feature planners' territory; duplicating it here creates two sources of truth that drift.

The PRD stays the source of truth for *what the product is*; each brief is the extraction of *one module's slice*, self-contained enough that a feature planner can run from it alone.

## Step 6 — Hand off

Close by showing the created file tree and the build order, and tell the user the next move for each module:

- `backend` or `fullstack` (server side first) → `backend-feature-planner`, pointing it at the module brief
- `frontend` → `frontend-feature-planner` (or the design skills first if no UI exists yet)
- No project scaffold yet → `express-ts-bootstrap` / `nextjs-bootstrap` before any feature work

Do **not** invoke any of those skills yourself. The user drives each stage.

## Modifying an existing PRD

When `_docs/prd/PRD.md` exists and the user wants changes ("add wishlist", "drop multi-currency", "actually make registration invite-only"):

1. Read the current PRD fully — respect decisions already recorded there, especially Out of scope (don't re-suggest rejected items).
2. Run the Step 2 keep-or-reject pass **scoped to the change** — if they're adding wishlist, suggest what wishlist implies (share links? move-to-cart? stock alerts?), not a re-review of the whole product.
3. Edit the PRD in place and append a dated entry to its **Changelog** section saying what changed and why.
4. **Re-shard only affected modules.** Update the briefs the change touches; if a change invalidates a brief whose FEATURE_PLAN or code already exists downstream, add a `> ⚠ Updated after implementation planning — re-run the feature planner` warning at the top of that brief and tell the user. Never silently rewrite a brief that downstream work was built on.

## Guardrails

- **Suggest, never impose.** Every addition beyond the user's words is a proposal they accept or reject; assumptions made on their behalf are flagged in the file.
- **Product altitude only.** No code, no schemas, no endpoints, no stack decisions. The moment you're tempted to write an API route, you've crossed into feature-planner territory — stop.
- **Never auto-chain.** Don't invoke feature planners, builders, or bootstrap skills; hand off with instructions instead.
- **Files are the interface.** Everything decided must land in the PRD or a brief — a decision that lives only in the chat is lost to the next session and to the downstream skills.
