---
name: backend-test-writer
description: Write test cases for backend code on demand. Use this ONLY when the user explicitly asks to test something — "write tests for auth.service.ts", "test the product module", "add unit tests for this", "cover the order service". It is a standalone utility, run manually whenever the user wants — never auto-chained from backend-feature-planner or backend-module-builder. It reads ARCHITECTURE.md (conventions), MODULE_REGISTRY.md (what to mock vs use), and the actual target file(s), detects the test framework from package.json, and writes matching test files. It never modifies source files and never touches the registry. Works in any project in the Express/TS convention family.
---

# backend-test-writer

Write tests for a target the user points at — a file, a module, or a feature name. This is a pure, on-demand utility: the user calls it explicitly and it does one thing. **It is never invoked by the other skills, never modifies source, and never edits MODULE_REGISTRY.md.**

## Step 1 — Read context (do not assume)

**First resolve the project dir** for this (`backend`) domain via `../LAYOUT.md` (read
`.claude/workspace.json`; fall back to the repo root if a root `ARCHITECTURE.md` exists with no
manifest). The contract files, `package.json` (framework detection), and the target files are
all **relative to that project dir**.

1. The **target file(s)** the user named — read the real implementation, not an assumption of it. If they named a module or feature, read its service/controller/routes.
2. `ARCHITECTURE.md` — the response envelope, error model, and validation flow, so assertions match how the code actually behaves (e.g. assert `{ success: true, data }`, assert error `{ success: false, error: { code } }`, assert the right `AppError` status codes).
3. `MODULE_REGISTRY.md` — to know which collaborators are shared real pieces. Mock the *real* shared dependencies (the model, another module's service) rather than inventing fakes that don't match reality.

## Step 2 — Detect, don't ask (where possible)

- **Framework**: read `package.json`. Vitest or Jest — use whatever is installed. Only ask if neither is present (then suggest Vitest as the default for a TS/ESM project).
- **File convention**: detect existing tests — colocated `*.test.ts`/`*.spec.ts` next to source, or a `__tests__/` dir, or a top-level `test/`. Match the existing convention. If none exists, default to colocated `*.test.ts`.
- **Import convention**: match the project's (e.g. NodeNext `.js` extensions) so the test file compiles under the same tsconfig.

## Step 3 — Ask only what's genuinely open (≤2 questions)

Only if not inferable:
- **Scope**: unit only, or unit + integration (integration = real Express app via supertest + an in-memory Mongo such as `mongodb-memory-server`)?
- **Coverage intent**: happy path only, or also edge cases / failure branches / auth-guard rejections?

If the user's request already implies these ("quick unit tests for the service"), skip the questions.

## Step 4 — Write the tests

Follow `references/test-patterns.md` for the layer being tested:
- **Service** → unit test with the model (or collaborators) mocked; assert returned data and that the right `AppError` is thrown on failure paths.
- **Controller** → mock the service; assert the response envelope shape and status via a mocked `res`.
- **Routes / integration** → supertest against the built app; assert real status codes and envelope; use in-memory Mongo if the path hits the DB.

Match the project's assertion style and the standard envelope. Don't introduce a new mocking library if one is already in use.

## Step 5 — Report

State what was tested, the framework/convention used, what was mocked vs real, and how to run it (`<pm> run test`). If you couldn't run the tests yourself, say so rather than asserting they pass.

## Guardrails

- **Standalone only.** Never triggered by build/plan flows; never trigger them.
- **Read-only on source.** Never edit the implementation to make it testable — if it's hard to test, note why and suggest a refactor, but leave the source alone.
- **Never touch MODULE_REGISTRY.md.**
- Mock the real shared pieces named in the registry, not stand-ins that drift from actual behavior.
