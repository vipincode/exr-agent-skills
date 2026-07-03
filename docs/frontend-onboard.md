# frontend-onboard

The **entry point** for using the frontend toolkit on an **existing** Next.js/React app. The frontend twin of `backend-onboard`.

## What it does

- Scans the repo (read-only) and writes a **descriptive** `ARCHITECTURE.md` reflecting how your frontend actually works.
- Seeds `MODULE_REGISTRY.md` with all existing reusable components, hooks, Zod schemas, lib utils, and feature modules — so new work reuses them instead of duplicating.
- If the directory is empty, hands off to `nextjs-bootstrap` instead.
- Handles monorepos — finds where the frontend actually lives.

## Example prompts

- "Onboard this Next.js app for the frontend skills"
- "Set up my existing React frontend for the toolkit"
- "Get this client ready for the feature planner"

## Important

- **Non-destructive** — it only writes the two contract files; it never refactors your code.
- Run it **once per project**, before any frontend plan/build/test/review.
- Don't point it at an Express/Mongoose API — that's `backend-onboard`.
