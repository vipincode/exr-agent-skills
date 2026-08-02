# Slice template

Write one file per slice to `_docs/features/<module>/NN-<slice-name>.md` — zero-padded number,
kebab-case name. **The number is the build order.**

A slice is what `module-builder` actually executes, so it must be self-contained enough to build
from (with the master plan open alongside for the data model and module-wide decisions). Two
sections are load-bearing and must never be omitted: **Status** (how work resumes across sessions)
and **API contract** (the single shape both halves follow).

```markdown
# 01 — Register

> Status: ready          ← ready | blocked | built
> Domain: fullstack      ← backend | frontend | fullstack
> Depends on: —          ← earlier slice numbers, or another module
> Part of: [auth](./auth-plan.md)

## Goal
One sentence: what capability this slice adds.

## Done when
The demoable outcome. If this can't be written in one sentence, the slice is cut wrong.
> A visitor can submit the register form and land authenticated, with the user persisted.

---

## API contract (this slice)

**The single source of truth for this slice.** The backend half implements it; the frontend half
binds to it. Neither half restates the shape — they both point here. In observe mode, every fact
carries its source.

| Method | Path | Auth | Request | Success `data` | Errors |
|--------|------|------|---------|----------------|--------|
| POST | /auth/register | public | `{ email, password, name }` | `{ user: { id, email, name, role }, token }` | 409 email taken · 422 validation |

Success envelope:
```json
{ "success": true, "data": { "user": { "id": "…", "email": "…", "name": "…", "role": "user" }, "token": "…" }, "message": "Registered" }
```

Error envelope:
```json
{ "success": false, "error": { "code": "CONFLICT", "message": "Email already registered" } }
```

Source: **declared here** — or — **observed from `backend-shoply/src/modules/auth/auth.controller.ts:42`**

---

## Backend half
(or "n/a — frontend-only slice")

**Create**

| File | Purpose |
|------|---------|
| src/modules/auth/auth.schema.ts | Zod input schemas |
| src/modules/auth/auth.service.ts | business logic |
| src/modules/auth/auth.controller.ts | HTTP handlers |
| src/modules/auth/auth.routes.ts | router (mounted in src/app.ts) |

**Validation** — per schema: fields, formats, constraints, create-only vs updatable.

**Service surface** — the functions this slice exposes for other modules to call
(`registerUser(input): Promise<AuthResult>`), so later slices import rather than re-implement.

**Errors & edge cases** — `<case>` → `<which error class / status>`. Duplicate email, weak password,
race on concurrent register, whatever genuinely needs handling.

**Reuse for this slice** — the subset of the master plan's reuse list this slice actually imports.

**New shared pieces / env vars** — or "none".

---

## Frontend half
(or "n/a — backend-only slice")

**Types & schema** — mirroring the contract above, derived from the schemas (never a parallel
hand-written interface that can drift).

**Create**

| File | Purpose |
|------|---------|
| src/features/auth/schema/register.schema.ts | request + response schemas |
| src/features/auth/api/register.ts | request fn (unwraps envelope, parses response) |
| src/features/auth/hooks/use-register.ts | mutation hook |

**Hooks** — keys, what each invalidates on success, optimistic vs invalidate-on-success.

**Data binding map** — which already-built component consumes which field, by path, plus any
transform.

| Component (path) | Bound to | Notes |
|---|---|---|
| src/features/auth/template/register-form.tsx | useRegister mutation | replace the stubbed onSubmit |
| src/features/auth/components/role-badge.tsx | data.user.role | — |

**States** — loading, empty, error, plus the slice-specific ones (submit-pending, 409 shown inline
on the email field, redirect on success).

**Design gaps** — components this binding needs that aren't built yet, and which skill builds them
(`figma-to-component` / `html-to-component` / `project-to-component`). Plan the binding anyway.
(or "none — the design is fully built")

**Reuse for this slice** — the subset of the master plan's reuse list this slice imports.

---

## Testing checklist

Behavior a correct build must satisfy — concrete, checkable, not test code. `test-writer` uses this
as its spec after the slice lands, and it doubles as the slice's definition of done.

- [ ] valid submission creates the user and returns the envelope above
- [ ] duplicate email returns 409 and the form shows it inline on the email field
- [ ] password below the minimum is rejected client-side before any request
- [ ] the response is envelope-unwrapped and schema-validated (a drifted payload errors, never renders garbage)
- [ ] success stores the session and redirects

## Notes / open questions
Anything specific to this slice the user still has to decide.
```

## When a slice is blocked

Write the file anyway, with `Status: blocked` and the reason stated in the section that can't be
filled — then give the unblock path plainly:

```markdown
> Status: blocked — the orders API this binds to does not exist yet.
> Unblock: plan and build the orders module first (module-planner → module-builder),
> or paste a sample request/response and this slice can be re-planned against it.
```

A predictable file with an honest blocked banner is what the user and `module-builder` expect.
Fabricating a contract to fill the gap, or skipping the file, are both failures.
