# Feature plan: auth (API binding)

> Status: **BLOCKED** — the auth API does not exist yet. `backend/src/modules/` contains only
> `products`; there is no `auth` module, no OpenAPI spec, and no pasted sample, so the endpoint-level
> contract could **not** be observed. The envelope below IS observed (rung 2); the endpoints are
> **proposed** from the sibling plan `backend/_docs/FEATURE_PLAN_auth.md` and must be re-verified
> against real source once `backend-module-builder` has built each slice.
>
> Secondary blocker: **the auth design does not exist either** — `src/features/` contains only
> `products`. Every auth screen is a design gap (see Design gaps).
>
> Source brief: `_docs/features/auth/auth-module.md` (repo root).

## Overview
Bind the auth screens (register, login, logout, forgot/reset password, and the session/role that the
rest of the app reads) to the demo-api auth endpoints — replacing the `useAuth` stub at
`src/hooks/use-auth.ts` with a real session, so guarded pages and admin-only controls work.

## Build order — one slice at a time
Per the user's request, this binding is not built in one go. Each row is independently shippable and
depends only on the rows above it. Each frontend slice should be built **after** the matching backend
slice in `backend/_docs/FEATURE_PLAN_auth.md` — that pairing is what keeps the types from drifting.

| # | Slice | Frontend scope | Backend prerequisite |
|---|-------|----------------|----------------------|
| 01 | **register** | `AuthProvider` + real `useAuth`, `registerSchema`, `useRegisterMutation`, register form + `app/(auth)/register/page.tsx`, `useSessionQuery` (`GET /auth/me`) | backend 01 |
| 02 | **login** | `loginSchema`, `useLoginMutation`, login form + `app/(auth)/login/page.tsx`, post-login redirect (`?next=`) | backend 02 |
| 03 | **logout** | `useLogoutMutation`, header sign-out control, `queryClient.clear()` on success | backend 03 |
| 04 | **session refresh + route guarding** | axios 401 interceptor → one `/auth/refresh` retry → redirect on failure; `middleware.ts` route guard | backend 04 |
| 05 | **forgot / reset password** | 2 schemas, 2 mutations, 2 screens (`forgot-password`, `reset-password?token=`) | backend 05 |
| 06 | **role-gated UI** | `useAuth().user.role === 'admin'` gating for admin-only controls (e.g. the products create action) | backend 06 |

> ⚠️ **Skill gap, flagged honestly:** `frontend-feature-planner` emits ONE plan file per feature; it
> has no sharding step that writes a file per slice. The table above is the closest this skill gets
> to "one at a time". Per-slice files (`_docs/features/auth/01-register.md`, …) are a
> `module-planner` capability, not this skill's.

## API contract (observed)
> **Rungs tried:**
> - **Rung 1 — monorepo backend source** (`.claude/workspace.json` → `backend/`): read
>   `backend/src/app.ts` (mounts only `/api/products`) and `backend/src/modules/` (only `products`).
>   **No auth module exists.** Endpoint-level facts NOT obtainable.
> - **Rung 2 — backend contract files**: `backend/ARCHITECTURE.md` + `backend/MODULE_REGISTRY.md`.
>   ✅ Envelope, error model and auth primitives obtained here. The registry lists only `products`,
>   so no auth service surface.
> - **Rung 3 — OpenAPI/Swagger**: none in the repo.
> - **Rung 4 — pasted sample**: none provided (the user is not available to paste one).

**Success envelope — OBSERVED** (`backend/ARCHITECTURE.md`, confirmed by
`backend/src/lib/app-response.ts` and `products.controller.ts`):
```
200 ok(res, data, message)      → { "success": true, "data": <data>, "message": <string> }
201 created(res, data, message) → { "success": true, "data": <data>, "message": <string> }
204 noContent(res)              → no body
```
**Error envelope — OBSERVED** (`backend/ARCHITECTURE.md`):
```
{ "success": false, "message": <string>, "code": <string> }
```
with `NotFoundError→404`, `ConflictError→409`, `UnauthorizedError→401`, `ValidationError→422`.

