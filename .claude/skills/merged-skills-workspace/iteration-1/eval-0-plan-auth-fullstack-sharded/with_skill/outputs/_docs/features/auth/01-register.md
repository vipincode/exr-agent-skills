# 01 — Register

> Status: ready
> Domain: fullstack
> Depends on: —
> Part of: [auth](./auth-plan.md)

## Goal

Create the `User` model and the register endpoint, and wire the register form to it so a new
shopper ends up signed in. This slice also establishes the module's foundations every later slice
copies: password hashing, token issuance, and the BFF session cookie.

## Done when

> A visitor submits the register form with an email and password, the user is persisted with a
> hashed password, and they land on the app already signed in.

---

## API contract (this slice)

**The single source of truth for this slice.** The backend half implements it; the frontend half
binds to it.

| Method | Path | Auth | Request body | Success `data` | Errors |
|--------|------|------|--------------|----------------|--------|
| POST | /api/auth/register | public | `{ email, password }` | `{ user: { id, email, role }, token }` | 409 email taken · 422 validation |

Success envelope — **201** via `created(res, data, "Registered")`:

```json
{
  "success": true,
  "data": {
    "user": { "id": "665f1c2ab3d4e5f601234567", "email": "sam@example.com", "role": "user" },
    "token": "eyJhbGciOiJIUzI1NiJ9..."
  },
  "message": "Registered"
}
```

Error envelope — flat, no nested `error` object:

```json
{ "success": false, "message": "Email already registered", "code": "CONFLICT" }
```

- 409 `ConflictError` — email already registered.
- 422 `ValidationError` — from the `validate` middleware (missing email, malformed email, password
  under 8 chars).

**What the browser actually receives**: the BFF register route strips `data.token` and sets it as an
httpOnly cookie, so the browser sees `{ success: true, data: { user }, message }`. The contract
above is the *backend* contract; the frontend response schema in this slice is
`{ user }` only. This is deliberate — the token must never be readable by client JS.

Source: **declared here** (design mode).

---

## Backend half

**Create**

