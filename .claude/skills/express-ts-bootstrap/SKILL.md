---
name: express-ts-bootstrap
description: Scaffold a new production-grade Express.js + TypeScript + Mongoose + JOSE backend from scratch. Use this whenever the user wants to start a new Node/Express API project, bootstrap a backend, set up an Express + TypeScript starter, or initialize a server-side project — even if they only say "new API", "Express starter", "backend boilerplate", or name the stack loosely. This skill scaffolds the infrastructure ONCE per project and generates the two source-of-truth files (ARCHITECTURE.md and MODULE_REGISTRY.md) that the feature-planner, module-builder, and test-writer skills depend on. Do NOT use this to add a feature to an existing project (that is feature-planner + module-builder) or to write tests (test-writer). This scaffolds an Express/Node + TypeScript backend specifically — do NOT use it to bootstrap projects in other stacks or languages (Django/Python, Rails, Spring, Go, Next.js, etc.); those are out of scope.
---

# express-ts-bootstrap

Scaffold a runnable, production-grade Express 5 + TypeScript + Mongoose 8 + JOSE 5 backend, and — critically — emit `ARCHITECTURE.md` and `MODULE_REGISTRY.md`. Those two files are the shared memory that lets the other skills avoid re-asking decisions and stop generating duplicate code. Getting them right matters more than the boilerplate.

This skill runs **once per project**. It does NOT build feature modules (auth, products, etc.) — it lays the foundation and a single `health` module that demonstrates the chosen paradigm so later skills have a concrete pattern to copy.

## Stack (fixed)

- **Express 5** — stable; async route handlers forward rejections to the error middleware automatically, so there is **no `asyncHandler` wrapper anywhere**. Plain `async (req, res) => {}` is correct.
- **TypeScript** strict, ESM, `tsx` for dev/runtime.
- **Mongoose 8**.
- **JOSE 5** for token signing/verification. The bootstrap installs JOSE + token utils + a `protect` middleware, but does **not** build auth endpoints — that is a feature for feature-planner/module-builder.
- **Zod 4** for validation and env parsing. Use root import `import * as z from "zod"`, top-level formats (`z.email()`, `z.uuid()`), and `z.treeifyError()` (not `.flatten()`/`.format()`).
- **pino** + `pino-http` for logging, **helmet**, **cors**, **compression**, **express-rate-limit** for the production middleware stack.
- **rimraf** (devDependency) so `dist/` is wiped before every build and dev run — cross-platform, never `rm -rf`. See the "Build & scripts" section of `references/conventions-core.md` for the exact `package.json` scripts.

## Decision gate (ask ONLY these)

The whole point of this toolkit is to not interrogate the user. Ask exactly two questions, with defaults, then proceed. Everything else is a baked-in production default.

1. **Paradigm** — functional / OOP / hybrid. Default **hybrid**. This decides how modules are authored and is recorded in ARCHITECTURE.md so later skills follow it.
2. **Package manager** — pnpm / npm / bun. Default **pnpm**.

Optional, only if the user volunteers interest — otherwise just include sensible defaults silently:
- Docker for local Mongo (default: include `docker-compose.yml` with a Mongo service + `Dockerfile`).
- Structure is **always domain-module** (`src/modules/<name>/`). Do not offer layered; it is the wrong default for module-by-module growth and the registry workflow assumes domain modules.

If the user already stated a paradigm earlier in the conversation, do not re-ask — use it.

## Workflow

1. **Resolve decisions.** Apply the decision gate. Confirm the resolved set in one line before scaffolding (e.g. "Hybrid paradigm, pnpm, Docker for Mongo — scaffolding now.").
2. **Copy the infrastructure** from `assets/files/` verbatim into the target project. These files are paradigm-agnostic and runnable as-is. See `assets/files/` — it is a complete `src/` tree plus configs.
3. **Generate the `health` module** in the chosen paradigm. The functional version ships in `assets/files/src/modules/health/`. For OOP or hybrid, rewrite that module following `references/paradigm-oop.md` or `references/paradigm-hybrid.md`. The health module is the canonical example later skills imitate, so it must match the paradigm exactly.
4. **Fill in package manager specifics** — scripts and lockfile-relevant bits in `package.json` are PM-agnostic, but install/run commands in the generated README use the chosen PM.
5. **Generate `ARCHITECTURE.md`** from `assets/ARCHITECTURE.template.md`, filling every `{{placeholder}}` with the resolved decisions and the actual conventions from `references/conventions-core.md`. This file is read by every other skill before it writes code — it must be concrete, not aspirational.
6. **Generate `MODULE_REGISTRY.md`** from `assets/MODULE_REGISTRY.template.md`. Seed it with the shared pieces the scaffold itself ships (the error classes, response helpers, `normalizeDbError` from `lib/db-errors.ts`, `protect` middleware, env config, logger, request-context). This is the dedup ledger; if a shared util exists, it must be listed here so feature-planner sees it and module-builder reuses it instead of recreating it — in particular, modules must reuse `normalizeDbError`/the central error handler rather than catching Mongoose/Zod errors themselves.
7. **Install dependencies** with the chosen PM, then verify the project builds and boots (`<pm> run build` then a quick `<pm> run dev` smoke check that the health route responds). Confirm `dist/` is wiped on both `build` and `dev` (the `rimraf` step). Report the result.

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
- **Seed the registry honestly.** Every reusable thing the scaffold creates goes into MODULE_REGISTRY.md immediately. An empty or inaccurate registry defeats the dedup workflow and the duplicate-code problem comes right back.
- **Don't scaffold features.** Auth, users, products are out of scope here. Stop at infrastructure + health.
