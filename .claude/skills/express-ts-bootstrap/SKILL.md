---
name: express-ts-bootstrap
description: Scaffold a new production-grade Express.js + TypeScript + Mongoose + JOSE backend from scratch. Use this whenever the user wants to start a new Node/Express API project, bootstrap a backend, set up an Express + TypeScript starter, or initialize a server-side project — even if they only say "new API", "Express starter", "backend boilerplate", or name the stack loosely. This skill scaffolds the infrastructure ONCE per project and generates the two source-of-truth files (ARCHITECTURE.md and MODULE_REGISTRY.md) that the backend-feature-planner, backend-module-builder, and backend-test-writer skills depend on. Do NOT use this to add a feature to an existing project (that is backend-feature-planner + backend-module-builder) or to write tests (backend-test-writer). This scaffolds an Express/Node + TypeScript backend specifically — do NOT use it to bootstrap projects in other stacks or languages (Django/Python, Rails, Spring, Go, Next.js, etc.); those are out of scope.
---

# express-ts-bootstrap

Scaffold a runnable, production-grade Express 5 + TypeScript + Mongoose 8 + JOSE 5 backend, and — critically — emit `ARCHITECTURE.md` and `MODULE_REGISTRY.md`. Those two files are the shared memory that lets the other skills avoid re-asking decisions and stop generating duplicate code. Getting them right matters more than the boilerplate.

This skill runs **once per project**. It does NOT build feature modules (auth, products, etc.) — it lays the foundation and a single `health` module that demonstrates the chosen paradigm so later skills have a concrete pattern to copy.

## Stack (fixed)

- **Express 5** — stable; async route handlers forward rejections to the error middleware automatically, so there is **no `asyncHandler` wrapper anywhere**. Plain `async (req, res) => {}` is correct.
- **TypeScript** strict, ESM, `tsx` for dev/runtime.
- **Mongoose 8**.
- **JOSE 5** for token signing/verification. The bootstrap installs JOSE + token utils + a `protect` middleware, but does **not** build auth endpoints — that is a feature for backend-feature-planner/backend-module-builder.
- **Zod 4** for validation and env parsing. Use root import `import * as z from "zod"`, top-level formats (`z.email()`, `z.uuid()`), and `z.treeifyError()` (not `.flatten()`/`.format()`).
- **pino** + `pino-http` for logging, **helmet**, **cors**, **compression**, **express-rate-limit** for the production middleware stack.
- **rimraf** (devDependency) so `dist/` is wiped before every build and dev run — cross-platform, never `rm -rf`. See the "Build & scripts" section of `references/conventions-core.md` for the exact `package.json` scripts.
- **Native `--env-file=.env`** in the `dev` and `start` scripts — this is what actually loads `.env` (there is no `dotenv`; `config/env.ts` only validates `process.env`). Omitting the flag ships a scaffold that dies at the env check on first boot.
- **husky (v9) + lint-staged** (devDependencies) — every scaffold ships a working pre-commit hook (`.husky/pre-commit` → `lint-staged` → `eslint --fix` on staged files), installed automatically via the `prepare` script. See the "Git hooks" section of `references/conventions-core.md`, including the adjusted form when the project lives in a subfolder of the git root.

## Decision gate (ask ONLY these)

The whole point of this toolkit is to not interrogate the user. Ask exactly three questions, with defaults, then proceed. Everything else is a baked-in production default.

1. **Paradigm** — functional / OOP / hybrid. Default **hybrid**. This decides how modules are authored and is recorded in ARCHITECTURE.md so later skills follow it.
2. **Package manager** — pnpm / npm / bun. Default **pnpm**.
3. **Project name** — always ask; there is no default. Get a short kebab-case name (e.g. `shoply`, `crm-portal`) and scaffold into a `backend-<name>/` subfolder (e.g. `backend-shoply/`). The name-suffixed folder is deliberate: when the folder is later pushed as its own git repo, `backend-shoply` is self-describing where a bare `backend` is not. `.claude/` stays at the repo root as the shared anchor, and a `frontend-<name>/` can be added the same way later. Scaffold into the repo root only if the user explicitly asks for that. This sets the **project dir** that everything below is scaffolded into and is recorded in `.claude/workspace.json`. See `../LAYOUT.md`.

Optional, only if the user volunteers interest — otherwise just include sensible defaults silently:
- Docker for local Mongo (default: include `docker-compose.yml` with a Mongo service + `Dockerfile`).
- Structure is **always domain-module** (`src/modules/<name>/`). Do not offer layered; it is the wrong default for module-by-module growth and the registry workflow assumes domain modules.

If the user already stated a paradigm earlier in the conversation, do not re-ask — use it.

## Workflow

> **All paths below are relative to the resolved project dir** (`<proj>` = the `backend-<name>/`
> subfolder, or the repo root if explicitly chosen). `.claude/` and `.claude/workspace.json`
> always stay at the repo root. See `../LAYOUT.md`.

