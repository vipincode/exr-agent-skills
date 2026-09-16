# {{PROJECT_NAME}} — backend

Express 5 + TypeScript (strict, ESM/NodeNext) + Mongoose 8 + JOSE 5 + Zod 4 + pino.
Paradigm: **{{PARADIGM}}**. Package manager: **{{PACKAGE_MANAGER}}**.

> **Generated from `ARCHITECTURE.md` → `## Invariants`. Do not edit here.**
> Change the rule in `ARCHITECTURE.md` first, then regenerate this file so the two never drift.

## Invariants

{{INVARIANTS}}

## Where the full detail lives

Keep this file small — it is in context for **every** change. Read further only when the work needs it:

| Need | Read |
| --- | --- |
| The full conventions (layout, envelope, error model, validation, auth, env, logging, naming) | `ARCHITECTURE.md` |
| Does this util/middleware/type/constant already exist? | `MODULE_REGISTRY.md` (index → shard) |
| What is being built and in what order | `_docs/features/<module>/` at the **repo root** |
| Which folder each project lives in | `.claude/workspace.json` at the repo root |

The `health` module (`src/modules/health/`) is the canonical example of the paradigm — imitate it.
For a small, local change, the rules above are enough — don't load the rest.

## When to reach for a skill

Ad-hoc edits are fine and should follow the invariants above. Use a skill when the work is structural:

- Planning a module → **module-planner** · Building a planned slice → **module-builder**
- Tests → **test-writer** · Review → **code-review**

Those skills read `ARCHITECTURE.md` and `MODULE_REGISTRY.md` in full — that is deliberate, not waste.
