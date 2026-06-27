import { cn } from "@/lib/utils";

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {}

/** Max-width page container — centers content and applies horizontal gutters. */
export function Container({ className, ...props }: ContainerProps) {
  return (
    <div
      className={cn("mx-auto w-full max-w-[1120px] px-6", className)}
      {...props}
    />
  );
}