**Auth guards — OBSERVED** (`backend/ARCHITECTURE.md`, used in `products.routes.ts`):
`protect` requires a valid **Bearer** access token and attaches `req.user`; `requireRole('admin')`
runs after it.

**Endpoints — ⚠️ PROPOSED, NOT OBSERVED.** Mirrored from `backend/_docs/FEATURE_PLAN_auth.md`.
Treat every row as provisional until the backend slice is built and this table is re-checked
against `backend/src/modules/auth/auth.routes.ts` + `auth.controller.ts`.

| Method | Path | Auth | Request | Response `data` |
|--------|------|------|---------|-----------------|
| POST | `/auth/register` | public | body: `{ email, password, name? }` | `{ user: User, accessToken: string }` (201) |
| POST | `/auth/login` | public | body: `{ email, password }` | `{ user: User, accessToken: string }` |
| POST | `/auth/logout` | `protect` | — | none (204) |
| POST | `/auth/refresh` | refresh cookie | — | `{ accessToken: string }` |
| GET | `/auth/me` | `protect` | — | `User` |
| POST | `/auth/forgot-password` | public | body: `{ email }` | `null` (always 200, generic message) |
| POST | `/auth/reset-password` | public | body: `{ token, password }` | `null` |

`User` = `{ id: string, email: string, name?: string, role: "user" \| "admin", createdAt: string }`
— **proposed**; there is no `User` model in the backend to read it from yet. Note paths are written
without the `/api` prefix because the axios instance already has `baseURL: "/api"`.

## Decisions
- **Transport**: browser → same-origin `/api/*` → catch-all BFF proxy → backend. Fixed by
  `ARCHITECTURE.md`; no new BFF route is needed for `/api/auth/*` — the catch-all already covers it.
- **Validation & types**: Zod 4 schemas, types via `z.infer`. No parallel interfaces. Fixed.
- **Server state**: TanStack Query v5, array keys namespaced by feature — `["auth", "session"]`. Fixed.
- **Forms**: RHF + shared `*Field` components only (`InputField` for email/password). Fixed.
- **Module layout**: `src/features/auth/{types,schema,api,hooks,components,template,index.ts}`. Fixed.
- _Assumption_ — **Access token lives in memory only** (React context inside `AuthProvider`), never
  `localStorage`/`sessionStorage`. Persistence across browser restarts comes from the backend's
  httpOnly refresh cookie + a `/auth/refresh` call on app boot. This follows the backend plan's
  transport assumption; if that changes, this changes with it.
- _Assumption_ — **The BFF proxy must forward `Authorization` and `Set-Cookie`/`Cookie` headers.**
  The proxy impl is elided in this checkout (`app/api/[...path]/route.ts` is a stub), so this is
  unverified. If it strips headers, **no auth call will work** — see Dependencies.
- _Assumption_ — **Route guarding**: `middleware.ts` redirects unauthenticated users away from
  protected routes to `/login?next=<path>`; the client `useAuth()` handles in-page role gating. The
  middleware can only see the refresh cookie, not the in-memory access token, so it checks cookie
  presence only — real authorization stays server-side.
- _Assumption_ — **Cache strategy**: invalidate-on-success, no optimistic updates. Auth mutations
  are identity-changing; optimism here is a footgun. `logout` additionally calls `queryClient.clear()`.
- _Assumption_ — **Routes**: new `app/(auth)/{login,register,forgot-password,reset-password}/page.tsx`.
  There is no existing auth route to feed.
