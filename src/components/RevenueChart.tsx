"use client";

import { useState } from "react";

interface RevenueChartProps {
  weeks: number[];
  labels: string[];
}

export default function RevenueChart({ weeks, labels }: RevenueChartProps) {
  const max = Math.max(...weeks, 1);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Calculate growth rates
  const growths = weeks.map((val, i) => {
    if (i === 0 || weeks[i - 1] === 0) return null;
    return ((val - weeks[i - 1]) / weeks[i - 1]) * 100;
  });

  const total = weeks.reduce((a, b) => a + b, 0);
  const avg = Math.round(total / weeks.length);
  const latest = weeks[weeks.length - 1];
  const latestGrowth = growths[growths.length - 1];

  return (
    <div>
      {/* Summary row */}
      <div className="flex items-center gap-6 mb-4">
        <div>
          <div className="text-[10px] font-mono text-txt-tertiary uppercase tracking-wider">
            Total
          </div>
          <div className="text-lg font-bold font-mono text-txt">
            ${total.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-mono text-txt-tertiary uppercase tracking-wider">
            Avg / Week
          </div>
          <div className="text-lg font-bold font-mono text-txt-secondary">
            ${avg.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-mono text-txt-tertiary uppercase tracking-wider">
            Latest Week
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold font-mono text-accent-green">
              ${latest.toLocaleString()}
            </span>
            {latestGrowth !== null && (
              <span
                className={`text-xs font-mono ${
                  latestGrowth >= 0 ? "text-accent-green" : "text-accent-red"
                }`}
              >
                {latestGrowth >= 0 ? "+" : ""}
                {latestGrowth.toFixed(0)}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex items-end gap-2 h-[140px] px-1">
        {weeks.map((val, i) => {
          const height = Math.max((val / max) * 100, 3);
          const isLast = i === weeks.length - 1;
          const isHovered = hoveredIdx === i;
          const growth = growths[i];

          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center gap-1 cursor-pointer"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Hover tooltip */}
              <div
                className={`text-center transition-opacity duration-100 ${
                  isHovered ? "opacity-100" : "opacity-0"
                }`}
              >
                <div className="text-[11px] font-mono font-semibold text-accent-green">
                  ${val.toLocaleString()}
                </div>
                {growth !== null && (
                  <div
                    className={`text-[9px] font-mono ${
                      growth >= 0 ? "text-accent-green" : "text-accent-red"
                    }`}
                  >
                    {growth >= 0 ? "+" : ""}
                    {growth.toFixed(0)}%
                  </div>
                )}
              </div>

              {/* Bar */}
              <div
                className={`w-full rounded-sm transition-all duration-150 ${
                  isHovered
                    ? "bg-accent-green"
                    : isLast
                    ? "bg-accent-green/60"
                    : "bg-white/10"
                }`}
                style={{ height: `${height}%`, minHeight: "3px" }}
              />

              {/* Label */}
              <span
                className={`text-[10px] font-mono ${
                  isHovered ? "text-txt" : "text-txt-tertiary"
                }`}
              >
                {labels[i]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Growth summary */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50">
        {growths.map((g, i) => {
          if (i === 0 || g === null) return null;
          return (
            <div key={i} className="text-[10px] font-mono text-txt-tertiary">
              {labels[i - 1]}→{labels[i]}:{" "}
              <span
                className={g >= 0 ? "text-accent-green" : "text-accent-red"}
              >
                {g >= 0 ? "+" : ""}
                {g.toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
