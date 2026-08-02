# 02 — Login

> Status: ready
> Domain: fullstack
> Depends on: 01 (needs users to exist, and reuses its model, token issuance and BFF session plumbing)
> Part of: [auth](./auth-plan.md)

## Goal

Let an existing shopper sign in with email and password and get the same session a fresh
registration produces.

## Done when

> A returning shopper submits the login form with correct credentials and lands signed in; wrong
> credentials show one generic error that reveals nothing about whether the email exists.

---

## API contract (this slice)

| Method | Path | Auth | Request body | Success `data` | Errors |
|--------|------|------|--------------|----------------|--------|
| POST | /api/auth/login | public | `{ email, password }` | `{ user: { id, email, role }, token }` | 401 invalid credentials · 422 validation |

Success envelope — **200** via `ok(res, data, "Signed in")`:

```json
{
  "success": true,
  "data": {
    "user": { "id": "665f1c2ab3d4e5f601234567", "email": "sam@example.com", "role": "user" },
    "token": "eyJhbGciOiJIUzI1NiJ9..."
  },
  "message": "Signed in"
}
```

Error envelope:

```json
{ "success": false, "message": "Invalid email or password", "code": "UNAUTHORIZED" }
```

- 401 `UnauthorizedError` — **the identical message and status whether the email is unknown or the
  password is wrong** (brief §Functional requirements). No "user not found" anywhere on this path.
- 422 `ValidationError` — missing/malformed fields.

`data` is deliberately byte-identical in shape to slice 01's, so both share one response schema on
the frontend. As in 01, the BFF strips `data.token` into the httpOnly cookie and the browser sees
`{ success: true, data: { user }, message }`.

Source: **declared here** (design mode).

---

## Backend half

**Modify** (all files already exist from slice 01 — nothing new is created)

| File | Change |
|------|--------|
| src/modules/auth/auth.schema.ts | add `loginBody = z.object({ email: z.email().trim().toLowerCase(), password: z.string().min(1) })` |
| src/modules/auth/auth.service.ts | add `authenticateUser` |
| src/modules/auth/auth.controller.ts | add `login` handler → `ok(res, { user, token }, "Signed in")` |
| src/modules/auth/auth.routes.ts | `authRouter.post("/login", validate({ body: loginBody }), ctrl.login);` |

**Validation** — note `password: z.string().min(1)` on login, *not* `.min(8)`. The 8-char rule is a
registration policy; applying it at login would 422 legacy or policy-changed passwords and leak
information about password shape. Length policy belongs to register only.

**Service surface**

- `authenticateUser(input: { email: string; password: string }): Promise<{ user: UserDTO; token: string }>`

Implementation notes that matter:
- `passwordHash` is `select: false`, so this lookup must explicitly `.select("+passwordHash")`.
  Forgetting it makes every login fail with a confusing "invalid credentials".
- Reuse `verifyPassword` from `src/lib/password.ts` and the **same token issuance** slice 01 wrote —
  extract it to a small internal helper in the service if 01 inlined it, rather than copying it.

**Errors & edge cases**

| Case | Handling |
|------|----------|
| Unknown email | `UnauthorizedError("Invalid email or password")` → 401 |
| Wrong password | The same error object, same message, same status |
| Timing difference between the two | Run `verifyPassword` against a dummy hash when no user is found, so an unknown email doesn't return measurably faster |
| Email casing | Normalised by the schema before lookup, matching how 01 stored it |
| Repeated failed attempts | Not handled here — rate limiting is module-level out of scope (see master plan) |

**Reuse for this slice** — `ok`, `UnauthorizedError`, `validate`, `src/lib/password.ts`,
`src/modules/auth/auth.model.ts`, and slice 01's token issuance.

**New shared pieces / env vars** — none.

---

## Frontend half

**Types & schema** — extends `src/features/auth/schema/auth.schema.ts` from slice 01; the response
schema is **reused, not re-declared** (`data.user` is the same shape).

