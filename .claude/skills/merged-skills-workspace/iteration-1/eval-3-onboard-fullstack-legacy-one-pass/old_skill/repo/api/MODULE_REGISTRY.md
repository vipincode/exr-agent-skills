# Module Registry — legacy-api

> The dedup ledger. Before creating any util, middleware, helper, type, or model,
> check here first, then grep `src/utils`/`src/middleware`/sibling files. If a
> suitable piece exists, **import it** — don't recreate it. When a genuinely new
> reusable piece is created, add it here in the same change.
>
> Seeded by `backend-onboard` from a read-only scan of the existing code. Paths are
> relative to `api/src/`. Note the layout is **layered**, so there is no `lib/`,
> `config/`, or `modules/` folder — the equivalents are listed under their real paths.

## Shared utilities (`src/utils/`)

| Name | Path | Purpose |
| --- | --- | --- |
| `ApiError` | `utils/ApiError.ts` | The **only** error class. `new ApiError(status, message)` — `extends Error` with a `status: number`. `errorHandler` reads `instanceof ApiError` to pick the HTTP status. Throw this; never `throw new Error()`. No named subclasses exist. |
| `notFound(what)` | `utils/ApiError.ts` | Factory → `ApiError(404, "<what> not found")`. Used by `product.service.getProduct`. Reuse for all 404s. |
| `conflict(msg)` | `utils/ApiError.ts` | Factory → `ApiError(409, msg)`. Currently unused — reuse it for duplicate-key/uniqueness conflicts instead of a new helper. |
| `catchAsync(fn)` | `utils/catchAsync.ts` | **Required** async-handler wrapper (Express 4 does not forward async rejections). Every async controller is wrapped: `export const list = catchAsync(async (req, res) => {...})`. Never write an unwrapped async handler. |
| `formatDate(d)` | `utils/formatDate.ts` | `Date` → `"YYYY-MM-DD"` (`toISOString().slice(0,10)`). **Canonical date helper** — reuse it. (A duplicate private `toDayString` lives in `services/report.service.ts`; do not copy that pattern.) |

There is **no** response-envelope helper (`ok`/`created`), **no** logger module, **no**
DB-error normalizer, and **no** token sign/verify helper. Controllers build
`{ data, message }` inline; see `ARCHITECTURE.md` → "Response envelope".

## Shared middleware (`src/middleware/`)

| Name | Path | Purpose |
| --- | --- | --- |
| `errorHandler` | `middleware/errorHandler.ts` | The single error-envelope renderer: `ApiError` → its `status`, anything else → 500; responds `{ data: null, message }`. Mounted **last** in `src/index.ts`. Not Mongoose/Joi-aware. |
| `requireAuth` | `middleware/auth.ts` | Bearer-token guard. Parses `Authorization: Bearer <t>`, `jwt.verify(t, process.env.JWT_SECRET)`, sets `(req as any).user`. Throws `ApiError(401)`. **Reuse — do not write new token verification.** |
| `requireAdmin` | `middleware/auth.ts` | Role gate — `user.role !== "admin"` → `ApiError(403)`. Use **after** `requireAuth`. Only the `admin` role is gated today; there is no generic `requireRole(role)` factory. |
| `validateBody(schema)` | `middleware/validate.ts` | **Joi** body-validation factory (`abortEarly: false`), throws `ApiError(422, error.message)` and writes the coerced value back to `req.body`. Body only — no params/query variant. **Currently unused by any route**; wire new endpoints through it rather than writing a new validator. |

## Models (`src/models/`)

| Model | Path | Collection shape | Notes |
| --- | --- | --- | --- |
| `Product` | `models/Product.ts` | `title` (req), `slug` (req, **unique**), `priceCents` (req, Number), `inStock` (Boolean, default `true`), `timestamps` | Untyped `mongoose.model` (no interface/generic). Accessed only through `product.service.ts` — never import this model from a controller. |
| `User` | `models/User.ts` | `email` (req, unique, lowercase), `passwordHash` (req, **`select: false`**), `name` (req), `role` (`"user" \| "admin"`, default `"user"`), `timestamps` | **No user service, controller, or route exists yet.** `passwordHash` is excluded by default — an auth feature must `.select("+passwordHash")` explicitly. Nothing currently hashes or writes it. |

