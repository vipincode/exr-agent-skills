import Link from "next/link";
import { cn } from "@/lib/utils";

export interface SidebarNavItem {
  label: string;
  href: string;
  active?: boolean;
}

export interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
  items: SidebarNavItem[];
}

export function Sidebar({ items, className, ...props }: SidebarProps) {
  return (
    <aside
      className={cn(
        "flex flex-col border-r border-sidebar-border bg-sidebar px-4 py-6",
        className
      )}
      {...props}
    >
      <nav className="flex flex-col gap-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={item.active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-sm px-3 py-2.5 text-sm transition-colors",
              item.active
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
