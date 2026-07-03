# font-theme-setup

Extracts a design system's tokens from a **Figma file** and applies them to the project's **theme**. It edits exactly two things: `globals.css` and `layout.tsx`.

## What it does

- Pulls colors, typography, radius, shadows, spacing, line-heights, gradients, and background images from Figma via the Figma MCP.
- Rewrites the `globals.css` color tokens in **oklch** and maps them onto the shadcn/ui token system.
- Wires fonts in `layout.tsx` — Google fonts via `next/font`, plus local custom fonts.

## Example prompts

- "Set up the theme from this Figma file: <figma link>"
- "Apply the colors and fonts from Figma"
- "Convert this palette to oklch and configure the shadcn theme"

## Important

- **Requires the Figma MCP connected** and a Figma file/frame URL.
- Runs **once per project**; re-run it later to refresh tokens when the design system changes.
- Theme only — it does **not** build pages or components (that's `figma-to-component` / `html-to-component`) and does not scaffold projects (`nextjs-bootstrap`).
- Do this **before** building components, so they pick up the right tokens.
