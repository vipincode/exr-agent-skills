# 03 — Logout

> Status: ready
> Domain: fullstack
> Depends on: 02
> Part of: [auth](./auth-plan.md)

## Goal
Let a signed-in user sign out and clear their session.

## Done when
Clicking sign out clears the session, and protected pages then redirect to login.

---

## API contract (this slice)

| Method | Path | Auth | Request | Success `data` | Errors |
|--------|------|------|---------|----------------|--------|
| POST | /auth/logout | protect | — | `null` | 401 not signed in |

Source: **declared here**

---

## Backend half

**Create** — a `logout` controller handler and route, guarded by `protect`. Returns 204 via the
shared `noContent` helper.

**Errors & edge cases** — calling it without a valid token returns 401 from `protect`; that is not
an error this module handles itself.

---

## Frontend half

**Create** — `api/logout.ts`, `hooks/use-logout.ts`.

**Hooks** — `useLogout` mutation. On success, clear the session via `useAuth` and invalidate every
`["auth", ...]` key.

**Data binding map**

| Component (path) | Bound to | Notes |
|---|---|---|
| the header user menu | `useLogout` mutation | sign-out item |

**States** — optimistic clear is acceptable here; if the request fails the session is already gone
locally, which is the safe direction.

**Design gaps** — no header user menu exists yet. Flag it; don't build it here.

---

## Testing checklist

- [ ] logout clears the stored session
- [ ] a protected page after logout redirects to login
- [ ] logout without a session returns 401 and does not crash the UI
- [ ] auth query keys are invalidated on success

## Notes / open questions
None.
