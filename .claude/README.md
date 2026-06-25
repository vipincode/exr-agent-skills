## Installation

Copy the folders in `.claude/skills/` into the skills directory used by your assistant.

### Claude Code

macOS or Linux:

```sh
mkdir -p ~/.claude/skills
cp -R .claude/skills/* ~/.claude/skills/
```

Windows PowerShell:

```powershell
New-Item -ItemType Directory -Force "$HOME\.claude\skills"
Copy-Item -Recurse -Force ".claude\skills\*" "$HOME\.claude\skills\"
```

Restart Claude Code after copying the files.

### OpenAI Codex CLI

macOS or Linux:

```sh
mkdir -p ~/.codex/skills
cp -R .claude/skills/* ~/.codex/skills/
```

Windows PowerShell:

```powershell
New-Item -ItemType Directory -Force "$HOME\.codex\skills"
Copy-Item -Recurse -Force ".claude\skills\*" "$HOME\.codex\skills\"
```

Restart Codex after copying the files.

## Publishing To SkillsMP

SkillsMP discovers skills from public GitHub repositories that contain `SKILL.md` files. Push this repository to GitHub, make it public, and wait for SkillsMP to index it.
