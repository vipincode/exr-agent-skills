# Skill Naming & Domain Taxonomy

> **Applied 2026-06-26.** The rename below has been carried out; this now documents the
> convention (and the historical map) so the skill set stays clean as it grows from
> backend-only into frontend.

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

## Rename map (applied)

| Current | New |
|---|---|
| `project-onboard` | `backend-onboard` |
| `feature-planner` | `backend-feature-planner` |
| `module-builder` | `backend-module-builder` |
| `test-writer` | `backend-test-writer` |
| `code-review` | `backend-code-review` |
| `express-ts-bootstrap` | *(unchanged)* |

## Frontend (in progress)

| Skill | Status | Notes |
|---|---|---|
| `nextjs-bootstrap` | **shipped** (2026-06-26) | stack-named scaffolder; Next.js App Router + shadcn + axios + Zod + TanStack Query + RHF. Emits the frontend `ARCHITECTURE.md` / `MODULE_REGISTRY.md` + a `{ "domain": "frontend" }` manifest entry. The frontend twin of `express-ts-bootstrap`. |
| `font-theme-setup` | **shipped** (2026-06-26) | Figma (MCP) → theme. Extracts design tokens and rewrites `globals.css` (colors in oklch) + `layout.tsx` fonts (`next/font` google + local) + radius/shadow/gradient/bg tokens. Bundles a hex→oklch converter script. Reads/updates the contract files' theming notes. Theme-only — the bootstrap defers theming to it. |
| `figma-to-component` | **shipped** (2026-06-26) | Figma frame (MCP) → Next.js components, **dedup-first**: scans `MODULE_REGISTRY.md` + shared/feature trees and reuses/extends before creating, places generic→`components/shared`, domain→`features/<name>/components`, Tailwind tokens + framer-motion, registers new shared components. The design-to-code builder. |
| `html-to-component` | **shipped** (2026-06-26) | HTML file / pasted section / URL → Next.js, **combined** theme + components in one skill. Phase 1 lifts tokens to the theme (colors→oklch in `globals.css`, fonts in `layout.tsx`, light+dark, radius/shadow/gradient); Phase 2 is the same dedup-first builder as `figma-to-component`. Looks in `_docs/designs/` by default. Bundles `extract_tokens.py` (CSS/inline/Tailwind scanner) + `hex_to_oklch.py`. The HTML counterpart to the two Figma/MCP skills. |
| `project-to-component` | **shipped** (2026-07-04) | An existing codebase/repo on disk (design mock, legacy app — CSS Modules, styled-components, SCSS, foreign Tailwind, Vue …) → Next.js pages, source **read-only**. Profiles the source once into `_docs/design-source/<name>.md` (styling system, tokens, component catalog, route map), lifts the source theme via `html-to-component`'s Phase-1 machinery when the target is unthemed, derives a persisted **translation map** (values→tokens, source components→shadcn/shared), then the same dedup-first build as its two siblings; restyles in place on URL collision. Generalized from the retired project-specific `shiny-to-page`. Cross-references `html-to-component`'s generic references instead of duplicating them. |
| `frontend-onboard` | planned | establish contract files for an existing Next.js/React repo |
| `frontend-feature-planner` | **shipped** (2026-06-26) | plans how a built design BINDS to a real API: reads the real backend (source → contract files → OpenAPI → pasted sample) for the observed contract, maps design ↔ data, writes `_docs/FEATURE_PLAN_<name>.md`. Does not write code. |
| `frontend-module-builder` | **shipped** (2026-06-27) | executes an approved `FEATURE_PLAN`: writes the binding layer (types/schema/api/hooks), edits the built design to consume it (drops hardcoded samples), unwraps the envelope + Zod-validates, server state via TanStack Query, dedup-first (reuse shared components/hooks before creating), updates the registry. The frontend twin of `backend-module-builder`. Does not plan, redesign, or test. |
| `frontend-test-writer` | **shipped** (2026-06-27) | standalone, on-demand frontend tests (components, Query hooks, schemas, bound screens) with Vitest + RTL; detects framework + MSW; reads a FEATURE_PLAN's testing checklist if present. Never auto-chained, read-only on source, never touches the registry. The frontend twin of `backend-test-writer`. |
| `frontend-code-review` | **shipped** (2026-06-27) | standalone, read-only review of React/Next.js code against the contract — headline checks: component duplication & placement (vs registry + shared rule, cross-feature imports), API-binding conformance (BFF-only, envelope unwrap + Zod, TanStack Query, query keys/invalidation), forms via shared `*Field`, App Router client/server boundary, a11y, perf. The frontend twin of `backend-code-review`. |

Net-new frontend skills the user intends (stack-agnostic within frontend; name by role, no `frontend-`
prefix needed if they read as standalone tools): ~~`font-theme-setup`~~ (shipped), ~~`html-to-code`/`ux-designer`~~
(shipped as `figma-to-component`), `api-binder`, ~~plus a copy-from-existing-project helper~~ (shipped as `project-to-component`, 2026-07-04). When each ships,
give it a tightly frontend-scoped description and, if it consumes/produces project conventions, point it at
the same `ARCHITECTURE.md` / `MODULE_REGISTRY.md` contract files.

> The two Figma/MCP skills (`font-theme-setup`, `figma-to-component`) were split from a single
> requested "ui-developer" skill: theming runs once per project and triggers on token/color/font
> phrasing; component-building runs many times and triggers on "build this frame" phrasing — two
> cadences, two trigger surfaces, so two tightly-scoped descriptions (the exact reason this doc
> separates names from descriptions).

> Reminder (from "Key principle"): names prevent *collisions*, descriptions prevent *mis-firing*.
> Every frontend skill's description must be scoped to "frontend / Next.js / React / component / UI"
> as tightly as the backend ones are to "backend / Express / Mongoose / server-side".

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

## Execution order (followed)

1. Run the grep above; inventory every hit.
2. Rename the 5 folders.
3. Update `name:` frontmatter + in-body sibling references.
4. Update `eval-set.json` + `route_eval.py`.
5. Update templates / CLAUDE.md / README hits.
6. **Verify**: re-run `route_eval.py` against `eval-set.json`; routing accuracy should match
   the prior baseline (`baseline-results.json`). No regression = clean rename.

## Companion: project layout

Naming keeps skills from colliding; **[`LAYOUT.md`](./LAYOUT.md)** keeps them pointed at the
right folder. It defines the `.claude/workspace.json` manifest (domain → folder) and the
resolution protocol every skill runs to find its project dir — the same domain-prefix mechanism
that lets a `frontend-<name>/` project coexist with `backend-<name>/` under one repo-root `.claude/`.

## Open follow-up

When the first frontend skill ships, revisit **plugins vs flat prefixes**. Flat
`backend-`/`frontend-` prefixes are fine up to ~10–12 skills; beyond that, splitting into
`backend` / `frontend` **plugins** (namespaced `backend:code-review`, toggleable per domain)
becomes worth the restructure. Not needed now.
