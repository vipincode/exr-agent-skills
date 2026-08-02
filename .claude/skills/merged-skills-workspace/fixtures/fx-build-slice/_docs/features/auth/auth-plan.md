# Module plan: auth

> Status: draft — edit freely, then build slice by slice with module-builder.
> Domains: fullstack (backend + frontend)   ·   Slices: 3

## Overview
Email + password accounts for shoppers, with a single role per user so admin-only UI can be gated.

## Build order

| # | Slice | Domain | Depends on | Status |
|---|-------|--------|-----------|--------|
| 01 | [Register](./01-register.md) | fullstack | — | ready |
| 02 | [Login](./02-login.md) | fullstack | 01 | ready |
| 03 | [Logout](./03-logout.md) | fullstack | 02 | ready |

Build these in order — the number is the order. `module-builder` updates the Status column as each
slice lands.

## Decisions (module-wide)
- Token transport: bearer token returned in the response body, stored by the frontend and sent by the BFF.
- Role model: a single `role` string per user, `"user" | "admin"`.
- Registration: open self-serve, no invites.
- Password hashing: bcrypt, cost 10.
- _Assumption_: refresh-token rotation is out of scope for now — access tokens are long-lived.

## Data model
New Mongoose model `User` (`src/modules/auth/auth.model.ts`):

- `email`: `string` — required, lowercased, trimmed
- `passwordHash`: `string` — required, never selected by default (`select: false`)
- `name`: `string` — required
- `role`: `"user" | "admin"` — required, default `"user"`
- `createdAt` / `updatedAt`: timestamps
- Indexes: unique on `email`

Created by slice 01, which is the first slice that needs it.

## API contract conventions
- Success envelope: `{ "success": true, "data": <payload>, "message": "<string>" }`
- Error envelope: `{ "success": false, "error": { "code": "<CODE>", "message": "<string>" } }`
- Auth: `protect` for guarded routes; `requireRole('admin')` for admin-only.
- Source: **declared here** (design mode — these endpoints don't exist yet).

## Reuse (do NOT recreate these)

| What | Path | How it's used here |
|------|------|--------------------|
| ok / created helpers | backend/src/lib/app-response.ts | every success response |
| axios instance | frontend/src/lib/axios.ts | all client requests |
| BFF catch-all proxy | frontend/src/app/api/[...path]/route.ts | already covers `/api/auth/*` |
| shared form fields | frontend/src/components/shared/form/index.ts | both auth forms |
| useAuth | frontend/src/hooks/use-auth.ts | session state + role gating |

## New shared pieces (→ register after build)
`protect` middleware and the JWT helpers, if the backend doesn't already ship them.

## New env vars
`JWT_SECRET` — signing secret for access tokens, backend. No default; required.

## Out of scope (module-wide)
Social login, two-factor, teams/organisations, per-permission RBAC, password reset (a later slice).

## Open questions
None outstanding.
