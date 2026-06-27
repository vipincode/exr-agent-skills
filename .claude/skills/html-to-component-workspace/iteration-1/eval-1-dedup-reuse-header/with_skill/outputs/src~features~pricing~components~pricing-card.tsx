import { cva, type VariantProps } from "class-variance-authority";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const cardVariants = cva(
  "flex flex-col rounded-xl border bg-card p-8 text-left",
  {
    variants: {
      featured: {
        true: "border-primary shadow-card-featured",
        false: "border-border shadow-card",
      },
    },
    defaultVariants: { featured: false },
  }
);

export interface PricingPlan {
  name: string;
  /** Headline price, e.g. "$29" or "Custom". */
  price: string;
  /** Optional billing period suffix, e.g. "/mo". */
  period?: string;
  features: string[];
  cta: { label: string; href: string };
  featured?: boolean;
}

export interface PricingCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children">,
    VariantProps<typeof cardVariants>,
    PricingPlan {}

export function PricingCard({
  name,
  price,
  period,
  features,
  cta,
  featured = false,
  className,
  ...props
}: PricingCardProps) {
  return (
    <article className={cn(cardVariants({ featured }), className)} {...props}>
      <h3 className="text-lg font-semibold">{name}</h3>
      <p className="my-3 text-[2.5rem] font-bold leading-none">
        {price}
        {period && (
          <span className="text-sm font-normal text-muted-foreground">
            {period}
          </span>
        )}
      </p>
      <ul className="mb-6 space-y-1.5">
        {features.map((feature) => (
          <li key={feature} className="py-1 text-[0.9375rem] text-muted-foreground">
            {feature}
          </li>
        ))}
      </ul>
      <Button asChild size="lg" className="mt-auto w-full">
        <a href={cta.href}>{cta.label}</a>
      </Button>
    </article>
  );
}
