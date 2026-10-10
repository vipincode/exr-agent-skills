// The app's single icon registry. Every icon the app uses is re-exported here
// (and custom icons live here as `currentColor` SVG components), so app code
// imports from "@/components/shared/icons" — never from lucide-react directly,
// never a pasted inline <svg>. Lint enforces it (eslint.boundaries.mjs).
// Need a new icon? Add it to this export list.

export { CalendarIcon, Check, ChevronsUpDown, X } from "lucide-react";
