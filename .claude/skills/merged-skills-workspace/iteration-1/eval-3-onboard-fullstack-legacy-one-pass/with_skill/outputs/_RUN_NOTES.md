# Run notes — eval-3 (project-onboard, fullstack legacy, one pass)

## Files created (5) — all new, none pre-existing

| Path (relative to repo root) | What it is |
| --- | --- |
| `.claude/workspace.json` | The merged manifest — **one** file with **both** domain entries, written in a single pass |
| `api/ARCHITECTURE.md` | Descriptive backend contract |
| `api/MODULE_REGISTRY.md` | Seeded backend dedup ledger |
| `web/ARCHITECTURE.md` | Descriptive frontend contract |
| `web/MODULE_REGISTRY.md` | Seeded frontend dedup ledger |

Manifest contents:

```json
{
  "projects": [
    { "domain": "backend", "path": "api", "stack": "express-ts" },
    { "domain": "frontend", "path": "web", "stack": "vite-react" }
  ]
}
```

## Source files modified: NONE

Verified two ways:

- `diff -rq fixtures/fx-onboard-legacy <repo>` reports **only** the 5 additions above and
  no content differences in any existing file.
- `git status --porcelain` shows only the untracked eval directory; no tracked file changed.

No file was edited, moved, renamed, refactored, or deleted. No dependency was installed and
no `package.json` was touched. Every finding below is reported, not fixed.

## Questions I would have asked (user absent → defaults applied and flagged)

Step 2 of the skill only permits questions where the codebase is genuinely *conflicting*.
Three qualified. The user was not present, so I proceeded with the most sensible default in
each case and recorded the choice in the contract.

1. **Backend — two identical date helpers. Which is canonical?**
   `api/src/utils/formatDate.ts#formatDate` and
   `api/src/services/report.service.ts#toDayString` are the same logic
   (`d.toISOString().slice(0, 10)`), and the source even carries comments admitting it.
   **Default applied:** `utils/formatDate.ts` is canonical (it is the one already in the
   shared `utils/` layer). Registered as such; `toDayString` recorded as a duplicate to
   collapse later. Neither file was changed.

2. **Backend — is Joi + `validateBody` the canonical validation approach for new modules,
   given it is currently dead code?**
   `middleware/validate.ts` exists and Joi is a dependency, but no route uses it and no
   schema files exist — so "the repo's validation convention" had to be inferred rather
   than observed.
   **Default applied:** yes — Joi via `validateBody` is recorded as the approach, and new
   write routes should be its first consumers. Explicitly **not** switched to Zod.

3. **Frontend — reads go through SWR, but `LoginForm` posts with `apiClient` directly from
   the component. Should new mutations get an api-module layer, or keep inline calls?**
   **Default applied:** recorded the observed split as the convention (SWR `use*` hooks for
   reads, `apiClient` for writes, one instance for both), and raised "no mutation-hook
   layer" as a finding rather than inventing a layer that does not exist.

Also flagged as an **assumption, not a question**: no lockfile is committed in either
project, so the package manager is recorded as **npm (assumed)** in both contracts.

Projects to onboard were **not** ambiguous — `api/` (Express + `src/`) and `web/`
(React/Vite + `src/`) map cleanly to backend and frontend, so no disambiguation question
was needed. Both were onboarded in one pass.

## Findings reported to the user (recorded, never auto-fixed)

### Backend (`api/`)
- Duplicate date helper (`utils/formatDate.ts` vs `report.service.ts#toDayString`).
- `POST /api/products` is wired to `controller.list`, not a `create` handler — looks like a
  real bug.
- `middleware/validate.ts` is dead code; no Joi schema files exist anywhere.
- `bcryptjs` installed but unused; `User` model exists with **no** routes/controller/service
  and **no** token-issuing helper — auth is entirely unbuilt despite the guards.
- `services/report.service.ts#dailyStockReport()` has no controller/route — unreachable
  over HTTP.
- No Mongoose/Joi error normalization: `CastError`, duplicate-key `11000`, and
  `ValidationError` surface as raw 500s with the driver's message.
- Error messages/stacks are not suppressed in production.
- Raw `process.env` reads scattered across `index.ts` and `middleware/auth.ts`, unvalidated.
- No `app.ts`/`server.ts` split; no helmet/compression/rate-limit; `strict: false`.
- jest + supertest installed, `npm test` → `jest`, but no config and no tests.
- Express 4 is EOL-track — noted as a recommendation only; the contract records
  `catchAsync` as **mandatory**, exactly as the repo does it.

