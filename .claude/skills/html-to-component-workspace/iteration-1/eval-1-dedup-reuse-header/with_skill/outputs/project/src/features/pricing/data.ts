import type { PricingPlan } from "./components/pricing-card";

export const pricingPlans: PricingPlan[] = [
  {
    name: "Starter",
    price: "$0",
    period: "/mo",
    features: ["1 project", "Community support", "1 GB storage"],
    cta: { label: "Start free", href: "/signup" },
  },
  {
    name: "Pro",
    price: "$29",
    period: "/mo",
    features: ["Unlimited projects", "Priority support", "100 GB storage"],
    cta: { label: "Start Pro", href: "/signup" },
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    features: ["SSO & SAML", "Dedicated support", "Unlimited storage"],
    cta: { label: "Contact sales", href: "/contact" },
  },
];
