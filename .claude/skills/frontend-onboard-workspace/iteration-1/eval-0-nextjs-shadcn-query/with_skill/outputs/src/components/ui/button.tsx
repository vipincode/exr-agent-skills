import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
const buttonVariants = cva("inline-flex items-center rounded-md", {
  variants: { variant: { default: "bg-primary", outline: "border" }, size: { sm: "h-8", md: "h-10" } },
  defaultVariants: { variant: "default", size: "md" },
});
export function Button({ className, variant, size, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
