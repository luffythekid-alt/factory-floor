"use client";

import { useState } from "react";

interface RevenueSparklineProps {
  weeks: number[];
  labels: string[];
  className?: string;
}

function formatK(val: number): string {
  if (val >= 1000) return `$${(val / 1000).toFixed(1)}k`;
  return `$${val}`;
}

export default function RevenueSparkline({
  weeks,
  labels,
  className = "",
}: RevenueSparklineProps) {
  const max = Math.max(...weeks, 1);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Header */}
      <div className="text-[10px] font-mono text-txt-tertiary uppercase tracking-wider">
        Weekly Revenue
      </div>

      {/* Bars with labels */}
      <div className="space-y-1.5">
        {weeks.map((val, i) => {
          const width = Math.max((val / max) * 100, 4);
          const isLast = i === weeks.length - 1;
          const isHovered = hoveredIdx === i;
          const prev = i > 0 ? weeks[i - 1] : null;
          const growth = prev && prev > 0 ? ((val - prev) / prev) * 100 : null;

          return (
            <div
              key={i}
              className="flex items-center gap-2 cursor-pointer"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Week label */}
              <span className="text-[10px] font-mono text-txt-tertiary w-6 shrink-0">
                {labels[i]}
              </span>

              {/* Bar */}
              <div className="flex-1 h-5 relative">
                <div
                  className={`h-full rounded-sm transition-all duration-150 ${
                    isHovered
                      ? "bg-accent-green"
                      : isLast
                      ? "bg-accent-green/60"
                      : "bg-white/15"
                  }`}
                  style={{ width: `${width}%`, minWidth: "4px" }}
                />
              </div>

              {/* Amount + growth */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span
                  className={`text-[11px] font-mono font-medium ${
                    isHovered ? "text-accent-green" : "text-txt-secondary"
                  }`}
                >
                  {formatK(val)}
                </span>
                {growth !== null && (
                  <span
                    className={`text-[9px] font-mono ${
                      growth >= 0 ? "text-accent-green" : "text-accent-red"
                    }`}
                  >
                    {growth >= 0 ? "+" : ""}
                    {growth.toFixed(0)}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
