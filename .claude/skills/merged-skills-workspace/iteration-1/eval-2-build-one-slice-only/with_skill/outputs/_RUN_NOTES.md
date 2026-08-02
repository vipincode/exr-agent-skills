# Run notes — eval-2 (build one slice only), with_skill

Skill under test: `module-builder`. User prompt: "ok the auth plan looks good, go ahead and build it".
Slice picked: **01-register** (lowest-numbered slice whose `Status:` was not `built`). Slices 02 and
03 were deliberately NOT built.

## Files created

Backend
- `backend/src/lib/jwt.ts` — new shared piece: `signAccessToken` (JOSE, HS256, 7d, `JWT_SECRET`)
- `backend/src/modules/auth/auth.constants.ts`
- `backend/src/modules/auth/auth.model.ts` — `User` model (unique email, `passwordHash` `select: false`)
- `backend/src/modules/auth/auth.schema.ts` — `registerBody`
- `backend/src/modules/auth/auth.types.ts` — `PublicUser`, `AuthResult`
- `backend/src/modules/auth/auth.service.ts` — `registerUser`
- `backend/src/modules/auth/auth.controller.ts` — `register`
- `backend/src/modules/auth/auth.routes.ts` — `authRouter`
- `backend/.env.example` — `JWT_SECRET`

Frontend
- `frontend/src/features/auth/schema/register.schema.ts`
- `frontend/src/features/auth/api/register.ts`
- `frontend/src/features/auth/hooks/use-register.ts`
- `frontend/src/features/auth/constants/auth.ts`
- `frontend/src/features/auth/template/register-form.tsx` (STOPGAP form — flagged)
- `frontend/src/features/auth/index.ts`

## Files modified
- `backend/src/app.ts` — mounted `authRouter` at `/api/auth`
- `backend/MODULE_REGISTRY.md` — auth module row, shared `src/lib/jwt.ts`, env var, decisions log
- `frontend/MODULE_REGISTRY.md` — auth feature row, updated `useAuth` row, decisions log
- `frontend/src/hooks/use-auth.ts` — **extended** (not forked) with `setSession` / `clearSession`
- `_docs/features/auth/01-register.md` — `Status: built` + build notes
- `_docs/features/auth/auth-plan.md` — build-order row 01 → `built`

## Could not do
- **Typecheck / lint / build were not run.** This checkout has no `package.json`, no `tsconfig.json`
  and no `node_modules` in either project dir (verified by `ls`), and dependency installation was
  out of bounds. Nothing was compiled; correctness is by inspection only.
- Could not read `backend/src/middleware/auth.ts`, `backend/src/middleware/validate.ts` or
  `backend/src/lib/app-error.ts` — they are referenced by the existing products module but absent
  from this partial checkout. They were imported at the paths products already uses.
  Risk: if `middleware/auth.ts` already exports a token **signer**, `src/lib/jwt.ts` duplicates it.
- Could not read `components/shared/form/input-field.tsx` or `components/ui/button.tsx` (absent from
  the checkout, but exported by `components/shared/form/index.ts` / implied by the shadcn stack), so
  `InputField` / `Button` prop shapes are assumed conventional.
- No `/register` page or route was created — the slice does not specify one.

## Closing hand-off message (verbatim)

---

I built **slice 01 — Register** only. You said "build it" without naming a slice, so I took the
lowest-numbered slice that wasn't `built`; 02 (login) and 03 (logout) are untouched and still
`ready`, which is the checkpoint the sharded plan is for.

**What was built**

Backend — `POST /api/auth/register`, public, `201` with `{ user: { id, email, name, role }, token }`
exactly as the slice's contract says:
- `backend/src/modules/auth/auth.model.ts` — `User`, unique index on `email`, `passwordHash` with
  `select: false`
- `backend/src/modules/auth/auth.schema.ts` — `registerBody` (email lowercased, password ≥ 8, name 1–80)
- `backend/src/modules/auth/auth.service.ts` — `registerUser(input): Promise<{ user, token }>`;
  bcrypt cost 10, maps to `PublicUser` explicitly, duplicate email → `ConflictError` via the unique
  index (error 11000), not a read-then-write check
- `backend/src/modules/auth/auth.controller.ts`, `auth.routes.ts`, `auth.types.ts`, `auth.constants.ts`
- mounted at `/api/auth` in `backend/src/app.ts`

