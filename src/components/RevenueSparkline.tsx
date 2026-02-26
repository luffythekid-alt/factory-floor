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
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="text-[10px] font-mono text-txt-tertiary uppercase tracking-wider">
        Weekly Revenue
      </div>

      {/* Bars */}
      <div className="flex items-end gap-1.5 h-[64px]">
        {weeks.map((val, i) => {
          const height = Math.max((val / max) * 100, 8);
          const isLast = i === weeks.length - 1;
          const isHovered = hoveredIdx === i;

          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center justify-end h-full cursor-pointer"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Amount on hover */}
              <div
                className={`text-[9px] font-mono font-medium mb-0.5 transition-opacity ${
                  isHovered ? "opacity-100 text-accent-green" : "opacity-0"
                }`}
              >
                {formatK(val)}
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
            </div>
          );
        })}
      </div>

      {/* Labels row */}
      <div className="flex gap-1.5">
        {weeks.map((_, i) => (
          <div key={i} className="flex-1 text-center">
            <span className="text-[8px] font-mono text-txt-tertiary">
              {labels[i]}
            </span>
          </div>
        ))}
      </div>

      {/* WoW */}
      {weeks.length >= 2 && (() => {
        const curr = weeks[weeks.length - 1];
        const prev = weeks[weeks.length - 2];
        if (!prev) return null;
        const pct = ((curr - prev) / prev) * 100;
        return (
          <div
            className={`text-[10px] font-mono ${
              pct >= 0 ? "text-accent-green" : "text-accent-red"
            }`}
          >
            {pct >= 0 ? "↑" : "↓"} {Math.abs(pct).toFixed(0)}% vs last week
          </div>
        );
      })()}
    </div>
  );
}
