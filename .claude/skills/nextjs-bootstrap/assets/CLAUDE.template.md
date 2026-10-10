# {{PROJECT_NAME}} — frontend

Next.js App Router + TypeScript + Tailwind v4 + shadcn/ui + axios + Zod 4 + TanStack Query v5 + RHF 7.
Package manager: **{{PACKAGE_MANAGER}}**. Node **{{NODE_MAJOR}}**.

> **Generated from `ARCHITECTURE.md` → `## Invariants`. Do not edit here.**
> Change the rule in `ARCHITECTURE.md` first, then regenerate this file so the two never drift.

## Invariants

{{INVARIANTS}}

## Before you say "done"

`{{PM}} run typecheck && {{PM}} run lint && {{PM}} test` — lint includes the boundary rules (`eslint.boundaries.mjs`).

## Where the full detail lives

Keep this file small — it is in context for **every** change. Read further only when the work needs it:

| Need | Read |
| --- | --- |
| The full conventions (layout, forms, typography, data fetching, auth, env, naming) | `ARCHITECTURE.md` |
| Does this component/hook/util/type already exist? Which file serves a route? | `codemap/INDEX.md` → one shard (generated, always current) |
| What is a shared piece for / what was decided? | `MODULE_REGISTRY.md` |
| How to search without wasting tokens (+ optional GitNexus) | `.claude/skills/CODE-NAV.md` |
| Current Next.js APIs (version-matched, offline) | `node_modules/next/dist/docs/` (see the Next-managed `AGENTS.md`) |
| What is being built and in what order | `_docs/features/<module>/` at the **repo root** |
| Which folder each project lives in | `.claude/workspace.json` at the repo root |

For a small, local change, the rules above are enough — don't load the rest.

## When to reach for a skill

Ad-hoc edits are fine and should follow the invariants above. Use a skill when the work is structural:

- Planning a module → **module-planner** · Building a planned slice → **module-builder**
- Design → code → **figma-to-component** / **html-to-component** / **project-to-component**
- Theme/design tokens → **font-theme-setup** · Tests → **test-writer** · Review → **code-review**

Those skills read `ARCHITECTURE.md` and `MODULE_REGISTRY.md` in full — that is deliberate, not waste.
