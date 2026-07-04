# Deriving the translation map (source → target)

The translation map is the contract of a port: **every recurring source value and every source custom component gets a target equivalent, and nothing crosses without one.** Derive it once per source→target pair, append it to the source profile in `_docs/design-source/<source-name>.md`, and route every page through it. This is what keeps a 20-page port consistent — page 14 must translate `--color-accent` exactly like page 1 did.

Derive by **role, not by name**. The source's crimson `--color-accent` maps to the target's `primary` because both play the brand/CTA role — even if the target's primary is blue after a theme lift, or stays the target's own brand color when the target was already themed (the user asked for the *design*, structure and hierarchy included; flag it if the palettes diverge so much the port won't read as "the same design").

## 1. Color map

Assign each recurring source color a **shadcn semantic role**, then record the Tailwind class:

| Source role (however it's named) | shadcn role | Classes |
|---|---|---|
| page background | `background` | `bg-background` |
| default text | `foreground` | `text-foreground` |
| card/panel surface | `card` | `bg-card text-card-foreground` |
| muted surface / alt background | `muted` | `bg-muted` |
| secondary/dim text | `muted-foreground` | `text-muted-foreground` |
| brand / CTA / emphasis | `primary` | `bg-primary text-primary-foreground` · `text-primary` · `border-primary` |
| secondary accent | `secondary` | `bg-secondary text-secondary-foreground` |
| borders / dividers | `border` (inputs: `input`) | `border-border` / `border-input` |
| destructive / error | `destructive` | `bg-destructive text-destructive-foreground` / `text-destructive` |
| focus ring | `ring` | `ring-ring` |
| success / warning / info states | project status tokens | check the target's `globals.css` — use its status tokens if present, else add them as tokens (tell the user), never hardcode a green/amber hex |

Record the map as `source value/name → role → class`. Confirm the exact class names against the **target's** `globals.css` — projects extend the standard set (`text-success`, `shadow-card`, chart colors), and the target's names win.

## 2. Typography map

- Source font families → the target's `font-*` tokens (`font-sans`, `font-display`/`font-heading`, `font-mono`). A data/metrics mono font in the source maps to `font-mono`; don't import the source's font unless the theme-gate step added it as a real `next/font` token.
- Source size/weight/line-height scale → the nearest Tailwind steps (`text-sm`…`text-4xl`, `font-medium`…). Map the *scale*, not each px occurrence — if the source's body is 15px, decide once that body = `text-sm` or `text-base` and stick to it.
- Source `Heading`/`Text` components → semantic `h1`–`h6`/`p` with token classes (or the target's shared typography components if the registry has them). Exactly one `h1` per page.

## 3. Radius / shadow / spacing map

| Source | Target |
|---|---|
| each radius step (e.g. 8/16/32px) | nearest `rounded-*` step, decided once (`rounded-lg` / `rounded-2xl` / `rounded-3xl`) |
| each shadow | the target's `shadow-*` tokens (add a token for a signature card shadow rather than an arbitrary value) |
| spacing scale (4/8/16/24…) | Tailwind spacing steps — nearest step, consistently (`gap-2`, `p-4`, `py-10`) |
| fixed sidebar/grid columns (`240px 1fr`) | `grid grid-cols-1 lg:grid-cols-[240px_1fr]` — mobile-first, collapse below `lg` |
| `repeat(N, 1fr)` grids | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-N` |

## 4. Component map

One row per source custom component, from the profile's component catalog. Targets in priority order: an existing **target shared component** (registry!) → a **shadcn/ui primitive** (add via CLI if missing) → a **new component** built per the dedup protocol. Typical mappings:

| Source component | Target |
|---|---|
| `Button` (primary/secondary/danger) | `ui/button` (`default`/`outline`/`destructive`) |
| `Badge`/`Tag`/status pill | `ui/badge` variants |
| `Input`/`Select` (display only) | `ui/input` / `ui/select` |
| `Input`/`Select` **inside a form** | the project's shared form-field wrappers (RHF + zod) |
| `Modal`/`Dialog` (side panel) | `ui/dialog` (`ui/sheet`) |
| `Table`/`DataTable` | `ui/table`; `@tanstack/react-table` when it sorts/filters/paginates |
| `Tabs`/segmented control | `ui/tabs` |
| charts (incl. mocked/static) | `ui/chart` (recharts) |
| `Tooltip`/`Popover`/`Dropdown` | `ui/tooltip` / `ui/popover` / `ui/dropdown-menu` |
| metric/stat card | shared or feature component composed on `ui/card` |
| `Container`/page wrapper | a width/padding utility wrapper (`mx-auto w-full max-w-* px-*`) — reuse the target's if one exists |
| icon font / inline SVG / emoji icons | lucide equivalents via `components/shared/icons.tsx` |

A source component with no obvious equivalent is a design decision, not a porting blocker: describe its role, run the dedup protocol, and build it as a target-native component (composing `ui/` primitives).

## 5. Persist and reuse

Append all four maps to the source profile under `## Translation maps`. On later pages: **look up before deciding** — if a source value/component already has a row, use it; only genuinely new values get new rows (append them). If you find yourself wanting to change an existing row, that's a redesign decision — surface it to the user, and if accepted, note the change and where it diverges from earlier pages.
