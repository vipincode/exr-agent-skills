import type { Metadata } from "next";
import { PricingTemplate } from "@/features/pricing/template/pricing-template";

export const metadata: Metadata = {
  title: "Acme — Pricing",
  description: "Simple, transparent pricing.",
};

export default function PricingPage() {
  return <PricingTemplate />;
}
