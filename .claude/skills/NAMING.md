# Skill Naming & Domain Taxonomy

> **Updated 2026-08-02** — the backend/frontend skill pairs were merged. This documents the current
> convention plus the historical map, so the skill set stays clean as it grows.

## Why this exists

The toolkit grew backend-first, then sprouted a frontend twin for each workflow skill. That gave
ten skills in five near-identical pairs — `backend-onboard` / `frontend-onboard`,
`backend-feature-planner` / `frontend-feature-planner`, and so on. The pairs shared their entire
shape and differed only in what they searched for and which patterns they emitted, which is the
textbook case for one skill with per-domain reference files.

## Key principle

Claude Code routes to a skill by its **`description`**, not its name.

- **Name** = the invocation handle (`/code-review`), and it must be unique → names prevent
  *collisions*.
- **Description** = what the model reads to auto-select → tight scoping prevents *mis-firing*.

The `backend-` / `frontend-` prefixes existed only to solve the collision half. Once a pair is
merged there is no collision left, so the plain role name is correct again — and a domain prefix on
a skill that handles both domains would actively mislead.

What the merge *doesn't* change: descriptions still carry the whole routing burden. A merged skill's
description has a wider surface, so it must be explicit about what it does **and** what it hands off
to, or it starts stealing triggers from its neighbours.

## The convention

| Category | Rule | Examples |
|---|---|---|
| **Stack scaffolders** | name by **stack** | `express-ts-bootstrap`, `nextjs-bootstrap` |
| **Design importers** | name by **source → target** | `figma-to-component`, `html-to-component`, `project-to-component` |
| **Workflow skills** | name by **role** (domain-agnostic) | `module-planner`, `module-builder`, `test-writer`, `code-review`, `project-onboard` |
| **Meta / cross-cutting** | name by **function** | `prd-creator`, `toolkit-guide` |

A user may run several frontend stacks, so scaffolders keep the stack in the name. Design importers
are distinguished by their *source*, which is the only thing that separates them. Workflow skills
span both domains, so they take the bare role name.

## Merge map (applied 2026-08-02)

| Before | After |
|---|---|
| `backend-onboard` + `frontend-onboard` | `project-onboard` |
| `backend-feature-planner` + `frontend-feature-planner` | `module-planner` |
| `backend-module-builder` + `frontend-module-builder` | `module-builder` |
| `backend-test-writer` + `frontend-test-writer` | `test-writer` |
| `backend-code-review` + `frontend-code-review` | `code-review` |

Earlier rename map (2026-06-26), kept for history: `project-onboard` → `backend-onboard`,
`feature-planner` → `backend-feature-planner`, `module-builder` → `backend-module-builder`,
`test-writer` → `backend-test-writer`, `code-review` → `backend-code-review`. The 2026-08-02 merge
effectively reverses those, because the collision they solved no longer exists.

**The merge was not just consolidation.** Two behavioral changes came with it, and they're the
reason it was worth doing:

1. **`module-planner` plans both halves in one document,** so a slice states its API contract
   **once** and both halves implement it. Previously the frontend planner had to re-discover the
   backend's contract from source, and any drift between the two produced bindings that compiled
   but broke at runtime.
2. **Plans are sharded into ordered slices,** so a module is built one demoable piece at a time
   rather than in one large pass. `module-builder` executes one slice per run and marks it `built`,
   which is what makes the work resumable.

## Current inventory

**Product**
- `prd-creator` — app idea → `_docs/prd/PRD.md` + per-module briefs. Upstream of everything.

**Setup**
- `express-ts-bootstrap` — new Express + TS + Mongoose backend (empty dir). Emits contract files.
- `nextjs-bootstrap` — new Next.js App Router + shadcn frontend (empty dir). Emits contract files.
- `project-onboard` — existing code → contract files, backend and/or frontend in one pass.
  Descriptive, non-destructive.

**Design (frontend, source-distinguished)**
- `font-theme-setup` — Figma design system → theme tokens and fonts. Once per project.
- `figma-to-component` — Figma frame/node → components.
- `html-to-component` — HTML file / URL / pasted markup → theme + components.
- `project-to-component` — another codebase on disk → pages, source read-only.

**Workflow (domain-merged)**
- `module-planner` — module → `<module>-plan.md` + ordered slices. Both domains, one contract.
- `module-builder` — one slice → code, backend and frontend binding. Dedup-first.
- `test-writer` — tests on demand. Reads the slice's testing checklist. Never auto-chained.
- `code-review` — static review against the contract. Read-only, never auto-chained.

**Meta**
- `toolkit-guide` — the front desk. Inspects project state and routes to the right next skill.
  Guidance only. Its in-body catalog mirrors this file, so update both together.

## Descriptions after the merge

Each merged skill's description has to do more work than the two it replaced, because it can no
longer lean on a domain word to disambiguate. Three things it must carry:

1. **Both domains' trigger vocabulary** — `module-planner` has to fire on "plan the auth module"
   *and* "wire this design to the API"; `test-writer` on "test auth.service.ts" *and* "test the
   products grid".
2. **The handoff boundaries** — what it does *not* do, naming the skill that does. This is what
   keeps `module-planner` from absorbing `prd-creator`'s triggers and `module-builder` from
   absorbing the design skills'.
3. **The new structural behavior** — sharding, slices, build order, the contract-declared-once
   property. Users who want that behavior describe it in their own words ("split the auth plan",
   "build it module by module"), so those phrasings need to be reachable.

## Reference sites that must move together

A rename or merge is **not** just folder renames. Update all of these in one pass or things drift:

1. Folder names under `.claude/skills/<name>/`.
2. `name:` frontmatter in each `SKILL.md`.
3. In-body sibling references across every SKILL.md and reference file.
4. `toolkit-guide/SKILL.md` — its pipeline diagram and full catalog.
5. `LAYOUT.md` — the resolution protocol and doc-location table.
6. This file.
7. Bootstrap templates — `express-ts-bootstrap/assets/ARCHITECTURE.template.md` and
   `MODULE_REGISTRY.template.md`, and the `nextjs-bootstrap` equivalents.
8. `prd-creator` — its hand-off targets and `references/module-template.md`.
9. `_trigger-workspace/eval-set.json` — the `skills` array **and** every `correct` field — plus
   `route_eval.py` if it hardcodes names.
10. `docs/*.md` (the human-facing mirrors), `docs/README.md`, and the top-level `README.md`.

Find every site first:

```
rg -n "backend-(onboard|feature-planner|module-builder|test-writer|code-review)|frontend-(onboard|feature-planner|module-builder|test-writer|code-review)" .
```

Then verify: re-run `route_eval.py` against `eval-set.json` and compare routing accuracy to the
prior baseline. No regression = clean merge.

## Companion: project layout

Naming keeps skills from colliding; **[`LAYOUT.md`](./LAYOUT.md)** keeps them pointed at the right
folder. It defines the `.claude/workspace.json` manifest (domain → folder), the resolution protocol
every skill runs, and — since the merge — where planning docs live (repo-root `_docs/features/`,
because a plan now spans both domains).

## Open follow-up

The merge took the toolkit from 19 skills to 13, which puts flat naming comfortably back in its
happy range. Revisit **plugins vs flat names** only if it grows past ~15 again; at that point
splitting into toggleable plugins becomes worth the restructure. Not needed now.
