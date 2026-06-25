# Skill Naming & Domain Taxonomy

> Notes for a future refactor. **Nothing here is applied yet.** This documents the agreed
> convention so the skill set stays clean as it grows from backend-only into frontend.

## Why this exists

The skills today are implicitly backend-only (Express + TS + Mongoose), but several carry
**generic role names** (`feature-planner`, `module-builder`, `test-writer`, `code-review`,
`project-onboard`). The moment a frontend twin exists, those names **collide** — two skills
both named `test-writer`, both describing "write tests."

## Key principle

Claude Code routes to a skill by its **`description`**, not its name.

- **Name** = invocation handle (`/code-review`), must be unique → renaming prevents *collisions*.
- **Description** = what the model reads to auto-select → tight scoping prevents *mis-firing*.

Future-proofing is therefore **two** moves, not one:
1. Domain-prefixed names (below).
2. Every new frontend skill gets a description scoped to frontend ("frontend / React /
   Next.js / component") as tightly as the current ones are to backend ("backend / Express /
   Mongoose / server-side").

## The convention

| Category | Rule | Examples |
|---|---|---|
| **Stack scaffolders** | name by **stack** | `express-ts-bootstrap` *(keep)*, future `nextjs-bootstrap`, `vite-react-bootstrap` |
| **Workflow skills** | name by **`domain-role`** | `backend-feature-planner`, future `frontend-feature-planner` |

A user may run several frontend stacks, so scaffolders keep the stack in the name (not
`frontend-`); workflow skills are stack-agnostic within a domain, so they take the domain prefix.

## Rename map (apply later)

| Current | New |
|---|---|
| `project-onboard` | `backend-onboard` |
| `feature-planner` | `backend-feature-planner` |
| `module-builder` | `backend-module-builder` |
| `test-writer` | `backend-test-writer` |
| `code-review` | `backend-code-review` |
| `express-ts-bootstrap` | *(unchanged)* |

Future frontend mirror: `nextjs-bootstrap`, `frontend-onboard`, `frontend-feature-planner`,
`frontend-module-builder` (or `component-builder`), `frontend-test-writer`,
`frontend-code-review`, plus net-new like `ui-design`.

## Reference sites that must move together

A rename is **not** just folder renames. Update all of these in one pass or the eval harness breaks:

1. Folder names under `.claude/skills/<name>/`.
2. `name:` frontmatter in each `SKILL.md`.
3. In-body sibling references in SKILL.md files (e.g. "that is `module-builder`" / "that is `test-writer`").
4. `_trigger-workspace/eval-set.json` — the `skills` array **and** every `correct` field.
5. `_trigger-workspace/route_eval.py` — any hardcoded skill-name lists.
6. Bootstrap templates — `express-ts-bootstrap/assets/ARCHITECTURE.template.md` and `MODULE_REGISTRY.template.md`.
7. Any top-level `CLAUDE.md` / `README` describing the toolkit.

Find every site first:

```
rg -n "project-onboard|feature-planner|module-builder|test-writer|code-review" .claude
```

## Execution order (when ready)

1. Run the grep above; inventory every hit.
2. Rename the 5 folders.
3. Update `name:` frontmatter + in-body sibling references.
4. Update `eval-set.json` + `route_eval.py`.
5. Update templates / CLAUDE.md / README hits.
6. **Verify**: re-run `route_eval.py` against `eval-set.json`; routing accuracy should match
   the prior baseline (`baseline-results.json`). No regression = clean rename.

## Open follow-up

When the first frontend skill ships, revisit **plugins vs flat prefixes**. Flat
`backend-`/`frontend-` prefixes are fine up to ~10–12 skills; beyond that, splitting into
`backend` / `frontend` **plugins** (namespaced `backend:code-review`, toggleable per domain)
becomes worth the restructure. Not needed now.
