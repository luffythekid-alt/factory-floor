"use client";

import { useState } from "react";

interface RevenueChartProps {
  weeks: number[];
  labels: string[];
}

function formatK(val: number): string {
  if (val >= 1000) return `$${(val / 1000).toFixed(1)}k`;
  return `$${val}`;
}

export default function RevenueChart({ weeks, labels }: RevenueChartProps) {
  const max = Math.max(...weeks, 1);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const total = weeks.reduce((a, b) => a + b, 0);
  const avg = Math.round(total / weeks.length);
  const latest = weeks[weeks.length - 1];
  const prev = weeks.length >= 2 ? weeks[weeks.length - 2] : null;
  const latestGrowth =
    prev && prev > 0 ? ((latest - prev) / prev) * 100 : null;

  return (
    <div>
      {/* Summary row */}
      <div className="flex items-center gap-6 mb-5">
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

      {/* Horizontal bar chart */}
      <div className="space-y-2">
        {weeks.map((val, i) => {
          const width = Math.max((val / max) * 100, 3);
          const isLast = i === weeks.length - 1;
          const isHovered = hoveredIdx === i;
          const prevVal = i > 0 ? weeks[i - 1] : null;
          const growth =
            prevVal && prevVal > 0
              ? ((val - prevVal) / prevVal) * 100
              : null;

          return (
            <div
              key={i}
              className="flex items-center gap-3 cursor-pointer"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Week label */}
              <span className="text-xs font-mono text-txt-tertiary w-7 shrink-0">
                {labels[i]}
              </span>

              {/* Bar */}
              <div className="flex-1 h-7 relative">
                <div
                  className={`h-full rounded transition-all duration-150 ${
                    isHovered
                      ? "bg-accent-green"
                      : isLast
                      ? "bg-accent-green/60"
                      : "bg-white/10"
                  }`}
                  style={{ width: `${width}%`, minWidth: "4px" }}
                />
              </div>

              {/* Amount + growth */}
              <div className="flex items-center gap-2 shrink-0 min-w-[100px] justify-end">
                <span
                  className={`text-sm font-mono font-semibold ${
                    isHovered ? "text-accent-green" : "text-txt"
                  }`}
                >
                  {formatK(val)}
                </span>
                {growth !== null && (
                  <span
                    className={`text-[10px] font-mono min-w-[40px] text-right ${
                      growth >= 0 ? "text-accent-green" : "text-accent-red"
                    }`}
                  >
                    {growth >= 0 ? "+" : ""}
                    {growth.toFixed(0)}%
                  </span>
                )}
                {growth === null && (
                  <span className="min-w-[40px]" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
