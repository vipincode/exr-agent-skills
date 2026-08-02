# Auth Module

> Source: `_docs/prd/PRD.md` §5.1 · Domain: `fullstack` · Phase: MVP
> Status: Ready for planning
> Next step: run `module-planner` against this file.

## Purpose
Let shoppers create an account, sign in, and stay signed in across visits, and let the app tell
admins apart from regular customers.

## Scope
In: self-serve registration with email + password, sign-in, sign-out, "forgot password" reset by
emailed link, and a single role per user (`user` or `admin`).
Out: social login, two-factor, organisations/teams, per-permission RBAC.

## User stories
- As a visitor I can create an account with my email and a password so I can check out faster next time.
- As a returning shopper I can sign in and stay signed in so I don't retype my password every visit.
- As a signed-in shopper I can sign out, including from a shared computer.
- As a shopper who forgot my password I can request a reset link by email and choose a new password.
- As an admin I see admin-only controls that regular shoppers never see.

## Functional requirements
- Email must be unique; a second signup with the same email is rejected with a clear message.
- Passwords are at least 8 characters and are never stored or returned in plaintext.
- Sign-in with wrong credentials gives the same generic message whether the email exists or not.
- A reset link expires after a limited window and works only once.
- The signed-in user's role is available to the UI so admin-only controls can be hidden.

## Acceptance criteria
- A new shopper can register and land signed in, without a separate sign-in step.
- A returning shopper closing and reopening the browser is still signed in.
- Signing out clears the session; protected pages then redirect to sign-in.
- Requesting a reset for an unknown email reveals nothing about whether the account exists.

## Edge cases
- Duplicate email registration (concurrent submits).
- Reset link used twice, or after expiry.
- Session expiring mid-session on a protected page.

## Dependencies
None — this is the first module. Cart, orders, and admin all depend on it.

## Notes
Registration is open to anyone; there is no invite flow.
