import { Header } from "@/components/shared/layout";
import { PricingSection } from "../components/pricing-section";
import { pricingPlans } from "../data";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Get started", href: "/signup" },
];

export function PricingTemplate() {
  return (
    <main className="min-h-screen">
      <Header links={navLinks} />
      <PricingSection plans={pricingPlans} />
    </main>
  );
}
