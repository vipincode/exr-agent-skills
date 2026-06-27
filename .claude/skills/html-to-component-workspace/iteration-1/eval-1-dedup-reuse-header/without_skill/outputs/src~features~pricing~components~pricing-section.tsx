import { Container } from "@/components/shared/layout";
import { PricingCard, type PricingPlan } from "./pricing-card";

const plans: PricingPlan[] = [
  {
    name: "Starter",
    price: "$0",
    period: "/mo",
    features: ["1 project", "Community support", "1 GB storage"],
    ctaLabel: "Start free",
    ctaHref: "/signup",
  },
  {
    name: "Pro",
    price: "$29",
    period: "/mo",
    features: ["Unlimited projects", "Priority support", "100 GB storage"],
    ctaLabel: "Start Pro",
    ctaHref: "/signup",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    features: ["SSO & SAML", "Dedicated support", "Unlimited storage"],
    ctaLabel: "Contact sales",
    ctaHref: "/contact",
  },
];

export function PricingSection() {
  return (
    <section className="py-20 text-center">
      <Container>
        <h1 className="text-4xl font-bold">Simple, transparent pricing</h1>
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <PricingCard key={plan.name} {...plan} />
          ))}
        </div>
      </Container>
    </section>
  );
}
