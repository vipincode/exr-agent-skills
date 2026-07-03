# express-ts-bootstrap

Scaffolds a **new** production-grade backend from scratch: Express.js + TypeScript + Mongoose + JOSE (auth). Runs **once per project**.

## What it does

- Creates the full project structure — config, error handling, response envelope, logging, middleware, the works.
- Asks only a tiny set of decision-gate questions (project name, DB, etc.) before scaffolding.
- Generates the two contract files the rest of the toolkit depends on: `ARCHITECTURE.md` and `MODULE_REGISTRY.md`.

## Example prompts

- "Bootstrap a new Express + TypeScript API for an inventory system"
- "Set up a new backend project called `orders-api`"
- "I need an Express starter with auth and MongoDB"

## Important

- **New projects only.** To add a feature to an existing project use `backend-feature-planner` + `backend-module-builder`; for tests use `backend-test-writer`.
- **Stack is fixed** (Express/TS/Mongoose/JOSE). It will not bootstrap Django, Rails, Spring, Go, Next.js, etc.
- If you point the toolkit at an empty directory via `backend-onboard`, it hands off to this skill automatically.
