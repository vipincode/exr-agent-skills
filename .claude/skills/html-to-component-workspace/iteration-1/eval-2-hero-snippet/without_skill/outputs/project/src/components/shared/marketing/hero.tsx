import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface HeroProps extends React.HTMLAttributes<HTMLElement> {
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export function Hero({
  title,
  subtitle,
  ctaLabel,
  ctaHref = "#",
  className,
  ...props
}: HeroProps) {
  return (
    <section
      className={cn(
        "bg-gradient-to-br from-blue-500 to-purple-600 px-6 py-24",
        className
      )}
      {...props}
    >
      <div className="mx-auto max-w-[1100px] text-center">
        <h1 className="font-display text-[56px] font-semibold leading-[1.05] text-white">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-4 text-lg text-gray-200">{subtitle}</p>
        ) : null}
        {ctaLabel ? (
          <Button
            asChild
            className="mt-8 h-auto rounded-xl bg-white px-7 py-3.5 font-semibold text-blue-500 hover:bg-white/90"
          >
            <a href={ctaHref}>{ctaLabel}</a>
          </Button>
        ) : null}
      </div>
    </section>
  );
}
