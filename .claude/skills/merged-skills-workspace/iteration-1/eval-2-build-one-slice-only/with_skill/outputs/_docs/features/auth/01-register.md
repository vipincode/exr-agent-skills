# 01 — Register

> Status: built
> Domain: fullstack
> Depends on: —
> Part of: [auth](./auth-plan.md)

## Goal
Let a visitor create an account with email, password, and name, and land signed in.

## Done when
A visitor can submit the register form and land authenticated, with the user persisted.

---

## API contract (this slice)

| Method | Path | Auth | Request | Success `data` | Errors |
|--------|------|------|---------|----------------|--------|
| POST | /auth/register | public | `{ email, password, name }` | `{ user: { id, email, name, role }, token }` | 409 email taken · 422 validation |

Success envelope:
```json
{
  "success": true,
  "data": {
    "user": { "id": "665f…", "email": "a@b.com", "name": "Ann", "role": "user" },
    "token": "eyJhbGciOi…"
  },
  "message": "Registered"
}
```

Error envelope:
```json
{ "success": false, "error": { "code": "CONFLICT", "message": "Email already registered" } }
```

Source: **declared here**

---

## Backend half

**Create**

| File | Purpose |
|------|---------|
| src/modules/auth/auth.model.ts | User Mongoose model (see master plan's data model) |
| src/modules/auth/auth.schema.ts | Zod input schemas |
| src/modules/auth/auth.service.ts | business logic (hash, create, sign token) |
| src/modules/auth/auth.controller.ts | HTTP handler |
| src/modules/auth/auth.routes.ts | router (mounted in src/app.ts) |

**Validation** — `registerSchema`: `email` a valid email, lowercased; `password` min 8 chars;
`name` non-empty, max 80.

**Service surface** — `registerUser(input): Promise<{ user: PublicUser; token: string }>`, so slice
02 can reuse the token-signing path rather than re-implementing it.

**Errors & edge cases**
- Existing email → `ConflictError` (409). Rely on the unique index so concurrent submits can't both win.
- Validation failure → handled by the shared `validate` middleware (422).
- `passwordHash` must never appear in any response — the model has `select: false`, and the service
  maps to a public shape explicitly.

**Reuse for this slice** — the `ok`/`created` response helpers, the shared `validate` middleware,
the `AppError` family.

**New shared pieces / env vars** — `JWT_SECRET` added to the env schema and `.env.example`.

---

## Frontend half

**Types & schema** — derived from the Zod schemas via `z.infer`; no hand-written parallel interfaces.

**Create**

| File | Purpose |
|------|---------|
| src/features/auth/schema/register.schema.ts | request + response schemas |
| src/features/auth/api/register.ts | request fn (unwraps envelope, parses response) |
| src/features/auth/hooks/use-register.ts | mutation hook |

**Hooks** — `useRegister` mutation. On success, store the session via `useAuth` and invalidate
`["auth", "session"]`.

**Data binding map**

| Component (path) | Bound to | Notes |
|---|---|---|
| src/features/auth/template/register-form.tsx | `useRegister` mutation | replace the stubbed `onSubmit` |

**States** — submit pending disables the button; a 409 shows inline on the email field; success
redirects to `/`.

**Design gaps** — the register form template does not exist yet in this project. Build it with
`figma-to-component` / `html-to-component`, or accept a minimal shared-`*Field` form from this
slice as a stopgap and flag it.

**Reuse for this slice** — the axios instance, the BFF catch-all proxy, the shared `*Field`
components, `useAuth`.

---

## Testing checklist

- [ ] valid submission creates the user and returns the envelope above
- [ ] duplicate email returns 409 and the form shows it inline on the email field
- [ ] a password shorter than 8 characters is rejected client-side before any request
- [ ] `passwordHash` never appears in any response body
- [ ] the response is envelope-unwrapped and schema-validated (a drifted payload errors, never renders garbage)
- [ ] success stores the session and redirects

## Notes / open questions

**Build notes (module-builder, slice 01):**
- **Error-envelope discrepancy — flagged, not silently resolved.** This slice and the master plan
  write errors as `{ success: false, error: { code, message } }`, but `backend/ARCHITECTURE.md`
  says the existing error middleware serializes `{ success: false, message, code }`. ARCHITECTURE.md
  wins (it describes the real middleware), so the backend was built to it; the form reads
  `message` first and falls back to `error.message`. Reconcile the plan text before slice 02.
- Naming follows the repo's existing conventions over the slice's prose: the Zod schema is
  `registerBody` (matching `createProductBody`) and the hook is `useRegisterMutation` (matching
  the `useXMutation` rule in `frontend/ARCHITECTURE.md`).
- The register form was built as the **stopgap** this slice authorises
  (`features/auth/template/register-form.tsx`) — shared `*Field` components only, no design.
- `hooks/use-auth.ts` was **extended** (not forked) with `setSession` / `clearSession` because the
  existing hook was a read-only stub with no way to store a session.
- No `/register` page/route exists yet; `RegisterForm` is exported but not mounted on a route.
- Typecheck/lint/build could not be run: this checkout has no `package.json` / `node_modules`.
