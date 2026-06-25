# FEATURE_PLAN template

Write to `FEATURE_PLAN_<name>.md` at the project root. Use this structure verbatim. Keep it scannable — the user edits this by hand.

```markdown
# Feature plan: <name>

> Status: draft — edit freely, then hand to module-builder. Add/remove any section.

## Overview
One or two sentences: what this feature does and why.

## Decisions
- <decision>: <chosen value>
- <decision>: <chosen value>
- _Assumption_: <anything inferred rather than confirmed — correct me if wrong>

## Reuse (do NOT recreate these)
| What | Path | How it's used here |
|------|------|--------------------|
| protect | src/middleware/protect.ts | guard mutating routes |
| AppError family | src/lib/app-error.ts | throw NotFoundError/ConflictError |
| validate | src/middleware/validate.ts | validate request bodies |
| <existing model/service> | <path> | <usage> |

## Create
| File | Purpose |
|------|---------|
| src/modules/<name>/<name>.model.ts | Mongoose model |
| src/modules/<name>/<name>.schema.ts | Zod input schemas |
| src/modules/<name>/<name>.service.ts | business logic |
| src/modules/<name>/<name>.controller.ts | HTTP handlers |
| src/modules/<name>/<name>.routes.ts | router (mounted in app.ts) |

## Data model
New/changed Mongoose schema:
- `<field>`: `<type>` — <notes, required?, default?>
- Indexes: <e.g. unique on email; compound on (userId, createdAt)>
(or: "No data owned by this module.")

## Endpoints
| Method | Path | Auth | Validation | Description |
|--------|------|------|-----------|-------------|
| POST | /<name> | requireRole('admin') | createSchema | create |
| GET | /<name>/:id | protect | — | fetch one |

## Validation rules
Per schema: which fields, formats (z.email/z.uuid), constraints, which are create-only vs update.

## Errors & edge cases
- <case> → <which AppError / status>
- <concurrency / not-found / duplicate / permission cases worth handling>

## New shared pieces (→ register after build)
Anything genuinely reusable this feature introduces (else "none"). module-builder adds these to MODULE_REGISTRY.md.

## New env vars
`<VAR>` — <purpose, default>. (or "none") — must be added to env schema + .env.example.

## Out of scope
What this feature deliberately excludes.

## Open questions
Anything still undecided for the user to resolve before building.
```
