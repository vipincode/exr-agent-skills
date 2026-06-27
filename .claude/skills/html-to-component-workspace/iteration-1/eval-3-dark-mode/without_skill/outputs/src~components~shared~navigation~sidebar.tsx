import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const sidebarItem = cva(
  "flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm transition-colors",
  {
    variants: {
      active: {
        true: "bg-primary text-primary-foreground",
        false: "text-muted-foreground hover:bg-accent hover:text-foreground",
      },
    },
    defaultVariants: { active: false },
  }
);

export interface SidebarItem {
  label: string;
  href?: string;
  active?: boolean;
  icon?: React.ReactNode;
}

export interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
  items: SidebarItem[];
}

export function Sidebar({ items, className, ...props }: SidebarProps) {
  return (
    <aside
      className={cn(
        "flex w-60 flex-col gap-1 border-r border-border bg-card px-4 py-6",
        className
      )}
      {...props}
    >
      <nav className="flex flex-col gap-1">
        {items.map((item) => (
          <a
            key={item.label}
            href={item.href ?? "#"}
            aria-current={item.active ? "page" : undefined}
            className={sidebarItem({ active: item.active })}
          >
            {item.icon}
            {item.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}
