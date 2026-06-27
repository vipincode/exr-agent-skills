import { Sidebar, type SidebarNavItem } from "@/components/shared/layout";
import { StatCard, type StatCardProps } from "@/components/shared/data-display";

const navItems: SidebarNavItem[] = [
  { label: "Overview", href: "/", active: true },
  { label: "Analytics", href: "/analytics" },
  { label: "Customers", href: "/customers" },
  { label: "Settings", href: "/settings" },
];

const stats: StatCardProps[] = [
  { label: "Revenue", value: "$48.2k", delta: "+12.4%", trend: "up" },
  { label: "Active users", value: "3,184", delta: "+5.1%", trend: "up" },
  { label: "Churn", value: "1.8%", delta: "-0.3%", trend: "up" },
];

export function DashboardTemplate() {
  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[240px_1fr]">
      <Sidebar items={navItems} />
      <main className="p-6 md:p-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      </main>
    </div>
  );
}
