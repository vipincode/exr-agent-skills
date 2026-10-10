# Core conventions

These are the project-wide rules that hold regardless of paradigm. They are the canonical source for the generated `ARCHITECTURE.md`. Keep them concrete — vague conventions produce inconsistent modules, which is exactly what defeats the registry/dedup workflow.

The design goal behind every rule here: **work on one module touches one folder.** An AI (or a person) building `product` should edit `src/modules/product/**`, add one line to `src/routes.ts`, and update the registry — nothing else, unless the dedup protocol says a shared piece must be created or extended. The lint config enforces the import boundaries mechanically, so this holds even when nobody re-reads the rules.

## Project layout (domain-module, always)

```
<proj>/
  src/
    app.ts              # middleware stack + mounts apiRouter at /api/v1 — never edited per feature
    routes.ts           # THE route registry: one mount line per module
    server.ts           # bootstrap: connect db, listen, graceful shutdown
    config/
      env.ts            # Zod-validated process.env, exported as typed `env`
      db.ts             # mongoose connection + disconnect
    lib/
      app-error.ts      # AppError + typed subclasses (NotFound, BadRequest, ...)
      http.ts           # response envelope helpers: ok(), created(), noContent()
      db-errors.ts      # normalizeDbError(): maps Mongoose/Zod errors -> AppError
      pagination.ts     # paginationQuerySchema, toSkip(), toPageMeta()
      common-schemas.ts # objectIdSchema, idParamsSchema
      logger.ts         # pino instance
      jwt.ts            # JOSE sign/verify helpers (see auth-jose.md)
    middleware/
      error-handler.ts  # the single error-envelope renderer
      not-found.ts      # 404 fallthrough
      request-context.ts# request id + child logger per request
      protect.ts        # JOSE auth guard (see auth-jose.md)
      require-role.ts   # role gate (see auth-jose.md)
      validate.ts       # validate() factory + ValidatedRequest<> type
    modules/
      <name>/                 # one folder per domain (health, auth, product, ...)
        index.ts              # PUBLIC API — the only file other code may import
        <name>.routes.ts      # express.Router wiring: validate → auth → handler
        <name>.controller.ts  # thin HTTP layer (typed req → service → envelope)
        <name>.service.ts     # business rules; returns DTOs; throws AppErrors
        <name>.repository.ts  # data access — the only file that imports the model
        <name>.model.ts       # Mongoose schema/model + indexes
        <name>.schema.ts      # Zod request schemas, inferred input types, route bundles
        <name>.mapper.ts      # doc → response DTO (explicit field allowlist)
        <name>.types.ts       # module-local types (optional)
        <name>.constants.ts   # module-local constants/enums (optional)
        <name>.utils.ts       # module-local helpers (optional)
        __tests__/
          <name>.service.test.ts      # unit — repository mocked, no DB
          <name>.routes.int.test.ts   # integration — real app + in-memory Mongo
    types/
      express.d.ts      # augment Express.Request (req.user, req.id, req.log, req.cookies)
                        # + types shared by 2+ modules (one file per topic, created on first need)
    constants/          # constants/enums shared by 2+ modules (created on first need)
  test/
    setup-db.ts         # in-memory Mongo lifecycle for *.int.test.ts
    helpers.ts          # api() supertest agent, authHeader(role)
  scripts/
    codemap.ts          # generates codemap/ from the code
  codemap/              # GENERATED map of every export — read before searching (never hand-edit)
  vitest.config.ts      # unit + integration projects
  tsconfig.json         # typecheck (src + tests); tsconfig.build.json emits src only
  eslint.config.js      # includes the architecture-boundary rules
```

A module that owns no data (like `health`) has no model, repository, or mapper. Everything else is the same.

## Layering inside a module

```
routes → controller → service → repository → model
                         ↘ mapper (doc → DTO)
schema is imported by routes (validate), controller (types), service + repository (input types)
```