### Frontend (`web/`)
- **Frontend/backend contract mismatch (the biggest one):** `useUsers` fetches `/users` and
  `LoginForm` posts `/auth/login`, but the backend only exposes `/api/products` and
  `/health`. `VITE_API_URL` also lacks the `/api` prefix the backend mounts under.
- Auth unimplemented: login response is discarded — no token storage, no axios interceptor,
  no session context, no logout, no route protection on `/`.
- No shared form-field layer; `LoginForm`'s **password field has no `error`/`helperText`
  binding**, so its validation errors never render.
- `UsersPage` handles `isLoading` but drops SWR's `error` — no error-UI convention exists.
- `components/Card.tsx` uses `React.ReactNode` without importing React (compiles only via
  the global UMD type).
- `<CssBaseline/>` not mounted; no global stylesheet.
- `npm run lint` is `eslint .` but no ESLint config is committed — the script fails.
- jest + `@testing-library/react` installed with no transform config and no tests.
- No BFF — noted **without alarm**, per the reference guidance: a pure Vite SPA has no
  server to host one, so direct-to-backend is expected here.

## Descriptive-not-prescriptive check

The two contracts record the repo as it is, and explicitly reject the bootstrap defaults:

| Bootstrap default | What was recorded instead |
| --- | --- |
| Express 5, no async wrapper | **Express 4, `catchAsync` mandatory** |
| `{ success, data }` + `ok()`/`created()` | **`{ data, message }`, built inline, no helpers** |
| domain-module `src/modules/<x>/` | **layered `controllers/`+`services/`+`routes/`+`models/`** |
| Zod 4 validation | **Joi 17 + `validateBody`** |
| JOSE | **jsonwebtoken, Bearer header** |
| pino + request context | **morgan + `console`** |
| ESM + `.js` import extensions | **CommonJS, extensionless imports** |
| T3 Env / `config/env.ts` | **raw `process.env` / `import.meta.env`** |
| Next.js App Router | **Vite 6 + React 18 SPA + react-router 6** |
| Tailwind v4 + shadcn/ui | **MUI 6 + Emotion, theme in `theme/theme.ts`** |
| TanStack Query v5 | **SWR 2** |
| React Hook Form + Zod | **Formik 2 + Yup 1** |
| BFF proxy (`app/api/`) | **direct to backend via `VITE_API_URL`** |
| `@/*` path alias | **no alias — relative extensionless imports** |
| `features/<name>/` anatomy | **type-grouped `pages/`+`components/`+`hooks/`+`schemas/`** |

Both frontend files also carry an explicit instruction that the design skills
(`figma-to-component` / `html-to-component` / `project-to-component`) must target MUI + the
existing theme, never Tailwind/shadcn — since those skills' own descriptions assume shadcn.

## Registry seeding

- **Backend:** 5 utils/error pieces (`ApiError`, `notFound`, `conflict`, `catchAsync`,
  `formatDate`), 4 middleware (`errorHandler`, `requireAuth`, `requireAdmin`,
  `validateBody`), 2 models (`Product`, `User`), 3 modules (products with its full service
  surface, reports, health), plus the `src/index.ts` bootstrap. Every reusable file in
  `api/src/` is accounted for.
- **Frontend:** 2 shared components (`Card`, `PageHeader`), 1 form (`LoginForm`), 1 hook +
  1 exported type (`useUsers`, `User`), 1 schema (`loginSchema`), 2 lib singletons
  (`apiClient`, `fetcher`), the MUI theme, both app-infra files (`main.tsx`, `App.tsx`), and
  both pages. Every file in `web/src/` is accounted for. MUI is recorded as the primitive
  layer (not enumerated, per the reference guidance).

## Verification performed (Step 5)

Spot-checked the generated contracts against real files:
`{ data, message }` matches `product.controller.ts`, `errorHandler.ts`, and the `/health`
route; `catchAsync` wrapping matches `product.controller.ts`; `listProducts` really returns
`{ items, total, page, limit }`; `useUsers` really returns `{ users, error, isLoading }` on
key `"/users"`; `web/tsconfig.json` really has `baseUrl` with **no** `paths` (so the
recorded "no alias" rule is correct); named-vs-default export conventions match every page
and component. No drift found.

## Routing given to the user

Contract-ready → `prd-creator` (scope) → `module-planner` (module → slices) →
`module-builder` (one slice at a time) → `test-writer` / `code-review` on demand. Flagged
the missing `/users` + `/auth` endpoints as the natural first module.
