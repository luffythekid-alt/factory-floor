import { Agent } from "@/lib/types";
import { formatRevenue } from "@/lib/utils";

export default function StatsBar({ agents }: { agents: Agent[] }) {
  const totalRevenue = agents.reduce(
    (sum, a) => sum + (a.totalRevenue ?? 0),
    0
  );
  const activeCount = agents.filter((a) => a.status === "active").length;
  const withRevenue = agents.filter((a) => a.totalRevenue !== null).length;

  const stats = [
    { label: "Tracked Agents", value: agents.length.toString() },
    { label: "Active", value: activeCount.toString() },
    { label: "Total Revenue (tracked)", value: formatRevenue(totalRevenue) },
    { label: "With Public Revenue", value: withRevenue.toString() },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
      {stats.map((s) => (
        <div
          key={s.label}
          className="bg-white/[0.02] border border-border rounded-lg p-4"
        >
          <div className="text-xs font-mono text-txt-tertiary uppercase tracking-wider">
            {s.label}
          </div>
          <div className="text-xl font-bold font-mono text-accent-green mt-1">
            {s.value}
          </div>
        </div>
      ))}
    </div>
  );
}
