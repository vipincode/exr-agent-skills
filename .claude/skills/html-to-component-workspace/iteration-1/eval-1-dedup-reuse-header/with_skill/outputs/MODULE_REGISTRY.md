# Module Registry

The dedup ledger. Every reusable shared component, hook, and util is listed here. **Check here before creating anything.** Register new shared components immediately.

## Shared components

| Component | Path | Wraps / composes | Purpose |
| --- | --- | --- | --- |
| Header | components/shared/layout/header.tsx | composes ui/button + Logo | site header / top nav; variants size (`md`/`sm`), theme (`light`/`dark`) |
| Logo | components/shared/brand/logo.tsx | inline SVG | brand mark; `variant` mono/color |
| Container | components/shared/layout/container.tsx | — | max-width page container |
| Button | components/ui/button.tsx | shadcn primitive | base button |

## Feature components

| Component | Path | Wraps / composes | Purpose |
| --- | --- | --- | --- |
| PricingCard | features/pricing/components/pricing-card.tsx | composes ui/button | single pricing plan card; `featured` cva variant (border/shadow emphasis) |
| PricingSection | features/pricing/components/pricing-section.tsx | composes Container + PricingCard | pricing heading + responsive 3-up plan grid |
| PricingTemplate | features/pricing/template/pricing-template.tsx | composes shared/Header + PricingSection | assembles the `/pricing` screen |

## Hooks / utils

| Name | Path | Purpose |
| --- | --- | --- |
| cn | lib/utils.ts | className merge (clsx + tailwind-merge) |

## Decisions log
- Theme/fonts: applied from `_docs/designs/pricing.html` — indigo `#4f46e5` primary + slate
  neutrals (oklch), Inter font (sans + display). Dark mode derived. Added `--shadow-card` /
  `--shadow-card-featured` tokens. (was stock shadcn defaults.)
- `pricing.html`: **reused** shared `Header` (passed nav links) and `Logo` — no new header built.
  `Container` was registered but unimplemented; implemented it at the registered path.
- Pricing plan cards are domain-specific → `features/pricing/` (PricingCard + PricingSection +
  template + `data.ts`). PricingCard renders one plan from typed props; the section `.map()`s the
  3 plans over it rather than emitting three inline blocks.
