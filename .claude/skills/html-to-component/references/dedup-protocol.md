# Dedup protocol — reuse before you create

This is the reason phase 2 of this skill exists. HTML repeats components (the same header on
every section, avatars and cards everywhere, the same nav rendered as a list). Without a
discipline, a markup→code pass re-emits each one inline and the codebase fills with duplicate
`Header`/`Avatar`/`Card` variants. The discipline: **for every candidate component, search
first; create last.**

Run this for **each** discrete piece you identified during decomposition — before writing a
single line of it.

## The decision: reuse → extend → create

```
For each candidate component (e.g. "ProfileAvatar", "Header", "PricingCard"):

  1. Is it (or an equivalent) already in MODULE_REGISTRY.md?
       YES → import and use it. STOP. (If it needs a new visual variant, go to step 4-extend.)
       NO  → continue.

  2. Does a grep of the codebase reveal an existing implementation not yet registered?
       YES → use it, and register it now (the registry was stale). STOP.
       NO  → continue.

  3. Is it really a primitive shadcn ships (carousel, avatar, chart, tabs, accordion, sidebar, …)?
       YES → `shadcn add <name>` into components/ui/, then compose it. (Don't hand-write it.)
       NO  → continue.

  4. Is there a CLOSE cousin — same role, slightly different look?
       YES → EXTEND it: add a cva variant / a prop, don't fork a near-copy.
              (e.g. need a small header → add `size="sm"` to the shared Header, don't make Header2.)
       NO  → CREATE it (step 5).

  5. CREATE. Decide its home with shared-taxonomy.md (shared/<group> vs feature/<name>),
     build it (building-components.md), and if it's shared, REGISTER it in MODULE_REGISTRY.md.
```

## The search order (do all three, in order)

1. **`MODULE_REGISTRY.md`** — the curated ledger. Scan the shared sections (form, typography,
   overlay, layout, data-display, and any the builders added) and the features table. This is
   fastest and authoritative.
2. **Grep the tree** — the registry can lag. Search by likely name and by role:
   ```
   # by name (PascalCase component + kebab file)
   rg -i "header|navbar|avatar|carousel|hero" src/components src/features -l
   # confirm what a hit actually is
   rg -n "export (function|const) (Header|Navbar|Avatar)" src
   ```
   Look in `components/shared/**`, `components/ui/**`, and `features/*/components/**`.
3. **shadcn registry** — for primitives, check whether shadcn ships it before building
   (`carousel`, `avatar`, `chart`, `sidebar`, `tabs`, `accordion`, `tooltip`, `sheet`, …).

Only after all three come back empty do you create.

Two special cases that short-circuit the whole decision:
- **Icons are never new components.** An icon is an export appended to the registry file
  `components/shared/icons.tsx` (lucide first, react-icons for gaps, custom `currentColor` SVG
  last) — check that file's exports before adding one. See building-components.md "Icons".
- **A restyled primitive is not a new component.** If the "new" thing is a shadcn primitive
  with different looks (a gradient button, a pill badge), the answer is a `cva` variant edited
  into `components/ui/<primitive>.tsx` — see building-components.md "The design's variants
  live in `ui/`".

## The HTML repetition trap

HTML makes one duplication mistake especially easy: a section with five sibling `.card`
elements, or a `<ul>` of ten nav items, looks like "many components" but is **one component
rendered over data**. Before you treat repeated markup as multiple pieces, ask: *is this the
same thing with different content?* If yes, build it once with a typed props interface and
`.map()` over the data — don't emit five near-identical blocks. This is dedup *within* a single
input, the complement to dedup across the registry.

## Extend vs create — the judgment call

The trap is creating `HeaderDark`, `SmallHero`, `CardCompact` as siblings of existing
components. Most "new" components are really **variants** of an existing one:

- Same semantic role + same content shape, different size/color/density → **add a `cva`
  variant or a prop** to the existing component.
- Genuinely different role/content/behavior → **new component**.

Examples:
- "small-hero" vs "hero" → if it's the hero with less padding and a smaller heading, that's
  `<Hero size="sm">`, not a new file. If it has a fundamentally different layout (no media, no
  CTA), it's its own component.
- "profile avatar with status dot" vs "avatar" → extend `Avatar` with a `status` prop.
- Two cards that differ only in padding/shadow → one `Card` with variants.

When in doubt, prefer extend — one component with variants beats two near-duplicates. But don't
overload: if a "variant" needs a wholly different prop set and markup, it's a new component.

## The move rule (feature → shared)

If a component currently lives in `features/<a>/components/` and this design needs it in a
second feature, **move it to `components/shared/<group>/` and register it** — update imports in
feature `<a>`. Never copy it into feature `<b>`. Two copies = the duplication this protocol
exists to stop. (See shared-taxonomy.md for which group it moves into.)

## Non-component reusables (utils, hooks, types, constants)

Building a design produces more than components — a `formatPrice`/`formatDate` helper, a
`useMediaQuery`/`useScrollPosition` hook, a `NavItem` type, a nav-links or option-list constant.
These follow the **same protocol** (registry → grep → reuse/extend/create), with their own homes
and search paths — the same rules `frontend-module-builder` enforces, so design-time and
binding-time code land in the same places:

- **Search**: the registry's lib/hooks sections, then grep `src/lib/**` and `src/hooks/**` for
  utils/hooks (`rg -i "format|use-scroll|media-query" src/lib src/hooks`), and `src/types/**` /
  `src/constants/**` for shared types and constants/enums/option lists.
- **Placement, decided by dependency** (mirror of the component rule):
  - Reusable util → `lib/`; reusable hook → `hooks/`. Registered.
  - Type used by 2+ features → `src/types/`; constant/enum/option-list used by 2+ features →
    `src/constants/`. Registered.
  - Feature-local, single-use (a `formatPrice` only this feature uses, a one-screen prop type)
    → stays in the feature (its `types/`/`constants/` files, or next to the component) and is
    **not** registered. Don't over-share either.
- **Same move rule**: when a second feature needs a util/type/constant that lives inside
  `features/<a>/`, move it to `lib`/`hooks`/`src/types`/`src/constants` and register it — never
  copy it, never cross-import `features/<a>/` from `features/<b>/`.
- Never inline magic literals or ad-hoc duplicate types in components when a named
  constant/type exists (or should exist); never re-declare an option list another feature
  already exports.

## Registering (closing the loop)

Every shared component you create or move gets a `MODULE_REGISTRY.md` row immediately:

```
| Header | components/shared/layout/header.tsx | composes ui/navigation-menu + Logo | site header, variants size/theme |
```

An unregistered shared component is invisible to the next run and **will** be rebuilt — which
is exactly the duplicate you just avoided, reappearing. Registration is not optional cleanup;
it's what makes the dedup work across runs.
