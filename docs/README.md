# EXR Agent Skills — Team Guide

Short docs for every skill in this repo. Each doc tells you what the skill does, example prompts to trigger it, and anything important to know. You don't invoke skills by name (though you can with `/skill-name`) — just describe the task and Claude picks the right one.

## The one concept to understand first

Every project gets two **contract files** that the whole toolkit reads and maintains:

- **`ARCHITECTURE.md`** — how THIS project is structured and its conventions.
- **`MODULE_REGISTRY.md`** — every reusable util, middleware, component, hook, schema, etc. that already exists, so new work **reuses instead of duplicating** (DRY).

If a project doesn't have them yet, start with an **onboard** or **bootstrap** skill — everything else depends on those files.

## Not sure where to begin? (start here)

| Skill | One-liner | Doc |
|---|---|---|
| `toolkit-guide` | Looks at your project and tells you the next skill to run | [doc](toolkit-guide.md) |

Ask it "where do I start?", "what should I do next?", or "which skill do I use?" and it inspects your actual project state (contract files, PRD, feature plans) and routes you to the right skill — guidance only, it never does the work itself.

## Product planning (start here for a new app)

| Skill | One-liner | Doc |
|---|---|---|
| `prd-creator` | Turn an app idea into a PRD + per-module briefs | [doc](prd-creator.md) |

**Flow:** describe your app idea → `prd-creator` interviews you (keep or reject its suggestions) → writes `_docs/prd/PRD.md` → you approve → it shards into `_docs/features/<module>/<module>-module.md` briefs → each brief feeds a feature planner below.

## Backend suite (Express + TypeScript + Mongoose)

| Skill | One-liner | Doc |
|---|---|---|
| `express-ts-bootstrap` | Scaffold a brand-new Express+TS backend | [doc](express-ts-bootstrap.md) |
| `backend-onboard` | Make an existing API ready for the toolkit | [doc](backend-onboard.md) |
| `backend-feature-planner` | Plan a feature before writing code | [doc](backend-feature-planner.md) |
| `backend-module-builder` | Build the feature from the approved plan | [doc](backend-module-builder.md) |
| `backend-test-writer` | Write tests on demand | [doc](backend-test-writer.md) |
| `backend-code-review` | Static review against project conventions | [doc](backend-code-review.md) |

**Flow:** (`prd-creator` module brief, if you planned the product first) → `express-ts-bootstrap` (new project) **or** `backend-onboard` (existing project) → `backend-feature-planner` → you approve the plan → `backend-module-builder` → `backend-test-writer` / `backend-code-review` whenever you want.

## Frontend suite (Next.js + TypeScript + Tailwind + shadcn/ui)

| Skill | One-liner | Doc |
|---|---|---|
| `nextjs-bootstrap` | Scaffold a brand-new Next.js frontend | [doc](nextjs-bootstrap.md) |
| `frontend-onboard` | Make an existing frontend ready for the toolkit | [doc](frontend-onboard.md) |
| `font-theme-setup` | Apply a Figma design system to the theme | [doc](font-theme-setup.md) |
| `figma-to-component` | Build components from a Figma frame | [doc](figma-to-component.md) |
| `html-to-component` | Build theme + components from HTML or a URL | [doc](html-to-component.md) |
| `project-to-component` | Port page designs from another codebase on disk | [doc](project-to-component.md) |
| `frontend-feature-planner` | Plan how a design binds to a real API | [doc](frontend-feature-planner.md) |
| `frontend-module-builder` | Build the API binding from the approved plan | [doc](frontend-module-builder.md) |
| `frontend-test-writer` | Write frontend tests on demand | [doc](frontend-test-writer.md) |
| `frontend-code-review` | Static review of frontend code | [doc](frontend-code-review.md) |

**Flow:** `nextjs-bootstrap` (new) **or** `frontend-onboard` (existing) → `font-theme-setup` (theme from Figma) → `figma-to-component` / `html-to-component` / `project-to-component` (build the design) → `frontend-feature-planner` (plan the API binding) → you approve → `frontend-module-builder` (make it functional) → `frontend-test-writer` / `frontend-code-review` whenever you want.

## Rules of thumb

- **Plan → approve → build.** Builders only run from an approved `_docs/FEATURE_PLAN_<name>.md`; edit the plan file directly if something's wrong, then say "build it".
- **Test writers and code reviewers never run automatically.** Ask for them explicitly.
- **Reviews are static.** They read code; they don't run the app. Use `/verify` or `/run` to confirm runtime behavior.
- **Onboarding is non-destructive.** It only writes contract files, never refactors your code.
- Stack-locked: backend skills are for Express/TS/Mongoose, frontend skills for Next.js/React. Don't point them at Django, Rails, Vue, etc.
