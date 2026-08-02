# Auth Module

> Source: `_docs/prd/PRD.md` §5.1 · Domain: `fullstack` · Phase: MVP
> Status: Ready for planning
> Next step: run `module-planner` against this file.

## Purpose
Accounts, sessions, and the Shopper/Admin role split for Verdant.

## Scope
- Registration with email + password; open signup.
- Login, logout, password reset by email.
- Profile management including saved delivery addresses.
- Role distinction: Shopper vs Admin (admin accounts created manually).

## User stories
- As a Shopper, I can create an account so that my orders and addresses are saved.
- As a Shopper, I can reset my password so that I'm never locked out.
- As an Admin, I can log in so that I can manage the store.

## Functional requirements
1. A visitor can register with email + password and becomes a Shopper.
2. A Shopper can save multiple delivery addresses and mark one default.
3. Only Admin-role users can access admin capabilities.
4. Password reset works via a time-limited email link.

## Dependencies
- **Needs:** —
- **Needed by:** product-catalog (admin CRUD), cart (merge on login), orders, payments, admin

## Edge cases & failure modes
- Registration with an email that already exists.
- Guest with a cart logs in — cart must merge, not vanish.

## Acceptance criteria
- [ ] A new visitor can register, log in, and see their profile.
- [ ] A Shopper cannot reach any admin screen or action.
- [ ] Password reset email arrives and the link expires after use.

## Out of scope
- Social login (Later).
- Multi-role users.
