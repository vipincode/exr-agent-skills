import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const deltaVariants = cva("mt-1 text-[13px]", {
  variants: {
    trend: {
      positive: "text-positive",
      negative: "text-destructive",
    },
  },
  defaultVariants: { trend: "positive" },
});

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string;
  delta?: string;
  trend?: "positive" | "negative";
}

export function StatCard({
  label,
  value,
  delta,
  trend = "positive",
  className,
  ...props
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-5",
        className
      )}
      {...props}
    >
      <div className="text-[13px] text-muted-foreground">{label}</div>
      <div className="mt-1.5 text-[28px] font-semibold leading-tight text-card-foreground">
        {value}
      </div>
      {delta ? <div className={deltaVariants({ trend })}>{delta}</div> : null}
    </div>
  );
}
