# backend-test-writer

Writes tests for backend code **on demand**. A standalone utility — it never runs automatically after planning or building.

## What it does

- Reads `ARCHITECTURE.md` (conventions), `MODULE_REGISTRY.md` (what to mock vs use for real), and the actual target file(s).
- Detects the test framework from `package.json` — it doesn't ask about things it can figure out (asks at most 2 questions).
- Writes test files that match your project's existing test style.

## Example prompts

- "Write tests for auth.service.ts"
- "Test the product module"
- "Add unit tests for the order service"
- "Cover the validation middleware"

## Important

- **Only runs when you explicitly ask for tests.** Building a module does not auto-generate tests.
- Never modifies source files and never touches the registry — test files only.
- Backend only; frontend tests are `frontend-test-writer`.
