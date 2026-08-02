# Run notes — eval-2 (old_skill), fixture `fx-build-legacy`

## Skills used
Both, in sequence — the repo is a fullstack workspace (`.claude/workspace.json` has `backend` +
`frontend`) and there is an approved plan on each side:

1. `backend-module-builder` (+ `references/dedup-protocol.md`, `references/module-anatomy.md`)
   driven by `backend/_docs/FEATURE_PLAN_auth.md`.
2. `frontend-module-builder` (+ `references/dedup-protocol.md`, `references/binding-anatomy.md`)
   driven by `frontend/_docs/FEATURE_PLAN_auth.md`.

Project dirs resolved via `../LAYOUT.md` → `.claude/workspace.json` (`backend/`, `frontend/`).
Plans are in the legacy `<proj>/_docs/FEATURE_PLAN_<name>.md` location, which LAYOUT.md says to
read as-is.

## Files created
Backend (`backend/`):
- `src/modules/auth/auth.model.ts` — `User` model (unique email, `passwordHash` `select:false`)
- `src/modules/auth/auth.schema.ts` — `registerSchema`, `loginSchema` (+ `z.infer` types)
- `src/modules/auth/auth.service.ts` — `registerUser`, `loginUser`, DTO mapping
- `src/modules/auth/auth.controller.ts` — `register`, `login`, `logout`
- `src/modules/auth/auth.routes.ts` — `authRouter`
- `src/modules/auth/auth.constants.ts` — roles, bcrypt cost, dummy hash, messages *(beyond the
  plan's Create table — added to keep magic literals out of the service, per the skill's
  placement rules; flagged to the user)*
- `src/modules/auth/auth.utils.ts` — `hashPassword`, `verifyPassword`, `isDuplicateKeyError`
  *(also beyond the plan's Create table, same reason)*
- `src/lib/jwt.ts` — `signAccessToken` (JOSE HS256, `JWT_SECRET`, 30d) — new shared piece

Frontend (`frontend/`):
- `src/features/auth/schema/auth.schema.ts`
- `src/features/auth/types/auth.ts`
- `src/features/auth/constants/auth.ts`
- `src/features/auth/api/register.ts`, `api/login.ts`, `api/logout.ts`
- `src/features/auth/hooks/use-register.ts`, `hooks/use-login.ts`, `hooks/use-logout.ts`
- `src/features/auth/index.ts` (barrel)

*(`types/`, `constants/`, `index.ts` are beyond the plan's Create table — required by the
feature-module anatomy in `binding-anatomy.md`.)*

## Files modified
- `backend/src/app.ts` — mounted `authRouter` at `/api/auth`
- `backend/MODULE_REGISTRY.md` — auth module row, shared/middleware/env tables, decisions log
- `frontend/MODULE_REGISTRY.md` — auth feature row + decisions log

## Plan files
Neither `FEATURE_PLAN_auth.md` was edited. These skills have no "mark the plan built" step (that
belongs to the newer slice-based `module-builder`), so both plans are unchanged and still say
`Status: draft`.

## Reused (dedup gate outcome — nothing recreated)
`src/lib/app-response.ts` (`ok`/`created`/`noContent`), `src/lib/app-error.ts`
(`ConflictError`/`UnauthorizedError`), `src/middleware/validate.ts`, `src/middleware/auth.ts`
(`protect`), `frontend/src/lib/axios.ts`, the catch-all BFF proxy
`frontend/src/app/api/[...path]/route.ts`. No new BFF route, no second axios instance, no
re-implemented `protect`.

## Could not do
- **Typecheck / lint / build did not run.** There is no `package.json`, `tsconfig.json`, or
  `node_modules` anywhere in the fixture; `npx tsc --noEmit` in `backend/` refused to run
  ("This is not the tsc command you are looking for"). The code is **unverified** — no
  compilation was performed and none was claimed. No dependencies were installed.
- **The auth design was not built.** `features/auth/template/register-form.tsx`,
  `login-form.tsx`, and the header user menu don't exist (the plan itself lists this under
  "Design gaps"). Per the skill's "bind the design, don't rebuild it" guardrail these were
  flagged, not invented, so nothing is wired to the hooks yet.
- **Session persistence not wired.** `frontend/src/hooks/use-auth.ts` is a read-only stub
  (`{ user: null }`) with no `setSession`/`clearSession`, so the hooks only invalidate the
  `["auth"]` keys.
- **`JWT_SECRET` not added to an env schema / `.env.example`** — neither file exists in the
  fixture. `src/lib/jwt.ts` throws if the var is missing.
- Dependencies the code imports but the fixture cannot confirm are installed: `bcrypt`
  (+ `@types/bcrypt`), `jose`, `mongoose`, `@tanstack/react-query`, `zod`.

## Closing hand-off message (verbatim)

