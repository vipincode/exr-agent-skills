# Module Registry — demo-api (backend)
## Modules
| Module | Path | Public surface | Notes |
|---|---|---|---|
| products | src/modules/products | listProducts, getProduct, createProduct | mounted at /api/products |
| auth | src/modules/auth | registerUser, User model, registerBody schema, PublicUser / AuthResult types, USER_ROLES / BCRYPT_COST constants | mounted at /api/auth; slice 01 (register) built — login/logout still to come |

## Shared library (src/lib/)
| Name | Path | Purpose |
|---|---|---|
| ok / created / noContent | src/lib/app-response.ts | the fixed success envelope |
| signAccessToken | src/lib/jwt.ts | signs HS256 bearer access tokens via JOSE (`JWT_SECRET`, 7d TTL); verification stays in the `protect` middleware |

## Env vars
| Name | Used by | Notes |
|---|---|---|
| JWT_SECRET | src/lib/jwt.ts | access-token signing secret; required, no default (see .env.example) |

## Decisions
- Passwords are stored as bcrypt hashes (cost 10) in `User.passwordHash`, which is `select: false`; services map to `PublicUser` explicitly so the hash can never leak into a response.
- Duplicate signups are caught by the unique index on `email` (Mongo error 11000 → `ConflictError`), not by a read-then-write check, so concurrent submits can't both win.
- Single `role` string per user, `"user" | "admin"`, defaulting to `"user"` (`USER_ROLES` in src/modules/auth/auth.constants.ts).
- Access tokens are long-lived (7d) bearer tokens returned in the response body; refresh-token rotation is out of scope.
- Token signing lives in `src/lib/jwt.ts` so slice 02 (login) reuses it instead of re-implementing signing.
