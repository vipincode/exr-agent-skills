# 03 — Logout

> Status: ready
> Domain: fullstack
> Depends on: 02 (you have to be able to sign in before signing out is demoable)
> Part of: [auth](./auth-plan.md)

## Goal

Let a signed-in shopper sign out from the account menu, clearing the session on the device —
including a shared computer.

## Done when

> A signed-in shopper clicks "Sign out", the session cookie and cached session are gone, and the UI
> is back to its signed-out state.

---

## API contract (this slice)

| Method | Path | Auth | Request body | Success `data` | Errors |
|--------|------|------|--------------|----------------|--------|
| POST | /api/auth/logout | protect | — | — (204, no body) | 401 no/invalid token |

Success — **204 via `noContent(res)`, with no body at all**. The frontend request fn must not try to
parse JSON on this call; that is the single most likely bug in this slice.

Error envelope (from `protect`, if the token is missing or expired):

```json
{ "success": false, "message": "Unauthorized", "code": "UNAUTHORIZED" }
```

Honesty about what this endpoint does: tokens are stateless in this module (master plan, Out of
scope), so server-side this is a **no-op acknowledgement**. The real sign-out is the BFF clearing
the httpOnly cookie. The endpoint exists so that adding a token denylist later is a change of
implementation, not of contract. If you would rather not ship a no-op, delete the backend half and
retag this slice `frontend` — the cookie clear alone satisfies "Done when".

Source: **declared here** (design mode).

---

## Backend half

**Modify** (no new files)

| File | Change |
|------|--------|
| src/modules/auth/auth.controller.ts | add `logout` handler → `noContent(res)` |
| src/modules/auth/auth.routes.ts | `authRouter.post("/logout", protect, ctrl.logout);` |

No schema — there is no body to validate, so no `validate` middleware on this route.

**Service surface** — none added. Do not create an empty `logoutUser` service function just for
symmetry; add one when there is actually a denylist to write to.

**Errors & edge cases**

| Case | Handling |
|------|----------|
| No / expired token | `protect` returns 401 before the handler runs |
| Logging out twice | Second call 401s (cookie already gone). The frontend treats 401 on logout as success — the desired end state is already true |

**Reuse for this slice** — `noContent` (`src/lib/app-response.ts`), `protect`
(`src/middleware/auth.ts`).

**New shared pieces / env vars** — none.

---

## Frontend half

**Types & schema** — none. A 204 has no body, so there is nothing to parse and no schema to write.

**Create**

| File | Purpose |
|------|---------|
| src/features/auth/api/logout.ts | request fn — POSTs `/auth/logout`, returns `void`, swallows 401 |
| src/features/auth/hooks/use-logout.ts | `useLogoutMutation` |
| src/app/api/auth/logout/route.ts | BFF route — forwards with the Bearer header, then clears the cookie (`clearSessionCookie`) on **any** backend outcome |

**Modify**

| File | Change |
|------|--------|
| src/features/auth/index.ts | export the logout hook |
| the app header / account menu | add the "Sign out" item bound to the mutation — see Design gaps |

**Hooks**

- `useLogoutMutation` — on settled (not just success): `queryClient.setQueryData(["auth","session"], null)`, then `queryClient.clear()` to drop every cached query, then redirect to `/login`.
  - `onSettled` rather than `onSuccess` is deliberate: if the token already expired the call 401s,
    and the user must still end up signed out. Never leave a user apparently-signed-in because
    sign-out failed.
  - `queryClient.clear()` matters on a shared computer — a stale products/orders cache surviving a
    sign-out is exactly the leak the brief's shared-computer story is about.

**Data binding map**

| Component (path) | Bound to | Notes |
|---|---|---|
| the header account menu (path TBD — not built yet) | `useLogoutMutation` | menu item, disabled while `isPending` |
| the header account menu | `useAuth().user` | renders sign-out only when a user is present; shows Sign in / Register otherwise |

**States**

- signed-out → the menu shows Sign in / Register instead of Sign out
- pending → item disabled, brief spinner (this call is fast; no full-page blocker)
- error → still sign out locally, redirect anyway; optionally a toast
- success → redirect to `/login`

**Design gaps** — there is **no header, navbar or account menu** anywhere in
`frontend/MODULE_REGISTRY.md` or `src/components/shared/`. A header is a generic piece, so when it
is built it belongs in `src/components/shared/` (per `frontend/ARCHITECTURE.md`), not in
`features/auth/`. Build it with `figma-to-component` / `html-to-component` /
`project-to-component`, then bind it here. Until then this slice can be demoed with a plain
sign-out button placed on any page — the mutation is what is being tested, not the chrome.

**Reuse for this slice** — `frontend/src/lib/axios.ts`, `lib/query-client.ts`, `lib/session.ts`
(`clearSessionCookie`, from slice 01), `src/hooks/use-auth.ts`.

---

## Testing checklist

- [ ] a signed-in user can sign out and the session cookie is cleared (expired `Set-Cookie`, httpOnly path intact)
- [ ] the 204 is handled without attempting to parse a JSON body
- [ ] after sign-out the cached session is `null` and the whole query cache is cleared
- [ ] a request to a protected endpoint after sign-out 401s (no stale Bearer header is attached)
- [ ] signing out with an already-expired token still ends signed out locally (401 treated as success)
- [ ] signing out twice is harmless
- [ ] the header shows signed-out actions immediately, without a manual reload

## Notes / open questions

- Server-side revocation (denylist / session table) is out of scope module-wide; a token stolen
  before sign-out stays valid until it expires. The contract above accommodates adding it later.
