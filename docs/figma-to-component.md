# figma-to-component

Turns a **Figma frame or node** into production-grade Next.js + TypeScript + Tailwind + shadcn/ui components — **without creating duplicates**.

## What it does

- Scans `MODULE_REGISTRY.md` and the `components/shared` + `features/` trees first, and **reuses or extends** what already exists.
- Places new pieces correctly: generic/reusable → `components/shared`, domain-specific → `features/<name>/components`.
- Styles with Tailwind utilities + theme tokens (no hardcoded hex), animates with Tailwind/CSS or framer-motion, exports assets, and registers new shared components in the registry.

## Example prompts

- "Turn this Figma frame into components: <node link>"
- "Build this design" (with a figma.com node URL)
- "Implement this screen from Figma"

## Important

- **Requires:** the Figma MCP connected, a **node-specific** Figma URL (select the frame → copy link), and an existing Next.js + shadcn project with the contract files.
- Run `font-theme-setup` first so components use the right theme tokens.
- Builds the **design** (with sample data). Making it functional against a real API is `module-planner` → `module-builder`.
- HTML source instead of Figma? Use `html-to-component`.
