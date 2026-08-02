# Module plan: auth

> Status: draft — edit freely, then build slice by slice with module-builder.
> Domains: fullstack (backend `backend/`, frontend `frontend/`)   ·   Slices: 5
> Mode: **design** — no auth endpoints exist yet, so this plan *declares* the contract.

## Overview

Self-serve email + password accounts for the shop: register, sign in, stay signed in across
visits, sign out, recover a forgotten password, and expose the signed-in user's role so the UI
can hide admin-only controls. Product brief: see `./auth-module.md`.

This is the first module — cart, orders and admin all depend on it — so slice 01 is where the
`User` model, the password hashing choice, the token transport and the BFF session plumbing all
get established. Every later slice (and later module) copies those patterns.

## Build order

| # | Slice | Domain | Depends on | Status |
|---|-------|--------|-----------|--------|
| 01 | [Register](./01-register.md) | fullstack | — | ready |
| 02 | [Login](./02-login.md) | fullstack | 01 | ready |
| 03 | [Logout](./03-logout.md) | fullstack | 02 | ready |
| 04 | [Session persistence + role gating](./04-session-and-role-gating.md) | fullstack | 02 | ready |
| 05 | [Forgot password](./05-forgot-password.md) | fullstack | 01 | blocked — no mail transport exists |

Build these in order — the number is the build order. `module-builder` updates the Status column
as each slice lands, so this table is the at-a-glance answer to "where am I".

Deliberate progression to be aware of: slices 01–03 keep the signed-in user in the TanStack Query
cache for the current tab. Session **survival across a reload/reopen** (brief acceptance criterion)
arrives in slice 04 via `GET /api/auth/me`. The httpOnly cookie is set from slice 01 onward, so 04
is a hydration change, not a re-architecture.

## Decisions (module-wide)

Choices every slice inherits.

- **Registration**: open self-serve, no invite flow — from the brief (§Notes).
- **Role model**: a single `role` string on the user, `"user" | "admin"`, default `"user"` — from
  the brief (§Scope). No permission lists, no org/team scoping.
- **Register collects email + password only** — the brief's scope is "email + password"; there is
  no `name` field, and the account menu shows the email. (Add `name` later if you want it; it is a
  schema + form change in slice 01, cheap now, annoying after 05.)
- **Password rules**: minimum 8 characters (brief §Functional requirements), stored only as a hash,
  never returned in any response or included in any DTO.
- **Generic credential failure**: wrong email and wrong password produce the identical 401 message
  (brief §Functional requirements). Same principle for forgot-password: unknown email still gets a
  success response.
- **Email is the identity**: trimmed + lowercased before save and before every lookup; unique index.
- _Assumption_ — **Token transport: JWT issued by the backend, held by the browser in an httpOnly
  cookie set by the BFF.** The backend's `protect` takes a **Bearer** token
  (`backend/ARCHITECTURE.md` §Auth primitives) and the frontend's browser code may only call
  same-origin `/api/*` (`frontend/ARCHITECTURE.md` §Backend connection), so the two are bridged in
  the BFF layer: the auth BFF routes take `data.token` off the backend response, set it as an
  httpOnly cookie, and strip it from the JSON the browser sees; the catch-all proxy reads that
  cookie and attaches `Authorization: Bearer <token>` to every forwarded request. Nothing
  auth-related is ever readable by client JS. _If you'd rather ship the simpler thing, the
  alternative is returning the token to the browser and storing it in `localStorage` with an axios
  request interceptor — change this line and slice 01's BFF section; the API contract itself does
  not change._
- _Assumption_ — **Access-token-only, ~7 day expiry, no refresh rotation in MVP.** "Stay signed in
  across visits" (brief) is satisfied by a 7-day cookie + token. Refresh-token rotation is out of
  scope; it would be a slice 06 and it does not change any contract below.
- _Assumption_ — **Password hashing: bcrypt, cost 12**, behind `backend/src/lib/password.ts` so the
  choice is swappable in one file. (`argon2` is fine too — one-line change, same surface.)
- _Assumption_ — **UI gating style: hide + route-guard.** Admin-only controls are not rendered at
  all for non-admins (not disabled), and protected pages redirect to `/login` rather than showing an
  empty shell. The server still guards every endpoint — the UI gate is cosmetic.