- _Assumption_ — **Errors are shown inline on the form** (from the envelope's `message`), not as toasts.
  No toast/overlay component is listed in `MODULE_REGISTRY.md`.

## Dependencies
| Dependency | Needed for | Status / unblock path |
|------------|-----------|------------------------|
| `/auth/*` endpoints | **every** request in this plan | ❌ **BLOCKED** — no auth module in `backend/src/modules/`. Build via `backend/_docs/FEATURE_PLAN_auth.md` → `backend-module-builder`, slice by slice. |
| Auth screens (login/register/forgot/reset forms) | rendering anything | ❌ **BLOCKED** — `src/features/` has only `products`. Build via `figma-to-component` / `html-to-component` first, or accept that `module-builder` will have to create plain shadcn forms. |
| Real `useAuth` | route guards, role gating, logout control | ⚠️ `src/hooks/use-auth.ts` is a stub returning `{ user: null }`. Slice 01 replaces its internals with the session query; **keep the path and the exported name** so nothing else has to change. |
| BFF proxy forwards auth headers + cookies | login/refresh/logout | ⚠️ **unverified** — `app/api/[...path]/route.ts` is elided in this checkout. Confirm it forwards `Authorization`, request `Cookie`, and response `Set-Cookie` before slice 01. |
| `BACKEND_URL` env | BFF → backend | ⚠️ referenced in `ARCHITECTURE.md`; not verified in this checkout (no `.env.example` present). |
| `lib/query-client.ts` + `app/providers.tsx` | all hooks | ⚠️ listed in `MODULE_REGISTRY.md` but not present in this checkout — confirm before building. `AuthProvider` must nest **inside** the query provider. |
| Backend `role` on `req.user` | admin-gated UI (slice 06) | ❌ depends on backend slice 01/06 — `products.routes.ts` already calls `requireRole('admin')` but nothing populates a real user today. |

## Reuse (do NOT recreate)
| What | Path | How it's used here |
|------|------|--------------------|
| axios instance | `src/lib/axios.ts` | every auth request fn goes through `api` (`baseURL: "/api"`); slice 04 adds the 401→refresh interceptor **to this instance**, not a new one |
| BFF proxy | `src/app/api/[...path]/route.ts` | already forwards `/api/auth/*` → backend; **no new route handler needed** |
| query client | `src/lib/query-client.ts` | provided in `app/providers.tsx`; `logout` calls `.clear()` on it |
| `InputField` | `src/components/shared/form/input-field.tsx` | email, password, confirm-password, name on every auth form |
| `CheckboxField` | `src/components/shared/form/checkbox-field.tsx` | only if a "remember me" is added (currently out of scope) |
| form barrel | `src/components/shared/form/index.ts` | import fields from here, not by deep path |
| `useAuth` | `src/hooks/use-auth.ts` | **extend in place** — same path, same export name; do not create a second auth hook |
| products design (reference) | `src/features/products/` | copy the feature-module anatomy and the design-only → bound conversion pattern |

## Types & schema
- `src/features/auth/types/auth.ts` — `User`, `AuthSession` (`{ user, accessToken }`), derived from
  the schemas below via `z.infer`. Mirrors the envelope's `data` **exactly** (unwrap `data`, don't
  type the wrapper into every hook — use one shared `ApiResponse<T>` helper type).
- `src/features/auth/schema/auth.schema.ts`:
  - `userSchema` — `{ id, email, name?, role: z.enum(["user","admin"]), createdAt }` ⚠️ pending contract
  - `registerSchema` — `email: z.email()`, `password: z.string().min(8)`, `confirmPassword` +
    `.refine()` match (client-only field, stripped before the request), `name` optional
  - `loginSchema` — `email: z.email()`, `password: z.string().min(1)`
  - `forgotPasswordSchema` — `email: z.email()`
  - `resetPasswordSchema` — `password: z.string().min(8)` + confirm match; `token` from the URL
- Parse every response's `data` through the Zod schema so backend drift fails loudly rather than
  rendering `undefined`.

