# 02 — Login

> Status: ready
> Domain: fullstack
> Depends on: 01
> Part of: [auth](./auth-plan.md)

## Goal
Let an existing user sign in with email and password.

## Done when
A registered user can submit the login form and land authenticated.

---

## API contract (this slice)

| Method | Path | Auth | Request | Success `data` | Errors |
|--------|------|------|---------|----------------|--------|
| POST | /auth/login | public | `{ email, password }` | `{ user: { id, email, name, role }, token }` | 401 bad credentials · 422 validation |

Error envelope:
```json
{ "success": false, "error": { "code": "UNAUTHORIZED", "message": "Invalid email or password" } }
```

The message is deliberately identical whether the email exists or not, so the endpoint doesn't
confirm which accounts are registered.

Source: **declared here**

---

## Backend half

**Create** — `loginSchema` in `auth.schema.ts`, `loginUser()` in `auth.service.ts`, a controller
handler, and the route. All added to the module slice 01 created; no new files beyond schemas.

**Service surface** — `loginUser(input): Promise<{ user: PublicUser; token: string }>`, reusing
slice 01's token-signing path.

**Errors & edge cases** — unknown email and wrong password both produce the same
`UnauthorizedError`. Compare the hash even when the user is missing, so response timing doesn't
leak account existence.

---

## Frontend half

**Create** — `login.schema.ts`, `api/login.ts`, `hooks/use-login.ts`.

**Hooks** — `useLogin` mutation; same session-store + invalidation as slice 01.

**Data binding map**

| Component (path) | Bound to | Notes |
|---|---|---|
| src/features/auth/template/login-form.tsx | `useLogin` mutation | replace the stubbed onSubmit |

**States** — pending disables submit; 401 shows as a form-level error, not per-field.

---

## Testing checklist

- [ ] correct credentials return the envelope and store the session
- [ ] wrong password returns 401 with the generic message
- [ ] unknown email returns the same 401 and message as a wrong password
- [ ] the error surfaces at form level, not on a single field
- [ ] the response is envelope-unwrapped and schema-validated

## Notes / open questions
None.
