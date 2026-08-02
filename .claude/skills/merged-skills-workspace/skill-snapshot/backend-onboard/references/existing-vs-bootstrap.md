# Mapping existing patterns into the contract (descriptive, not prescriptive)

The contract must describe what the repo *does*. If it instead prescribes the bootstrap's defaults, backend-module-builder will generate code that clashes with the surrounding codebase. Below: how to faithfully record common existing patterns, and how the other skills then adapt because they are contract-driven.

## The governing rule
Record reality + the user's Step 2 decisions. Never silently "upgrade" the repo's conventions into the contract. If something is genuinely worth changing (Express 4 → 5, scattered `process.env` → validated env), raise it as a **finding/recommendation** in the report — do not bake the change into the contract unless the user opts in.

## Async error handling
- **Express 4 + asyncHandler/catchAsync**: ARCHITECTURE.md error section states wrappers ARE required and names the wrapper + path. backend-module-builder will then wrap handlers, because the contract says so.
- **Express 5**: state that async rejections forward natively; no wrapper.
- **Mixed** (a Step 2 conflict): user picks one; record the choice; report the others as cleanup candidates.

## Response envelope
Record the exact shape in use. Examples and what the builder/backend-test-writer then do:
- `{ success, data }` → helpers like `ok()/created()` if they exist (register them); else describe the shape and where it's built.
- `{ data, message }` or `{ status, data }` → record verbatim; backend-test-writer asserts against THIS shape.
- No consistent shape (conflict) → user picks canonical; note that existing endpoints may differ until migrated.

## Error model
- Existing `AppError`/`HttpException` family → list subclasses + status/code mapping in the contract and as registry entries; builder throws these.
- Plain `throw new Error()` + status set in handlers → record that pattern; recommend (as a finding) introducing a base error class, but don't force it.

## Layout
- **Layered** (`controllers/`, `services/`, `routes/`, `models/`): ARCHITECTURE.md layout section says layered and specifies where each file type goes. backend-module-builder's default is domain-module, but ARCHITECTURE.md wins — it will place a new feature's controller in `controllers/`, service in `services/`, etc.
- **Domain-module**: record the module folder pattern.
- Note the path-alias convention (`@/...`) if present so imports match.

## Validation
- **Joi**: record Joi as the approach; builder writes Joi schemas + the repo's existing validate middleware. Do not switch to Zod.
- **express-validator**: record the chain/middleware style.
- **Zod**: record version (v3 vs v4 import + API differences) and the existing validate middleware.
- **None**: record absence; recommend adding validation as a finding.

## Auth
- `jsonwebtoken`: record `sign`/`verify` helpers + their paths as registry entries; builder reuses them rather than introducing JOSE.
- `passport`: record the strategies and guard middleware.
- `jose`: record the token helpers.
Whatever exists, the auth feature reuses it — onboarding's job is to make sure those helpers are in the registry so they get reused.

## Env & logging
- Validated config (zod/envalid) → record the module and that new vars go through it.
- Raw `process.env` → record it; recommend centralizing as a finding.
- Logger (pino/winston/morgan) → record it so new code logs the same way; if `console.*`, record that and optionally recommend a logger.

## What goes in the registry vs the report
- **Registry**: every reusable thing that EXISTS and should be reused (utils, middleware, error classes, auth helpers, response helpers, models, module service surfaces).
- **Report (findings)**: things that are wrong or duplicated and might warrant cleanup (duplicate utils, mixed conventions, missing validation, Express 4 EOL). These are recommendations the user can act on later — onboarding never changes them automatically.