## Create
| File | Purpose |
|------|---------|
| `src/features/auth/types/auth.ts` | `User`, `AuthSession`, `ApiResponse<T>` |
| `src/features/auth/schema/auth.schema.ts` | Zod request/form schemas (above) |
| `src/features/auth/api/auth.api.ts` | `register`, `login`, `logout`, `refresh`, `getMe`, `forgotPassword`, `resetPassword` — all via `api` |
| `src/features/auth/hooks/use-session-query.ts` | `useSessionQuery()` — key `["auth","session"]` |
| `src/features/auth/hooks/use-auth-mutations.ts` | register / login / logout / forgot / reset mutations |
| `src/features/auth/components/auth-provider.tsx` | holds the in-memory access token; bootstraps via `/auth/refresh` |
| `src/features/auth/components/register-form.tsx` | ⚠️ design gap — form does not exist yet |
| `src/features/auth/components/login-form.tsx` | ⚠️ design gap |
| `src/features/auth/components/forgot-password-form.tsx` | ⚠️ design gap |
| `src/features/auth/components/reset-password-form.tsx` | ⚠️ design gap |
| `src/features/auth/template/auth-screen.tsx` | shared composed shell for the auth pages |
| `src/features/auth/index.ts` | barrel — public surface of the module |
| `src/app/(auth)/register/page.tsx` | renders the register screen |
| `src/app/(auth)/login/page.tsx` | renders the login screen |
| `src/app/(auth)/forgot-password/page.tsx` | request a reset link |
| `src/app/(auth)/reset-password/page.tsx` | consumes `?token=` |
| `src/middleware.ts` | route guard: redirect unauthenticated users to `/login?next=` |
| _(edit)_ `src/hooks/use-auth.ts` | replace the stub's internals with the real session; keep the path + export name |
| _(edit)_ `src/lib/axios.ts` | slice 04: attach `Authorization`; 401 → single `/auth/refresh` retry |
| _(edit)_ `src/app/providers.tsx` | mount `AuthProvider` inside the query provider |
| ~~`src/app/api/auth/route.ts`~~ | **NOT needed** — the catch-all BFF proxy already covers `/api/auth/*` |

## Data mapping
| Component (path) | Hook | Fields bound | States |
|------------------|------|--------------|--------|
| `features/auth/components/register-form.tsx` | `useRegisterMutation` | `email`, `password`, `name?` → POST body; response `data.user` → session, `data.accessToken` → memory | submitting / disabled / 409 duplicate-email inline on the email field / 422 field errors |
| `features/auth/components/login-form.tsx` | `useLoginMutation` | `email`, `password` → POST body | submitting / 401 → single generic "Invalid email or password" above the form (never per-field — it leaks account existence) |
| header sign-out control (⚠️ no header component exists) | `useLogoutMutation` | — | pending / disabled while pending |
| `features/auth/components/forgot-password-form.tsx` | `useForgotPasswordMutation` | `email` → POST body | always shows the same success message, even for unknown emails |
| `features/auth/components/reset-password-form.tsx` | `useResetPasswordMutation` | `password` + `token` (from `useSearchParams`) | 401 expired/used-link → inline message + link back to forgot-password |
| `hooks/use-auth.ts` consumers (e.g. admin controls) | `useSessionQuery` | `user.role` | `isLoading` → render nothing rather than flashing the signed-out state |

## Query/mutation hooks
- `useSessionQuery()` — key `["auth","session"]`, calls `GET /auth/me`. `staleTime` ~5 min;
  `retry: false` (a 401 means signed out, not a transient failure). This is the single source of
  truth `useAuth()` wraps.
- `useRegisterMutation()` — on success: store `accessToken` in `AuthProvider`, `setQueryData(["auth","session"], data.user)`, redirect to `/` (the brief requires landing signed in, with no separate sign-in step).
- `useLoginMutation()` — same as register, but redirect to `?next=` when present, else `/`.
- `useLogoutMutation()` — on success (204): clear the in-memory token, `queryClient.clear()`,
  `router.replace("/login")`. **Clear local state even if the request fails** — the user asked to sign out.
- `useRefreshMutation()` — used by the axios interceptor and on app boot; not called from UI.
- `useForgotPasswordMutation()` / `useResetPasswordMutation()` — no cache invalidation; reset
  redirects to `/login` with a "password changed, sign in" message.
- Invalidation scope: only `["auth"]`. Nothing else in the app is bound yet.

