import { cn } from "@/lib/utils";

export interface LogoProps extends React.SVGProps<SVGSVGElement> {
  variant?: "color" | "mono";
}

export function Logo({ variant = "color", className, ...props }: LogoProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("h-6 w-6", className)} aria-label="Acme" {...props}>
      <path
        d="M12 2 2 22h20L12 2Z"
        fill={variant === "mono" ? "currentColor" : "var(--color-primary)"}
      />
    </svg>
  );
}
