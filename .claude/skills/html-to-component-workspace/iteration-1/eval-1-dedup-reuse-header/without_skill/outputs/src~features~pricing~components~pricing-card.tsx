import { cva } from "class-variance-authority";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const pricingCardVariants = cva(
  "rounded-xl border p-8 text-left",
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
  price: string;
  /** e.g. "/mo" — omitted for custom pricing. */
  period?: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  featured?: boolean;
}

export type PricingCardProps = PricingPlan;

export function PricingCard({
  name,
  price,
  period,
  features,
  ctaLabel,
  ctaHref,
  featured,
}: PricingCardProps) {
  return (
    <div className={cn(pricingCardVariants({ featured }))}>
      <div className="text-lg font-semibold">{name}</div>
      <div className="my-3 text-4xl font-bold leading-none">
        {price}
        {period && (
          <span className="text-sm font-normal text-muted-foreground">{period}</span>
        )}
      </div>
      <ul className="my-4 space-y-1.5">
        {features.map((feature) => (
          <li key={feature} className="text-[15px] text-muted-foreground">
            {feature}
          </li>
        ))}
      </ul>
      <Button asChild className="w-full">
        <a href={ctaHref}>{ctaLabel}</a>
      </Button>
    </div>
  );
}