Built the auth feature on both sides of the workspace — backend module + frontend binding — from the two approved plans. I used **backend-module-builder** and **frontend-module-builder** (this is a fullstack repo with a plan on each side).

**Backend — `backend/src/modules/auth/`** (mounted at `/api/auth` in `src/app.ts`)

| File | What it does |
|---|---|
| `auth.model.ts` | `User` model — unique lowercased `email`, `passwordHash` with `select: false`, `role` enum defaulting to `"user"` |
| `auth.schema.ts` | `registerSchema` / `loginSchema` (Zod 4, `z.email()`), types via `z.infer` |
| `auth.service.ts` | `registerUser` / `loginUser`, DTO mapping that can't leak `passwordHash` |
| `auth.controller.ts` | thin handlers using `created` / `ok` / `noContent`, no try/catch |
| `auth.routes.ts` | `POST /register`, `POST /login` (public, validated), `POST /logout` (`protect`, 204) |
| `auth.constants.ts` | roles, bcrypt cost, the dummy-compare hash, the shared error copy |
| `auth.utils.ts` | `hashPassword` / `verifyPassword` / `isDuplicateKeyError` (module-local) |

Two behaviors from the plan worth calling out: register conflicts both on a pre-check **and** on the unique-index duplicate-key error, so concurrent submits still 409; and login always compares a bcrypt hash — a dummy one when the email is unknown — so 401 is indistinguishable between "no such account" and "wrong password".

**Frontend — `frontend/src/features/auth/`** — the binding layer only: `schema/`, `types/`, `constants/`, `api/register|login|logout.ts`, `hooks/use-register|use-login|use-logout.ts`, and a barrel `index.ts`. Requests go through the shared axios `api` → `/api/...` → the catch-all BFF proxy; responses are envelope-unwrapped and Zod-parsed; all three are TanStack Query mutations keyed under `["auth"]`.

**Reused, not recreated** (this is the dedup gate doing its job): `src/lib/app-response.ts`, `src/lib/app-error.ts`, `src/middleware/validate.ts`, `src/middleware/auth.ts` (`protect` — the plan's "protect + JWT helpers, if not already shipped" turned out to be already shipped, so I only added a **signer**), `frontend/src/lib/axios.ts`, and `frontend/src/app/api/[...path]/route.ts` (no new BFF route needed).

**Newly registered:** `src/lib/jwt.ts` (`signAccessToken`, JOSE HS256, 30d) plus the `auth` rows and decision logs in both `MODULE_REGISTRY.md` files.

Now the things you need to know, because several of them block "done":

1. **I could not typecheck or build any of this.** There's no `package.json`, `tsconfig.json`, or `node_modules` in either project, and `npx tsc --noEmit` refused to run. I did not install anything. So treat all of this as **written but unverified** — please run your real typecheck before trusting it. The code imports `bcrypt` (+ `@types/bcrypt`), `jose`, `mongoose`, `zod`, and `@tanstack/react-query`; make sure `bcrypt` in particular is actually a dependency, since nothing in the repo confirmed it.
2. **The auth screens don't exist, so nothing is wired yet.** The frontend plan's Data mapping points at `features/auth/template/register-form.tsx`, `login-form.tsx`, and a header user menu — none of them are in the repo, and the plan itself lists this under "Design gaps". I deliberately did **not** invent them; that's `figma-to-component` / `html-to-component` work. Once they exist, they consume `useRegister` / `useLogin` / `useLogout` as-is.
3. **Contract mismatch between the two plans — logout.** The frontend plan records `data: null`, but the backend plan and route return **204 with an empty body**. `api/logout.ts` accepts both, but you should fix one of the plans so the contract has a single answer.
4. **Session storage isn't wired.** The plan says the mutations "store/clear the session via `useAuth`", but `frontend/src/hooks/use-auth.ts` is a read-only stub with no `setSession`/`clearSession`. Turning that shared hook into a real session store is a change to shared code that's outside this plan, so I flagged it in the hooks (`onSuccess` / `onSettled` only invalidate `["auth"]`) rather than inventing an API for it. Say the word and I'll do it as its own change.
5. **`JWT_SECRET` isn't in an env schema or `.env.example`** — neither file exists here. `src/lib/jwt.ts` throws at signing time if it's unset.
6. Two small **scope notes**: I added `auth.constants.ts` + `auth.utils.ts` on the backend and `types/` + `constants/` + `index.ts` on the frontend, which aren't in the plans' Create tables. They're required by the skills' placement rules (no magic literals, no ad-hoc inline types, feature-module anatomy). Delete them if you'd rather inline that.
7. Both `FEATURE_PLAN_auth.md` files are untouched and still say `Status: draft`.

Tests are a separate step — say the word and I'll run `backend-test-writer` / `frontend-test-writer`; I didn't write any here.
