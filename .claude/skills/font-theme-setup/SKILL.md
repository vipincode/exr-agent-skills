---
name: font-theme-setup
description: Extract a design system's tokens from a Figma file (via the Figma MCP) and apply them to a Next.js + Tailwind v4 + shadcn/ui project's THEME — rewriting globals.css color tokens in oklch, wiring fonts in layout.tsx (next/font Google + local custom fonts), and setting radius, shadows, spacing, line-heights, gradients, and background images. Use this whenever the user wants to set up or update the theme / design tokens / colors / typography / fonts from a Figma link — phrases like "set up the theme from this figma", "apply these design tokens", "update the colors and fonts from figma", "convert the palette to oklch", "configure the shadcn theme", or "wire up the fonts". This is the frontend theming skill — it edits globals.css + layout.tsx + tailwind theme, it does NOT build pages or components from a frame (that is figma-to-component) and does NOT scaffold the project (that is nextjs-bootstrap). Runs once per project (re-run to refresh tokens). Requires the Figma MCP to be connected and a Figma file/frame URL.
---

# font-theme-setup

Turn a Figma file's design tokens into a Next.js + **Tailwind v4 + shadcn/ui** theme. The job is to read the source of truth (the Figma variables / styles) and write it into the **two places a shadcn app stores its theme**: `src/app/globals.css` (the CSS variables, colors in **oklch**) and `src/app/layout.tsx` (the fonts). Everything visual that's a *token* — color, type scale, radius, shadow, spacing, line-height, gradient, background — flows from Figma into those files so the rest of the app can just use Tailwind utilities and shadcn semantic classes.

