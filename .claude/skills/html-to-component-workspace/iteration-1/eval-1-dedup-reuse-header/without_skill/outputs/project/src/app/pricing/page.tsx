import { Header } from "@/components/shared/layout";
import { PricingSection } from "@/features/pricing/components";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Get started", href: "/signup" },
];

export const metadata = {
  title: "Acme — Pricing",
  description: "Simple, transparent pricing.",
};

export default function PricingPage() {
  return (
    <main className="min-h-screen">
      <Header links={navLinks} />
      <PricingSection />
    </main>
  );
}
