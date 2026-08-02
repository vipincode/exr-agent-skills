# Run notes — eval-0-plan-auth-fullstack-sharded (old skills)

## Skills used

**Both**, because the task is explicitly fullstack ("backend and the frontend binding both") and the
brief is tagged `Domain: fullstack`. Neither old skill covers both halves:

- `backend-feature-planner` — designs the server-side auth module (models, endpoints, validation,
  errors). Its description matches "plan the auth feature" / "design the module" for a server-side API.
- `frontend-feature-planner` — plans how the frontend binds to those endpoints. Its description
  matches "bind this design to the auth endpoints".

Run order was backend → frontend, because the frontend skill's signature step (Step 2, "learn the
REAL API contract") reads the backend. That ordering is not stated anywhere in either skill — I had
to infer it.

## Files created

| Path (relative to repo root) | By which skill |
|---|---|
| `backend/_docs/FEATURE_PLAN_auth.md` | backend-feature-planner (Step 4) |
| `frontend/_docs/FEATURE_PLAN_auth.md` | frontend-feature-planner (Step 6) |

No source files were modified. Both skills are plan-only.

### Path conflict I had to resolve
`backend-feature-planner` Step 4 and `frontend-feature-planner` Step 6 both say write to
`_docs/FEATURE_PLAN_<name>.md` **under the project dir**. But `../LAYOUT.md` — which both skills cite
for path resolution — says "**All planning docs live at the repo root under `_docs/`, never inside a
project dir**", and lists `<proj>/_docs/FEATURE_PLAN_<name>.md` under a heading literally called
"**Legacy**". The repo also already has the brief at repo-root `_docs/features/auth/auth-module.md`.

I followed the SKILL.md bodies (project dir), since that is what the skills instruct verbatim. **This
is a real conflict in the old skills** and the resulting layout is arguably wrong: the auth docs are
now split across three directories (`_docs/features/auth/` for the brief, `backend/_docs/` and
`frontend/_docs/` for the plans) instead of the single per-module folder LAYOUT.md prescribes.

## Questions I would have asked (user absent → defaults assumed, all flagged in the plans)

Backend:
1. Token transport — access token in the JSON body + httpOnly refresh cookie (assumed), or
   cookie-only for both? Assumed body+cookie: `ARCHITECTURE.md` fixes `protect` to Bearer, but the
   brief requires staying signed in across browser restarts, and a body-only token can't do that.
2. Email provider for the reset link (Resend / SES / Postmark / SMTP)? Assumed a swappable
   `src/lib/mailer.ts` seam with SMTP + dev console transport.
3. Password hashing — argon2id (assumed) or bcrypt?
4. Is the first admin promoted manually / by seed script? Assumed yes; no admin-creation endpoint.
5. Is `name` collected at registration? Assumed optional.

Frontend:
6. Does the elided BFF proxy forward `Authorization`, `Cookie` and `Set-Cookie`? Assumed yes —
   if not, nothing in the plan works.
7. Should I build the missing auth UI, or does `figma-to-component`/`html-to-component` run first?
   Assumed the designs get built first; planned the binding regardless (per Step 3 of the skill).
8. Route guarding via `middleware.ts` (assumed) or per-page server checks?
9. Error surface — inline form errors (assumed) or add a shared toast to the registry?

Questions I deliberately did **not** ask (already settled by the contracts/brief, per each skill's
"decide what is already answered" step): response envelope, error model, validation library, auth
guards, role model (brief: single role), open registration (brief: no invite flow), password reset in
scope (brief), data-fetching library, form components, feature-module anatomy, BFF transport.

## What I could not do

1. **Sharding — the headline gap.** The user asked, unambiguously, for "register first, then login,
   then logout etc, one at a time" and explicitly *not* one giant plan. **Neither old skill has any
   sharding step.** Both templates are single-document, and their handoff text points at
   `backend-module-builder` / `frontend-module-builder` to execute the whole plan in one pass.
   Best I could do inside the skills was add a "Build order — one slice at a time" table to each plan
   (the templates do say "Add/remove any section"). The user still receives **two large documents**,
   not six small buildable slice files, and there is no `Status: ready|blocked|built` per slice, so
   nothing tracks a resume point across sessions. This is the clearest miss of the run.

2. **One contract, declared once.** Because the skills are separate, the API contract is written
   **twice** — authored in the backend plan, then re-transcribed into the frontend plan. That is
   exactly the type-drift risk `frontend-feature-planner` exists to prevent, reintroduced by the
   split. I mitigated it by naming the backend plan the contract owner and marking the frontend
   table "PROPOSED, NOT OBSERVED", but the duplication is structural.

3. **Frontend contract could not be observed → plan is BLOCKED.** Correctly, per the skill's ladder:
   rung 1 (backend source) has no `auth` module — `backend/src/modules/` contains only `products`;
   rung 3 no spec; rung 4 no sample. Only rung 2 (backend `ARCHITECTURE.md`) yielded the envelope and
   error model. So the frontend plan is `Status: BLOCKED` with the endpoints marked proposed. Note
   the awkwardness: within a single fullstack request the frontend half is *always* blocked when the
   backend is being designed in the same run — the old skills have no notion of "planned contract".

4. **The frontend skill's premise doesn't hold here.** It assumes "the design already exists, now
   make it functional". `src/features/` contains only `products` — there is **no auth UI at all**, so
   every auth screen is a design gap. I planned the binding anyway (Step 3 says to) and listed the
   six missing components.

5. **Missing files in the fixture, flagged not assumed.** `backend/ARCHITECTURE.md` documents
   `protect`/`requireRole`/`validate`, and `products.controller.ts` imports `../../lib/app-error.js`,
   but `src/middleware/auth.ts`, `src/middleware/validate.ts`, `src/lib/app-error.ts` and any
   `src/lib/jwt.ts` are **not on disk**. Same on the frontend: `lib/query-client.ts` and
   `app/providers.tsx` are in `MODULE_REGISTRY.md` but absent, and the BFF proxy body is elided.
   I listed them as Reuse (on the strength of the contract files, so the plan doesn't duplicate them)
   with an explicit "verify before building" warning, rather than silently planning replacements.

6. **No cross-skill sequencing.** Nothing in either skill tells the agent to run the sibling for the
   other half, or in which order. A user who only ran one of them would get half a plan with no hint
   that the other half exists.
