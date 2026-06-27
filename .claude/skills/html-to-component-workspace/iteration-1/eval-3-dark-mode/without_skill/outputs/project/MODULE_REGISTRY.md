# Module Registry

The dedup ledger. Every reusable shared component, hook, and util is listed here. **Check here before creating anything.** Register new shared components immediately.

## Shared components

| Component | Path | Wraps / composes | Purpose |
| --- | --- | --- | --- |
| Header | components/shared/layout/header.tsx | composes ui/button + Logo | site header / top nav; variants size (`md`/`sm`), theme (`light`/`dark`) |
| Logo | components/shared/brand/logo.tsx | inline SVG | brand mark; `variant` mono/color |
| Container | components/shared/layout/container.tsx | — | max-width page container |
| Button | components/ui/button.tsx | shadcn primitive | base button |
| Sidebar | components/shared/navigation/sidebar.tsx | — | vertical nav rail; `items` (label/href/active/icon), active item highlighted with primary |
| StatCard | components/shared/data-display/stat-card.tsx | — | KPI card: label / value / delta; `trend` positive(green) / negative(red) |

## Hooks / utils

| Name | Path | Purpose |
| --- | --- | --- |
| cn | lib/utils.ts | className merge (clsx + tailwind-merge) |

## Feature components

| Component | Path | Composes | Purpose |
| --- | --- | --- | --- |
| DashboardShell | features/dashboard/components/dashboard-shell.tsx | Sidebar + StatCard | dashboard page: sidebar + stat-card grid |

## Decisions log
- Theme/fonts: set from `_docs/designs/dashboard-dark.html` — Inter font, indigo primary, 12px radius, light + dark palettes in oklch. Added a `positive` (green) token pair for stat deltas. Dark mode via `.dark` class with a `prefers-color-scheme` fallback so the OS preference works out of the box.
