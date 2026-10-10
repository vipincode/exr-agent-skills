---
name: express-ts-bootstrap
description: Scaffold a new production-grade Express.js + TypeScript + Mongoose + JOSE backend from scratch. Use this whenever the user wants to start a new Node/Express API project, bootstrap a backend, set up an Express + TypeScript starter, or initialize a server-side project — even if they only say "new API", "Express starter", "backend boilerplate", or name the stack loosely. This skill scaffolds the infrastructure ONCE per project and generates the two source-of-truth files (ARCHITECTURE.md and MODULE_REGISTRY.md) that the module-planner, module-builder, and test-writer skills depend on. Do NOT use this to add a feature to an existing project (that is module-planner + module-builder) or to write tests (test-writer). This scaffolds an Express/Node + TypeScript backend specifically — do NOT use it to bootstrap projects in other stacks or languages (Django/Python, Rails, Spring, Go, Next.js, etc.); those are out of scope.
---

# express-ts-bootstrap

Scaffold a runnable, production-grade Express + TypeScript + Mongoose + JOSE backend on the **latest library releases**, and — critically — emit `ARCHITECTURE.md` and `MODULE_REGISTRY.md`. Those two files are the shared memory that lets the other skills avoid re-asking decisions and stop generating duplicate code. Getting them right matters more than the boilerplate.

The structure is built around one goal: **work on one module touches one folder.** Each domain lives in `src/modules/<name>/` with a strict internal layering (routes → controller → service → repository → model, plus a mapper for responses), exposes itself only through `index.ts`, mounts with one line in `src/routes.ts`, and carries its own tests in `__tests__/`. ESLint enforces the boundaries, so they hold even when nobody re-reads the rules. A generated **code map** (`codemap/`, rebuilt on every commit) lists every export with its file and purpose, so AI finds existing code by reading one small shard instead of opening files.

This skill runs **once per project**. It does NOT build feature modules (auth, products, etc.) — it lays the foundation and a single `health` module that demonstrates the skeleton so later skills have a concrete pattern to copy.

## Stack (fixed libraries, latest versions)

