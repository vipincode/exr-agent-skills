# Core conventions

These are the project-wide rules that hold regardless of paradigm. They are the canonical source for the generated `ARCHITECTURE.md`. Keep them concrete — vague conventions produce inconsistent modules, which is exactly what defeats the registry/dedup workflow.

## Project layout (domain-module, always)

```
src/
  config/
    env.ts            # Zod-validated process.env, exported as typed `env`
    db.ts             # mongoose connection + disconnect
  lib/
    app-error.ts      # AppError + typed subclasses (NotFound, BadRequest, ...)
    http.ts           # response envelope helpers: ok(), created(), noContent()
    db-errors.ts      # normalizeDbError(): maps Mongoose/Zod errors -> AppError
    logger.ts         # pino instance
    jwt.ts            # JOSE sign/verify helpers (see auth-jose.md)
  middleware/
    error-handler.ts  # central error handler (AppError-, Mongoose-, Zod-aware)
    not-found.ts      # 404 fallthrough
    request-context.ts# request id + child logger per request
    protect.ts        # JOSE auth guard (see auth-jose.md)
    require-role.ts    # role gate (see auth-jose.md)
    validate.ts       # Zod request validation factory
  modules/
    <name>/           # one folder per domain (health, auth, product, ...)
      <name>.model.ts     # Mongoose schema/model (if it owns data)
      <name>.schema.ts    # Zod input/output schemas
      <name>.service.ts   # business logic
      <name>.controller.ts# thin HTTP layer
      <name>.routes.ts    # express.Router wiring
      <name>.types.ts     # module-local types (optional)
      <name>.constants.ts # module-local constants/enums (optional)
      <name>.utils.ts     # module-local helpers (optional)
  types/
    express.d.ts      # augment Express.Request (req.user, req.id, req.log)
                      # + types shared by 2+ modules (one file per topic, created on first need)
  constants/          # constants/enums shared by 2+ modules (created on first need)
  app.ts              # build & configure the Express app (no listen)
  server.ts           # bootstrap: connect db, listen, graceful shutdown
```

Rule: a module folder contains everything that module owns and nothing another module owns. Cross-module needs go through the other module's `service`, never by reaching into its model directly. Anything used by two or more modules belongs at the global level — utils/helpers in `lib/`, middleware in `middleware/`, types in `types/`, constants/enums in `constants/` — and **must** be registered in MODULE_REGISTRY.md. Single-use pieces stay module-local, but still in their named file (`<name>.types.ts` / `<name>.constants.ts` / `<name>.utils.ts`), never as inline magic literals.

## Response envelope (single shape)

Success and error responses share one shape so clients and the backend-test-writer skill can rely on it:

```jsonc
// success
{ "success": true, "data": <payload>, "meta": <optional> }
// error
{ "success": false, "error": { "code": "NOT_FOUND", "message": "...", "details": <optional> } }
```

Controllers never hand-roll this. They call `ok(res, data, meta?)`, `created(res, data)`, or `noContent(res)` from `lib/http.ts`. Errors are produced by throwing `AppError` subclasses; the error handler renders the envelope. There is exactly one place that calls `res.json` with an error shape: `middleware/error-handler.ts`.

## Error model

- `AppError(message, statusCode, code, details?)` is the base. Subclasses: `BadRequestError` (400, `BAD_REQUEST`), `UnauthorizedError` (401, `UNAUTHORIZED`), `ForbiddenError` (403, `FORBIDDEN`), `NotFoundError` (404, `NOT_FOUND`), `ConflictError` (409, `CONFLICT`), `UnprocessableError` (422, `UNPROCESSABLE`).
- `isOperational` is `true` on these. Unknown/thrown non-AppError values are treated as non-operational → logged at `error`, rendered as a generic 500 with code `INTERNAL` (never leak the message/stack in production).
- Services throw these. Controllers do not try/catch — Express 5 forwards rejections to the error handler. The only try/catch in normal code is around genuinely recoverable operations (e.g. an external call with a fallback).

