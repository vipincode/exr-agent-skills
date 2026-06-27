import { cva, type VariantProps } from "class-variance-authority";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const heroVariants = cva(
  "w-full bg-[image:var(--gradient-brand)] text-white",
  {
    variants: {
      size: {
        md: "px-6 py-20 md:py-24",
        sm: "px-6 py-12 md:py-16",
      },
    },
    defaultVariants: { size: "md" },
  }
);

export interface HeroAction {
  label: string;
  href: string;
}

export interface HeroProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof heroVariants> {
  title: string;
  subtitle?: string;
  action?: HeroAction;
}

export function Hero({
  size,
  title,
  subtitle,
  action,
  className,
  ...props
}: HeroProps) {
  return (
    <section className={cn(heroVariants({ size }), className)} {...props}>
      <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
        <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-4 max-w-2xl text-lg text-white/80">{subtitle}</p>
        ) : null}
        {action ? (
          <Button
            asChild
            size="lg"
            className="mt-8 rounded-xl bg-white px-7 font-semibold text-primary hover:bg-white/90"
          >
            <a href={action.href}>{action.label}</a>
          </Button>
        ) : null}
      </div>
    </section>
  );
}
