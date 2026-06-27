# Extracting tokens from Figma (which MCP tool, how to read it)

Goal: get the design system's **values** out of Figma so you can turn them into shadcn theme
tokens. Three MCP tools matter here; use them together — variables give you names, design
context gives you computed styles, the screenshot keeps you honest.

## Get a node-specific URL first

Every read tool needs a `fileKey` + `nodeId`, parsed from the URL:
`https://figma.com/design/<fileKey>/<name>?node-id=1-2` → `fileKey`, `nodeId = 1:2`
(`1-2` and `1:2` are both accepted).

If the user's URL has **no `node-id`**, don't guess one. Call `get_metadata` with only the
`fileKey` — it returns the document's top-level pages (guid + name). Pick the page that holds
the foundations (often named "Tokens", "Foundations", "Design System", "Styles", or the main
page) and use its id, or ask the user which frame defines the styles.

## 1. `get_variable_defs` — the primary token source

Returns the **named variables** bound in the node, e.g. `{ 'color/primary/600': '#3B82F6',
'font/family/sans': 'Inter', 'radius/md': 8, 'space/4': 16 }`. This is the cleanest input
because the names usually telegraph intent (`color/primary/...`, `text/heading/...`).

How to use it:
- **Colors** → collect into a `{role: hex}` map for the converter. Use the Figma name to guess
  the shadcn role (`primary` → `--primary`, `bg/surface` → `--card`/`--background`, `border/*`
  → `--border`). Finalize the mapping with `references/token-mapping.md`.
- **Font families** → the `--font-*` names for `layout.tsx` (`references/fonts.md`).
- **Numbers** (radius, spacing) → Figma reports these in px. `--radius` is typically the
  base/md corner radius. Spacing maps to Tailwind's scale (16px = `4` = `1rem`).

If the node has few or no variables (older files style things directly), lean on
`get_design_context` instead.

## 2. `get_design_context` — computed styles & the things variables miss

Returns reference code + a screenshot + asset URLs for a frame. Use it to read what variables
often **don't** capture:
- **Font weights and line-heights** actually used on text layers.
- **Shadows** (`box-shadow` values) — convert the color part to oklch too, keep offsets/blur.
- **Gradients** — capture stops, angle, and each stop color (→ oklch).
- **Background images / fills** — note them; you'll export with `download_assets` if needed
  (the component skill usually owns asset export, but a themed background image can live here).

Treat the returned code as a **reference for values, not code to paste** — you're harvesting
numbers and colors, not its markup.

## 3. `get_screenshot` — sanity check

Pull a screenshot of the foundations frame (and one real screen) so you can eyeball that your
extracted palette and type scale match what a human sees — catches cases where a variable is
defined but the design actually uses an override.

## Turning raw colors into oklch

Once you have the hex/rgb values, batch-convert:

```bash
# write the map you built from get_variable_defs:
echo '{"primary":"#3B82F6","background":"#FFFFFF","foreground":"#0A0A0A"}' \
  | python scripts/hex_to_oklch.py --json -
```

Use the output strings verbatim in `globals.css`. Don't round further or hand-edit them.

## A note on scope

Extract **tokens** (system-level values), not per-screen one-offs. If a single hero uses a
bespoke gradient that isn't part of the system, that belongs to the component
(`figma-to-component`), not the global theme. The theme is the reusable foundation.
