# EXR Agent Skills

Reusable agent skills for software planning, onboarding, module building, testing, and code review.

## Skills

- `project-onboard` - inspect an existing project and build a practical understanding before making changes.
- `feature-planner` - turn a feature request into an implementation plan with risks and questions.
- `module-builder` - build Express TypeScript modules using the project's conventions.
- `express-ts-bootstrap` - bootstrap an Express TypeScript backend structure.
- `test-writer` - add focused tests that match the project's test style.
- `code-review` - review code for bugs, regressions, security risks, and missing tests.

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
Review this pull request using the code-review skill.
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
  skills/
    code-review/
      SKILL.md
      references/
    express-ts-bootstrap/
      SKILL.md
      references/
    feature-planner/
      SKILL.md
      references/
    module-builder/
      SKILL.md
      references/
    project-onboard/
      SKILL.md
      references/
    test-writer/
      SKILL.md
      references/
```

## Notes

- Review each `SKILL.md` before installing it in another environment.
- Keep supporting files such as `references/` together with the skill folder.
- If a skill does not appear after installation, restart the assistant CLI or app.
