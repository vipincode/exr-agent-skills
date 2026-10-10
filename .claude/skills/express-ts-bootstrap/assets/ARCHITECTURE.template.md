# Architecture — {{PROJECT_NAME}}

> Source of truth for conventions. Every skill (module-planner, module-builder,
> test-writer, code-review) reads this before writing or reviewing code. Keep it
> concrete and current — if a convention changes, change it here first.

## Invariants

> **This section is the source for `CLAUDE.md`.** The bootstrap copies it verbatim into
> `CLAUDE.md` at this project root so it is always in context, even when no skill is running
> and nobody has read this file. Change a rule **here**, then regenerate `CLAUDE.md` — never
> edit the two out of sync. Everything below this section is the full detail behind these rules.

Non-negotiable in **every** change, however small. Rules marked *(lint)* are enforced by `eslint.config.js` — a lint error there means the code is wrong, not the rule.

1. **Module work stays in the module.** Building or changing module `<x>` edits `src/modules/<x>/**` (tests included), plus at most one mount line in `src/routes.ts` and the `MODULE_REGISTRY.md` rows. Touch a shared folder (`lib/`, `middleware/`, `types/`, `constants/`, `config/`) only when the dedup check says a shared piece must be created or extended — and say so in the hand-off. Never edit another module's files.
2. **Module boundaries** *(lint)* — other code imports a module only through its `index.ts`; cross-module needs call the other module's public service functions. `lib/`, `middleware/`, `config/`, `types/`, `constants/` never import from `modules/`.
3. **Layering** *(lint)* — routes → controller → service → repository → model. Only `<name>.repository.ts` imports the model; controllers/routes never import the repository.
4. **Responses only via `ok()` / `created()` / `noContent()`** from `lib/http.ts`, and `data` is always a DTO from `<name>.mapper.ts` — never a raw Mongoose document. The error envelope is rendered only in `middleware/error-handler.ts`.
5. **Errors only by throwing the shared `AppError` subclasses.** Controllers never try/catch. **No `asyncHandler`** — Express 5 forwards rejections.
6. **Mongoose/Zod errors are normalized once** in `lib/db-errors.ts`. Never re-catch them in a module.
7. **Validation via `validate(<route>Request)`** with a request bundle from the module's `<name>.schema.ts`; the controller types `req` as `ValidatedRequest<typeof <route>Request>`. Never `req.body as X`, never re-validate.
8. **Types derive from their source** — inputs via `z.output<typeof schema>`, responses via `ReturnType<typeof toXDto>`. No parallel hand-written interfaces.
9. **Lists paginate** with `lib/pagination.ts` (`paginationQuerySchema.extend(...)`, `toSkip`, `toPageMeta`). Ids validate with `lib/common-schemas.ts`. No unbounded `find()`.
10. **Relative imports carry explicit `.js` extensions** (NodeNext ESM). Type-only imports use `import type` *(lint)*.
11. **Placement by reach** — used by 2+ modules → `lib/` / `middleware/` / `types/` / `constants/` and **registered**; single-use → the module's own `<name>.types.ts` / `.constants.ts` / `.utils.ts`. No inline magic literals.
12. **Check `MODULE_REGISTRY.md` before creating** any util, middleware, type, constant, or schema — then grep. If it exists, import it. Extend rather than fork.
13. **Auth reuses `lib/jwt.ts` + `protect` / `getAuthUser` + `requireRole`.** Never write new token logic; never `req.user!`.
14. **Env only through the typed `config/env.ts`** — no raw `process.env` elsewhere. New vars land in the schema and `.env.example` in the same change.
15. **No `console.*`** *(lint)* — `req.log` in requests, the root `logger` elsewhere.
16. **Tests live in the module's `__tests__/`** — `*.test.ts` unit (repository mocked), `*.int.test.ts` integration (`test/helpers.ts` + in-memory Mongo).
17. **Dependencies: latest, verified.** Add with `{{PM}} add <pkg>` — never hand-write a version. Check the library's current docs (context7) before using its API.

New shared code is **not done** until it is listed in `MODULE_REGISTRY.md`.

## Stack

Versions are whatever the PM resolved at scaffold time (`package.json` is the record). Majors the code was written against:

- **Express 5** — async handlers forward rejections; no `asyncHandler`.
- **TypeScript** strict, **ESM**, `module`/`moduleResolution: NodeNext`, `verbatimModuleSyntax` — newest release inside typescript-eslint's supported range.
- **Mongoose 9** — async pre-hooks (no `next`), `QueryFilter` type, `returnDocument: "after"`.
- **JOSE 6** — HS256, secret from env.
- **Zod 4** — `import * as z from "zod"`, top-level `z.email()`/`z.uuid()`, `z.treeifyError()`.
- **pino** + `pino-http`, **helmet**, **cors**, **compression**, **express-rate-limit**.
- **Vitest** + **supertest** + **mongodb-memory-server** for tests.
- **ESLint** flat config + typescript-eslint, with architecture-boundary rules.
- **Node** {{NODE_MAJOR}} (`.nvmrc`, Dockerfile, `engines`). **Package manager:** {{PACKAGE_MANAGER}}.

Adding a dependency: install with the PM (no version), read its current docs, and if it is a cross-cutting choice (mailer, queue, cache) record it here and wrap it once in `src/lib/` (registered).

## Paradigm — {{PARADIGM}}

{{PARADIGM_DESCRIPTION}}

The `health` module (`src/modules/health/`) shows the module skeleton (index, routes, controller, service, types, tests). It owns no data, so for the data-owning files (model, repository, mapper, schema bundles) follow the examples above and the anatomy below.

## Project layout

```
src/
  app.ts       middleware stack; mounts apiRouter at /api/v1 — never edited per feature
  routes.ts    the route registry — one mount line per module
  server.ts    bootstrap: connect db, listen, graceful shutdown
  config/      env.ts (Zod-validated env), db.ts (mongoose connect/disconnect)
  lib/         app-error, http, db-errors, pagination, common-schemas, logger, jwt
  middleware/  error-handler, not-found, request-context, protect, require-role, validate
  modules/<name>/
    index.ts              public API — the only file other code imports
    <name>.routes.ts      validate → auth → handler
    <name>.controller.ts  typed req → service → envelope
    <name>.service.ts     business rules → DTOs, throws AppErrors
    <name>.repository.ts  all data access (lean); only model importer
    <name>.model.ts       Mongoose schema + indexes + <Name>Doc type
    <name>.schema.ts      Zod schemas, input types, per-route request bundles
    <name>.mapper.ts      toXDto(doc) — explicit field allowlist
    <name>.container.ts   only when a class service needs wiring (see paradigm)
    <name>.types.ts / .constants.ts / .utils.ts   optional, module-local
    __tests__/            <name>.service.test.ts, <name>.routes.int.test.ts
  types/       express.d.ts + types shared by 2+ modules
  constants/   constants/enums shared by 2+ modules (created on first need)
test/
  setup-db.ts  in-memory Mongo for *.int.test.ts
  helpers.ts   api(), authHeader(role)
```

A module that owns no data has no model/repository/mapper.

## Module boundaries & layering

```
routes → controller → service → repository → model
                         ↘ mapper
```

- **Repository** — the only file that imports the model. Returns lean plain objects. No business rules, no HTTP errors.
- **Service** — business rules; calls its repository and other modules' public services (via their `index.ts`); maps docs to DTOs; throws `AppError`s. No `req`/`res`.
- **Controller** — `ValidatedRequest<…>` in, one service call, `ok`/`created`/`noContent` out. No try/catch, no logic.
- **Routes** — `validate(bundle)` → `protect` / `requireRole(...)` → handler. Default-exports the Router.
- **`index.ts`** — exports the router (as `<name>Routes`), the service functions other modules may call, and public DTO types. Never the model or repository.

Enforced by `eslint.config.js` (`@typescript-eslint/no-restricted-imports`): cross-module internals, model outside repository, repository from controllers/routes, and shared layers importing modules are all lint errors — and the pre-commit hook runs lint.

## Route registry

`src/routes.ts`:

```ts
// --- Module routes: one line per module, alphabetical. module-builder appends here. ---
apiRouter.use("/health", healthRoutes);
// --- End module routes ---
```

All module routes live under `/api/v1`. A breaking change gets a new versioned router, not edits to v1.

## Response envelope (one shape)

```jsonc
// success
{ "success": true, "data": <DTO | DTO[]>, "meta": <optional, e.g. pagination> }
// error
{ "success": false, "error": { "code": "NOT_FOUND", "message": "...", "details": <optional> } }
```

Paginated lists: `meta = { page, limit, total, totalPages }`.

## Error model

- `AppError(message, statusCode, code, details?)` base, with subclasses:
  `BadRequestError` (400), `UnauthorizedError` (401), `ForbiddenError` (403),
  `NotFoundError` (404), `ConflictError` (409), `UnprocessableError` (422).