Frontend — `frontend/src/features/auth/`: `schema/register.schema.ts` (request + envelope schemas,
types via `z.infer`), `api/register.ts` (shared axios → same-origin `/api/auth/register` → BFF
catch-all; unwraps the envelope and Zod-parses `data` so drift throws), `hooks/use-register.ts`
(`useRegisterMutation`; stores the session and invalidates `["auth","session"]`),
`constants/auth.ts`, `index.ts`.

**What was reused** (the dedup gate, with paths)
- `backend/src/lib/app-response.ts` — `created()` for the 201; no hand-rolled success shape
- `backend/src/lib/app-error.ts` — `ConflictError`; no new error class
- `backend/src/middleware/validate.ts` — `validate({ body })`; no per-module validation helper
- No `asyncHandler` — Express 5 forwards rejections, matching the products module
- `frontend/src/lib/axios.ts` — the one axios instance; no second client, no absolute backend URL
- `frontend/src/app/api/[...path]/route.ts` — the catch-all already covers `/api/auth/*`, so no
  feature BFF route was added
- `frontend/src/components/shared/form/index.ts` — `InputField` for all three fields
- `frontend/src/hooks/use-auth.ts` — **extended** rather than forked (see below)

**What was newly registered**
- `backend/src/lib/jwt.ts` → `signAccessToken` (JOSE HS256, 7d, `JWT_SECRET`) — the slice's
  "JWT helpers, if the backend doesn't already ship them". `protect` already exists (products uses
  it), so I did not touch verification. Registered in `backend/MODULE_REGISTRY.md` along with the
  `auth` module row, the `JWT_SECRET` env var, and the decisions log.
- `frontend/MODULE_REGISTRY.md` — the `auth` feature row, the updated `useAuth` row, and decisions.
- `backend/.env.example` created with `JWT_SECRET` (there is no env-schema file in this checkout to
  add it to — flagging that).

**Verification — did not run, and I'm not claiming it passed.** Neither project dir has a
`package.json`, `tsconfig.json`, or `node_modules` in this checkout, so `typecheck` / `lint` /
`build` could not be executed and I did not install anything. Everything below is by inspection.
Two more consequences of the partial checkout: `middleware/auth.ts`, `middleware/validate.ts` and
`lib/app-error.ts` aren't on disk (products imports them, so I imported the same paths) — if
`middleware/auth.ts` already exports a token *signer*, my `lib/jwt.ts` duplicates it and should be
deleted in favour of that. Likewise `InputField` and `Button` prop shapes are assumed.

**Three things I decided on your behalf, flagged**
1. **Error-envelope conflict.** The slice and the plan write errors as
   `{ success: false, error: { code, message } }`, but `backend/ARCHITECTURE.md` says the existing
   error middleware emits `{ success: false, message, code }`. ARCHITECTURE.md wins — it describes
   the real middleware — so the backend follows it and the form reads `message` first with
   `error.message` as fallback. **Please reconcile the plan text before slice 02.**
2. **The stopgap register form.** The slice flagged that no register-form design exists and
   authorised a minimal shared-`*Field` form as a stopgap. I built exactly that at
   `features/auth/template/register-form.tsx` — no design work, no new components. Replace it with
   `figma-to-component` / `html-to-component` when a design lands. There is also no `/register`
   page yet; `RegisterForm` is exported but not routed.
3. **`useAuth` was a read-only stub** (`{ user: null }`) with no way to store a session. Rather than
   create a parallel auth store inside the feature — a duplicate — I extended the shared hook with
   `setSession` / `clearSession` backed by localStorage. Related open item: the plan says the BFF
   sends the bearer token, but the proxy implementation is elided here and localStorage isn't
   readable server-side, so **nothing attaches `Authorization` yet**. Settle that (httpOnly cookie
   or an axios interceptor) before slice 03, which needs a guarded call.

**Test this slice now** — it's small and fresh, and the slice carries its own definition of done:
- [ ] valid submission creates the user and returns the envelope above
- [ ] duplicate email returns 409 and the form shows it inline on the email field
- [ ] a password shorter than 8 characters is rejected client-side before any request
- [ ] `passwordHash` never appears in any response body
- [ ] the response is envelope-unwrapped and schema-validated (a drifted payload errors, never renders garbage)
- [ ] success stores the session and redirects

Run `test-writer` and point it at this slice — it reads that checklist as its spec. `code-review`
alongside it will check conformance against ARCHITECTURE.md and the registries. I haven't run
either; your call.

**What's next** — slice **02 — Login** (`_docs/features/auth/02-login.md`, depends on 01, now
unblocked); it reuses `registerUser`'s token-signing path via `signAccessToken`. Still open: the
register-form design, the header user menu that slice 03 needs, and the BFF token forwarding.

---