This is a **theming** skill, not a component skill. It owns the global look. Building actual screens/components from a frame is `figma-to-component`; scaffolding the project is `nextjs-bootstrap`. Theming was deliberately deferred by the bootstrap to this skill (see the bootstrap's "Styling / theming" note).

## Why oklch, and why these two files

shadcn/Tailwind v4 store theme colors as **oklch** CSS variables in `globals.css` (a `:root` block, a `.dark` block, and a `@theme inline` block that maps them to Tailwind color names). Figma almost always hands you **hex/rgb**. So the core mechanical step is hex→oklch, done for every color — that's what `scripts/hex_to_oklch.py` is for (don't convert by hand; it's repetitive and easy to get subtly wrong). oklch is perceptually uniform, which is why shadcn picked it: light/dark variants and hover shades stay visually consistent.

Fonts live in `layout.tsx` because Next's `next/font` (Google **and** local) must run there to self-host the font, expose a CSS variable, and avoid layout shift. The CSS variable it produces (e.g. `--font-sans`) is then referenced from `globals.css`/`@theme`. So the two files work together: `layout.tsx` defines the font and its variable; `globals.css` binds that variable into the type system.

## Prerequisites & project resolution

1. **Resolve the project dir.** Read `.claude/workspace.json` at the repo root for the `frontend` entry → that's `<proj>`. If absent, look for a `frontend-*` folder (e.g. `frontend-shoply/`), a plain `frontend/`, or a `src/app/globals.css`. If you can't find a Next.js + shadcn project, stop and say so — this skill edits an existing scaffold, it doesn't create one (point them at `nextjs-bootstrap`).
2. **Read the contract files** at `<proj>` (or repo root): `ARCHITECTURE.md` and `MODULE_REGISTRY.md`. You'll update their theming notes at the end.
3. **Confirm the Figma MCP is connected and you have a URL.** You need a `figma.com/design/<fileKey>/...?node-id=<n>` link. If the user gave a file URL with no `node-id`, ask for a node-specific link (the frame/page that holds the design-system styles), or call `get_metadata` (no nodeId) to list pages and pick the tokens/foundations page.

## Workflow

> All paths are relative to `<proj>` (the resolved frontend project dir).

1. **Pull the tokens from Figma.** Prefer **`get_variable_defs`** on the design-system / foundations node — it returns the named variables (colors, font families, sizes, spacing, radii) which map cleanly to CSS variables. Also call **`get_design_context`** on a representative frame to see computed styles (font weights, line-heights, shadows, gradients that aren't always variables) and **`get_screenshot`** to eyeball the palette/typography. Read `references/extracting-tokens.md` for exactly what to ask for and how to interpret each tool's output.
2. **Normalize into a token map.** Group what you got into: **colors** (brand/semantic → shadcn roles), **typography** (font families, the size/line-height/weight scale), **radius**, **shadows**, **spacing**, **gradients**, **background images**. Don't invent tokens Figma doesn't have; do map Figma's semantic names onto shadcn's roles (see step 4).
3. **Convert every color to oklch.** Collect the hex/rgb values into a JSON map `{role: "#hex"}` and run `python scripts/hex_to_oklch.py --json colors.json` (or pass colors as args for a quick check). Use the output verbatim — these are the values you'll paste into `globals.css`.
4. **Map onto shadcn's semantic roles.** shadcn's theme is a fixed set of roles: `background foreground card popover primary secondary muted accent destructive border input ring` (+ `-foreground` pairs), plus `chart-1..5` and the `sidebar-*` set. Map Figma's palette onto these rather than inventing names, so every shadcn component is themed for free. Add **extra** brand tokens only when there's no role for them. Full mapping table + light/dark guidance: `references/token-mapping.md`.
5. **Rewrite `globals.css`.** Update the `:root` block (light), the `.dark` block (dark), and the `@theme inline` mapping. Set `--radius` from Figma's corner radius; add shadow tokens (`--shadow-*`), gradient tokens, and any custom font-size/line-height theme entries. Preserve shadcn's variable *names* and structure — you're swapping values, not restructuring. `references/token-mapping.md` shows the exact block shape for Tailwind v4.
6. **Wire fonts in `layout.tsx`.** Google fonts via `next/font/google`, custom/brand fonts via `next/font/local` (drop the font files under `src/app/fonts/` and reference them). Each font exposes a CSS variable; add those variables to `<html className={...}>` and bind them in `@theme` (`--font-sans`, `--font-serif`, `--font-mono`, or custom `--font-display`). Exact patterns for both: `references/fonts.md`.
7. **Apply the rest of the theme.** Radius, shadows, gradients, background images — wire them as tokens/utilities so components reference `rounded-lg`, `shadow-card`, `bg-gradient-brand`, etc., never raw values. `references/token-mapping.md` covers gradients/shadows/bg-images in Tailwind v4.
8. **Update the contract files.** In `ARCHITECTURE.md`, replace the "theme/fonts deferred to font-theme-setup" note with the now-concrete theme (fonts used, palette source, oklch). In `MODULE_REGISTRY.md`, update the decisions log line for theming/fonts (what fonts, light/dark, token source = this Figma file). Future skills (`figma-to-component`, builders) read these to use tokens instead of hardcoding.
9. **Verify.** Run the project's build/lint (`<pm> run build`) so the CSS + `layout.tsx` changes typecheck and Tailwind compiles. Spot-check `/` renders with the new fonts/colors. Report what changed (files touched, fonts added, # colors converted, light/dark coverage).

## What to read when

- `references/extracting-tokens.md` — which Figma MCP tool to call for which token type, and how to read each response (variables vs computed styles, dealing with no `node-id`, screenshots for sanity). Read before step 1.
- `references/token-mapping.md` — the shadcn role table, Figma→role mapping, the exact Tailwind v4 `:root` / `.dark` / `@theme inline` block shapes, and how radius/shadow/gradient/bg-image tokens are expressed. Read before steps 4–7.
- `references/fonts.md` — `next/font/google` and `next/font/local` patterns, exposing CSS variables, binding them in `@theme`, and the variable-font / multiple-weight cases. Read before step 6.
- `scripts/hex_to_oklch.py` — the hex/rgb → `oklch()` converter. Single color, many colors, or `--json` batch. Use it for every color.

## Non-negotiables

- **Colors are oklch, always.** shadcn's whole theme system is oklch in Tailwind v4. Never paste raw hex into `globals.css` theme variables — convert with the script. (Hex is fine only inside a one-off `linear-gradient()` if there's truly no token for it, but prefer tokens.)
- **Don't restructure shadcn's variables — re-value them.** Keep the role names (`--primary`, `--background`, …) and the `:root`/`.dark`/`@theme inline` three-block shape. Components depend on those names; renaming breaks them. You're changing values and adding tokens, not redesigning the system.
- **Map to semantic roles, don't sprinkle brand hexes.** A Figma "Blue/600" becomes `--primary` (and its readable text becomes `--primary-foreground`), so every Button/Badge/Link is themed at once. Resist creating `--blue-600`-style tokens unless the design truly needs a raw brand color with no semantic role.
- **Fonts go through `next/font`, never `<link>` tags or `@import url()`.** That's how Next self-hosts, prevents layout shift, and gives you the CSS variable. Google → `next/font/google`; brand/custom files → `next/font/local`.
- **Light AND dark.** Figma usually defines both (or a clear single mode). Fill both `:root` and `.dark`. If the design is one mode only, say so and set dark to a sensible derivation rather than leaving stale shadcn defaults.
- **Theme tokens, not magic numbers.** Radius, shadows, gradients, spacing → tokens/utilities so components stay declarative. A component hardcoding `border-radius: 14px` instead of using `--radius` is a regression this skill exists to prevent.
- **This skill is theme-only.** Don't build components or pages here. If the user also wants the frame turned into components, that's `figma-to-component` — hand off, don't scope-creep.