Libraries are fixed; **versions are not**. The template `package.json` has no dependencies — step 4 installs everything through the PM, which resolves the current releases. Never hand-write a version number. `references/versions.md` has the install list, the one known compatibility cap (TypeScript ≤ typescript-eslint's peer range), and the major-version notes the shipped code was verified against. If an installed major is newer than that table, read the library's migration notes (context7) before trusting the shipped code, and fix both.

- **Express 5** — async handlers forward rejections to the error middleware, so there is **no `asyncHandler` wrapper anywhere**.
- **TypeScript** strict, ESM/NodeNext, `verbatimModuleSyntax`, `tsx` for dev. `tsconfig.json` typechecks src + tests; `tsconfig.build.json` emits src only.
- **Mongoose 9**, **JOSE 6** (token utils + `protect`/`getAuthUser`/`requireRole` — no auth endpoints), **Zod 4** (`import * as z from "zod"`, top-level `z.email()`/`z.uuid()`, `z.treeifyError()`).
- **pino** + `pino-http`, **helmet**, **cors**, **compression**, **express-rate-limit**.
- **Vitest** with two projects — `unit` (no DB) and `integration` (supertest + **mongodb-memory-server**) — plus `test/helpers.ts` (`api()`, `authHeader(role)`).
- **ESLint** flat config + typescript-eslint, including the **architecture-boundary rules**.
- **rimraf** so `dist/` is wiped before every build and dev run (Windows-safe, never `rm -rf`).
- **Native `--env-file=.env`** in `dev` and `start` — this is what loads `.env` (no `dotenv`; `config/env.ts` only validates). Omitting the flag ships a scaffold that dies at the env check on first boot.
- **husky (v9) + lint-staged** — pre-commit runs `eslint --fix` on staged files, so boundary violations can't be committed, then regenerates and stages `codemap/`.
- **Code map** — `scripts/codemap.ts` (TypeScript parser, no extra dependency) writes `codemap/INDEX.md` + per-area/per-module shards. See "Code map" in `references/conventions-core.md` and the toolkit-wide `../CODE-NAV.md`. See "Git hooks" in `references/conventions-core.md`, including the subfolder form.
- **Node 24 LTS** by default (`.nvmrc`, `engines`, Dockerfile `node:24-alpine`) — raised if a tool's engine floor requires it.

## Decision gate (ask ONLY these)

The whole point of this toolkit is to not interrogate the user. Ask exactly three questions, with defaults, then proceed. Everything else is a baked-in production default.

1. **Paradigm** — functional / OOP / hybrid. Default **hybrid**. This decides how modules are authored and is recorded in ARCHITECTURE.md so later skills follow it.
2. **Package manager** — pnpm / npm / bun. Default **pnpm**.
3. **Project name** — always ask; there is no default. Get a short kebab-case name (e.g. `shoply`, `crm-portal`) and scaffold into a `backend-<name>/` subfolder (e.g. `backend-shoply/`). The name-suffixed folder is deliberate: when the folder is later pushed as its own git repo, `backend-shoply` is self-describing where a bare `backend` is not. `.claude/` stays at the repo root as the shared anchor, and a `frontend-<name>/` can be added the same way later. Scaffold into the repo root only if the user explicitly asks for that. This sets the **project dir** that everything below is scaffolded into and is recorded in `.claude/workspace.json`. See `../LAYOUT.md`.

Optional, only if the user volunteers interest — otherwise just include sensible defaults silently:
- Docker for local Mongo (default: include `docker-compose.yml` with a Mongo 8 service + `Dockerfile` + `.dockerignore`).
- Structure is **always domain-module** (`src/modules/<name>/`). Do not offer layered; it is the wrong default for module-by-module growth and the registry workflow assumes domain modules.

If the user already stated a paradigm earlier in the conversation, do not re-ask — use it.

## Workflow

> **All paths below are relative to the resolved project dir** (`<proj>` = the `backend-<name>/`
> subfolder, or the repo root if explicitly chosen). `.claude/` and `.claude/workspace.json`
> always stay at the repo root. See `../LAYOUT.md`.

1. **Resolve decisions.** Apply the decision gate. Confirm the resolved set in one line before scaffolding (e.g. "Hybrid paradigm, pnpm, Node 24, Docker for Mongo, in `backend-shoply/` — scaffolding now."). Create `<proj>` if it doesn't exist.
2. **Copy the infrastructure** from `assets/files/` verbatim into `<proj>` — the whole tree, including dotfiles (`.husky/`, `.gitignore`, `.gitattributes`, `.dockerignore`, `.nvmrc`, `.env.example`), `test/`, `scripts/`, `vitest.config.ts`, both tsconfigs, and `eslint.config.js`. Fill `{{PROJECT_SLUG}}` (package name = folder name), `{{PROJECT_NAME}}`, `{{PM}}`, `{{NODE_MAJOR}}` placeholders. If the PM isn't pnpm, adapt the `Dockerfile` install lines as its header comment says.
3. **Shape the `health` module** to the chosen paradigm. The functional version ships in `assets/files/src/modules/health/` (index, routes, controller, service, types, and two tests). Health owns no data, so under hybrid it stays functional; under OOP rewrite service + controller as classes and wire them in a `health.container.ts`, per `references/paradigm-oop.md`. Keep `index.ts` and the tests passing.
4. **Install dependencies — latest releases.** Follow `references/versions.md` exactly: runtime deps and dev deps via `<pm> add` with no versions, `@types/node` at the Node major, TypeScript resolved to the newest version inside typescript-eslint's peer range (pinned with `~`). Read the engine warnings; if any tool needs a newer Node than `.nvmrc`, raise `.nvmrc`/`engines`/Dockerfile together and tell the user. If an installed major is newer than the verified table, check its migration notes (context7) before moving on.
5. **Generate `ARCHITECTURE.md`** from `assets/ARCHITECTURE.template.md`, filling every `{{placeholder}}` with the resolved decisions. `{{PARADIGM_DESCRIPTION}}` = the decision rule and the repository/service/controller/routes examples from the matching `references/paradigm-*.md` (copied, `.js` extensions intact). This file is read by every other skill before it writes code — it must be concrete, not aspirational.
6. **Generate `MODULE_REGISTRY.md`** from `assets/MODULE_REGISTRY.template.md`. It is pre-seeded with every shared piece the scaffold ships (errors, envelope, `normalizeDbError`, pagination, common schemas, `validate`/`ValidatedRequest`, `protect`/`getAuthUser`, `requireRole`, env, logger, request-context, test helpers). If you add or rename anything in step 2–3, reflect it here — an inaccurate registry brings duplicate code straight back.
7. **Generate `CLAUDE.md`** at `<proj>` from `assets/CLAUDE.template.md`. Fill the header placeholders, then replace `{{INVARIANTS}}` with the numbered list from the `## Invariants` section of the `ARCHITECTURE.md` you just wrote — **verbatim, every item, no paraphrasing and no additions**. It is auto-loaded for every change in this project, so it is the only guardrail on small edits made without a skill. It must stay a strict subset of ARCHITECTURE.md.
8. **Record the project in the workspace manifest.** Create or update `.claude/workspace.json` at the **repo root** (not `<proj>`) with `{ "domain": "backend", "path": "<proj relative to repo root, e.g. 'backend-shoply', or '.'>", "stack": "express-ts" }`. Merge — don't clobber other domains' entries. See `../LAYOUT.md`.
9. **Verify it is green — all of it.** `cp .env.example .env`, then run and report each:
   - `<pm> run typecheck` and `<pm> run lint` — clean.
   - `<pm> test` — both projects pass (the first integration run downloads a `mongod` binary; allow time).
   - `<pm> run build` — `dist/` contains no `__tests__`.
   - `<pm> run codemap`, then `<pm> run codemap:check` — `codemap/INDEX.md` lists the health module with its `/api/v1/health` mount.
   - `<pm> run dev` smoke check — env validation passes and `GET /api/v1/health` responds (needs a reachable Mongo: `docker compose up -d`, or say it was skipped).
   - husky installed (`.husky/pre-commit` present, `core.hooksPath` set; subfolder form if `<proj>` isn't the git root).
   Report honestly — a step you couldn't run is "skipped", not "passed". Remind the user that `.env` holds example values they must edit. Mention once, as an option, that GitNexus can add call-graph/impact tools over MCP — with its Node floor and noncommercial license — per `../CODE-NAV.md`; never install it yourself.

## What to read when

- `references/conventions-core.md` — the canonical conventions: layout, layering, module boundaries, route registry, envelope, pagination, error model, typed validation flow, testing, env, naming, DRY, dependencies, scripts. The substance distilled into ARCHITECTURE.md. Read it before generating ARCHITECTURE.md.
- `references/versions.md` — the install commands, the TypeScript cap, engine floors, and the verified-majors table. Read it before step 4.
- `references/paradigm-functional.md` / `paradigm-oop.md` / `paradigm-hybrid.md` — how repository, service, controller, and routes are authored under each paradigm (compiled and lint-checked against this scaffold). Read the one matching the decision before step 3 and step 5.
- `references/auth-jose.md` — the JOSE token utilities and `protect`/`getAuthUser`/`requireRole`. Read it to describe them correctly in the registry. Do NOT build auth endpoints here.
- `assets/files/` — literal boilerplate, copied verbatim (except placeholders and the paradigm-shaped health module).
- `assets/*.template.md` — the three generated docs.
- `../CODE-NAV.md` — the toolkit-wide navigation ladder (code map → registry → optional GitNexus → grep → read). The generated ARCHITECTURE.md and CLAUDE.md point to it.

## Non-negotiables (these are the reasons this toolkit exists)

- **Boundaries are enforced, not suggested.** `eslint.config.js` ships the boundary rules (cross-module internals, model outside repository, repository from controllers/routes, shared layers importing modules). Never weaken them to make code pass — fix the code.
- **One mount file.** Modules mount in `src/routes.ts`; `app.ts` is not edited per feature.
- **No `asyncHandler`.** Express 5 handles it. Any generated wrapper is a bug.
- **One response shape, one error model.** `ok()/created()/noContent()` with mapper DTOs, `AppError` subclasses — never ad-hoc `res.status().json()` or bare `throw new Error()`.
- **Mongoose & Zod errors are normalized once** (`lib/db-errors.ts`); token errors are mapped to 401 in `protect`. Modules never re-catch these.
- **Latest versions, never hand-pinned.** Install via the PM per `references/versions.md`. A template with stale hardcoded versions is exactly what this replaced.
- **Tests ship green.** The scaffold includes Vitest config, helpers, in-memory Mongo setup, and passing health tests. A scaffold whose `test` script fails, or that has no test setup, is a bug.
- **`dist/` is always clean**, and never contains tests.
- **`.env` must actually load.** `dev` and `start` pass `--env-file=.env`. A scaffold that exits with "env validation failed" against a correct `.env` is a bug (this shipped once — don't regress it).
- **Git hooks work out of the box.** If the project dir isn't the git root, use the subfolder form from conventions-core.
- **The code map ships and stays fresh.** `scripts/codemap.ts`, the `codemap`/`codemap:check` scripts, and the pre-commit step are part of every scaffold, and `codemap/` is generated before the first commit. A missing or stale map sends AI back to opening files.
- **Seed the registry honestly.** Every reusable thing the scaffold creates is in MODULE_REGISTRY.md.
- **`CLAUDE.md` is a strict subset, never a fork** of ARCHITECTURE.md's invariants.
- **Record the project location** in `.claude/workspace.json`.
- **Don't scaffold features.** Auth, users, products are out of scope here. Stop at infrastructure + health.