## Modules / resources

Layered layout — a "module" is the set of same-named files across `controllers/`,
`services/`, `routes/`, `models/`.

| Module | Files | Owns | Public service surface | Notes |
| --- | --- | --- | --- | --- |
| product | `routes/product.routes.ts`, `controllers/product.controller.ts`, `services/product.service.ts`, `models/Product.ts` | Product catalog | `listProducts(page = 1, limit = 20)` → `{ items, total, page, limit }`; `getProduct(id)` → product doc, throws `notFound("Product")` | The canonical example of this repo's layered paradigm — imitate it. Controller exports `list`, `getOne` (both `catchAsync`-wrapped). Mounted at **`/api/products`**. `POST /` is mis-wired to `controller.list` (see Findings). |
| report | `services/report.service.ts` | Stock reporting | `dailyStockReport()` → `{ day, count }` | **Service only — no controller, no route, unreachable over HTTP.** Reads `Product` directly (bypasses `product.service`). Contains a duplicate private `toDayString` date helper. |

## Routes mounted (`src/index.ts`)

| Path | Router | Endpoints |
| --- | --- | --- |
| `/health` | inline in `index.ts` | `GET /health` → `{ data: { ok: true }, message: "OK" }` |
| `/api/products` | `routes/product.routes.ts` | `GET /` → `controller.list` (public); `GET /:id` → `controller.getOne` (public); `POST /` → `requireAuth, requireAdmin, controller.list` (**mis-wired**, see Findings) |

App middleware order in `src/index.ts`: `cors({ origin: process.env.CORS_ORIGIN })` →
`express.json()` → `morgan("dev")` → routes → `errorHandler`. Mongoose connects, then
`app.listen`. There is **no** 404/not-found terminal middleware.

## Config & environment

There is **no config module** — `process.env` is read directly at each use site.

| Var | Read in | Purpose |
| --- | --- | --- |
| `PORT` | `index.ts` | listen port (fallback `4000`) |
| `MONGO_URL` | `index.ts` | Mongoose connection string |
| `JWT_SECRET` | `middleware/auth.ts` | token verification secret |
| `CORS_ORIGIN` | `index.ts` | allowed browser origin |

Declared in `api/.env.example`. Add new vars there and read them at the use site (matching
the existing pattern).

## Types & constants

**None exist.** There is no `src/types/` (no `express.d.ts` augmenting `req.user` — code uses
`(req as any).user`) and no `src/constants/`. The `role` enum lives only inline in the `User`
schema (`["user", "admin"]`). The first shared type/constant should create these folders and
be registered here.

## Not present (do not assume it exists)

Explicitly absent, so the planner/builder don't reference phantom pieces: response helpers
(`ok`/`created`), `AppError` subclasses, DB-error normalizer, logger module, typed env,
token **signing** helper, password hashing, `requireRole(role)` factory, `notFound` 404
middleware, Joi schema files, `src/app.ts`/`src/server.ts` split, tests, ESLint config,
path aliases.

## Decisions log

- Seeded by `backend-onboard` (read-only scan) — no source file was created, edited, or moved.
- Structure: **layered**, not domain-module. New modules add files to the existing role folders.
- `catchAsync` is **mandatory** on every async handler (Express 4).
- Response envelope `{ data, message }` is built inline in controllers — there is no helper to reuse.
- Errors: `ApiError` + `notFound`/`conflict` only.
- Validation: **Joi** via `validateBody` (exists but unused).
- Auth: **jsonwebtoken** Bearer, verified in `middleware/auth.ts`; no signing side yet.
- **Assumed default:** `utils/formatDate.ts` is the canonical date helper; the duplicate in
  `report.service.ts` was left untouched for the user to retire.
- Project location: `api/`. Package manager: npm.