| File | Purpose |
|------|---------|
| src/modules/auth/auth.model.ts | `User` / `UserDoc` mongoose model (fields per the master plan's Data model) |
| src/modules/auth/auth.schema.ts | Zod input schemas |
| src/modules/auth/auth.service.ts | business logic + `UserDTO` and `toDTO` |
| src/modules/auth/auth.controller.ts | HTTP handlers |
| src/modules/auth/auth.routes.ts | router |
| src/lib/password.ts | `hashPassword` / `verifyPassword` (bcrypt, cost 12) |

**Modify**

| File | Change |
|------|--------|
| src/app.ts | add `app.use("/api/auth", authRouter);` next to the existing products mount |

**Validation** — `auth.schema.ts`:

```
registerBody = z.object({
  email:    z.email().trim().toLowerCase(),
  password: z.string().min(8),
})
```

Route wiring copies `products.routes.ts` exactly:
`authRouter.post("/register", validate({ body: registerBody }), ctrl.register);`

**Service surface** (exported for later slices and later modules):

- `registerUser(input: { email: string; password: string }): Promise<{ user: UserDTO; token: string }>`
- `toDTO(doc: UserDoc): UserDTO` — `{ id, email, role }` only; `passwordHash` never appears.

Token issuance lives in the service and is reused verbatim by slice 02. **Before writing it, open
the JWT helper that `protect` (`src/middleware/auth.ts`) uses to verify and sign with that same
helper/secret/algorithm** — do not create a second signing utility.

**Errors & edge cases**

| Case | Handling |
|------|----------|
| Email already registered | `ConflictError("Email already registered")` → 409 |
| Two concurrent submits, same email | The unique index on `email` is the real guard. Catch mongo error code `11000` in the service and rethrow as the same `ConflictError` — a pre-check `findOne` alone loses this race. |
| Password < 8 chars, malformed email | 422 from `validate`, before the controller runs |
| Password in a response | Impossible by construction: `passwordHash` is `select: false` and `toDTO` whitelists three fields |
| Email casing / whitespace | Normalised in the Zod schema (`.trim().toLowerCase()`) *and* on the model, so direct service calls are safe too |

**Reuse for this slice** — `created` (`src/lib/app-response.ts`), `ConflictError`
(`src/lib/app-error.ts`), `validate` (`src/middleware/validate.ts`), the JWT signing helper behind
`src/middleware/auth.ts`, and the `toDTO` / `.lean()` pattern from `products.service.ts`.

**New shared pieces** — `src/lib/password.ts` (→ backend registry).
**New env vars** — none expected; confirm the existing token secret/TTL vars that `protect` reads,
and only add one if there genuinely isn't any.

---

## Frontend half

**Types & schema** — derived from Zod via `z.infer`, no hand-written parallel interfaces
(`frontend/ARCHITECTURE.md`). The response schema mirrors what the **BFF** returns (user, no token).

```
registerRequestSchema  = z.object({ email: z.email(), password: z.string().min(8) })
userSchema             = z.object({ id: z.string(), email: z.email(), role: z.enum(["user","admin"]) })
registerResponseSchema = z.object({ success: z.literal(true), data: z.object({ user: userSchema }), message: z.string() })
type RegisterInput = z.infer<typeof registerRequestSchema>
type User          = z.infer<typeof userSchema>
```

The form schema adds a `confirmPassword` field with a `.refine` equality check — client-only, not
part of the request body.

**Create**

| File | Purpose |
|------|---------|
| src/features/auth/schema/auth.schema.ts | request + response + form schemas (shared by 02–05) |
| src/features/auth/types/index.ts | `z.infer` re-exports (`User`, `RegisterInput`) |
| src/features/auth/api/register.ts | request fn — posts `/auth/register`, parses the envelope, returns `data.user` |
| src/features/auth/hooks/use-register.ts | `useRegisterMutation` |
| src/features/auth/template/register-form.tsx | the register screen (see Design gaps) |
| src/features/auth/index.ts | feature public surface |
| src/app/(auth)/register/page.tsx | route rendering the template |
| src/app/api/auth/register/route.ts | BFF route — forwards to the backend, sets the httpOnly cookie, strips the token |
| src/lib/session.ts | `setSessionCookie` / `readSessionCookie` / `clearSessionCookie` |

**Modify**

| File | Change |
|------|--------|
| src/app/api/[...path]/route.ts | read the session cookie via `lib/session.ts` and attach `Authorization: Bearer <token>` to every forwarded request. Everything else stays as-is. |
| src/hooks/use-auth.ts | replace the `{ user: null }` stub with a real accessor reading the session from the query cache under key `["auth","session"]`; keep the same export name and path so nothing else has to change |

Why dedicated BFF routes here when `frontend/ARCHITECTURE.md` says a feature usually needs none:
only the auth routes have to *translate* — take the token out of the JSON and put it into a
`Set-Cookie`. A colocated `app/api/auth/register/route.ts` takes precedence over the catch-all for
that exact path; the catch-all keeps handling everything else unchanged.

**Hooks**

- `useRegisterMutation` — `mutationFn: register(input)`. On success: `queryClient.setQueryData(["auth","session"], user)` and redirect to `/`. Nothing to invalidate (there is no cached list this creates into).
- Query-key namespace for this whole module: `["auth", ...]` — matches the array/feature-namespaced style in `frontend/ARCHITECTURE.md`.

**Data binding map**

| Component (path) | Bound to | Notes |
|---|---|---|
| src/features/auth/template/register-form.tsx | `useRegisterMutation` | RHF + zodResolver; `isPending` → submit button; server 409 → `setError("email", …)` |
| src/features/auth/template/register-form.tsx — email input | `InputField` (shared) | `name="email"`, `type="email"`, `autoComplete="email"` |
| src/features/auth/template/register-form.tsx — password inputs | `InputField` (shared) | `type="password"`, `autoComplete="new-password"` |
| src/hooks/use-auth.ts | `["auth","session"]` cache entry | consumed later by the header and `RoleGate` (slice 04) |

**States**

- idle → submitting (button disabled, spinner, inputs read-only)
- 409 → inline error on the email field: "Email already registered" + a link to `/login`
- 422 → map field errors onto the form; anything unmapped goes to a form-level error
- network/5xx → form-level error, form stays filled so nothing is retyped
- success → session in cache, redirect to `/` (no separate sign-in step — brief acceptance criterion)

**Design gaps** — `src/features/auth/` does not exist yet; nothing in
`frontend/MODULE_REGISTRY.md` covers an auth screen. The register screen has to be **designed
first**: build it with `figma-to-component`, `html-to-component`, or `project-to-component`, then
this slice's binding drops onto it. The binding above is planned regardless, and the shared
`InputField` means the form fields themselves are not a gap. If you want to move now without a
design, a plain composition of shared `InputField`s inside a card is enough to demo the slice.

**Reuse for this slice** — `frontend/src/lib/axios.ts`, `frontend/src/lib/query-client.ts`,
`InputField` from `frontend/src/components/shared/form`, the existing catch-all proxy, and the
existing `useAuth` path.

---

## Testing checklist

- [ ] valid submission creates exactly one user and returns the 201 envelope above
- [ ] the stored document has a bcrypt hash, never the plaintext password
- [ ] no response, DTO or log anywhere in the path contains `passwordHash`
- [ ] duplicate email returns 409 with `success: false` and the form shows it inline on the email field
- [ ] two concurrent registrations of the same email produce one user and one 409 (unique index, not a pre-check)
- [ ] email is normalised: `  SAM@Example.COM ` and `sam@example.com` collide
- [ ] password under 8 chars is rejected client-side before any request is made, and by the server if posted directly
- [ ] the response is envelope-unwrapped and schema-parsed — a drifted payload throws instead of rendering garbage
- [ ] the token is set as an httpOnly cookie by the BFF and is absent from the JSON the browser receives
- [ ] the catch-all proxy attaches `Authorization: Bearer <token>` on a subsequent request
- [ ] on success the user lands signed in, with no separate sign-in step

## Notes / open questions

- The `name` field is intentionally absent (master plan, Decisions). Adding it later means a model
  field, a schema field, a form field, and a DTO change — cheap now, tedious after slice 05.
- If you switch the token-transport decision to `localStorage`, delete
  `src/app/api/auth/register/route.ts` and `src/lib/session.ts` from this slice and have the
  response schema keep `token`. The backend half is unaffected.
