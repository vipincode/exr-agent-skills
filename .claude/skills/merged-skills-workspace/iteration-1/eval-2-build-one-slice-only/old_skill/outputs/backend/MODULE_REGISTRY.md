# Module Registry — demo-api (backend)
## Modules
| Module | Path | Public surface | Notes |
|---|---|---|---|
| products | src/modules/products | listProducts, getProduct, createProduct | mounted at /api/products |
| auth | src/modules/auth | registerUser, loginUser (+ `AuthUserDTO`, `AuthResult`) | mounted at /api/auth; owns the `User` model |

## Shared library (src/lib/)
| Name | Path | Purpose |
|---|---|---|
| ok / created / noContent | src/lib/app-response.ts | the fixed success envelope |
| AppError family | src/lib/app-error.ts | thrown errors, serialized by the error middleware |
| signAccessToken | src/lib/jwt.ts | signs the JOSE HS256 access token (`JWT_SECRET`, 30d TTL) — **new** |

## Middleware (src/middleware/)
| Name | Path | Purpose |
|---|---|---|
| protect / requireRole | src/middleware/auth.ts | bearer-token guard + role guard |
| validate | src/middleware/validate.ts | Zod validation of body/query/params |

## Env vars
| Name | Required | Used by |
|---|---|---|
| JWT_SECRET | yes (no default) | src/lib/jwt.ts, src/middleware/auth.ts |

## Decisions log
- **auth**: tokens are stateless bearer tokens returned in the response body (not cookies); no
  refresh rotation — access tokens are long-lived (30d).
- **auth**: a single `role` string per user (`"user" | "admin"`), default `"user"`.
- **auth**: passwords hashed with bcrypt cost 10; `passwordHash` is `select: false` and never
  appears in a DTO.
- **auth**: login answers unknown-email and wrong-password identically (401, same message) and
  always compares a hash, so the endpoint doesn't confirm which accounts exist.
- **auth**: register 409s on a pre-check *and* on the unique-index duplicate-key error, so
  concurrent submits still conflict correctly.
- **auth**: logout is a 204 client-side discard — there is no server-side session/blacklist.
