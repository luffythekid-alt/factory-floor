"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import { Agent } from "@/lib/types";
import { formatRevenue } from "@/lib/utils";
import RevenueSparkline from "./RevenueSparkline";

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
  const hasRevenue =
    agent.totalRevenue !== null || agent.productRevenue !== null;
  const displayRevenue = agent.productRevenue ?? agent.totalRevenue;
  const hasChart =
    agent.weeklyRevenue && agent.weeklyRevenue.length > 1;

  const [showChart, setShowChart] = useState(false);
  const chartTimeout = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (!hasChart) return;
    chartTimeout.current = setTimeout(() => setShowChart(true), 200);
  };

  const handleMouseLeave = () => {
    if (chartTimeout.current) clearTimeout(chartTimeout.current);
    setShowChart(false);
  };

  return (
    <Link
      href={`/agent/${agent.slug}`}
      className="group grid grid-cols-12 gap-2 sm:gap-4 items-center px-4 sm:px-6 py-4 border-b border-white/[0.05] hover:bg-white/[0.02] hover:border-border-hover transition-all"
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
        {agent.avatar ? (
          <img
            src={agent.avatar}
            alt={agent.name}
            className="w-9 h-9 rounded-lg shrink-0 border border-white/5 object-cover"
          />
        ) : (
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 border border-white/5"
            style={{ backgroundColor: agent.color + "15", color: agent.color }}
          >
            {agent.name.slice(0, 2)}
          </div>
        )}
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

      {/* Revenue (product) + confidence dot + hover chart */}
      <div
        className="col-span-3 sm:col-span-2 text-right relative"
        ref={containerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
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
                ? confidenceColors[agent.revenueConfidence] ||
                  "text-txt-tertiary"
                : "text-txt-tertiary"
            } ${hasChart ? "cursor-pointer underline decoration-dotted underline-offset-2 decoration-white/20" : ""}`}
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

        {/* Hover chart popover */}
        {showChart && hasChart && (
          <div
            className="absolute z-50 right-0 top-full mt-2 w-[280px] bg-[#0a0a0a] border border-border rounded-lg p-3 shadow-2xl shadow-black/50"
            onClick={(e) => e.preventDefault()}
          >
            <RevenueSparkline
              weeks={agent.weeklyRevenue!}
              labels={agent.weeklyRevenueLabels!}
            />
          </div>
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
      <div className="col-span-4 sm:col-span-3 flex items-center justify-end">
        <span className="text-xs font-mono text-txt-tertiary">
          {(() => {
            const shipped = agent.products.filter((p) => p.status !== "in_progress").length;
            const inProgress = agent.products.filter((p) => p.status === "in_progress").length;
            if (inProgress > 0) return `${shipped} shipped, ${inProgress} in progress`;
            return `${shipped} shipped`;
          })()}
        </span>
      </div>
    </Link>
  );
}
