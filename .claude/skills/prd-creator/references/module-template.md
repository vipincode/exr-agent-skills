# Module Brief Template

Each shard is written to `_docs/features/<module-name>/<module-name>-module.md` (kebab-case,
folder name == file prefix). A brief must be self-contained: a feature planner should be able
to run from this file alone, without re-reading the whole PRD.

Stay at product altitude. If you catch yourself writing an endpoint path, a Mongoose field,
or a component name — delete it. That's the feature planner's output, not this file's.

```markdown
# <Module Name> Module

> Source: `_docs/prd/PRD.md` §5.<n> · Domain: `backend | frontend | fullstack` · Phase: MVP | Later
> Status: Ready for planning
> Next step: run `backend-feature-planner` / `frontend-feature-planner` against this file.

## Purpose
One or two sentences: what this module does for the product and why it exists.

## Scope
The capabilities this module owns, as bullets. Concrete enough that "done" is checkable.

## User stories
- As a <role>, I can <action> so that <benefit>.
(2–6 stories; use the exact role names from the PRD's Target users section.)

## Functional requirements
Numbered, testable statements — the contract the feature plan must satisfy.
1. A user can ... 
2. When <condition>, the system ...
3. <Role> can ..., but <other role> cannot.

## Dependencies
- **Needs:** <modules this one requires, and specifically what from them — e.g. "auth: role
  names Shopper/Admin; catalog: product availability">
- **Needed by:** <modules that depend on this one>

## Edge cases & failure modes
Product-level ones worth deciding now (e.g. "checkout when an item went out of stock mid-cart",
"comment on a post that was just deleted"). Not technical failure handling — that's downstream.

## Acceptance criteria
The checklist that makes this module "done" from the product's point of view. Each item
observable by a user or admin, not by reading code.
- [ ] ...

## Out of scope
Near-miss features that were explicitly cut or deferred, so the planner doesn't drift them in.
```

Rules:
- The set of briefs must exactly match the PRD's §7 Module map — same names, domains, phases.
- Cross-references between briefs use module names, not file paths in prose (paths change).
- If a brief is updated after downstream planning/code exists, prepend:
  `> ⚠ Updated after implementation planning — re-run the feature planner` and tell the user.
