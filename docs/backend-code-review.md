# backend-code-review

Static review of backend code for correctness, security, convention adherence, and duplication. Read-only — run it anytime.

## What it does

- Reads `ARCHITECTURE.md` + `MODULE_REGISTRY.md` so it reviews against **this project's** conventions, not generic best practices.
- Flags code that duplicates something already in the registry (DRY violations).
- Covers bugs, security risks, error handling, and missing edge cases; reports findings, ranked.

## Example prompts

- "Review the auth module"
- "Code review my changes / this diff / this PR"
- "Is this service production-ready?"
- "Sanity-check payments.controller.ts"

## Important

- **Read-only by default** — it reports findings and does not modify code unless you explicitly say "apply the fixes".
- **Static only** — it does not run the app. "Verify it works" / "does it run" is `/verify` or `/run` territory, not review.
- Backend only; React/Next.js review is `frontend-code-review`.