1. **Resolve decisions.** Apply the decision gate. Confirm the resolved set in one line before scaffolding (e.g. "Hybrid paradigm, pnpm, Docker for Mongo, in `backend-shoply/` — scaffolding now."). Create `<proj>` if it doesn't exist.
2. **Copy the infrastructure** from `assets/files/` verbatim into `<proj>`. These files are paradigm-agnostic and runnable as-is. See `assets/files/` — it is a complete `src/` tree plus configs.
3. **Generate the `health` module** in the chosen paradigm. The functional version ships in `assets/files/src/modules/health/`. For OOP or hybrid, rewrite that module following `references/paradigm-oop.md` or `references/paradigm-hybrid.md`. The health module is the canonical example later skills imitate, so it must match the paradigm exactly.
4. **Fill in package manager specifics** — scripts and lockfile-relevant bits in `package.json` are PM-agnostic, but install/run commands in the generated README use the chosen PM.
5. **Generate `ARCHITECTURE.md`** from `assets/ARCHITECTURE.template.md`, filling every `{{placeholder}}` with the resolved decisions and the actual conventions from `references/conventions-core.md`. This file is read by every other skill before it writes code — it must be concrete, not aspirational.
6. **Generate `MODULE_REGISTRY.md`** from `assets/MODULE_REGISTRY.template.md`. Seed it with the shared pieces the scaffold itself ships (the error classes, response helpers, `normalizeDbError` from `lib/db-errors.ts`, `protect` middleware, env config, logger, request-context). This is the dedup ledger; if a shared util exists, it must be listed here so backend-feature-planner sees it and backend-module-builder reuses it instead of recreating it — in particular, modules must reuse `normalizeDbError`/the central error handler rather than catching Mongoose/Zod errors themselves.
7. **Record the project in the workspace manifest.** Create or update `.claude/workspace.json` at the **repo root** (not `<proj>`) with this project's entry: `{ "domain": "backend", "path": "<proj relative to repo root, e.g. 'backend-shoply', or '.'>", "stack": "express-ts" }`. If the file already exists, merge — don't clobber other domains' entries (e.g. a future `frontend`). This is what lets every other skill find the project; see `../LAYOUT.md`.
8. **Install dependencies** with the chosen PM, then verify the project builds and boots: `cp .env.example .env` first (the dev script loads it via `--env-file=.env` — booting only works if that flag is in place and the file exists), then `<pm> run build` and a quick `<pm> run dev` smoke check that env validation passes and the health route responds. Confirm `dist/` is wiped on both `build` and `dev` (the `rimraf` step), and that the husky hook installed (`.husky/pre-commit` present and git `core.hooksPath` set after install). Report the result, and remind the user the smoke-check `.env` contains example values they must edit.

## What to read when

- `references/conventions-core.md` — the canonical conventions (response envelope, error model, validation flow, env, module anatomy, naming, DRY rules). This is the substance distilled into the generated ARCHITECTURE.md. Read it before generating ARCHITECTURE.md.
- `references/paradigm-functional.md` / `paradigm-oop.md` / `paradigm-hybrid.md` — how a module is authored under each paradigm. Read the one matching the resolved decision before generating the health module and the ARCHITECTURE.md paradigm section.
- `references/auth-jose.md` — the JOSE token utilities and `protect`/`requireRole` middleware that ship with the scaffold. Read it to place those files correctly and to write the registry entries describing them. Do NOT build auth endpoints here.
- `assets/files/` — literal boilerplate, copied verbatim (except the health module, which is paradigm-shaped).
- `assets/ARCHITECTURE.template.md` and `assets/MODULE_REGISTRY.template.md` — templates for the two source-of-truth docs.

## Non-negotiables (these are the reasons this toolkit exists)

- **No `asyncHandler`.** Express 5 handles it. Any generated wrapper is a bug.
- **One response shape, one error model.** Every module uses the shared `ok()/created()` helpers and throws `AppError` subclasses — never ad-hoc `res.status().json()` shapes or bare `throw new Error()`. This is what keeps modules consistent enough for later skills to reason about.
- **Mongoose & Zod errors are normalized once.** The scaffold ships `lib/db-errors.ts` (`normalizeDbError`) and the error handler calls it, so `CastError`, `ValidationError`, duplicate-key (11000), and raw `ZodError` all render through the standard envelope. Modules must not re-catch these — reuse the shared path.
- **`dist/` is always clean.** `dev` and `build` both `rimraf dist` first (via `rimraf`, Windows-safe). A scaffold that can run yesterday's compiled output is a bug.
- **`.env` must actually load.** `dev` and `start` pass `--env-file=.env`; the boot smoke check in step 8 must pass with values coming from `.env`, not from the shell. A scaffold that exits with "env validation failed" against a correct `.env` is a bug (this shipped once — don't regress it).
- **Git hooks work out of the box.** `.husky/pre-commit` + lint-staged ship with the scaffold and install on first `install`. If the project dir isn't the git root, use the subfolder form from conventions-core — don't ship a hook that silently never runs.
- **Seed the registry honestly.** Every reusable thing the scaffold creates goes into MODULE_REGISTRY.md immediately. An empty or inaccurate registry defeats the dedup workflow and the duplicate-code problem comes right back.
- **Record the project location.** The `.claude/workspace.json` entry is mandatory — without it, the other skills can't find a project scaffolded into a subfolder. Contract files and `src/` go in the **project dir**; only `.claude/` (and the manifest) live at the repo root.
- **Don't scaffold features.** Auth, users, products are out of scope here. Stop at infrastructure + health.
