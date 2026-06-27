import { Hero } from "@/components/shared/marketing";

export default function Home() {
  return (
    <main>
      <Hero
        title="Ship faster with Acme"
        subtitle="The all-in-one platform for modern teams."
        action={{ label: "Get started", href: "/signup" }}
      />
    </main>
  );
}