| File | Owns | Never |
|---|---|---|
| `routes` | `validate(bundle)` → `protect`/`requireRole` → handler; default-exports the Router | logic, data access |
| `controller` | typed `req` → one service call → `ok`/`created`/`noContent` | try/catch, logic, repository/model imports |
| `service` | business rules, cross-module calls (via the other module's `index.ts`), DTO mapping, throwing `AppError`s | `req`/`res`, importing the model |
| `repository` | every Mongoose call for this module; returns **lean plain objects** | business rules, throwing HTTP errors |
| `model` | schema shape, indexes, `ProductDoc` type | logic, hooks that call other modules |
| `schema` | Zod operation schemas, `z.output` input types, one **request bundle** per route | response shaping |
| `mapper` | `toXDto(doc)` — the explicit list of fields that leave the API, and `XDto = ReturnType<…>` | queries, side effects |

Why a mandatory repository: services become testable by mocking a handful of plain functions instead of Mongoose query chains, and swapping a query (index hint, aggregation, caching) never touches business rules.

Why a mandatory mapper: returning a raw Mongoose doc leaks `_id`, `__v`, and any field added later — including secrets such as `passwordHash`. An allowlist means new fields stay private until someone adds them on purpose.

Lint enforces the layering (`eslint.config.js`): only `*.repository.ts` may import a `*.model.js` at runtime (type-only imports are fine); controllers/routes may not import a repository.

## Module boundaries (enforced)

- Other code imports a module **only through its `index.ts`**. `../product/product.model.js` is a lint error; `../product/index.js` is allowed.
- `index.ts` exports the router (for `routes.ts`), the service functions other modules may call, and public DTO types. Nothing else — not the model, not the repository.
- Cross-module needs go through the other module's **service** surface, never its model or repository.
- `lib/`, `middleware/`, `config/`, `types/`, `constants/` must never import from `modules/` (lint error). If a shared piece needs module knowledge, it is not shared — or the knowledge moves down.

## Code map (generated — how AI finds code cheaply)

`scripts/codemap.ts` parses `src/` and `test/` (TypeScript parser, syntax only, under a second) and writes `codemap/`: an `INDEX.md` (shard table, every module's public surface and mount path) plus one shard per area (`lib.md`, `middleware.md`, `config.md`, `types-constants.md`, `app.md`, `test-helpers.md`, `modules/<name>.md`). Each line is an exported symbol with its file, compact signature, and one-line purpose.

- **Read order for any task:** `codemap/INDEX.md` → the one shard you need → only the files you will change. Grep confirms; it doesn't discover. (The toolkit-wide protocol is `.claude/skills/CODE-NAV.md`.)
- **Always fresh:** the pre-commit hook regenerates and stages it; `codemap:check` fails CI if it's stale; module-builder runs `codemap` at the end of every slice.
- **Comment convention** (this is where descriptions come from): a comment block **followed by a blank line** describes the file; a `/** one line */` **directly above** an export describes that export. Give every export someone might reuse a one-line purpose.
- `codemap/` is generated: never edit it by hand, and don't restate it in `MODULE_REGISTRY.md` — the registry keeps curated purposes, ownership, and decisions; the map is the exhaustive inventory.
- Optional: GitNexus (code knowledge graph over MCP) answers "who calls this / what breaks if it changes". It is never required — see `CODE-NAV.md` for setup (`--index-only`), license (PolyForm Noncommercial), and when skills use it.

## Route registry

`src/routes.ts` owns every module mount, one line each, alphabetical, between the marker comments:

```ts
apiRouter.use("/products", productRoutes);
```

`app.ts` mounts `apiRouter` at `API_PREFIX` (`/api/v1`) and is never edited for a feature. A breaking API change later gets a second router (`/api/v2`), not edits to v1 routes.

## Response envelope (single shape)

```jsonc
// success
{ "success": true, "data": <payload>, "meta": <optional> }
// error
{ "success": false, "error": { "code": "NOT_FOUND", "message": "...", "details": <optional> } }
```

Controllers never hand-roll this. They call `ok(res, data, meta?)`, `created(res, data)`, or `noContent(res)` from `lib/http.ts`. `data` is always a DTO (or array of DTOs) from a mapper — never a Mongoose document. Errors are produced by throwing `AppError` subclasses; `middleware/error-handler.ts` is the one place that renders the error shape.

## Pagination (one shape)

Every list endpoint paginates with `lib/pagination.ts`:

- Query: extend `paginationQuerySchema` (`page` ≥ 1, default 1; `limit` 1–100, default 20) — `paginationQuerySchema.extend({ search: … })`. Never re-declare page/limit.
- Service: `repository.findPage(filter, { skip: toSkip(query), limit: query.limit })` returning `{ items, total }`, then `toPageMeta(query, total)`.
- Controller: `ok(res, items, meta)` → `meta = { page, limit, total, totalPages }`.

An unbounded `find()` on a growing collection is a bug.

## Error model

- `AppError(message, statusCode, code, details?)` is the base. Subclasses: `BadRequestError` (400, `BAD_REQUEST`), `UnauthorizedError` (401, `UNAUTHORIZED`), `ForbiddenError` (403, `FORBIDDEN`), `NotFoundError` (404, `NOT_FOUND`), `ConflictError` (409, `CONFLICT`), `UnprocessableError` (422, `UNPROCESSABLE`).
- `isOperational` is `true` on these. Unknown/thrown non-AppError values are treated as non-operational → logged at `error`, rendered as a generic 500 with code `INTERNAL` (never leak the message/stack in production).
- Services throw these. Controllers do not try/catch — Express 5 forwards rejections to the error handler. The only try/catch in normal code is around genuinely recoverable operations (e.g. an external call with a fallback).

### Mongoose & Zod error normalization (reusable)

`lib/db-errors.ts` exports `normalizeDbError(err: unknown): AppError | null`; `middleware/error-handler.ts` calls it first. Module code never re-implements these mappings:

- Mongoose `CastError` → `BadRequestError` (400), `details = { path, value }`.
- Mongoose `ValidationError` → `UnprocessableError` (422), `details` = per-field messages keyed by path.
- Duplicate key (`code === 11000`) → `ConflictError` (409), `details = { keyValue }`.
- A raw `ZodError` that reached the handler → `BadRequestError` (400), `details = z.treeifyError(err)`.

## Validation flow (typed end to end)

- One `<name>.schema.ts` per module, Zod 4: `import * as z from "zod"`; top-level formats (`z.email()`, `z.uuid()`); `z.object()` strips unknown keys (this is the mass-assignment guard).
- Reuse `objectIdSchema` / `idParamsSchema` from `lib/common-schemas.ts` and `paginationQuerySchema` from `lib/pagination.ts`.
- Each route gets a **request bundle** in the schema file:
  ```ts
  export const updateProductRequest = { params: idParamsSchema, body: updateProductSchema } satisfies RequestSchemas;
  ```
- Routes: `validate(updateProductRequest)`. On failure it throws `BadRequestError` with `details = z.treeifyError(...)`; on success it writes the parsed values back onto `req`.
- Controllers: `req: ValidatedRequest<typeof updateProductRequest>` — `req.params.id` and `req.body` are fully typed from the same object the route validated with. Never `req.body as X`, never re-validate.
- Input types come from `z.output<typeof schema>`; response types from `ReturnType<typeof toXDto>`. No parallel hand-written interfaces.

## Testing

Vitest, two projects (`vitest.config.ts`):

| Project | Files | What it does |
|---|---|---|
| `unit` | `src/**/__tests__/*.test.ts` | Service/mapper/util tests. Mock the module's repository (`vi.mock("../<name>.repository.js")`) or collaborator services. No DB. |
| `integration` | `src/**/__tests__/*.int.test.ts` | `api()` from `test/helpers.ts` (supertest over `createApp()`) against an in-memory Mongo from `test/setup-db.ts`. Asserts real statuses and envelopes, including 400/401/403/404/409. |

- Tests live in the module's own `__tests__/` folder, so module work stays inside the module folder.
- Mint auth with `authHeader(role)` from `test/helpers.ts` — never a hand-crafted JWT.
- Test env values come from `vitest.config.ts → test.env`; `LOG_LEVEL=silent` keeps output clean.
- Scripts: `test`, `test:unit`, `test:int`, `test:watch`, `test:coverage`.
- `tsconfig.json` typechecks tests; `tsconfig.build.json` keeps them out of `dist/`.

## Environment config

`config/env.ts` parses `process.env` through a Zod schema at startup and exits the process on failure (fail fast, never boot half-configured). Everything downstream imports the typed `env` object — **no raw `process.env` access anywhere else** in the codebase. New env vars are added to the schema and to `.env.example` in the same change.

**`env.ts` validates — it does not load.** Nothing in the codebase reads `.env` off disk; that is the job of Node's native `--env-file=.env` flag, which the `dev` and `start` scripts pass (no `dotenv` dependency). A scaffold whose scripts omit this flag boots with `MONGODB_URI`/`JWT_SECRET` undefined and dies at the Zod check even though the user's `.env` is correct — this exact failure has happened, so treat the flag as part of the contract. In Docker/production the platform injects real env vars and the `Dockerfile` CMD runs `node dist/server.js` directly, no `.env` involved.

## Logging

`lib/logger.ts` exports a pino instance (pretty in dev via `pino-pretty`, JSON in prod, `silent` in tests). `request-context.ts` attaches a per-request id and a child logger at `req.log`. Application code logs through `req.log` inside requests and the root `logger` elsewhere. No `console.*` in committed code — lint enforces it (`config/env.ts` is the one exemption, since it fails before the logger exists).

## Naming

- Files: kebab-case, suffixed by role: `product.service.ts`, `product.repository.ts`.
- Exports: named exports everywhere except `<name>.routes.ts`, which default-exports its `Router` (re-exported by name from `index.ts`: `export { default as productRoutes }`).
- Mongoose models: PascalCase singular (`Product`), collection auto-pluralized; doc type `ProductDoc`.
- Zod: `createProductSchema` → `CreateProductInput`; request bundles `createProductRequest`.
- Mapper: `toProductDto` → `ProductDto`.
- Type-only imports use `import type` (lint + `verbatimModuleSyntax`).

## DRY rules (the point of the registry)

Before creating any util, middleware, helper, type, schema, or constant: **check `codemap/INDEX.md` → the relevant shard and `MODULE_REGISTRY.md` first, then grep `src/lib`, `src/middleware`, `src/types`, `src/constants`, and sibling modules.** If a suitable piece exists, import it. "It's only needed by one feature" is not a reason to inline-duplicate something that already exists. If a genuinely new reusable piece is created, place it by kind (util/shared schema → `lib/`, middleware → `middleware/`, type → `types/`, constant/enum → `constants/`) and add it to the registry in the same change. Module-local, single-use code stays in the module (in its `<name>.types.ts` / `<name>.constants.ts` / `<name>.utils.ts` file) and is not registered.

## Dependencies (always latest, verified)

- Never hand-write a version number. Add packages with the PM (`pnpm add <pkg>` / `pnpm add -D <pkg>`), which resolves the current release.
- Before using a library API, check its **current** docs (context7 when available) — training-data memory of a library is often one major version behind.
- Respect peer ranges: if a tool caps a peer (typescript-eslint caps `typescript`), install the newest version inside that cap. `references/versions.md` lists the known caps and the major-version gotchas.

## Build & scripts (clean dist, always)

The compiled output lives in `dist/`. A stale `dist/` is a recurring footgun — deleted source files linger as compiled `.js`, and `start` can run yesterday's code. So **`dist/` is always wiped before a build or a dev run**, with `rimraf` (works on Windows; never `rm -rf`).

```jsonc
"scripts": {
  "clean": "rimraf dist",
  "dev": "rimraf dist && tsx watch --env-file=.env src/server.ts",
  "build": "rimraf dist && tsc -p tsconfig.build.json",
  "start": "node --env-file=.env dist/server.js",
  "typecheck": "tsc --noEmit",
  "lint": "eslint .",
  "test": "vitest run",
  "test:unit": "vitest run --project unit",
  "test:int": "vitest run --project integration",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage",
  "codemap": "tsx scripts/codemap.ts",
  "codemap:check": "tsx scripts/codemap.ts --check",
  "prepare": "husky || true"
}
```

Script bodies are PM-agnostic (chain with `&&`, never `npm run`). `prepare`'s `|| true` keeps installs green where husky can't run (Docker `--prod` installs, no `.git`, CI).

## Git hooks (husky + lint-staged)

- `.husky/pre-commit` runs `lint-staged`, then `tsx scripts/codemap.ts && git add codemap`, so the code map is committed with the code it describes (husky v9 puts `node_modules/.bin` on the hook's PATH; no shebang or `husky.sh` sourcing).
- `package.json` carries `"lint-staged": { "*.{ts,js}": "eslint --fix" }` — staged files only, so the boundary rules run on every commit.
- Hooks activate via `prepare` on first install.

If the project dir is not the git root (e.g. `backend-shoply/` inside a monorepo), husky refuses to install from the subfolder. Use `"prepare": "cd .. && husky backend-shoply/.husky || true"` (adjust to the real folder name) and make the hook `cd backend-shoply && npx lint-staged && npx tsx scripts/codemap.ts && git add codemap` (`npx`, because the hook now runs from the git root).

## Graceful shutdown

`server.ts` listens, then on `SIGTERM`/`SIGINT` stops accepting connections, closes the Mongoose connection, and exits. Unhandled rejections and uncaught exceptions are logged and trigger a clean shutdown.