```
loginRequestSchema = z.object({ email: z.email(), password: z.string().min(1) })
loginResponseSchema = registerResponseSchema        // same shape — one schema, no drift
type LoginInput = z.infer<typeof loginRequestSchema>
```

**Create**

| File | Purpose |
|------|---------|
| src/features/auth/api/login.ts | request fn — posts `/auth/login`, parses the envelope, returns `data.user` |
| src/features/auth/hooks/use-login.ts | `useLoginMutation` |
| src/features/auth/template/login-form.tsx | the login screen (see Design gaps) |
| src/app/(auth)/login/page.tsx | route rendering the template |
| src/app/api/auth/login/route.ts | BFF route — forwards, sets the httpOnly cookie, strips the token |

**Modify**

| File | Change |
|------|--------|
| src/features/auth/schema/auth.schema.ts | add the login request schema |
| src/features/auth/index.ts | export the new hook/template |

The BFF login route is the same handler shape as `register/route.ts` — factor the shared "forward,
lift `data.token` into the cookie, return the rest" logic into `src/lib/session.ts` rather than
writing it twice.

**Hooks**

- `useLoginMutation` — on success: `queryClient.setQueryData(["auth","session"], user)`, then
  redirect to the `?next=` param if present, else `/`.
- Invalidation: none needed yet. Once other modules cache per-user data, login should
  `queryClient.clear()` before setting the session so a previous user's cached data can't leak into
  the new session — note it here so the pattern is set when that day comes.

**Data binding map**

| Component (path) | Bound to | Notes |
|---|---|---|
| src/features/auth/template/login-form.tsx | `useLoginMutation` | RHF + zodResolver; `isPending` → submit button |
| login-form.tsx — email input | `InputField` (shared) | `type="email"`, `autoComplete="email"` |
| login-form.tsx — password input | `InputField` (shared) | `type="password"`, `autoComplete="current-password"` |
| login-form.tsx — error banner | mutation `error` | form-level, never field-level (see States) |
| login-form.tsx — "Forgot password?" link | `/forgot-password` | route lands in slice 05; link to it now, or add the link with 05 |

**States**

- idle → submitting (button disabled, spinner)
- 401 → **form-level** generic error "Invalid email or password". Deliberately not attached to the
  email field: an inline email error would tell an attacker which half was wrong.
- 422 → field errors from the form schema (client-side catches these first in practice)
- network/5xx → form-level error, email preserved, password cleared
- success → session in cache, redirect

**Design gaps** — the login screen does not exist (`src/features/auth/` is created by slice 01 and
holds no login template). Build it with `figma-to-component` / `html-to-component` /
`project-to-component`, or compose shared `InputField`s directly. The binding above is planned
either way.

**Reuse for this slice** — `frontend/src/lib/axios.ts`, `lib/query-client.ts`, `lib/session.ts`
(slice 01), `InputField`, and the auth feature schemas from slice 01.

---

## Testing checklist

- [ ] correct credentials return the 200 envelope above and set the session cookie
- [ ] unknown email and wrong password return the **same** status, code and message
- [ ] no response on this path ever distinguishes "no such user" from "bad password"
- [ ] the password hash is fetched explicitly (`select: +passwordHash`) — the happy path actually works
- [ ] login succeeds for a user created by slice 01 (the hashing and verification agree)
- [ ] the login response is parsed with the same response schema as register — one schema, no second copy
- [ ] the 401 renders as a form-level error, not inline on the email field
- [ ] a `?next=/somewhere` param is honoured on success, and defaults to `/` when absent
- [ ] the token never appears in the JSON the browser receives, nor in any client-readable storage

## Notes / open questions

- Session survival across a browser restart is slice 04's job (`GET /auth/me`). After this slice a
  hard reload will show signed-out UI even though the cookie is valid — expected, not a bug.
