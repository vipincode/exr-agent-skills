# 04 — Session persistence + role gating

> Status: ready
> Domain: fullstack
> Depends on: 02 (a session has to exist before it can be rehydrated)
> Part of: [auth](./auth-plan.md)

## Goal

Rehydrate the signed-in user on page load from the session cookie, so the session survives a reload
or a browser restart, and expose the role so admin-only controls can be hidden and protected pages
guarded.

## Done when

> A signed-in shopper closes and reopens the browser and is still signed in, and an admin sees
> admin-only controls that a regular shopper never sees.

---

## API contract (this slice)

| Method | Path | Auth | Request | Success `data` | Errors |
|--------|------|------|---------|----------------|--------|
| GET | /api/auth/me | protect | — | `{ user: { id, email, role } }` | 401 no/invalid/expired token |

Success envelope — **200** via `ok(res, { user }, "Session")`:

```json
{
  "success": true,
  "data": { "user": { "id": "665f1c2ab3d4e5f601234567", "email": "sam@example.com", "role": "user" } },
  "message": "Session"
}
```

Error envelope:

```json
{ "success": false, "message": "Unauthorized", "code": "UNAUTHORIZED" }
```

`data.user` is the same `UserDTO` as slices 01 and 02 — the frontend reuses `userSchema`, it does
not declare a third copy. Note the wrapper differs: register/login return `{ user, token }`, this
returns `{ user }` only (there is no token to reissue without refresh rotation).

Source: **declared here** (design mode).

---

## Backend half

**Modify** (no new files)

| File | Change |
|------|--------|
| src/modules/auth/auth.service.ts | add `getUserById(id): Promise<UserDTO \| null>` |
| src/modules/auth/auth.controller.ts | add `me` handler — reads `req.user` (set by `protect`), loads fresh, `ok(res, { user }, "Session")` |
| src/modules/auth/auth.routes.ts | `authRouter.get("/me", protect, ctrl.me);` |

**Why re-read the user instead of echoing the token claims**: the role in a token minted days ago
can be stale. If an admin is demoted, the UI should stop showing admin controls on the next load.
Re-reading costs one indexed lookup per page load and keeps the role honest. (The endpoints
themselves are still guarded server-side by `requireRole`, so this is defence in depth, not the
only defence.)

**Errors & edge cases**

| Case | Handling |
|------|----------|
| Missing / malformed / expired token | 401 from `protect` |
| Valid token, user since deleted | `NotFoundError` → 404, or 401 — pick one and be consistent; the frontend treats both as signed-out |
| Role changed since the token was issued | Fresh read returns the current role |

**Reuse for this slice** — `ok`, `protect`, `NotFoundError`, `auth.model.ts`, and the `toDTO` from
slice 01.

**New shared pieces / env vars** — none.

---

## Frontend half

**Types & schema** — reuses `userSchema` from slice 01. Only the wrapper is new:

```
sessionResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({ user: userSchema }),
  message: z.string(),
})
```

**Create**

| File | Purpose |
|------|---------|
| src/features/auth/api/get-session.ts | request fn — GETs `/auth/me`, parses, returns `User`; returns `null` on 401 instead of throwing |
| src/features/auth/hooks/use-session.ts | `useSessionQuery` — key `["auth","session"]` |
| src/components/shared/auth/role-gate.tsx | `<RoleGate role="admin">…</RoleGate>` — renders children only for that role |
| src/features/auth/components/require-auth.tsx | route guard wrapper — redirects to `/login?next=<path>` when there is no session |

**Modify**

| File | Change |
|------|--------|
| src/hooks/use-auth.ts | back it with `useSessionQuery`; final shape `{ user, isLoading, isAuthenticated, isAdmin }`. Same path, same export name — the registry row is updated, not duplicated |
| src/features/auth/hooks/use-login.ts, use-register.ts | keep writing the user into `["auth","session"]` on success, so no refetch is needed right after auth |
| src/features/auth/index.ts | export the session hook and guard |

