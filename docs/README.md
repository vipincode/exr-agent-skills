# EXR Agent Skills — Team Guide

Short docs for every skill in this repo. Each doc tells you what the skill does, example prompts to trigger it, and anything important to know. You don't invoke skills by name (though you can with `/skill-name`) — just describe the task and Claude picks the right one.

## The two concepts to understand first

**1. Contract files.** Every project gets two files that the whole toolkit reads and maintains:

- **`ARCHITECTURE.md`** — how THIS project is structured and its conventions.
- **`MODULE_REGISTRY.md`** — every reusable util, middleware, component, hook, and schema that already exists, so new work **reuses instead of duplicating** (DRY).

If a project doesn't have them yet, start with `project-onboard` (existing code) or a bootstrap skill (empty dir) — everything else depends on those files.

**2. Modules and slices.** You don't build a whole module in one go. `module-planner` plans the module once — backend and frontend together — and shards it into small, ordered, individually shippable slices. `module-builder` builds one slice per run.

```
_docs/features/auth/
  auth-module.md        ← product brief        (prd-creator)
  auth-plan.md          ← the module plan      (module-planner)
  01-register.md        ← build first          (module-builder, one per run)
  02-login.md
  03-logout.md
  04-forgot-password.md
```

The number is the build order. Each slice carries a `Status:` (`ready` / `blocked` / `built`), so "what do I build next?" is always answerable — it's the lowest number that isn't `built`.

Each slice also states its **API contract once**, and both halves follow it. That's what keeps the frontend's types matching what the server actually returns.

## Not sure where to begin? (start here)

| Skill | One-liner | Doc |
|---|---|---|
| `toolkit-guide` | Looks at your project and tells you the next skill to run | [doc](toolkit-guide.md) |

Ask it "where do I start?", "what should I do next?", or "which skill do I use?" and it inspects your actual project state (contract files, PRD, module plans, slice statuses) and routes you to the right skill — guidance only, it never does the work itself.

## Product planning (start here for a new app)

| Skill | One-liner | Doc |
|---|---|---|
| `prd-creator` | Turn an app idea into a PRD + per-module briefs | [doc](prd-creator.md) |

**Flow:** describe your app idea → `prd-creator` interviews you (keep or reject its suggestions) → writes `_docs/prd/PRD.md` → you approve → it shards into `_docs/features/<module>/<module>-module.md` briefs → each brief feeds `module-planner`.

## Setup (once per project)

| Skill | One-liner | Doc |
|---|---|---|
| `express-ts-bootstrap` | Scaffold a brand-new Express + TS + Mongoose backend | [doc](express-ts-bootstrap.md) |
| `nextjs-bootstrap` | Scaffold a brand-new Next.js + Tailwind + shadcn frontend | [doc](nextjs-bootstrap.md) |
| `project-onboard` | Make existing code toolkit-ready — backend, frontend, or both | [doc](project-onboard.md) |

Empty directory → a bootstrap skill. Existing code → `project-onboard`, which handles both domains in one pass.

## Design → screens (frontend)

| Skill | One-liner | Doc |
|---|---|---|
| `font-theme-setup` | Apply a Figma design system to the theme | [doc](font-theme-setup.md) |
| `figma-to-component` | Build components from a Figma frame | [doc](figma-to-component.md) |
| `html-to-component` | Build theme + components from HTML or a URL | [doc](html-to-component.md) |
| `project-to-component` | Port page designs from another codebase on disk | [doc](project-to-component.md) |

These build the screens with sample data. Binding them to a real API comes next.

## Plan → build → verify (both domains, one skill each)

| Skill | One-liner | Doc |
|---|---|---|
| `module-planner` | Plan a module end to end, sharded into ordered slices | [doc](module-planner.md) |
| `module-builder` | Build one slice: backend + the frontend binding | [doc](module-builder.md) |
| `test-writer` | Write tests on demand, backend or frontend | [doc](test-writer.md) |
| `code-review` | Static review against your project's conventions | [doc](code-review.md) |

**Flow:** bootstrap or onboard → (frontend: theme + build the screens) → `module-planner` → you review and edit the plan and slices → `module-builder` on slice 01 → it suggests `test-writer` / `code-review` → `module-builder` on slice 02 → repeat.

## Rules of thumb

- **Plan → approve → build, one slice at a time.** Builders run from a slice file you've read. Edit the markdown directly if something's wrong, then say "build it".
- **Test writers and code reviewers never run automatically.** `module-builder` suggests them when a slice lands; you decide.
- **Reviews are static.** They read code; they don't run the app. Use `/verify` or `/run` to confirm runtime behavior.
- **Onboarding is non-destructive.** It only writes contract files, never refactors your code.
- **Planning docs live at the repo root** under `_docs/features/`, because a module plan spans backend and frontend. Contract files live in each project dir.
- Stack-locked: the backend side targets Express/TS/Mongoose, the frontend side Next.js/React. `project-onboard` records whatever your repo actually uses, and the other skills follow that contract.
