# Module Registry — {{PROJECT_NAME}}

The dedup ledger. **Check here FIRST** before creating any util, middleware, helper, type, constant,
or model — then grep `src/lib` / `src/middleware` / sibling modules. If a suitable piece exists,
**import it**; extend rather than fork. New reusable pieces are added here in the same change.

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
| `logger` | `lib/logger.ts` | root pino logger (pretty dev, JSON prod) |
| `signAccessToken` / `signRefreshToken` / `verifyToken` | `lib/jwt.ts` | JOSE HS256 token helpers |

## Shared middleware (`src/middleware/`)

| Name | Path | Purpose |
| --- | --- | --- |
| `errorHandler` | `middleware/error-handler.ts` | the single error-envelope renderer |
| `notFound` | `middleware/not-found.ts` | terminal 404 |
| `requestContext` | `middleware/request-context.ts` | per-request id + child logger |
| `validate` | `middleware/validate.ts` | `validate({ body?, params?, query? })` Zod factory |
| `protect` | `middleware/protect.ts` | JOSE auth guard; populates `req.user` |
| `requireRole` | `middleware/require-role.ts` | role gate; use after `protect` |

## Config (`src/config/`)

| Name | Path | Purpose |
| --- | --- | --- |
| `env` | `config/env.ts` | Zod-validated typed env — the only `process.env` reader |
| `connectDb` / `disconnectDb` | `config/db.ts` | Mongoose connection lifecycle |

## Shared types / constants (`src/types/`, `src/constants/`)

| Name | Path | Purpose |
| --- | --- | --- |
| `express.d.ts` | `types/express.d.ts` | `req.user` / `req.id` / `req.log` augmentation |

## Modules (`src/modules/`)

| Module | Path | Owns | Public service surface | Notes |
| --- | --- | --- | --- | --- |
| health | `modules/health/` | liveness/readiness check | `getHealth()` | canonical {{PARADIGM}} example; no model |

> **Auth endpoints do not exist yet** — the JWT helpers and `protect`/`requireRole` are installed,
> but login/register/refresh are a feature for module-planner + module-builder to wire onto them.

## Decisions log

- Paradigm **{{PARADIGM}}** · PM **{{PACKAGE_MANAGER}}** · domain-module layout · ESM NodeNext `.js` extensions.
- Tokens: JOSE HS256 from env. Cookie-vs-bearer transport deferred to the auth feature.
