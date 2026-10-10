# express-ts-bootstrap

Scaffolds a **new** production-grade backend from scratch: Express 5 + TypeScript + Mongoose + JOSE (auth) + Zod, tested with Vitest. Runs **once per project**.

## What it does

- Asks three questions (paradigm, package manager, project name), then scaffolds into `backend-<name>/`.
- Installs **the latest release of every library** at scaffold time. The template has no pinned versions, and the one known compatibility cap (TypeScript vs typescript-eslint) is resolved automatically.
- Lays out a structure built so **work on one module touches one folder**:

```
src/routes.ts                 one mount line per module (all under /api/v1)
src/modules/<name>/
  index.ts                    public API — the only file other code may import
  <name>.routes.ts            validate → auth → handler
  <name>.controller.ts        typed request → service → response envelope
  <name>.service.ts           business rules, returns DTOs
  <name>.repository.ts        all database access (the only file that imports the model)
  <name>.model.ts             Mongoose schema + indexes
  <name>.schema.ts            Zod validation + per-route request bundles
  <name>.mapper.ts            exactly which fields a response may contain
  __tests__/                  unit (*.test.ts) + integration (*.int.test.ts)
src/lib/                      shared: errors, envelope, pagination, common schemas, JWT, logger
src/middleware/               shared: validate, protect, requireRole, error handler, ...
test/                         api() + authHeader() helpers, in-memory MongoDB setup
```

- **Enforces the boundaries with ESLint**, and the pre-commit hook runs it. Importing another module's internals, touching a model outside its repository, or calling a repository from a controller fails lint.
- Ships working tests (unit + integration with an in-memory MongoDB), typed controllers (`ValidatedRequest<…>`), shared pagination, and a response mapper so raw database documents never leak.
- Generates the contract files the rest of the toolkit depends on: `ARCHITECTURE.md`, `MODULE_REGISTRY.md`, and an always-loaded `CLAUDE.md`.
- Verifies the result: typecheck, lint, tests, build, and a boot smoke check.

## Example prompts

- "Bootstrap a new Express + TypeScript API for an inventory system"
- "Set up a new backend project called `orders-api`"
- "I need an Express starter with auth and MongoDB"

## Important

- **New projects only.** To add a feature to an existing project use `module-planner` + `module-builder`; for tests use `test-writer`.
- **The libraries are fixed** (Express/TS/Mongoose/JOSE/Zod/Vitest), **the versions are not**: always the latest compatible ones. It will not bootstrap Django, Rails, Spring, Go, Next.js, etc.
- Needs a recent Node (24 LTS recommended). It tells you if a tool needs a newer Node than you have.
- If you point the toolkit at an empty directory via `project-onboard`, it hands off to this skill automatically.
