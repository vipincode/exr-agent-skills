# PRD Template

Write `_docs/prd/PRD.md` with exactly these sections, in this order. Keep prose tight — a PRD
that nobody reads fully is a PRD that fails. Decisions and tables beat paragraphs.

```markdown
# PRD — <Product Name>

> Status: Draft | Approved · Created: <date> · Last updated: <date>
> Owner: <user> · Produced by prd-creator; edit freely — this file is the source of truth.

## 1. Product summary
2–4 sentences: what it is, who it's for, why it will be used. No marketing fluff.

## 2. Goals & non-goals
- **Goals** — 3–6 bullets, each measurable or at least checkable.
- **Non-goals** — what this product deliberately is NOT (as important as the goals).

## 3. Target users
One line per user type (e.g. Shopper, Vendor, Admin). If there are roles, name them here —
the auth module brief will reference these exact role names.

## 4. Decisions
The product-shaping choices, as a table. Flag every assumption.

| # | Decision | Choice | Source |
|---|----------|--------|--------|
| 1 | Registration | Open, email + password | user |
| 2 | Guest checkout | Yes, with account nudge | user (accepted suggestion) |
| 3 | Currency | Single (INR) | (assumed — overturn by editing) |

## 5. Feature modules
The heart of the PRD. One subsection per module, each ~5–12 lines:

### 5.<n> <Module name>  `<domain>` `<MVP | Later>`
- **Purpose** — one line.
- **Includes** — the features/capabilities in scope, as bullets.
- **User stories** — 2–5 "As a <role>, I can <action> so that <benefit>".
- **Excludes** — near-misses that belong elsewhere or later.

## 6. Standard production rules
The accepted cross-cutting baseline (from the playbook's keep/reject pass): security &
auth rules, validation, error handling, admin capabilities, legal/compliance pages,
performance and SEO expectations. Bullets, each one enforceable.

## 7. Module map
The sharding contract — Step 5 turns exactly this table into files.

| Module | Folder | Domain | Phase | Depends on |
|--------|--------|--------|-------|------------|
| Auth | `_docs/features/auth/` | fullstack | MVP | — |
| Product catalog | `_docs/features/product-catalog/` | fullstack | MVP | auth (admin CRUD) |

**Suggested build order:** auth → product-catalog → cart → orders → payments → admin

## 8. Out of scope
Everything considered and rejected, with a few words on why — this prevents re-suggesting
rejected ideas in future sessions.

## 9. Open questions
Genuinely undecided items for the user to resolve. Empty is a fine state.

## 10. Changelog
| Date | Change | Reason |
|------|--------|--------|
| <date> | Initial PRD | — |
```

Notes:
- Section 5 and section 7 must agree — every module in 5 appears in 7 and vice versa.
- MVP/Later is per module, decided with the user; when in doubt, smaller MVP.
- Domain values are exactly `backend`, `frontend`, or `fullstack`.