- Services throw these. Controllers do **not** try/catch.
- **Mongoose & Zod errors are normalized once** in `lib/db-errors.ts`: `CastError` → 400,
  `ValidationError` → 422, duplicate key (11000) → 409, raw `ZodError` → 400.
- `protect` maps every token failure to 401.
- Unknown errors → logged, generic 500 (`INTERNAL`), no message/stack leak in production.

## Validation flow

- `<name>.schema.ts`: operation schemas (`createProductSchema`, `updateProductSchema = create.partial()`,
  `listProductsQuerySchema = paginationQuerySchema.extend(...)`), inferred input types, and one
  request bundle per route: `export const getProductRequest = { params: idParamsSchema } satisfies RequestSchemas;`
- Routes: `validate(getProductRequest)` → 400 with `details = z.treeifyError(...)` on failure; parsed values written back onto `req`.
- Controllers: `req: ValidatedRequest<typeof getProductRequest>` — fully typed params/body/query.
- `z.object()` strips unknown keys — the mass-assignment guard. Filters are built from validated fields, never from raw `req.query`.

## Testing

| Project | Files | Approach |
|---|---|---|
| `unit` | `src/**/__tests__/*.test.ts` | `vi.mock("../<name>.repository.js")`; assert DTOs and thrown `AppError`s. |
| `integration` | `src/**/__tests__/*.int.test.ts` | `api()` + `authHeader(role)` from `test/helpers.ts`; in-memory Mongo; assert statuses + envelopes (200/201/204, 400, 401, 403, 404, 409). |

Run: `{{PM}} test` · `{{PM}} run test:unit` · `{{PM}} run test:int` · `{{PM}} run test:coverage`.

## Auth primitives

`lib/jwt.ts` (`signAccessToken`/`signRefreshToken`/`verifyToken`), `middleware/protect.ts`
(`protect`, `getAuthUser`), `middleware/require-role.ts` ship with the scaffold.
**Auth endpoints do not exist yet** — module-planner designs them and module-builder wires
them onto these primitives. Never write new token logic.

## Environment config

`config/env.ts` validates `process.env` through Zod at startup and exits on failure. **No raw
`process.env` access anywhere else.** New vars go in the schema and `.env.example` in the same
change. `.env` is loaded by Node's native `--env-file=.env` in `dev`/`start` (no `dotenv`);
tests get values from `vitest.config.ts → test.env`; containers get real env vars.

## Build & scripts

- `{{PM}} run dev` — `rimraf dist && tsx watch --env-file=.env src/server.ts`
- `{{PM}} run build` — `rimraf dist && tsc -p tsconfig.build.json` (src only, no tests)
- `{{PM}} start` — `node --env-file=.env dist/server.js`
- `{{PM}} run typecheck` — `tsc --noEmit` (src + tests)
- `{{PM}} run lint` — ESLint incl. boundary rules
- `{{PM}} test` / `test:unit` / `test:int` / `test:watch` / `test:coverage`

## Git hooks

husky (v9) + lint-staged, installed via `prepare` on `{{PM}} install`. The pre-commit hook runs
`eslint --fix` on staged `*.ts`/`*.js` — so boundary violations can't be committed.

## Logging

`lib/logger.ts` (pino; pretty in dev, JSON in prod, silent in tests). `request-context.ts`
attaches a per-request id and `req.log`. No `console.*` (lint), except `config/env.ts`.

## Naming

- Files: kebab-case, role-suffixed (`product.repository.ts`).
- Models: PascalCase singular (`Product`), doc type `ProductDoc`.
- Zod: `createProductSchema` → `CreateProductInput`; route bundles `createProductRequest`.
- Mapper: `toProductDto` → `ProductDto`.
- `<name>.routes.ts` default-exports its Router; `index.ts` re-exports it as `<name>Routes`.

## Feature workflow

1. `module-planner` writes `_docs/features/<module>/<module>-plan.md` plus ordered slice files
   (`01-<slice>.md`, …) at the **repo root** (a plan can span backend and frontend).
2. You review and edit those files.
3. `module-builder` executes **one slice**, then marks it `built`.
4. `test-writer` covers it from that slice's testing checklist; `code-review` checks it against
   this contract. Both on demand.

`CLAUDE.md`, this file, and `MODULE_REGISTRY.md` live at the **project root** (the repo root or
a subfolder such as `backend-<name>/`), recorded in `.claude/workspace.json` at the repo root.
