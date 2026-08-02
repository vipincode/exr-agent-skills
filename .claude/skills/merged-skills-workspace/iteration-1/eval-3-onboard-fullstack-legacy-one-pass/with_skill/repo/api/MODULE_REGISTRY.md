# Module Registry — legacy-api

> The dedup ledger. Before creating any util, middleware, helper, type, or model,
> check here first, then grep `src/utils`/`src/middleware`/`src/services`. If a
> suitable piece exists, **import it** — don't recreate it. When a genuinely new
> reusable piece is created, add it here in the same change.
>
> Seeded by `project-onboard` from a read-only scan of the existing code. Paths are
> relative to `api/src/`.

## Shared utilities (`src/utils/`)

| Name | Path | Purpose |
| --- | --- | --- |
| `ApiError` | `utils/ApiError.ts` | The only error class. `new ApiError(status, message)`. No subclasses, no error `code`. Throw this — never `throw new Error()`. |
| `notFound(what)` | `utils/ApiError.ts` | Factory → `ApiError(404, "<what> not found")`. Reuse for all 404s. |
| `conflict(msg)` | `utils/ApiError.ts` | Factory → `ApiError(409, msg)`. Reuse for uniqueness/duplicate conflicts. |
| `catchAsync(fn)` | `utils/catchAsync.ts` | **Required** wrapper for every async controller (Express 4 does not forward async rejections). Catches and calls `next(err)`. |
| `formatDate(d: Date)` | `utils/formatDate.ts` | `Date` → `"YYYY-MM-DD"` (ISO slice). **Canonical date formatter** — see the duplicate note below. |

## Shared middleware (`src/middleware/`)

| Name | Path | Purpose |
| --- | --- | --- |
| `errorHandler` | `middleware/errorHandler.ts` | The single error-envelope renderer. `ApiError` → its status; anything else → 500. Emits `{ data: null, message }`. Mounted last in `src/index.ts`. |
| `requireAuth` | `middleware/auth.ts` | Bearer-token guard. `jwt.verify` with `JWT_SECRET`; sets `(req as any).user`. Throws `ApiError(401)`. |
| `requireAdmin` | `middleware/auth.ts` | Role gate — requires `user.role === "admin"`, else `ApiError(403)`. Mount **after** `requireAuth`. |
| `validateBody(schema)` | `middleware/validate.ts` | Joi body validation (`abortEarly: false`); throws `ApiError(422)`; writes the coerced value back to `req.body`. **Body only** — extend this file if params/query validation is needed. Currently unused by any route. |

## Models (`src/models/`)

| Model | Path | Collection / fields | Notes |
| --- | --- | --- | --- |
| `Product` | `models/Product.ts` | `products` — `title`, `slug` (unique), `priceCents`, `inStock` (default `true`), timestamps | Accessed only through `services/product.service.ts`. |
| `User` | `models/User.ts` | `users` — `email` (unique, lowercase), `passwordHash` (`select: false`), `name`, `role` (`"user" \| "admin"`, default `"user"`), timestamps | **No routes, controller, or service exist for this model yet.** The auth feature must build them; do not create a second user model. |

## Modules

| Module | Path | Owns | Public service surface | Notes |
| --- | --- | --- | --- | --- |
| products | `routes/product.routes.ts`, `controllers/product.controller.ts`, `services/product.service.ts`, `models/Product.ts` | The `Product` model + `/api/products` | `listProducts(page = 1, limit = 20)` → `{ items, total, page, limit }`; `getProduct(id)` → product doc (throws `notFound("Product")`) | Canonical layered example. Controller exports: `list`, `getOne`. Routes: `GET /`, `GET /:id`, `POST /` (guarded by `requireAuth` + `requireAdmin`). |
| reports | `services/report.service.ts` | Read-only aggregate over `Product` | `dailyStockReport()` → `{ day, count }` | **Service only** — no controller and no route mounts it, so it is currently unreachable over HTTP. |
| health | `src/index.ts` (inline) | Liveness check | — | `GET /health` → `{ data: { ok: true }, message: "OK" }`, defined inline on the app, outside `/api`. |

## App infrastructure

| Name | Path | Purpose |
| --- | --- | --- |
| app + server bootstrap | `src/index.ts` | Creates the app, mounts `cors`/`express.json`/`morgan`, the `/health` route, `/api/products`, then `errorHandler`; connects mongoose and listens. There is **no** `app.ts`/`server.ts` split — new routers are mounted here. |

## Config & env

There is **no config module**. `process.env` is read directly at the point of use
(`src/index.ts`: `CORS_ORIGIN`, `MONGO_URL`, `PORT`; `middleware/auth.ts`: `JWT_SECRET`).
Declared vars live in `api/.env.example` — add new vars there in the same change.

## Known duplication & gaps (findings — not auto-fixed)

- **Duplicate date helper.** `utils/formatDate.ts#formatDate` and
  `services/report.service.ts#toDayString` are byte-for-byte the same logic. Treat
  `utils/formatDate.ts` as **canonical**; new code imports it. Collapsing
  `toDayString` into it is a cleanup the user can request separately.
- **`validateBody` is dead code** — no route uses it and no Joi schema files exist.
  New write routes should be the first consumers.
- **`bcryptjs` is installed but unused** — reserved for the auth feature.
- **`POST /api/products` is wired to `controller.list`** (`routes/product.routes.ts`),
  not to a `create` handler. Looks like a bug; left untouched by onboarding.
- **No auth endpoints** despite a `User` model, JWT guards, and `bcryptjs` — there is no
  token-issuing helper anywhere.
- **No error normalization** for Mongoose `CastError` / duplicate-key `11000` /
  `ValidationError` — these surface as raw 500s.
- **No tests** despite jest + supertest being installed and `npm test` → `jest`.

## Decisions log

- Layout: **layered** (`controllers/`, `services/`, `routes/`, `models/`, `middleware/`,
  `utils/`). Package manager: **npm** (assumed — no lockfile committed).
- CommonJS, extensionless relative imports, no path aliases.
- Single envelope `{ data, message }`, built inline in controllers; single error renderer.
- `catchAsync` is mandatory on every async controller (Express 4).
- Validation: Joi via `validateBody`. Auth: `jsonwebtoken` Bearer + `requireAuth` /
  `requireAdmin`.
- Planner docs live in `_docs/` at the **repo root**; `ARCHITECTURE.md` and
  `MODULE_REGISTRY.md` live here in `api/`.
