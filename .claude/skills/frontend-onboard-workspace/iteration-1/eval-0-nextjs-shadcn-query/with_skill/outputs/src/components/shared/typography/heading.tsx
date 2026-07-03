import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
const headingVariants = cva("font-semibold tracking-tight", {
  variants: { level: { h1: "text-3xl", h2: "text-2xl", h3: "text-xl" } },
  defaultVariants: { level: "h1" },
});
export function Heading({ className, level, ...props }: React.HTMLAttributes<HTMLHeadingElement> & VariantProps<typeof headingVariants>) {
  return <h2 className={cn(headingVariants({ level }), className)} {...props} />;
}
