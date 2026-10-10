# Module Registry — {{PROJECT_NAME}}

The curated dedup ledger. Before creating any util, middleware, helper, type, constant, schema, or
model, read `codemap/INDEX.md` → the relevant shard (generated, exhaustive) **and** this file (intent,
ownership, decisions) — grep only to confirm. If a suitable piece exists, **import it**; extend rather
than fork. New reusable pieces are added here in the same change.

> **Registry vs code map.** `codemap/` is the generated, exhaustive list of every export — read it
> to find out what exists. This registry is the short, curated layer on top: what each shared piece
> is *for*, which module owns what, and the decisions log. Don't copy the map in here.
>
> **This file is a ledger, not a rulebook.** One row per entry: name, path, ≤8-word purpose. The
> *rules* about how these pieces are used live in `ARCHITECTURE.md` — never restate them here, or
> both files grow and drift. Rows stay terse because this file is read on every build.
>
> **Sharding:** past ~250 lines, keep the section headings + row counts here and move the rows into
> `_registry/<section>.md`, linking each heading to its shard. Skills then read this index plus only
> the shard they need. See `.claude/skills/LAYOUT.md`.

## Shared library (`src/lib/`)

| Name | Path | Purpose |
| --- | --- | --- |
| `AppError` + subclasses | `lib/app-error.ts` | the one error model — BadRequest…Unprocessable |
| `ok` / `created` / `noContent` | `lib/http.ts` | the only success-envelope helpers |
| `normalizeDbError` | `lib/db-errors.ts` | Mongoose/Zod errors → `AppError`, in one place |
| `paginationQuerySchema` / `toSkip` / `toPageMeta` / `PageMeta` | `lib/pagination.ts` | the one pagination query + meta shape |
| `objectIdSchema` / `idParamsSchema` | `lib/common-schemas.ts` | ObjectId + `/:id` params validation |
| `logger` | `lib/logger.ts` | root pino logger (pretty dev, JSON prod) |
| `signAccessToken` / `signRefreshToken` / `verifyToken` | `lib/jwt.ts` | JOSE HS256 token helpers |

## Shared middleware (`src/middleware/`)

| Name | Path | Purpose |
| --- | --- | --- |
| `errorHandler` | `middleware/error-handler.ts` | the single error-envelope renderer |
| `notFound` | `middleware/not-found.ts` | terminal 404 |
| `requestContext` | `middleware/request-context.ts` | per-request id + child logger |
| `validate` / `ValidatedRequest` / `RequestSchemas` | `middleware/validate.ts` | Zod request validation + typed controller `req` |
| `protect` / `getAuthUser` | `middleware/protect.ts` | JOSE auth guard; typed `req.user` accessor |
| `requireRole` | `middleware/require-role.ts` | role gate; use after `protect` |

## Config (`src/config/`)

| Name | Path | Purpose |
| --- | --- | --- |
| `env` | `config/env.ts` | Zod-validated typed env — the only `process.env` reader |
| `connectDb` / `disconnectDb` | `config/db.ts` | Mongoose connection lifecycle |

## Shared types / constants (`src/types/`, `src/constants/`)

| Name | Path | Purpose |
| --- | --- | --- |
| `express.d.ts` | `types/express.d.ts` | `req.user` / `req.id` / `req.log` / `req.cookies` |

## Test helpers (`test/`)

| Name | Path | Purpose |
| --- | --- | --- |
| `api` | `test/helpers.ts` | supertest agent over a fresh `createApp()` |
| `authHeader` | `test/helpers.ts` | real bearer token for a role |
| in-memory Mongo lifecycle | `test/setup-db.ts` | auto-loaded for `*.int.test.ts` |

## Modules (`src/modules/`)

| Module | Mount | Owns | Public surface (`index.ts`) | Notes |
| --- | --- | --- | --- | --- |
| health | `/api/v1/health` | liveness/readiness check | `healthRoutes`, `getHealth()`, `HealthStatus` | {{PARADIGM}} skeleton example; no model |

> **Auth endpoints do not exist yet** — the JWT helpers and `protect`/`requireRole` are installed,
> but login/register/refresh are a feature for module-planner + module-builder to wire onto them.

## Decisions log

- Paradigm **{{PARADIGM}}** · PM **{{PACKAGE_MANAGER}}** · Node **{{NODE_MAJOR}}** · domain-module layout · ESM NodeNext `.js` extensions · API under `/api/v1`.
- Tokens: JOSE HS256 from env. Cookie-vs-bearer transport deferred to the auth feature.
