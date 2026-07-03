# Skill Benchmark: frontend-onboard

**Executor model**: claude-sonnet-5 (both arms)
**Analyzer model**: claude-fable-5
**Date**: 2026-07-03
**Evals**: eval-0-nextjs-shadcn-query, eval-1-vite-mui-swr-formik, eval-2-empty-handoff (1 run each per configuration)

## Summary

| Metric | With skill | Without skill | Delta |
|--------|-----------|---------------|-------|
| Pass rate | 100% (22/22) | 77.3% (17/22) | **+22.7pp** |
| Time | 1726.5s | 1412.3s | +314.2s |
| Tokens | 204,474 | 159,601 | +44,873 |

## Per eval

| Eval | With skill | Without skill |
|------|-----------|---------------|
| 0 — nextjs-shadcn-query (clean bootstrap-shaped app) | 8/8 | 7/8 |
| 1 — vite-mui-swr-formik (divergent stack, descriptive-not-prescriptive test) | 8/8 | 7/8 |
| 2 — empty-handoff (express scratch folder, routing test) | 6/6 | 3/6 |

## Findings

1. **eval-2 is the discriminator.** The baseline hand-scaffolded a non-runnable Next.js skeleton (13 files) over the express scratch folder and wrote a *prescriptive* contract for code it invented, ending with "action needed" homework for the user. The skill's Step 0 detected no frontend source, wrote only a HANDOFF.md, and routed to nextjs-bootstrap.
2. **On existing frontends, a capable baseline keeps up on contract content** (consistent with the trio's iteration-1 finding) — both arms produced accurate, descriptive ARCHITECTURE/MODULE_REGISTRY files with exhaustive seeding. The consistent baseline miss is `.claude/workspace.json`: only the skill knows the toolkit's manifest convention that lets the other skills find the project.
3. **Sandbox note:** the eval-1 baseline agent wrote its two contract files into the shared `fixtures/` dir; the grader relocated them into `without_skill/outputs` (content graded as-is) and hash-verified the fixture was otherwise untouched. All six arms modified zero pre-existing files.
4. **Cost:** with-skill runs were slower/heavier (reads SKILL.md + references + bootstrap templates) — +314s / +45k tokens across 3 evals — buying the manifest wiring and correct empty-dir routing.

## Iteration-2 candidates (deferred, same as the trio)

- A monorepo fixture (`apps/web` + `apps/api` + a decoy `packages/ui`) to test project-dir location and the ask-when-ambiguous rule.
- A fixture with *genuine conflicts* (two HTTP clients, both fetch and axios, duplicate Button) to exercise Step 2's conflict questions — no fixture currently triggers them.
- An already-onboarded fixture (contract files present but stale registry) to test the refresh path.
