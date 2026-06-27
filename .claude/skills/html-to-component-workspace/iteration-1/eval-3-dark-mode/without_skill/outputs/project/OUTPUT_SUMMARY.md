# Output Summary

Source design: `_docs/designs/dashboard-dark.html` (Acme dashboard — light + dark).

## Theme changes

**`src/app/globals.css`**
- Mapped the design's CSS variables to shadcn oklch tokens for both `:root` (light) and `.dark`:
  | Design var | Light hex | Dark hex | shadcn token |
  | --- | --- | --- | --- |
  | `--bg` | `#ffffff` | `#0b1120` | `--background` |
  | `--surface` | `#f8fafc` | `#111827` | `--card` / `--secondary` / `--muted` / `--accent` |
  | `--text` | `#0f172a` | `#e5e7eb` | `--foreground` |
  | `--text-muted` | `#64748b` | `#94a3b8` | `--muted-foreground` |
  | `--brand` | `#6366f1` | `#818cf8` | `--primary` / `--ring` |
  | `--brand-fg` | `#ffffff` | `#0b1120` | `--primary-foreground` |
  | `--border` | `#e2e8f0` | `#1f2937` | `--border` / `--input` |
  | `--positive` | `#16a34a` | `#4ade80` | `--positive` (new) |
- `--radius` set to `0.75rem` (design's 12px).
- Added a custom `positive` / `positive-foreground` token pair (the design's green delta color) and exposed it in `@theme inline` as `--color-positive` so `text-positive` / `bg-positive` work.
- Added `--font-display: var(--font-sans)` so the `font-display` class used by existing components resolves to Inter.
- Dark mode: kept shadcn's class-based `.dark` palette AND added a `@media (prefers-color-scheme: dark)` fallback (scoped to `:root:not(.light):not(.dark)`) so the OS preference applies out of the box, matching the original design — while an explicit `.light`/`.dark` class still wins.

**`src/app/layout.tsx`**
- Swapped Geist for **Inter** (`next/font/google`, weights 400/500/600 per the design) bound to `--font-sans`. Kept Geist_Mono for `--font-mono`. Updated metadata title.

## Components created

| Component | Path | Notes |
| --- | --- | --- |
| `Sidebar` | `src/components/shared/navigation/sidebar.tsx` | Generic vertical nav rail. `items: { label, href?, active?, icon? }[]`. Active item uses `bg-primary text-primary-foreground` (cva). |
| `StatCard` | `src/components/shared/data-display/stat-card.tsx` | Generic KPI card (label / value / delta). `trend` prop: `positive` → `text-positive`, `negative` → `text-destructive`. |
| `DashboardShell` | `src/features/dashboard/components/dashboard-shell.tsx` | Domain layout composing `Sidebar` + a responsive `StatCard` grid with the design's sample data. |

Barrels added: `navigation/index.ts`, `data-display/index.ts`, `features/dashboard/components/index.ts`.

## Wiring & docs
- `src/app/page.tsx` now renders `<DashboardShell />`.
- `MODULE_REGISTRY.md`: registered Sidebar, StatCard, DashboardShell + decisions-log note.
- `ARCHITECTURE.md`: updated the Theme/fonts note.

## Conventions followed
- Theme tokens only (no raw hex/px in components — colors via `bg-card`, `text-positive`, etc.).
- `cva` for variant-bearing components; Server Components (no unnecessary `"use client"`).
- Generic pieces → `components/shared/`; domain layout → `features/dashboard/`.
- Reused existing `cn` util; no duplicates created.

Note: dependencies were not installed and no build was run, per instructions.
