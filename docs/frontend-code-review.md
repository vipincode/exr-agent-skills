# frontend-code-review

Static review of frontend code (Next.js App Router, React, TypeScript, Tailwind + shadcn/ui) for correctness, duplication, convention adherence, accessibility, and performance. Read-only — run it anytime.

## What it does

- Reads the frontend `ARCHITECTURE.md` + `MODULE_REGISTRY.md` so it reviews against **this project's** conventions.
- Flags components/hooks/utils that duplicate existing shared pieces or registry entries (DRY).
- Checks API bindings for conformance with the BFF + axios + Zod + TanStack Query standard, plus a11y and performance issues.

## Example prompts

- "Review the products binding"
- "Code review my changes / this diff / this PR"
- "Is this screen production-ready?"
- "Check product-card.tsx for issues"

## Important

- **Read-only by default** — reports findings; only modifies code if you explicitly say "apply the fixes".
- **Static only** — it doesn't run the app. "Does it render?" / "verify it works" is `/verify` or `/run`, not review.
- Frontend only; Express/Mongoose review is `backend-code-review`.
