import { Hero } from "@/components/shared/marketing";

export default function Home() {
  return (
    <main>
      <Hero
        title="Ship faster with Acme"
        subtitle="The all-in-one platform for modern teams."
        ctaLabel="Get started"
        ctaHref="/signup"
      />
    </main>
  );
}
