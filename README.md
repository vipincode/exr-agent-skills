# EXR Agent Skills

Reusable agent skills for software planning, onboarding, module building, testing, and code review.

> **Team guide:** short per-skill docs with example prompts live in [`docs/`](docs/README.md) — start there.

## Skills

**Getting started**

- `toolkit-guide` - front desk: inspects your project and tells you which skill to run next.

**Product planning**

- `prd-creator` - turn an app idea into a PRD, then shard it into per-module briefs.

**Backend (Express + TypeScript + Mongoose)**

- `express-ts-bootstrap` - bootstrap a new Express TypeScript backend structure.
- `backend-onboard` - make an existing API ready for the toolkit (writes the contract files).
- `backend-feature-planner` - turn a feature request into an editable implementation plan.
- `backend-module-builder` - build the planned module using the project's conventions, no duplicates.
- `backend-test-writer` - add focused tests that match the project's test style.
- `backend-code-review` - review code for bugs, regressions, security risks, and duplication.

**Frontend (Next.js + TypeScript + Tailwind + shadcn/ui)**

- `nextjs-bootstrap` - bootstrap a new Next.js frontend with BFF proxy, axios, Zod, TanStack Query.
- `frontend-onboard` - make an existing frontend ready for the toolkit (writes the contract files).
- `font-theme-setup` - apply a Figma design system's tokens to the theme (globals.css + fonts).
- `figma-to-component` - build components from a Figma frame without creating duplicates.
- `html-to-component` - build theme + components from an HTML file, pasted markup, or URL.
- `project-to-component` - port a page or design language from another codebase on disk.
- `frontend-feature-planner` - plan how a built design binds to the real backend API.
- `frontend-module-builder` - implement the planned API binding and make the design functional.
- `frontend-test-writer` - add Vitest + RTL tests for components, hooks, and schemas.
- `frontend-code-review` - review frontend code for correctness, duplication, a11y, and performance.

## Installation

### Claude Code

1. Clone or download this repository.
2. Copy the skill folders from `.claude/skills/` into your Claude skills directory.

On macOS or Linux:

```sh
mkdir -p ~/.claude/skills
cp -R .claude/skills/* ~/.claude/skills/
```

On Windows PowerShell:

```powershell
New-Item -ItemType Directory -Force "$HOME\.claude\skills"
Copy-Item -Recurse -Force ".claude\skills\*" "$HOME\.claude\skills\"
```

3. Restart Claude Code so it reloads the available skills.
4. Ask Claude to use one of the skills by describing the task, for example:

```text
Review this pull request using the backend-code-review skill.
```

### OpenAI Codex CLI

1. Clone or download this repository.
2. Copy the skill folders into your Codex skills directory.

On macOS or Linux:

```sh
mkdir -p ~/.codex/skills
cp -R .claude/skills/* ~/.codex/skills/
```

On Windows PowerShell:

```powershell
New-Item -ItemType Directory -Force "$HOME\.codex\skills"
Copy-Item -Recurse -Force ".claude\skills\*" "$HOME\.codex\skills\"
```

3. Restart Codex so it reloads the available skills.
4. Ask Codex for a task that matches one of the skill descriptions.

## Publishing To SkillsMP

SkillsMP indexes public GitHub repositories that contain `SKILL.md` files. To make these skills discoverable:

1. Push this repository to GitHub.
2. Make the repository public.
3. Keep each skill in its own folder with a `SKILL.md` file.
4. Wait for SkillsMP's next indexing run.
5. Search SkillsMP for the repository name, GitHub username, or skill names.

## Repository Layout

```text
.claude/
  workspace.json        # maps each project's domain -> folder (root or backend/); see LAYOUT.md
  skills/
    NAMING.md           # skill naming & domain taxonomy (collision-proofing)
    LAYOUT.md           # project-location manifest & resolution protocol (monorepo-ready)
    backend-code-review/
      SKILL.md
      references/
    express-ts-bootstrap/
      SKILL.md
      references/
    backend-feature-planner/
      SKILL.md
      references/
    backend-module-builder/
      SKILL.md
      references/
    backend-onboard/
      SKILL.md
      references/
    backend-test-writer/
      SKILL.md
      references/
```

## Notes

- Review each `SKILL.md` before installing it in another environment.
- Keep supporting files such as `references/` together with the skill folder.
- If a skill does not appear after installation, restart the assistant CLI or app.