### Mongoose & Zod error normalization (reusable)

Mongoose and Zod throw their own error shapes, not `AppError`. Rather than scattering `instanceof` checks across modules, normalize them in **one reusable place**: `lib/db-errors.ts` exports `normalizeDbError(err: unknown): AppError | null`, which returns a mapped `AppError` for a recognized error and `null` otherwise. `middleware/error-handler.ts` calls it first; if it returns an `AppError`, render that, else fall through to the AppError/`INTERNAL` logic above. This keeps the mapping testable, shared, and the single source of truth — module code never re-implements it.

`normalizeDbError` maps:
- Mongoose `CastError` (e.g. malformed ObjectId) → `BadRequestError` (400, `BAD_REQUEST`), `details` = `{ path, value }`.
- Mongoose `ValidationError` → `UnprocessableError` (422, `UNPROCESSABLE`), `details` = per-field messages keyed by path.
- Mongoose duplicate key (`MongoServerError` with `code === 11000`) → `ConflictError` (409, `CONFLICT`), `details` = the conflicting `keyValue`.
- Zod `ZodError` (a raw one that reached the handler, not via `validate`) → `BadRequestError` (400, `BAD_REQUEST`), `details = z.treeifyError(err)`.

Detection is by shape/`name`, not a hard `instanceof mongoose.Error` import chain where avoidable, so the helper stays decoupled and reusable. The `validate` middleware still handles request-body Zod errors up front; the handler's Zod branch is a defensive fallback for ZodError thrown deeper (e.g. response/parse validation).

## Validation flow

- One schema file per module (`<name>.schema.ts`) using Zod 4 (`import * as z from "zod"`; top-level `z.email()`, `z.uuid()`; `z.object()` strips unknown keys by default).
- `middleware/validate.ts` exports a factory `validate({ body?, params?, query? })` returning middleware that parses with `safeParse`, and on failure throws `BadRequestError` with `details = z.treeifyError(result.error)`. On success it assigns the parsed, typed values back onto `req`.
- Controllers consume already-validated, typed input. They never re-validate.
- Derive types from schemas with `z.infer` rather than writing parallel interfaces — one source of truth per shape.

## Environment config

`config/env.ts` parses `process.env` through a Zod schema at startup and exits the process on failure (fail fast, never boot half-configured). Everything downstream imports the typed `env` object — **no raw `process.env` access anywhere else** in the codebase. New env vars are added to the schema and to `.env.example` in the same change.

**`env.ts` validates — it does not load.** Nothing in the codebase reads `.env` off disk; that is the job of Node's native `--env-file=.env` flag, which the `dev` and `start` scripts pass (supported by both `tsx` and `node` on Node ≥ 20 — no `dotenv` dependency). A scaffold whose scripts omit this flag boots with `MONGODB_URI`/`JWT_SECRET` undefined and dies at the Zod check even though the user's `.env` is perfectly correct — this exact failure has happened, so treat the flag as part of the contract. In Docker/production the platform injects real env vars and the `Dockerfile` CMD runs `node dist/server.js` directly, no `.env` involved.

## Logging

`lib/logger.ts` exports a pino instance (pretty in dev via `pino-pretty`, JSON in prod). `request-context.ts` attaches a per-request id and a child logger at `req.log`. Application code logs through `req.log` inside requests and the root `logger` elsewhere. No `console.log` in committed code.

## Naming

- Files: kebab-case, suffixed by role: `product.service.ts`, `product.controller.ts`.
- Exports: named exports for utilities/services; the module's `routes.ts` default-exports its `Router`.
- Mongoose models: PascalCase singular (`Product`), collection auto-pluralized.
- Zod schemas: `createProductSchema`, `updateProductSchema`; inferred types `CreateProductInput`.

## DRY rules (the point of the registry)