## Design gaps (build before/with binding)
**Everything.** `src/features/` contains only `products`; there is no `features/auth/` directory and
no auth UI of any kind. Missing, in build order:
1. Register form, 2. Login form, 3. A header/nav with a sign-out control and a signed-in indicator,
4. Forgot-password form, 5. Reset-password form, 6. An auth-screen shell (card/centered layout).

Build these with `figma-to-component` or `html-to-component` before (or alongside) each slice. This
plan deliberately does **not** block on them — but note the premise of this skill ("the design already
exists, now make it functional") does not hold here, so `module-builder` will be creating the design
as well as the binding unless you build them first.

## Edge cases & states
- **Loading** — session query in flight on first paint: render a neutral shell, never a flash of the
  signed-out header.
- **401 on a guarded call** — axios interceptor tries `/auth/refresh` **once**; on success replay the
  original request, on failure clear state and redirect to `/login?next=<current>`. Guard against an
  infinite refresh loop (never refresh a failed `/auth/refresh`).
- **Session expires mid-session on a protected page** (brief edge case) — the above; the user lands
  back where they were after signing in, via `?next=`.
- **409 duplicate email** — inline on the email field with the server's `message`.
- **422 validation** — map the envelope `message` to the form; client Zod should have caught most.
- **Unknown email on forgot-password** — identical success UI; the frontend must not branch on it.
- **Reset link expired or already used** — 401 → inline message + "request a new link".
- **Double submit** — disable the submit button while the mutation is pending on every auth form.
- **Envelope drift** — Zod parse failure on `data` should throw visibly in dev, not render blank.
- **`?next=` open redirect** — only accept same-origin relative paths.

## Testing checklist
Behavior a correct binding must satisfy — handoff target for `frontend-test-writer`.
- [ ] Register with a valid email + password lands the user signed in, with no separate login step.
- [ ] Register with an existing email shows the 409 message inline on the email field.
- [ ] Login with wrong credentials shows one generic error — never "no such user" vs "wrong password".
- [ ] Client-side Zod rejects passwords under 8 chars and mismatched confirm before any request fires.
- [ ] The success envelope is unwrapped (`data`) and passes the Zod schema; drift fails loudly.
- [ ] The access token is never written to `localStorage`/`sessionStorage`.
- [ ] After a browser restart, the app boots signed in via the refresh cookie.
- [ ] Logout clears the token, clears the query cache, and redirects; a protected route then redirects to `/login`.
- [ ] A 401 on a guarded call triggers exactly one refresh attempt, then a redirect on failure (no loop).
- [ ] `?next=` returns the user to the page they were on, and rejects absolute/off-origin URLs.
- [ ] Forgot-password shows the identical confirmation for known and unknown emails.
- [ ] A reused or expired reset token shows the expired-link state.
- [ ] Admin-only controls are hidden when `useAuth().user.role !== "admin"` and while the session loads.
- [ ] Every auth submit button is disabled while its mutation is pending.

## Out of scope
Social login, two-factor, teams/orgs, per-permission RBAC (all out per the brief), email verification,
"remember me", profile editing, admin user management, and **binding the products design** — the
products feature is still design-only with hardcoded `SAMPLE` data (`features/products/template/products-grid.tsx`),
which is its own plan.

## Open questions
Questions I would have asked before writing this (defaults assumed above so you aren't blocked):
1. **Can you confirm the token transport** (access token in the body + httpOnly refresh cookie)?
   Everything in Decisions/Dependencies hangs off it, and it must match the backend plan.
2. **Does the elided BFF proxy forward `Authorization`, `Cookie` and `Set-Cookie`?** If not, that is
   the real first task — no auth binding works without it.
3. **Should I build the missing auth UI**, or will `figma-to-component`/`html-to-component` produce
   the designs first? The whole design layer is missing.
4. **Route guarding via `middleware.ts`** (assumed) **or per-page server checks?**
5. **Error surface** — inline form errors (assumed), or should I add a shared toast component to the
   registry first?
6. **Data gap** — the brief's "stay signed in across visits" implies a refresh mechanism the observed
   backend has no trace of; confirm once backend slice 04 exists.
