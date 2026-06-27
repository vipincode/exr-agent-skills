import { cva, type VariantProps } from "class-variance-authority";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/brand/logo";
import { cn } from "@/lib/utils";

const headerVariants = cva(
  "flex w-full items-center justify-between border-b",
  {
    variants: {
      size: { md: "h-16 px-6", sm: "h-12 px-4" },
      theme: { light: "bg-background text-foreground", dark: "bg-foreground text-background" },
    },
    defaultVariants: { size: "md", theme: "light" },
  }
);

export interface HeaderProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof headerVariants> {
  links?: { label: string; href: string }[];
}

export function Header({ size, theme, links = [], className, ...props }: HeaderProps) {
  return (
    <header className={cn(headerVariants({ size, theme }), className)} {...props}>
      <a href="/" className="flex items-center gap-2 font-display font-semibold">
        <Logo />
        Acme
      </a>
      <nav className="flex items-center gap-6">
        {links.map((l) => (
          <a key={l.href} href={l.href} className="text-sm text-muted-foreground hover:text-foreground">
            {l.label}
          </a>
        ))}
        <Button size="sm">Sign in</Button>
      </nav>
    </header>
  );
}
