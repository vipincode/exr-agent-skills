# Architecture — {{PROJECT_NAME}}

> Source of truth for conventions. Every skill (module-planner, module-builder,
> test-writer, code-review) reads this before writing or reviewing code. Keep it
> concrete and current — if a convention changes, change it here first.

## Stack

- **Express 5** — async route handlers forward rejections to the error middleware
  automatically. There is **no `asyncHandler` wrapper anywhere**; plain
  `async (req, res) => {}` is correct.
- **TypeScript** strict, **ESM**, `module`/`moduleResolution: NodeNext`.
- **Mongoose 8** for data.
- **JOSE 5** for token signing/verification (HS256, secret from env).
- **Zod 4** for validation and env parsing (`import * as z from "zod"`, top-level
  `z.email()`/`z.uuid()`, `z.treeifyError()`).
- **pino** + `pino-http` logging, **helmet**, **cors**, **compression**,
  **express-rate-limit**.
- **Package manager:** {{PACKAGE_MANAGER}}.

## Paradigm — {{PARADIGM}}

{{PARADIGM_DESCRIPTION}}

The `health` module (`src/modules/health/`) is the canonical example of this
paradigm. New modules imitate it.

## Import convention

Relative imports use explicit **`.js` extensions** (NodeNext ESM), e.g.
`import { ok } from "../../lib/http.js";` — even though the source file is `.ts`.
`tsx` (dev) and `tsc` (build) both resolve these. Do not drop the extension.

## Project layout (domain-module, always)

```
src/
  config/      env.ts (Zod-validated env), db.ts (mongoose connect/disconnect)
  lib/         app-error.ts, http.ts, db-errors.ts, logger.ts, jwt.ts
  middleware/  error-handler.ts, not-found.ts, request-context.ts,
               protect.ts, require-role.ts, validate.ts
  modules/     <name>/ — model, schema, service, controller, routes (per domain)
               + optional module-local types/constants/utils files
  types/       express.d.ts + types shared by 2+ modules (created on first need)
  constants/   constants/enums shared by 2+ modules (created on first need)
  app.ts       build & configure the app (no listen)
  server.ts    bootstrap: connect db, listen, graceful shutdown
```

A module folder owns its files and nothing another module owns. Cross-module
needs go through the other module's **service**, never its model. Anything used
by two or more modules lives globally — utils in `lib/`, middleware in
`middleware/`, types in `types/`, constants/enums in `constants/` — and **must**
be listed in `MODULE_REGISTRY.md`. Single-use pieces stay in the module, in named
files (`<name>.types.ts` / `<name>.constants.ts` / `<name>.utils.ts`), never as
inline magic literals.

## Response envelope (one shape)

```jsonc
// success
{ "success": true, "data": <payload>, "meta": <optional> }
// error
{ "success": false, "error": { "code": "NOT_FOUND", "message": "...", "details": <optional> } }
```

Controllers respond only via `ok()`/`created()`/`noContent()` from `lib/http.ts`.
The error envelope is rendered in exactly one place: `middleware/error-handler.ts`.

## Error model

- `AppError(message, statusCode, code, details?)` base, with subclasses:
  `BadRequestError` (400), `UnauthorizedError` (401), `ForbiddenError` (403),
  `NotFoundError` (404), `ConflictError` (409), `UnprocessableError` (422).
- Services throw these. Controllers do **not** try/catch — Express 5 forwards
  rejections to the handler.
- **Mongoose & Zod errors are normalized once** in `lib/db-errors.ts`
  (`normalizeDbError`), which the error handler calls before generic handling:
  `CastError` → 400, `ValidationError` → 422, duplicate key (11000) → 409, raw
  `ZodError` → 400. Modules must reuse this — never re-catch these errors.
- Unknown/non-operational errors → logged, rendered as a generic 500 (`INTERNAL`),
  never leaking message/stack in production.

## Validation flow

- One `<name>.schema.ts` per module (Zod 4).
- `middleware/validate.ts` exports `validate({ body?, params?, query? })`; on
  failure it throws `BadRequestError` with `details = z.treeifyError(...)`, on
  success it assigns parsed/typed values back onto `req`.
- Derive types from schemas with `z.infer` — no parallel interfaces.

## Auth primitives

`lib/jwt.ts` (`signAccessToken`/`signRefreshToken`/`verifyToken`),
`middleware/protect.ts`, `middleware/require-role.ts` ship with the scaffold.
**Auth endpoints do not exist yet** — module-planner designs them and
module-builder wires them onto these primitives. Never write new token logic.

## Environment config

`config/env.ts` validates `process.env` through Zod at startup and exits on
failure. **No raw `process.env` access anywhere else** — import the typed `env`.
New vars are added to the schema and `.env.example` in the same change.
`.env` itself is loaded by Node's native `--env-file=.env` flag in the `dev` and
`start` scripts (no `dotenv`); `env.ts` only validates. Docker/production inject
real env vars instead — the container CMD runs without the flag.

## Build & scripts

`dist/` is always wiped before a build or dev run via `rimraf` (Windows-safe):

- `{{PM}} run dev` — `rimraf dist && tsx watch --env-file=.env src/server.ts` (runs from source, loads `.env`)
- `{{PM}} run build` — `rimraf dist && tsc -p tsconfig.json`
- `{{PM}} start` — `node --env-file=.env dist/server.js` (run a build first)
- `{{PM}} run clean` — `rimraf dist`

## Git hooks

husky (v9) + lint-staged, installed via the `prepare` script on `{{PM}} install`.
`.husky/pre-commit` runs `lint-staged`, which runs `eslint --fix` on staged
`*.ts`/`*.js` files (config lives in `package.json` under `"lint-staged"`).

## Logging

`lib/logger.ts` (pino; pretty in dev, JSON in prod). `request-context.ts`
attaches a per-request id and `req.log`. Log through `req.log` in requests, the
root `logger` elsewhere. No `console.log` in committed code (the one exception is
`config/env.ts`, which fails before the logger exists).

## Naming

- Files: kebab-case, role-suffixed (`product.service.ts`).
- Mongoose models: PascalCase singular (`Product`).
- Zod schemas: `createProductSchema`; inferred types `CreateProductInput`.
- `routes.ts` default-exports its `Router`; utilities/services use named exports.

## Feature workflow

Work is planned **per module** and built **one slice at a time**:

1. `module-planner` writes `_docs/features/<module>/<module>-plan.md` plus ordered slice files
   (`01-<slice>.md`, `02-<slice>.md`, …) — the number is the build order. These live under
   `_docs/features/` at the **repo root**, not in this project folder, because a plan spans
   backend and frontend.
2. You review and edit those files.
3. `module-builder` executes **one slice**, then marks it `built`.
4. `test-writer` covers it from that slice's testing checklist; `code-review` checks it against
   this contract. Both on demand.

Only this file (`ARCHITECTURE.md`) and `MODULE_REGISTRY.md` live at the **project root** — the
project folder, which may be the repo root or a subfolder such as `backend-<name>/` (e.g.
`backend-shoply/`). That folder is recorded in `.claude/workspace.json` at the repo root, which is
how the skills locate this project.