- **Auth module owns the `User` model** and is the only module that writes it. Other modules read
  the user through `req.user` (set by `protect`) or by importing the auth service surface — never by
  importing the model directly.
- **File naming**: the model lives at `backend/src/modules/auth/auth.model.ts` (exporting `User` /
  `UserDoc`) to match the existing `<module>.<role>.ts` convention seen in `src/modules/products/`,
  rather than a separate `users` module.

## Data model

Owned by this module, created by slice 01 (the first slice that needs it).

`backend/src/modules/auth/auth.model.ts` — collection `users`

- `email`: `string` — required, unique, lowercased + trimmed on save
- `passwordHash`: `string` — required, `select: false` so it never leaves the DB layer by accident
- `role`: `"user" | "admin"` — required, enum, default `"user"`
- `resetTokenHash`: `string` — optional; SHA-256 of the emailed reset token (never the raw token)
- `resetTokenExpiresAt`: `Date` — optional; single-use window for the reset link
- `createdAt` / `updatedAt`: `Date` — via `{ timestamps: true }`, same as `products.model.ts`

Indexes:
- unique on `email` (this is what makes the duplicate-signup race return 409 instead of two rows)
- non-unique on `resetTokenHash` (sparse) — added by slice 05, only if you build it

Relations: none yet. Later modules (cart, orders) will reference `users._id`.

The public shape returned to clients is a DTO, mirroring the `toDTO` pattern in
`products.service.ts`:

```
UserDTO = { id: string; email: string; role: "user" | "admin" }
```

`passwordHash`, `resetTokenHash` and `resetTokenExpiresAt` are never in a DTO.

## API contract conventions

The envelope and auth primitives every slice follows, so each slice's contract section only states
its own endpoints. Source: `backend/ARCHITECTURE.md` + `backend/src/lib/app-response.ts`.

- Success envelope (`ok` → 200, `created` → 201):
  ```json
  { "success": true, "data": {}, "message": "OK" }
  ```
- No-content: `noContent` → **204 with no body at all** (so the frontend must not try to parse it).
- Error envelope — note it is **flat**, `message` and `code` are top-level, there is no nested
  `error` object:
  ```json
  { "success": false, "message": "Email already registered", "code": "CONFLICT" }
  ```
  Status mapping is fixed by the error middleware: `NotFoundError`→404, `ConflictError`→409,
  `UnauthorizedError`→401, `ValidationError`→422. The exact `code` strings are whatever
  `backend/src/lib/app-error.ts` sets — read that file when building and use its values verbatim in
  the frontend error mapping; do not invent new codes.
- Auth guard: `protect` (Bearer access token, attaches `req.user`), `requireRole('admin')` after it.
- Mount base: `app.use("/api/auth", authRouter)` in `backend/src/app.ts`, alongside the existing
  `/api/products` line.
- Browser-side base: axios `baseURL: "/api"` (`frontend/src/lib/axios.ts`), so `POST /auth/login`
  from a request fn is `/api/auth/login` same-origin, forwarded by the BFF.

Source: **declared here** (design mode — no auth endpoints exist in `backend/src/` yet).

## Reuse (do NOT recreate these)

Concrete paths this module imports rather than rebuilds.

