# Handoff: frontend-onboard → nextjs-bootstrap

## Request
"Onboard this folder for the frontend toolkit — I want to build the admin UI here."

## Routing decision
This folder is **not routed through frontend-onboard's normal onboarding pass**. Per `frontend-onboard/SKILL.md`, Step 0 ("Locate the project, then new-or-existing?"):

> **Empty, or no frontend source** (no `package.json`, or a `package.json` with no React/Next/Vite dep) → this is a new project. Hand off to **nextjs-bootstrap** ... Stop here.

## Why
Inventory of this directory found only:
- `package.json` — name `scratch`, a single dependency `express@^4.21.0`, and a `start` script (`node index.js`). This is a minimal Node/Express (backend) manifest, not a frontend one — no `next`, `react`, or `vite` dependency present, and no `index.js` file exists yet either.
- `README.md` — a one-line note: "Just a folder. Planning to build the admin UI here."

There is no `app/`, `pages/`, or `src/` tree, no existing component/hook/schema code, and no prior `ARCHITECTURE.md` / `MODULE_REGISTRY.md` / `.claude/workspace.json`. There is nothing here for onboarding to describe — onboarding's job is to generate contract files that *describe an existing frontend*, and there is no existing frontend to describe. This is a greenfield admin UI request, which is explicitly out of scope for `frontend-onboard` and belongs to `nextjs-bootstrap` instead.

## What happens next
Per the task constraints for this run, `nextjs-bootstrap` was **not** executed (no scaffolding, no `npm`/`npx`/install commands were run, and no project files were created beyond this handoff note). To actually build the admin UI here, run the `nextjs-bootstrap` skill against this folder next — it will ask root-vs-`frontend/` placement, scaffold the Next.js + TypeScript + Tailwind + shadcn/ui project, and emit the initial `ARCHITECTURE.md` + `MODULE_REGISTRY.md` itself. Only after that scaffold exists would `frontend-onboard` have something to onboard (and in that case it would find the contract files already present and route straight into the plan → build → test → review lifecycle instead).

No pre-existing file in this directory was modified.
