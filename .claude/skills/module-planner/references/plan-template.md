# Master module plan template

Write to `_docs/features/<module>/<module>-plan.md` at the **repo root** (create folders as needed).
Use this structure. Keep it scannable — the user edits this by hand.

This file holds only what is true for the **whole module**. Per-capability detail lives in the
numbered slice files (see `slice-template.md`). Don't duplicate across the boundary: a fact written
in both places will drift, and the slice is what `module-builder` executes from.

```markdown
# Module plan: <module>

> Status: draft — edit freely, then build slice by slice with module-builder.
> Domains: fullstack (backend + frontend)   ·   Slices: 4

## Overview
One or two sentences: what this module does and why the app needs it.
If a prd-creator brief exists, link it: see `./<module>-module.md`.

## Build order

| # | Slice | Domain | Depends on | Status |
|---|-------|--------|-----------|--------|
| 01 | [Register](./01-register.md) | fullstack | — | ready |
| 02 | [Login](./02-login.md) | fullstack | 01 | ready |
| 03 | [Logout](./03-logout.md) | fullstack | 02 | ready |
| 04 | [Forgot password](./04-forgot-password.md) | fullstack | 01 | blocked (needs mailer) |

Build these in order — the number is the order. `module-builder` updates the Status column as
each slice lands, so this table is the at-a-glance answer to "where am I".

## Decisions (module-wide)
Choices every slice inherits. Keep them here rather than repeating them per slice.
- <decision>: <chosen value>
- <decision>: <chosen value>
- _Assumption_: <inferred rather than confirmed — correct me by editing this line>

## Data model
The schema/collection this module owns. It belongs to the module, and is created by whichever
slice first needs it (normally 01) — not by a separate non-shippable slice.

- `<field>`: `<type>` — <required? default? notes>
- Indexes: <e.g. unique on email; compound on (userId, createdAt)>
- Relations: <references to existing models, by path>

(or: "Owns no data — operates on <other module>'s models.")

## API contract conventions
The envelope and auth primitives every slice in this module follows, so each slice's contract
section only has to state its own endpoints.

- Success envelope: `<exact shape>`
- Error envelope: `<exact shape>`
- Auth: <guard(s) used, token transport>
- Source: **declared here** (design mode) — or — **observed from `<path/spec>`** (observe mode)

## Reuse (do NOT recreate these)
Concrete paths this module imports rather than rebuilds. Paths, not categories — this is what
commits the module to dedup before any code exists.

| What | Path | How it's used here |
|------|------|--------------------|
| protect | backend/src/middleware/protect.ts | guard mutating routes |
| AppError family | backend/src/lib/app-error.ts | throw NotFound/Conflict |
| validate | backend/src/middleware/validate.ts | validate request bodies |
| http instance | frontend/src/lib/axios.ts | all client requests |
| shared form fields | frontend/src/components/shared/form | every form in this module |
| useAuth | frontend/src/hooks/use-auth.ts | auth state + role gating |

## New shared pieces (→ register after build)
Genuinely reusable things this module introduces, which `module-builder` adds to the relevant
`MODULE_REGISTRY.md`. (or "none")

## New env vars
`<VAR>` — <purpose, default>, which domain. (or "none")
Must be added to the env schema + `.env.example` by the slice that introduces it.

## Out of scope (module-wide)
What this module deliberately excludes, so it doesn't creep back in slice by slice.

## Open questions
Anything still genuinely undecided for the user to resolve. Blockers that stop a specific slice
belong in that slice file; this is for module-level uncertainty.
```
