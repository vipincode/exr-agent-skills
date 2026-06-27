# Output Summary — pricing.html → Next.js

Built `_docs/designs/pricing.html` into components and assembled the page at the `/pricing` route.

## Reuse (no duplicates)
- **Header** (`src/components/shared/layout/header.tsx`) — the pricing navbar is identical to the landing page header, so the existing shared `Header` is reused with the `links` prop. No new navbar component was created.
- **Button** (`src/components/ui/button.tsx`) — reused for all plan CTAs via `asChild` (rendered as `<a>`).

## Components created

| Component | Path | Type | Notes |
| --- | --- | --- | --- |
| `Container` | `src/components/shared/layout/container.tsx` | shared/layout | Max-width (1120px) centered page container. Was listed in MODULE_REGISTRY but the file was missing, so it was created to fulfill the contract. |
| `PricingCard` | `src/features/pricing/components/pricing-card.tsx` | feature | Single plan card. `featured` variant (cva) for the highlighted Pro plan. Composes `Button`. |
| `PricingSection` | `src/features/pricing/components/pricing-section.tsx` | feature | Heading + responsive 3-plan grid. Holds the plan data. Composes `Container` + `PricingCard`. |

Barrels added/updated:
- `src/components/shared/layout/index.ts` — now also exports `Container`.
- `src/features/pricing/components/index.ts` — exports the pricing components.

## Page assembled
- `src/app/pricing/page.tsx` — `Header` (with nav links) + `PricingSection`. Page metadata set to "Acme — Pricing".

## Theme tokens
- `src/app/globals.css`:
  - `--primary` set to the design indigo `#4f46e5` → `oklch(0.511 0.214 277)` (drives CTAs + featured border).
  - Added `--shadow-card` and `--shadow-card-featured` tokens (used by `PricingCard` as `shadow-card` / `shadow-card-featured`).

## Registry
- `MODULE_REGISTRY.md` updated with the new feature components and a decisions-log entry noting the Header reuse and theme changes.

## Conventions followed
- Tailwind utilities + theme tokens (no separate CSS files, no inline styles for static styling).
- Domain-specific pricing UI placed under `src/features/pricing/`; generic `Container` under `src/components/shared/layout/`.
- `cva` used for the card's visual variant; components are Server Components (no `"use client"` needed).

> Note: install/build were not run (no `node_modules`), per instructions — file edits only.
