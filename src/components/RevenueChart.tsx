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

      {/* Vertical bar chart */}
      <div className="flex items-end gap-3 h-[180px]">
        {weeks.map((val, i) => {
          const height = Math.max((val / max) * 100, 6);
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
              className="flex-1 flex flex-col items-center justify-end h-full cursor-pointer"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Amount + growth above bar */}
              <div
                className={`text-center mb-1 transition-opacity duration-100 ${
                  isHovered ? "opacity-100" : "opacity-70"
                }`}
              >
                <div
                  className={`text-xs font-mono font-semibold ${
                    isHovered ? "text-accent-green" : "text-txt-secondary"
                  }`}
                >
                  {formatK(val)}
                </div>
                {growth !== null && (
                  <div
                    className={`text-[10px] font-mono ${
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
                    ? "bg-accent-green/70"
                    : "bg-white/20"
                }`}
                style={{ height: `${height}%` }}
              />

              {/* Label */}
              <span
                className={`text-[11px] font-mono mt-1.5 ${
                  isHovered ? "text-txt" : "text-txt-tertiary"
                }`}
              >
                {labels[i]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
