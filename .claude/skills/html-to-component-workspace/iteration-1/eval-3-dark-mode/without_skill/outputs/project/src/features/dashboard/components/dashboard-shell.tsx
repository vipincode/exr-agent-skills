import { Sidebar, type SidebarItem } from "@/components/shared/navigation";
import { StatCard, type StatCardProps } from "@/components/shared/data-display";

const navItems: SidebarItem[] = [
  { label: "Overview", href: "#", active: true },
  { label: "Analytics", href: "#" },
  { label: "Customers", href: "#" },
  { label: "Settings", href: "#" },
];

const stats: StatCardProps[] = [
  { label: "Revenue", value: "$48.2k", delta: "+12.4%", trend: "positive" },
  { label: "Active users", value: "3,184", delta: "+5.1%", trend: "positive" },
  { label: "Churn", value: "1.8%", delta: "-0.3%", trend: "positive" },
];

export function DashboardShell() {
  return (
    <div className="grid min-h-screen grid-cols-[240px_1fr]">
      <Sidebar items={navItems} />
      <main className="p-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      </main>
    </div>
  );
}
