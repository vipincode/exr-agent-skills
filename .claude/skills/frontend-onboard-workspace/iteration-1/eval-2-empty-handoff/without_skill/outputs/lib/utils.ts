import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind class names, resolving conflicts (shadcn/ui convention).
 * Requires `clsx` and `tailwind-merge` as dependencies once package.json
 * is set up for this frontend (see ARCHITECTURE.md).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
