# Module Registry — {{PROJECT_NAME}}

> The dedup ledger. Before creating any util, middleware, helper, type, or model,
> check here first, then grep `src/lib`/`src/middleware`/sibling modules. If a
> suitable piece exists, **import it** — don't recreate it. When a genuinely new
> reusable piece is created, add it here in the same change.

## Shared library (`src/lib/`)

| Name | Path | Purpose |
| --- | --- | --- |
| `AppError` + subclasses | `lib/app-error.ts` | One error model: `BadRequestError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError`, `UnprocessableError`. Throw these; never `throw new Error()`. |
| `ok` / `created` / `noContent` | `lib/http.ts` | The only success-envelope helpers. Controllers respond through these. |
| `normalizeDbError` | `lib/db-errors.ts` | Maps Mongoose `CastError`/`ValidationError`/duplicate-key (11000) and raw `ZodError` to `AppError`. Used by the error handler. **Reuse — do not re-catch DB/Zod errors in modules.** |
| `logger` | `lib/logger.ts` | Root pino logger (pretty in dev, JSON in prod). |
| `signAccessToken` / `signRefreshToken` / `verifyToken` | `lib/jwt.ts` | JOSE HS256 token helpers. Auth feature reuses these — no new token logic. |

## Shared middleware (`src/middleware/`)

| Name | Path | Purpose |
| --- | --- | --- |
| `errorHandler` | `middleware/error-handler.ts` | The single error-envelope renderer (AppError-, Mongoose-, Zod-aware). |
| `notFound` | `middleware/not-found.ts` | Terminal 404. |
| `requestContext` | `middleware/request-context.ts` | Per-request id + child logger (`req.id`, `req.log`). |
| `validate` | `middleware/validate.ts` | `validate({ body?, params?, query? })` Zod request validation factory. |
| `protect` | `middleware/protect.ts` | JOSE auth guard; populates `req.user`. |
| `requireRole` | `middleware/require-role.ts` | Role gate; use after `protect`. |

## Config (`src/config/`)

| Name | Path | Purpose |
| --- | --- | --- |
| `env` | `config/env.ts` | Zod-validated, typed environment. The only place that reads `process.env`. |
| `connectDb` / `disconnectDb` | `config/db.ts` | Mongoose connection lifecycle. |

## Modules

| Module | Path | Owns | Public service surface | Notes |
| --- | --- | --- | --- | --- |
| health | `modules/health/` | Liveness/readiness check | `getHealth()` | Canonical {{PARADIGM}} example. No data model. |

> **Auth endpoints do not exist yet.** The JWT helpers and `protect`/`requireRole`
> middleware are installed, but login/register/refresh routes are a feature for
> feature-planner + module-builder to design and wire onto these primitives.

## Decisions log

- Paradigm: **{{PARADIGM}}**. Package manager: **{{PACKAGE_MANAGER}}**.
- Structure: domain-module (`src/modules/<name>/`).
- ESM with NodeNext `.js` import extensions.
- Single response envelope; single error model; Mongoose/Zod errors normalized in `lib/db-errors.ts`.
- Tokens: JOSE HS256, secret from env. Cookie-vs-bearer transport deferred to the auth feature.
- `dist/` wiped before every `build`/`dev` via `rimraf`.
- Planner docs live in `_docs/`; `ARCHITECTURE.md` and `MODULE_REGISTRY.md` at root.