| What | Path | How it's used here |
|------|------|--------------------|
| ok / created / noContent | backend/src/lib/app-response.ts | every auth controller response |
| AppError family | backend/src/lib/app-error.ts | `ConflictError` (409 dup email), `UnauthorizedError` (401 bad creds), `NotFoundError`, `ValidationError` |
| protect, requireRole | backend/src/middleware/auth.ts | guard `/auth/me`, `/auth/logout`; `requireRole` for admin-gated routes in other modules |
| validate | backend/src/middleware/validate.ts | every auth route validates its body with a Zod schema |
| Router + mount pattern | backend/src/app.ts, backend/src/modules/products/products.routes.ts | copy the routes-file shape verbatim (validate → guard → controller) |
| service DTO pattern | backend/src/modules/products/products.service.ts | `toDTO` mapping, `.lean()` reads, module-owned interface export |
| axios instance | frontend/src/lib/axios.ts | all client requests (`baseURL: "/api"`) |
| BFF catch-all proxy | frontend/src/app/api/[...path]/route.ts | forwards everything; extended once in slice 01 to attach the Bearer header |
| queryClient | frontend/src/lib/query-client.ts | session cache lives here |
| InputField | frontend/src/components/shared/form/input-field.tsx | email + password inputs — **do not create a PasswordField**; pass `type="password"` (if the component does not accept `type`, extend `InputField`, don't fork it) |
| useAuth | frontend/src/hooks/use-auth.ts | the current-user accessor — **extend this stub, do not add a second auth hook**; it currently returns `{ user: null }` |

Verify-before-you-create note for the builder: `protect` must already verify a JWT somewhere
(`backend/src/lib/jwt.ts` or similar — the fixture only shows the import from
`src/middleware/auth.js`). **Find that helper and sign tokens with it**, using the same secret and
algorithm. A second, parallel signing helper is the exact duplication this module must not create.

## New shared pieces (→ register after build)

- `backend/src/lib/password.ts` — `hashPassword(plain)` / `verifyPassword(plain, hash)`. Slice 01.
- `backend/src/modules/auth` public service surface — `registerUser`, `authenticateUser`,
  `getUserById` (+ `requestPasswordReset`, `resetPassword` from slice 05). Other modules call these,
  never the model.
- `frontend/src/lib/session.ts` — `setSessionCookie(res, token)`, `readSessionCookie(req)`,
  `clearSessionCookie(res)`, used by the auth BFF routes and the catch-all proxy. Slice 01.
- `frontend/src/components/shared/auth/role-gate.tsx` — `<RoleGate role="admin">`. Shared, not
  feature-local: features may not cross-import features (`frontend/ARCHITECTURE.md`), and cart /
  orders / admin will all need it. Slice 04.
- `frontend/src/hooks/use-auth.ts` is an **update**, not a new entry — the registry row already
  exists; the builder replaces the stub implementation and refreshes the Purpose column.

## New env vars

Backend:
- Token secret + TTL: **reuse whatever `protect` already reads** (likely `JWT_SECRET` /
  `ACCESS_TOKEN_TTL`). Only add a var if the existing middleware genuinely has none, and then add it
  to the env schema *and* `.env.example` in slice 01.

Frontend:
- `AUTH_COOKIE_NAME` — name of the session cookie, default `"session"`. Slice 01. (Optional: a
  literal constant in `lib/session.ts` is acceptable if you prefer fewer vars.)
- `BACKEND_URL` already exists (used by the catch-all proxy).

Slice 05 adds mail-provider vars; they are listed there because that slice is blocked on choosing
the provider.

## Out of scope (module-wide)

From the brief, plus the deferrals made here. Listed so they don't creep back in slice by slice:

- Social / OAuth login, two-factor auth, magic links.
- Organisations, teams, per-permission RBAC (single `role` string only).
- Email **verification** of new signups — the brief asks for reset-by-email, not verify-on-signup.
- Refresh-token rotation and silent re-auth (see the assumption above; a later slice 06 if wanted).
- Server-side session storage / token denylist. Logout clears the cookie; a stolen token stays
  valid until it expires. Revocation would be a follow-up, and the logout contract already has the
  right shape to add it without a breaking change.
- Rate limiting / brute-force lockout on login and reset. Genuinely worth having, but it is a
  cross-cutting middleware concern, not an auth slice — flagged as an open question below.
- Account settings, change-password-while-signed-in, delete account.

## Open questions

The user was not available while this plan was written. These are the four questions that would
have been asked; each currently carries the flagged assumption from the Decisions section above, so
the plan is buildable as-is — edit the decision line if you disagree.

1. **Token transport** — httpOnly cookie set by the BFF (assumed), or token returned to the browser
   and kept in `localStorage`? This is the only decision that changes the BFF layer.
2. **Refresh strategy** — access-token-only with a 7-day expiry (assumed), or refresh-token rotation
   with short-lived access tokens? Adds a slice if you want rotation.
3. **Password reset delivery** — which mail provider? There is no mailer anywhere in the backend
   registry or `src/lib`, which is why slice 05 is blocked. Resend / SendGrid / SMTP / Nodemailer via
   an existing SMTP host?
4. **Guarded-UI style** — hide admin controls entirely (assumed), disable them with a tooltip, or
   route-guard whole pages? Assumed answer is hide + route-guard both.

Also undecided, lower stakes: whether login/reset endpoints get rate limiting in this module or in a
later cross-cutting hardening pass (assumed: later).
