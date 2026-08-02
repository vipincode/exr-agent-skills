# prd-creator

Turns a raw app idea into a **PRD** plus **per-module briefs** that feed `module-planner`. This is the product-level front door of the toolkit — the step *before* `module-planner`.

## What it does

- You describe the app you want (blog, e-commerce, SaaS, anything) and share your thoughts.
- It compares your points against a built-in playbook for that app type and **suggests improvements, missing standard features, and production rules** (auth, admin panel, refunds, SEO, moderation…). Every suggestion is a keep-or-reject choice — **your call is final**, and rejections are recorded so they're never re-suggested.
- Asks at most ~4 genuinely open product questions (monetization, guest checkout, comment moderation…) — never tech-stack questions.
- Writes the PRD to **`_docs/prd/PRD.md`** — plain markdown you own and edit, with every assumption flagged and modules marked MVP vs Later.
- On your approval, **shards** the PRD into one brief per module:

```
_docs/
├── prd/
│   └── PRD.md
└── features/
    ├── auth/auth-module.md
    ├── product-catalog/product-catalog-module.md
    ├── cart/cart-module.md
    └── orders/orders-module.md
```

- Each brief is tagged `backend` / `frontend` / `fullstack` and lists its dependencies, so you know which feature planner to run and in what order.

## How to use it

**1. Create the PRD.** Describe your idea with as much or as little detail as you have:

> "I want to build an e-commerce app for handmade jewelry. Customers browse by category, add to cart, pay with Razorpay, leave reviews. Create a PRD."

It restates your idea, proposes additions and standard rules (you keep or reject each), asks the few remaining questions, then writes `_docs/prd/PRD.md`.

**2. Review and edit.** The PRD is yours — open it, change decisions, delete modules, fix assumptions directly in the file.

**3. Shard it.** Say "divide the PRD into modules" (or approve when it offers). It creates the `_docs/features/<module>/` briefs and shows you the suggested build order.

**4. Hand off, one module at a time.** For each brief, run the matching planner:

> "Plan the auth module from `_docs/features/auth/auth-module.md`"

From there it's the normal pipeline: feature-planner → you approve the plan → module-builder → test-writer / code-review.

**Modifying later.** Come back anytime with changes — "add a wishlist feature", "drop coupons". It edits the PRD in place, logs the change in the PRD's Changelog, and re-shards **only the affected module files**. If a change touches a module that already has downstream plans or code, the brief gets a ⚠ warning telling you to re-run its feature planner.

## Example prompts

- "I want to build a blog where I write about programming — plan this app properly"
- "Create a PRD for a booking app for my salon"
- "Divide the PRD into modules"
- "Add a wishlist feature to the PRD and update the modules"
- "Actually drop the coupons idea — update the PRD"

## Important

- **Product scope only.** No code, no endpoints, no schemas, no stack choices — those belong to the feature planners and builders downstream.
- **Never auto-chains.** It hands off with instructions; you drive each next stage.
- The PRD and briefs live at the **repo-root** `_docs/`, and `module-planner` writes each module plan and its slices into the same `_docs/features/<module>/` folder — so one folder holds everything about a module.
- Works before any scaffold exists — you can write the PRD first, then run `express-ts-bootstrap` / `nextjs-bootstrap` when it's time to build.
