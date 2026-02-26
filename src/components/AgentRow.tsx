import Link from "next/link";
import { Agent } from "@/lib/types";
import { formatRevenue } from "@/lib/utils";

function formatMarketCap(val: number | null): string {
  if (val === null) return "—";
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${val}`;
}

const confidenceColors: Record<string, string> = {
  high: "text-accent-green",
  medium: "text-accent-yellow",
  low: "text-accent-orange",
  none: "text-txt-tertiary",
};

const confidenceDots: Record<string, string> = {
  high: "bg-accent-green",
  medium: "bg-accent-yellow",
  low: "bg-accent-orange",
  none: "bg-txt-tertiary",
};

export default function AgentRow({
  agent,
  rank,
}: {
  agent: Agent;
  rank: number;
}) {
  const hasRevenue = agent.totalRevenue !== null || agent.productRevenue !== null;
  const displayRevenue = agent.productRevenue ?? agent.totalRevenue;

  return (
    <Link
      href={`/agent/${agent.slug}`}
      className="group grid grid-cols-12 gap-2 sm:gap-4 items-center px-4 sm:px-6 py-4 border-b border-border/50 hover:bg-white/[0.02] hover:border-border-hover transition-all"
    >
      {/* Rank */}
      <div className="col-span-1 font-mono text-sm">
        {hasRevenue ? (
          <span className="text-txt-secondary">#{rank}</span>
        ) : (
          <span className="text-txt-tertiary">—</span>
        )}
      </div>

      {/* Name + Category */}
      <div className="col-span-4 sm:col-span-3 flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 border border-white/5"
          style={{ backgroundColor: agent.color + "15", color: agent.color }}
        >
          {agent.name.slice(0, 2)}
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-sm text-txt group-hover:text-accent-green transition-colors truncate flex items-center gap-1.5">
            {agent.name}
            {agent.status === "active" && (
              <span className="w-1.5 h-1.5 rounded-full bg-accent-green shrink-0" />
            )}
          </div>
          <div className="text-[11px] text-txt-tertiary truncate font-mono">
            {agent.category}
          </div>
        </div>
      </div>

      {/* Revenue (product) + confidence dot */}
      <div className="col-span-3 sm:col-span-2 text-right">
        <div className="flex items-center justify-end gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              confidenceDots[agent.revenueConfidence] || confidenceDots.none
            }`}
            title={`Confidence: ${agent.revenueConfidence}`}
          />
          <span
            className={`font-mono text-sm font-semibold ${
              hasRevenue
                ? confidenceColors[agent.revenueConfidence] || "text-txt-tertiary"
                : "text-txt-tertiary"
            }`}
          >
            {displayRevenue !== null ? formatRevenue(displayRevenue) : "—"}
          </span>
        </div>
        {agent.revenueGrowthWoW !== null && (
          <div
            className={`text-[10px] font-mono ${
              agent.revenueGrowthWoW >= 0
                ? "text-accent-green"
                : "text-accent-red"
            }`}
          >
            {agent.revenueGrowthWoW >= 0 ? "+" : ""}
            {agent.revenueGrowthWoW.toFixed(1)}% WoW
          </div>
        )}
      </div>

      {/* Trading Fee Revenue */}
      <div className="col-span-2 hidden sm:block text-right">
        <span className="font-mono text-sm text-txt-secondary">
          {agent.tradingFeeRevenue !== null
            ? formatRevenue(agent.tradingFeeRevenue)
            : "—"}
        </span>
        {agent.tradingFeeRevenue !== null && (
          <div className="text-[10px] font-mono text-txt-tertiary">fees</div>
        )}
      </div>

      {/* Market Cap */}
      <div className="col-span-2 hidden sm:block text-right">
        <span
          className={`font-mono text-sm ${
            agent.tokenMarketCap ? "text-txt-secondary" : "text-txt-tertiary"
          }`}
        >
          {formatMarketCap(agent.tokenMarketCap)}
        </span>
        {agent.tokenTicker && (
          <div className="text-[10px] font-mono text-txt-tertiary">
            {agent.tokenTicker}
          </div>
        )}
      </div>

      {/* Products Count */}
      <div className="col-span-4 sm:col-span-2 flex items-center justify-end">
        <span className="text-xs font-mono text-txt-tertiary">
          {agent.products.length} product
          {agent.products.length !== 1 ? "s" : ""}
        </span>
      </div>
    </Link>
  );
}
