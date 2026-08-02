# Feature plan: auth (backend)

> Status: draft — edit freely, then hand to backend-module-builder. Add/remove any section.
> Source brief: `_docs/features/auth/auth-module.md` (repo root) · Domain: fullstack
> Companion: `frontend/_docs/FEATURE_PLAN_auth.md` — the frontend binding plan. This file is the
> **contract owner**; the frontend plan mirrors the envelope defined here.

## Overview
Self-serve email + password accounts for demo-api: register, login, logout, session refresh,
password reset by emailed link, and a single `role` (`user` | `admin`) that the UI can read to hide
admin-only controls. This is the first module; cart, orders and admin all depend on it.

## Build order — one slice at a time
The user asked not to receive one monolithic build. Build in this order; each slice is independently
shippable and testable, and each depends only on the slices above it.

| # | Slice | Backend scope | Depends on |
|---|-------|---------------|------------|
| 01 | **register** | `User` model, password hashing, `POST /api/auth/register`, token issuance, `GET /api/auth/me` (needed to prove the session works) | — |
| 02 | **login** | `POST /api/auth/login`, generic-failure handling, login rate limiting | 01 (User model, token issuance) |
| 03 | **logout** | `POST /api/auth/logout`, refresh-token revocation, cookie clearing | 01, 02 |
| 04 | **session refresh** | `POST /api/auth/refresh` with rotation; wire `protect` to reject expired access tokens cleanly | 01–03 |
| 05 | **forgot / reset password** | `PasswordResetToken` model, mailer, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password` | 01 |
| 06 | **role gating** | seed/promote an `admin`, confirm `requireRole('admin')` works against the real `req.user` | 01 |

> ⚠️ **Skill gap, flagged honestly:** `backend-feature-planner` produces ONE plan file per feature —
> it has no step that emits separate per-slice files. The table above is the closest this skill can
> get to the requested "one at a time" workflow. If you want a file per slice
> (`_docs/features/auth/01-register.md`, `02-login.md`, …) that is a `module-planner` capability,
> not something this skill does.

## Decisions
- **Role model**: single `role: 'user' | 'admin'` string on the User document — settled by the brief
  ("a single role per user"), not RBAC permissions.
- **Registration**: open self-serve, no invite flow — settled by the brief's Notes.
- **Password reset**: in scope now (emailed link, single-use, expiring) — settled by the brief.
- **Response envelope / error model**: fixed by `ARCHITECTURE.md` — `ok`/`created`/`noContent` from
  `src/lib/app-response.ts`; errors thrown as `AppError` subclasses. Not re-decided here.
- **Validation**: `validate({ body })` middleware + Zod schemas, per `ARCHITECTURE.md`.
- **Auth guards**: reuse the shipped `protect` / `requireRole` — per `ARCHITECTURE.md` they already
  exist and `products.routes.ts` already imports them. Not redesigned.
- _Assumption_ — **Token transport**: `protect` is documented as Bearer, so the **access token is
  returned in the JSON body** (short-lived, 15 min) and the client sends `Authorization: Bearer`.
  The **refresh token is an httpOnly, Secure, SameSite=Lax cookie** set by the backend. This is the
  only combination that satisfies both the fixed Bearer guard AND the brief's "returning shopper
  closing and reopening the browser is still signed in" (a body-only access token dies with the tab).
  Correct me if you want cookie-only access tokens instead.
- _Assumption_ — **Refresh strategy**: rotation. Every `/refresh` issues a new refresh token and
  revokes the old one; a revoked token presented again is rejected (basic reuse detection). 30-day
  refresh lifetime.
- _Assumption_ — **Logout is server-side**: logout revokes the refresh token row, not just the
  cookie, because the brief calls out "sign out … from a shared computer". Access tokens remain
  valid until they expire (≤15 min) — acceptable, or say so if you need immediate global kill.
- _Assumption_ — **Password hashing**: `argon2id` (fall back to `bcrypt` if you'd rather not add a
  native dep). Nothing in the repo settles this.
- _Assumption_ — **Email delivery**: no mailer exists in `MODULE_REGISTRY.md`, so the plan creates a
  thin `src/lib/mailer.ts` seam with an SMTP transport (nodemailer) and a dev/console transport.
  Provider (Resend / SES / Postmark / plain SMTP) is yours to pick — the seam keeps it swappable.
- _Assumption_ — **Register logs you in**: register returns the same payload as login, because the
  brief's acceptance criteria says a new shopper "lands signed in, without a separate sign-in step".

## Reuse (do NOT recreate these)
| What | Path | How it's used here |
|------|------|--------------------|
| `ok` / `created` / `noContent` | `src/lib/app-response.ts` | every success response; do not hand-roll `res.json` |
| `AppError` family (`NotFoundError`, `ConflictError`, `UnauthorizedError`, `ValidationError`) | `src/lib/app-error.ts` | 409 duplicate email, 401 bad credentials, 422 weak password |
| `protect` | `src/middleware/auth.ts` | guards `GET /me` and `POST /logout`; already imported by `products.routes.ts` |
| `requireRole('admin')` | `src/middleware/auth.ts` | already used by `POST /api/products`; auth only has to make `req.user.role` real |
| `validate({ body })` | `src/middleware/validate.ts` | all auth request bodies |
| Module anatomy (model/schema/service/controller/routes) | `src/modules/products/*` | copy the file layout and the `toDTO` mapping style exactly |
| Router mount point | `src/app.ts` | add `app.use("/api/auth", authRouter)` next to the products mount |

> ⚠️ **Verify before building.** `ARCHITECTURE.md` documents `protect` / `requireRole` / `validate`
> and `products.controller.ts` imports `../../lib/app-error.js`, but **none of
> `src/middleware/auth.ts`, `src/middleware/validate.ts`, `src/lib/app-error.ts` are present on
> disk** in this checkout, and there is no `src/lib/jwt.ts`. Either they were omitted from this
> checkout, or the products module doesn't compile. Confirm they exist before slice 01 — if they
> genuinely don't, `protect`'s token verification and a `jwt`/JOSE helper become part of slice 01
> and belong in `MODULE_REGISTRY.md` as new shared pieces. They are listed as Reuse on the strength
> of `ARCHITECTURE.md`; this plan does **not** silently assume they're absent and duplicate them.

## Create
| File | Purpose |
|------|---------|
| `src/modules/auth/auth.model.ts` | `User` Mongoose model (+ `UserDoc`) |
| `src/modules/auth/refresh-token.model.ts` | `RefreshToken` model — hashed token, rotation chain, revocation |
| `src/modules/auth/password-reset.model.ts` | `PasswordResetToken` model — hashed token, expiry, single-use |
| `src/modules/auth/auth.schema.ts` | Zod bodies: register, login, forgot-password, reset-password |
| `src/modules/auth/auth.service.ts` | business logic + `UserDTO` mapping (never leaks `passwordHash`) |
| `src/modules/auth/auth.controller.ts` | HTTP handlers; sets/clears the refresh cookie |
| `src/modules/auth/auth.routes.ts` | `authRouter`, mounted at `/api/auth` in `src/app.ts` |
| `src/lib/password.ts` | `hashPassword` / `verifyPassword` (argon2id) — shared, register it |
| `src/lib/mailer.ts` | `sendMail({ to, subject, html })` seam + dev console transport — shared, register it |
| `src/lib/tokens.ts` | opaque random token generation + SHA-256 hashing for refresh/reset tokens |
| _(edit)_ `src/app.ts` | mount `authRouter`; add `cookie-parser` for the refresh cookie |

## Data model

### `User` (new collection)
- `email`: `string` — required, lowercased + trimmed, **unique index**
- `passwordHash`: `string` — required, `select: false` so it never leaves the DB layer by accident
- `name`: `string` — optional (the brief doesn't require it at signup)
- `role`: `'user' | 'admin'` — enum, default `'user'`
- `createdAt` / `updatedAt` — via `{ timestamps: true }`
- Indexes: **unique on `email`** (this, not an app-level check, is what makes concurrent duplicate
  submits safe — catch the Mongo E11000 and rethrow as `ConflictError`)

### `RefreshToken` (new collection)
- `userId`: `ObjectId` — ref `User`, indexed
- `tokenHash`: `string` — SHA-256 of the opaque token; **never store the raw token**
- `expiresAt`: `Date` — TTL index (auto-purge)
- `revokedAt`: `Date | null`, `replacedByHash`: `string | null` — rotation chain / reuse detection
- Indexes: unique on `tokenHash`; TTL on `expiresAt`; compound `(userId, revokedAt)`

### `PasswordResetToken` (new collection)
- `userId`: `ObjectId` — ref `User`, indexed
- `tokenHash`: `string` — SHA-256 of the emailed token
- `expiresAt`: `Date` — TTL index; **1 hour** window (_assumption_)
- `usedAt`: `Date | null` — set on first successful use; a token with `usedAt` set is rejected
- Indexes: unique on `tokenHash`; TTL on `expiresAt`

### `UserDTO` (service boundary — mirrors the `products` `toDTO` pattern)
`{ id, email, name?, role, createdAt }` — **no `passwordHash`, ever.**

## Endpoints
All mounted under `/api/auth`. Envelope is the fixed `{ success, data, message }`.

| Method | Path | Auth | Validation | Description |
|--------|------|------|-----------|-------------|
| POST | `/api/auth/register` | public | `registerBody` | create account; returns `{ user, accessToken }` via `created()`; sets refresh cookie |
| POST | `/api/auth/login` | public | `loginBody` | authenticate; returns `{ user, accessToken }` via `ok()`; sets refresh cookie |
| POST | `/api/auth/logout` | `protect` | — | revoke this refresh token + clear cookie; `noContent()` (204) |
| POST | `/api/auth/refresh` | refresh cookie | — | rotate refresh, return `{ accessToken }`; `ok()` |
| GET | `/api/auth/me` | `protect` | — | current `UserDTO`; `ok()` — this is what the frontend's `useAuth` reads |
| POST | `/api/auth/forgot-password` | public | `forgotPasswordBody` | always 200 + generic message, regardless of whether the email exists |
| POST | `/api/auth/reset-password` | public | `resetPasswordBody` | consume token, set new password, revoke all refresh tokens; `ok()` |

**Exact success payloads** (the frontend plan mirrors these verbatim):
- register → `201 { success: true, data: { user: UserDTO, accessToken: string }, message: "Account created" }`
- login → `200 { success: true, data: { user: UserDTO, accessToken: string }, message: "Signed in" }`
- refresh → `200 { success: true, data: { accessToken: string }, message: "Token refreshed" }`
- me → `200 { success: true, data: UserDTO, message: "OK" }`
- logout → `204` (no body)
- forgot/reset → `200 { success: true, data: null, message: "<generic>" }`

## Validation rules
- `registerBody`: `email` — `z.email()`, trimmed, lowercased; `password` — `z.string().min(8)`
  (the brief's floor); `name` — `z.string().min(1).optional()`.
- `loginBody`: `email` — `z.email()`; `password` — `z.string().min(1)` (**do not** apply the min(8)
  rule on login — it leaks the password policy and rejects legacy passwords with the wrong error).
- `forgotPasswordBody`: `email` — `z.email()`.
- `resetPasswordBody`: `token` — `z.string().min(32)`; `password` — `z.string().min(8)`.
- Create-only vs update: all of these are create-shaped; there is no profile-update endpoint in scope.
- _Assumption_: no complexity rules beyond length (no forced symbol/number). The brief only says
  "at least 8 characters".

## Errors & edge cases
- **Duplicate email, including concurrent submits** → rely on the unique index; catch Mongo `E11000`
  in the service and rethrow `ConflictError("An account with this email already exists")` → 409.
  An app-level `findOne` pre-check alone loses the race.
- **Wrong email OR wrong password** → the *same* `UnauthorizedError("Invalid email or password")`
  → 401. Also run the password verify against a dummy hash when the user is missing, so response
  timing doesn't leak account existence.
- **Forgot-password for an unknown email** → still `200` with the identical generic message; send
  no email. (Brief acceptance criterion.)
- **Reset token reused** → `usedAt` is set → `UnauthorizedError("This reset link has already been used")`.
- **Reset token expired** → TTL-purged or `expiresAt < now` → `UnauthorizedError("This reset link has expired")`.
  Use the *same* message for both invalid and expired if you'd rather not confirm a token ever existed.
- **Successful reset** → revoke **all** of that user's refresh tokens (password change kills sessions).
- **Refresh token missing / unknown / revoked** → `UnauthorizedError` → 401; if a *revoked* token is
  presented, revoke the entire chain for that user (reuse = likely theft).
- **Session expires mid-session** → access token expiry surfaces as 401 from `protect`; the client
  retries once via `/refresh` (see the frontend plan) and only then redirects to sign-in.
- **Login brute force** → _assumption_: fixed-window rate limit, 10 attempts / 15 min per IP+email,
  on `/login` and `/forgot-password`. No limiter exists in the registry; add one or drop this.
- **Weak/short password** → `validate` returns 422 via `ValidationError`, per `ARCHITECTURE.md`.

## New shared pieces (→ register after build)
| Piece | Path | Why shared |
|---|---|---|
| `hashPassword` / `verifyPassword` | `src/lib/password.ts` | any future credential flow needs it |
| `sendMail` | `src/lib/mailer.ts` | order confirmations etc. will reuse the same seam |
| `generateToken` / `hashToken` | `src/lib/tokens.ts` | reused by refresh + reset, and future email verification |
| `auth` module public surface | `src/modules/auth` | `registerUser, loginUser, logoutUser, refreshSession, getCurrentUser, requestPasswordReset, resetPassword` |

`backend-module-builder` adds these to `MODULE_REGISTRY.md`. Note the registry currently lists
**only** the products module and no shared-utils section — it likely needs that section created.

## New env vars
Must be added to the env schema **and** `.env.example`:
- `JWT_ACCESS_SECRET` — signing key for access tokens (no default; required)
- `JWT_ACCESS_TTL` — default `15m`
- `REFRESH_TOKEN_TTL_DAYS` — default `30`
- `PASSWORD_RESET_TTL_MINUTES` — default `60`
- `APP_URL` — base URL used to build the reset link in the email (e.g. `http://localhost:3000`)
- `SMTP_URL` / `MAIL_FROM` — mailer transport + sender (dev falls back to console transport)
- `COOKIE_DOMAIN`, `COOKIE_SECURE` — refresh-cookie attributes per environment

## Out of scope
Social/OAuth login, two-factor, organisations/teams, per-permission RBAC (all explicitly out per the
brief), email address verification on signup, "remember me" toggle, account deletion, profile editing,
admin user-management endpoints, and session listing / "sign out everywhere" UI.

## Open questions
Questions I would have asked before writing this (answered with the defaults above so you aren't blocked):
1. **Token transport** — access token in the JSON body + refresh in an httpOnly cookie (assumed), or
   cookie-only for both? This is the one decision that changes both halves of the stack.
2. **Email provider for the reset link** — Resend / SES / Postmark / plain SMTP? Nothing in the repo
   hints at one, so slice 05 is blocked on this in practice.
3. **Password hashing** — argon2id (assumed) or bcrypt?
4. **Does an admin ever get created through this module**, or is the first admin promoted manually in
   the DB / by a seed script? Assumed manual; there is no admin-creation endpoint here.
5. **Is `name` collected at registration?** Assumed optional. The brief's user story mentions only
   email + password.
6. **Do the middleware/lib files referenced above actually exist?** See the warning in Reuse — this
   materially changes slice 01's size.
