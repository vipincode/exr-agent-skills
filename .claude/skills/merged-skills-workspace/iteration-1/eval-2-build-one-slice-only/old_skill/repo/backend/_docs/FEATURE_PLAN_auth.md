# Feature plan: auth

> Status: draft — edit freely, then hand to backend-module-builder. Add/remove any section.

## Overview
Email + password accounts for shoppers, with a single role per user so admin-only UI can be gated.
Covers register, login, and logout.

## Decisions
- Token transport: bearer token returned in the response body.
- Role model: a single `role` string per user, `"user" | "admin"`.
- Registration: open self-serve, no invites.
- Password hashing: bcrypt, cost 10.
- _Assumption_: refresh-token rotation is out of scope — access tokens are long-lived.

## Reuse (do NOT recreate these)
| What | Path | How it's used here |
|------|------|--------------------|
| ok / created helpers | src/lib/app-response.ts | every success response |
| validate middleware | src/middleware/validate.ts | validate request bodies |
| AppError family | src/lib/app-error.ts | throw Conflict/Unauthorized |

## Create
| File | Purpose |
|------|---------|
| src/modules/auth/auth.model.ts | User Mongoose model |
| src/modules/auth/auth.schema.ts | Zod input schemas |
| src/modules/auth/auth.service.ts | business logic |
| src/modules/auth/auth.controller.ts | HTTP handlers |
| src/modules/auth/auth.routes.ts | router (mounted in app.ts) |

## Data model
New Mongoose model `User`:
- `email`: `string` — required, lowercased, trimmed
- `passwordHash`: `string` — required, `select: false`
- `name`: `string` — required
- `role`: `"user" | "admin"` — required, default `"user"`
- Indexes: unique on `email`

## Endpoints
| Method | Path | Auth | Validation | Description |
|--------|------|------|-----------|-------------|
| POST | /auth/register | public | registerSchema | create an account, return user + token |
| POST | /auth/login | public | loginSchema | sign in, return user + token |
| POST | /auth/logout | protect | — | clear the session (204) |

Success envelope: `{ success: true, data: { user: { id, email, name, role }, token }, message }`.
Error envelope: `{ success: false, error: { code, message } }`.

## Validation rules
`registerSchema`: email valid + lowercased; password min 8; name non-empty, max 80.
`loginSchema`: email valid; password non-empty.

## Errors & edge cases
- Existing email on register → ConflictError (409); rely on the unique index for concurrent submits.
- Wrong password OR unknown email on login → the same UnauthorizedError (401) and message, so the
  endpoint doesn't confirm which accounts exist. Compare a hash even when the user is missing.
- `passwordHash` must never appear in a response.
- Logout without a valid token → 401 from `protect`.

## New shared pieces (→ register after build)
`protect` middleware and JWT helpers, if not already shipped.

## New env vars
`JWT_SECRET` — access-token signing secret. No default; required. Add to env schema + .env.example.

## Out of scope
Social login, two-factor, teams, per-permission RBAC, password reset.

## Open questions
None outstanding.
