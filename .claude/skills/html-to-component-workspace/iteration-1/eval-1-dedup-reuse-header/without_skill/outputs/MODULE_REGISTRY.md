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
| PricingCard | features/pricing/components/pricing-card.tsx | composes ui/button | single pricing plan card; `featured` variant |
| PricingSection | features/pricing/components/pricing-section.tsx | composes Container + PricingCard | pricing heading + 3-plan grid |

## Hooks / utils

| Name | Path | Purpose |
| --- | --- | --- |
| cn | lib/utils.ts | className merge (clsx + tailwind-merge) |

## Decisions log
- Theme/fonts: stock shadcn defaults, with `--primary` set to the design indigo (#4f46e5) and `--shadow-card` / `--shadow-card-featured` tokens added for pricing cards.
- Pricing page (`/pricing`) reuses the shared `Header` (passing `links`) instead of a new navbar, and the new shared `Container`.
