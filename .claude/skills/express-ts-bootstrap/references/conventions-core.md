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
    logger.ts         # pino instance
    jwt.ts            # JOSE sign/verify helpers (see auth-jose.md)
  middleware/
    error-handler.ts  # central error handler (Zod- and AppError-aware)
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
  types/
    express.d.ts      # augment Express.Request (req.user, req.id, req.log)
  app.ts              # build & configure the Express app (no listen)
  server.ts           # bootstrap: connect db, listen, graceful shutdown
```

Rule: a module folder contains everything that module owns and nothing another module owns. Cross-module needs go through the other module's `service`, never by reaching into its model directly. Anything used by two or more modules belongs in `lib/` or `middleware/` and **must** be registered in MODULE_REGISTRY.md.

## Response envelope (single shape)

Success and error responses share one shape so clients and the test-writer skill can rely on it:

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

## Validation flow

- One schema file per module (`<name>.schema.ts`) using Zod 4 (`import * as z from "zod"`; top-level `z.email()`, `z.uuid()`; `z.object()` strips unknown keys by default).
- `middleware/validate.ts` exports a factory `validate({ body?, params?, query? })` returning middleware that parses with `safeParse`, and on failure throws `BadRequestError` with `details = z.treeifyError(result.error)`. On success it assigns the parsed, typed values back onto `req`.
- Controllers consume already-validated, typed input. They never re-validate.
- Derive types from schemas with `z.infer` rather than writing parallel interfaces — one source of truth per shape.

## Environment config

`config/env.ts` parses `process.env` through a Zod schema at startup and exits the process on failure (fail fast, never boot half-configured). Everything downstream imports the typed `env` object — **no raw `process.env` access anywhere else** in the codebase. New env vars are added to the schema and to `.env.example` in the same change.

## Logging

`lib/logger.ts` exports a pino instance (pretty in dev via `pino-pretty`, JSON in prod). `request-context.ts` attaches a per-request id and a child logger at `req.log`. Application code logs through `req.log` inside requests and the root `logger` elsewhere. No `console.log` in committed code.

## Naming

- Files: kebab-case, suffixed by role: `product.service.ts`, `product.controller.ts`.
- Exports: named exports for utilities/services; the module's `routes.ts` default-exports its `Router`.
- Mongoose models: PascalCase singular (`Product`), collection auto-pluralized.
- Zod schemas: `createProductSchema`, `updateProductSchema`; inferred types `CreateProductInput`.

## DRY rules (the point of the registry)

Before creating any util, middleware, helper, type, or constant, the rule for every skill that builds code is: **check `MODULE_REGISTRY.md` first, then grep `src/lib`, `src/middleware`, and sibling modules.** If a suitable piece exists, import it. "It's only needed by one feature" is not a reason to inline-duplicate something that already exists — reuse it. If a genuinely new reusable piece is created, add it to the registry in the same change so the next feature sees it. Module-local, single-use code stays in the module and is not registered.

## Graceful shutdown

`server.ts` listens, then on `SIGTERM`/`SIGINT` stops accepting connections, closes the Mongoose connection, and exits. Unhandled rejections and uncaught exceptions are logged and trigger a clean shutdown.