`RoleGate` lives in `components/shared/auth/`, **not** in `features/auth/components/`: features may
not cross-import features (`frontend/ARCHITECTURE.md`), and cart, orders and admin will all need
role gating. `require-auth.tsx` stays feature-local because it is auth-flow-specific (it redirects
to the auth routes).

**Hooks**

- `useSessionQuery` — key `["auth","session"]`, `staleTime` ~5 min, `retry: false` (a 401 must not be
  retried), `refetchOnWindowFocus: true` so a session expiring in another tab is noticed.
- On 401 the fn resolves `null` rather than throwing, so "signed out" is a **state**, not an error —
  every consumer then does `if (!user)` instead of inspecting error objects.
- Everything reads this one key. There must be exactly one `/auth/me` request per page load no
  matter how many components ask for the user.

**Data binding map**

| Component (path) | Bound to | Notes |
|---|---|---|
| src/hooks/use-auth.ts | `useSessionQuery()` | the single accessor the whole app uses |
| src/components/shared/auth/role-gate.tsx | `useAuth().user.role` | renders `null` for the wrong role, and while `isLoading` |
| src/features/auth/components/require-auth.tsx | `useAuth().isAuthenticated` | redirect to `/login?next=…`; renders a skeleton while loading, never a flash of signed-out UI |
| the header account menu (not built — see slice 03) | `useAuth().user.email` | shows the email; Sign in / Register when `user` is `null` |

**States**

- loading (first paint, session unknown) → skeleton in the header, guarded pages show a skeleton
  rather than bouncing to `/login`. A redirect fired before the session resolves is the classic bug
  here: signed-in users get thrown to the login page on every refresh.
- signed-out → guarded pages redirect with `?next=`; `RoleGate` renders nothing
- signed-in, role `user` → app chrome, no admin controls in the DOM at all
- signed-in, role `admin` → admin controls visible
- session expires mid-session (brief §Edge cases) → the next 401 from any request clears
  `["auth","session"]` and redirects to `/login?next=<current path>`. Put this in one axios response
  interceptor in `src/lib/axios.ts` so every feature inherits it instead of each hook handling 401s.

**Design gaps** — the header/account menu still does not exist (same gap as slice 03), and there is
no admin surface to gate yet. `RoleGate` and `RequireAuth` are logic, not design, so they can be
built now; wiring them into a header waits on that component being designed
(`figma-to-component` / `html-to-component` / `project-to-component`). Demoable meanwhile by
wrapping any page in `RequireAuth` and any element in `RoleGate`.

**Reuse for this slice** — `frontend/src/lib/axios.ts` (the 401 interceptor goes here),
`lib/query-client.ts`, `src/hooks/use-auth.ts`, and the auth feature schemas from slice 01.

---

## Testing checklist

- [ ] a signed-in user reloading the page stays signed in (cookie → proxy Bearer → `/auth/me` → cache)
- [ ] closing and reopening the browser keeps the session until the cookie/token expires
- [ ] `/auth/me` returns the **current** role, not the role baked into the token
- [ ] no token, expired token, and deleted user all end as signed-out, never as a crash
- [ ] a 401 is not retried by the query client
- [ ] one page load makes exactly one `/auth/me` request regardless of how many components use `useAuth`
- [ ] a guarded page shows a skeleton while the session loads and only then redirects — no redirect flash for a signed-in user
- [ ] `RoleGate role="admin"` renders nothing for a `user`, and the admin markup is absent from the DOM (not merely hidden by CSS)
- [ ] a 401 mid-session clears the cached session and redirects to `/login?next=<current path>`, and after signing in the user returns to that path
- [ ] `useAuth` is still imported from `src/hooks/use-auth.ts` — no second auth hook was introduced

## Notes / open questions

- Server-side rendering: this plan hydrates the session on the client. If you later want guarded
  pages rendered on the server without a flash, the cookie is already httpOnly and readable in a
  server component / middleware — a follow-up, not a contract change.
