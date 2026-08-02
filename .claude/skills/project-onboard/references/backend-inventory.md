# Inventory checklist

The read-only scan. For each item: how to detect it and what to record. Everything here feeds the descriptive ARCHITECTURE.md and the seeded MODULE_REGISTRY.md. Do not modify any file while scanning.

## Stack & versions — `package.json`
- `express`: major version. **4 vs 5 is decisive** — v4 needs `asyncHandler`/`express-async-errors`; v5 forwards async rejections natively. Record which, so the builder follows the repo (not the bootstrap default).
- `mongoose` / other ORM (prisma, typeorm, sequelize, drizzle). Record the data layer as-is.
- Validation: `zod`, `joi`, `express-validator`, `yup`, or none.
- Auth: `jose`, `jsonwebtoken`, `passport`, `better-auth`, session middleware, or none.
- Logging: `pino`, `winston`, `morgan`, or `console`.
- Test: `vitest`, `jest`, `mocha`, `node:test`, `supertest`, `mongodb-memory-server`.
- Scripts block — record the real dev/build/start/test commands.

## TypeScript / module system — `tsconfig.json`
- `module` / `moduleResolution`: NodeNext/Node16 → relative imports need `.js` extensions; Bundler/CJS → they don't. Record the **actual** import convention the source uses (open a file and check).
- `type: module` in package.json (ESM) vs CommonJS.
- strictness flags (informational).
- Path aliases (`@/...`) in `compilerOptions.paths` — record them; the builder must use them.

## Layout — directory shape
- Domain-module: `src/modules/<x>/` each containing model/service/controller/routes.
- Layered: top-level `controllers/`, `services/`, `routes/`, `models/`, `middlewares/`.
- Flat / ad-hoc: note it and pick the dominant grouping.
Record the pattern and where new modules' files should go under it.

## Shared code inventory (the DRY-critical part)
Grep and list, with paths, everything reusable:
- `**/utils/**`, `**/lib/**`, `**/helpers/**` — utility functions.
- `**/middleware*/**` — auth guards, validation, rate limiting, request context, error handler.
- Error classes — search for `extends Error`, `AppError`, `HttpException`, custom error files.
- Response helpers — search `res.json(`, `res.send(`, `sendResponse`, `ApiResponse` to find a shared envelope helper (or its absence).
- Validation helpers / schema files.
- Auth/token helpers — `sign`, `verify`, `jwt`, `bcrypt`, `hash`.
- DB/connection helpers, config/env modules.
Each becomes a MODULE_REGISTRY.md row: name, path, purpose.

## Existing domains/modules
For each module/resource:
- Path and what it owns (model + collection).
- Its public service surface — the exported functions/methods other code imports. Record these so cross-module needs go through the service, not the model.

## Response shape(s)
Read several controllers. Is there ONE consistent success shape? Capture it exactly (`{ data }`, `{ success, data }`, `{ data, message }`, bare body…). If multiple shapes exist → Step 2 conflict.

## Error handling
- Is there a central error-handling middleware? Path + the error response shape it emits.
- An `AppError`-like base + subclasses? List them and their status/code mapping.
- `asyncHandler`/`catchAsync` wrappers in use? (expected with Express 4).
- Inconsistent handling across routes → Step 2 conflict.

## Environment & config
- Validated config module (zod/envalid) or raw `process.env` scattered around? Record the approach and where vars are declared (`.env.example`?).

## Logging
- Shared logger module + how requests are logged, or `console.*`. Record it.

## Tests
- Framework, file convention (colocated `*.test.ts` vs `__tests__/` vs `test/`), and whether integration uses supertest / in-memory Mongo. test-writer will match this.

## Output of the scan
Two things: (1) the facts to write into ARCHITECTURE.md, and (2) the exhaustive list of reusable pieces to seed MODULE_REGISTRY.md. Plus a findings note of any duplication/inconsistency observed (reported, never auto-fixed).