Before creating any util, middleware, helper, type, or constant, the rule for every skill that builds code is: **check `MODULE_REGISTRY.md` first, then grep `src/lib`, `src/middleware`, `src/types`, `src/constants`, and sibling modules.** If a suitable piece exists, import it. "It's only needed by one feature" is not a reason to inline-duplicate something that already exists — reuse it. If a genuinely new reusable piece is created, place it by kind (util → `lib/`, middleware → `middleware/`, type → `types/`, constant/enum → `constants/`) and add it to the registry in the same change so the next feature sees it. Module-local, single-use code stays in the module (in its `<name>.types.ts` / `<name>.constants.ts` / `<name>.utils.ts` file) and is not registered.

## Build & scripts (clean dist, always)

The compiled output lives in `dist/` (TypeScript `outDir`). A stale `dist/` is a recurring footgun — deleted source files linger as compiled `.js`, and `npm start` can run yesterday's code. So **`dist/` is always wiped before a build or a dev run.** Use `rimraf` (a devDependency) for the delete, never `rm -rf` — it must work on Windows too.

`package.json` scripts (PM-agnostic — the same script bodies work under npm/pnpm/bun; chain with `&&`, not `npm run`, so they aren't tied to one PM):

```jsonc
"scripts": {
  "clean": "rimraf dist",
  "dev": "rimraf dist && tsx watch --env-file=.env src/server.ts",
  "build": "rimraf dist && tsc -p tsconfig.json",
  "start": "node --env-file=.env dist/server.js",
  "typecheck": "tsc --noEmit",
  "lint": "eslint .",
  "prepare": "husky || true"
}
```

- `clean` — standalone wipe, callable directly.
- `dev` — clears `dist/` then runs via `tsx watch` (no emit; running fresh from source, never a stale build). `--env-file=.env` loads the env file natively — without it `env.ts` validates an empty `process.env` and the boot fails; see "Environment config".
- `build` — clears `dist/` then emits a clean compile.
- `start` — runs the compiled output (assumes a prior `build`), also loading `.env` natively. The `Dockerfile` deliberately runs `node dist/server.js` (no flag) because containers get env vars from the platform, not a file.
- `prepare` — installs the husky git hooks on `install`. The `|| true` keeps installs green where husky can't run (Docker image builds with `--omit=dev`, no `.git` directory, CI).

Add `dist/` to `.gitignore`. The `rimraf` devDependency must be in `package.json`, and the registry/README note that `clean` runs automatically inside `dev` and `build`.

## Git hooks (husky + lint-staged)

The scaffold ships husky (v9+) and lint-staged as devDependencies so every project starts with working pre-commit checks instead of bolting them on later:

- `.husky/pre-commit` contains just `lint-staged` (husky v9 puts `node_modules/.bin` on the hook's PATH; no shebang or `husky.sh` sourcing — those are deprecated).
- `package.json` carries the lint-staged config: `"lint-staged": { "*.{ts,js}": "eslint --fix" }` — staged files only, so commits stay fast even as the repo grows.
- Hooks activate via the `prepare` script on first install; nothing else to run manually.

If the project dir is not itself the git root (e.g. scaffolded into `backend/` inside a monorepo), husky refuses to install from the subfolder — that's why `prepare` ends in `|| true`, so installs still succeed. To activate the hooks in that layout, change the project's prepare script to hop to the git root: `"prepare": "cd .. && husky backend/.husky || true"` (adjust the path to match), and make the hook `cd backend && npx lint-staged` (`npx`, because the hook now runs from the git root where `node_modules/.bin` isn't on PATH). When scaffolding into a subfolder, apply this adjusted form instead of the plain `husky` call.

## Graceful shutdown

`server.ts` listens, then on `SIGTERM`/`SIGINT` stops accepting connections, closes the Mongoose connection, and exits. Unhandled rejections and uncaught exceptions are logged and trigger a clean shutdown.
