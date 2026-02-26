"use client";

import { useState } from "react";

interface RevenueSparklineProps {
  weeks: number[];
  labels: string[];
  className?: string;
}

export default function RevenueSparkline({
  weeks,
  labels,
  className = "",
}: RevenueSparklineProps) {
  const max = Math.max(...weeks, 1);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-txt-tertiary uppercase tracking-wider">
          Weekly Revenue
        </span>
        {hoveredIdx !== null && (
          <span className="text-[11px] font-mono text-accent-green">
            {labels[hoveredIdx]}: ${weeks[hoveredIdx].toLocaleString()}
          </span>
        )}
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-[3px] h-[48px]">
        {weeks.map((val, i) => {
          const height = Math.max((val / max) * 100, 4);
          const isLast = i === weeks.length - 1;
          const isHovered = hoveredIdx === i;
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center gap-0.5 cursor-pointer"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <div
                className={`w-full rounded-sm transition-all duration-150 ${
                  isHovered
                    ? "bg-accent-green"
                    : isLast
                    ? "bg-accent-green/70"
                    : "bg-white/10"
                }`}
                style={{ height: `${height}%`, minHeight: "2px" }}
              />
              <span
                className={`text-[8px] font-mono ${
                  isHovered ? "text-txt" : "text-txt-tertiary"
                }`}
              >
                {labels[i]}
              </span>
            </div>
          );
        })}
      </div>

      {/* WoW change for last week */}
      {weeks.length >= 2 && (
        <div className="text-[10px] font-mono text-txt-tertiary">
          {(() => {
            const curr = weeks[weeks.length - 1];
            const prev = weeks[weeks.length - 2];
            if (!prev) return null;
            const pct = ((curr - prev) / prev) * 100;
            return (
              <span
                className={pct >= 0 ? "text-accent-green" : "text-accent-red"}
              >
                {pct >= 0 ? "↑" : "↓"} {Math.abs(pct).toFixed(0)}% vs last
                week
              </span>
            );
          })()}
        </div>
      )}
    </div>
  );
}
