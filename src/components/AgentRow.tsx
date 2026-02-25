import Link from "next/link";
import { Agent } from "@/lib/types";
import { formatRevenue, formatDate } from "@/lib/utils";

export default function AgentRow({
  agent,
  rank,
}: {
  agent: Agent;
  rank: number;
}) {
  return (
    <Link
      href={`/agent/${agent.slug}`}
      className="group grid grid-cols-12 gap-2 sm:gap-4 items-center px-4 sm:px-6 py-4 border-b border-border hover:bg-white/[0.02] transition-colors"
    >
      {/* Rank */}
      <div className="col-span-1 text-txt-tertiary font-mono text-sm">
        {agent.totalRevenue !== null ? `#${rank}` : "—"}
      </div>

      {/* Name + Category */}
      <div className="col-span-4 sm:col-span-3 flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
          style={{ backgroundColor: agent.color + "20", color: agent.color }}
        >
          {agent.name[0]}
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-sm text-txt group-hover:text-accent-green transition-colors truncate">
            {agent.name}
          </div>
          <div className="text-xs text-txt-tertiary truncate">
            {agent.category}
          </div>
        </div>
      </div>

      {/* Twitter */}
      <div className="col-span-2 hidden sm:block">
        <span className="text-xs font-mono text-txt-secondary">
          @{agent.twitter}
        </span>
      </div>

      {/* Revenue */}
      <div className="col-span-3 sm:col-span-2 text-right">
        <span className="font-mono text-sm font-semibold text-accent-green">
          {formatRevenue(agent.totalRevenue)}
        </span>
      </div>

      {/* Revenue Source */}
      <div className="col-span-2 hidden sm:block">
        <span className="text-xs text-txt-tertiary truncate block">
          {agent.revenueSource}
        </span>
      </div>

      {/* Status + Date */}
      <div className="col-span-4 sm:col-span-2 flex items-center justify-end gap-2">
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            agent.status === "active" ? "bg-accent-green" : "bg-accent-red"
          }`}
        />
        <span className="text-xs font-mono text-txt-tertiary hidden sm:inline">
          {formatDate(agent.launchDate)}
        </span>
      </div>
    </Link>
  );
}
