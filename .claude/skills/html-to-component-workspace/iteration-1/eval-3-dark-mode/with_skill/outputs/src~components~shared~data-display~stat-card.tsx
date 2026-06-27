import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const deltaVariants = cva("mt-1 text-sm", {
  variants: {
    trend: {
      up: "text-positive",
      down: "text-destructive",
    },
  },
  defaultVariants: { trend: "up" },
});

export interface StatCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof deltaVariants> {
  label: string;
  value: string;
  delta?: string;
}

export function StatCard({
  label,
  value,
  delta,
  trend,
  className,
  ...props
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-5 text-card-foreground",
        className
      )}
      {...props}
    >
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1.5 text-3xl font-semibold">{value}</p>
      {delta ? <p className={deltaVariants({ trend })}>{delta}</p> : null}
    </div>
  );
}
