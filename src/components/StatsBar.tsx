import { Agent } from "@/lib/types";
import { formatRevenue } from "@/lib/utils";

export default function StatsBar({ agents }: { agents: Agent[] }) {
  const totalRevenue = agents.reduce(
    (sum, a) => sum + (a.totalRevenue ?? 0),
    0
  );
  const activeCount = agents.filter((a) => a.status === "active").length;
  const categories = new Set(agents.map((a) => a.category)).size;

  const stats = [
    { label: "Total Revenue", value: formatRevenue(totalRevenue), accent: true },
    { label: "Factories Tracked", value: agents.length.toString(), accent: false },
    { label: "Active", value: activeCount.toString(), accent: false },
    { label: "Categories", value: categories.toString(), accent: false },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
      {stats.map((s) => (
        <div
          key={s.label}
          className="relative overflow-hidden bg-white/[0.02] border border-border rounded-lg p-4 hover:border-border-hover transition-colors group"
        >
          {s.accent && (
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent-green/50 to-transparent" />
          )}
          <div className="text-[10px] font-mono text-txt-tertiary uppercase tracking-widest">
            {s.label}
          </div>
          <div className={`text-2xl font-bold font-mono mt-1.5 ${
            s.accent ? "text-accent-green" : "text-txt"
          }`}>
            {s.value}
          </div>
        </div>
      ))}
    </div>
  );
}
