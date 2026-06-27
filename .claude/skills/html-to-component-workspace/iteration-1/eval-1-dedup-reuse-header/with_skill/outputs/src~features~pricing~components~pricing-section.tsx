import { Container } from "@/components/shared/layout";
import { PricingCard, type PricingPlan } from "./pricing-card";

export interface PricingSectionProps {
  plans: PricingPlan[];
  heading?: string;
}

export function PricingSection({
  plans,
  heading = "Simple, transparent pricing",
}: PricingSectionProps) {
  return (
    <section className="py-20 text-center">
      <Container>
        <h1 className="font-display text-3xl font-bold md:text-4xl">{heading}</h1>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <PricingCard key={plan.name} {...plan} />
          ))}
        </div>
      </Container>
    </section>
  );
}
