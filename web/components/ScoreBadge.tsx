"use client";

import { CountUp } from "./CountUp";

interface ScoreBadgeProps {
  label: string;
  score: number;
  color?: "gold" | "rose" | "blue" | "green";
}

const colorMap = {
  gold: {
    bg: "bg-amber-950/40",
    bar: "bg-amber-500",
    text: "text-amber-400",
    border: "border-amber-800/30",
    glow: "shadow-amber-500/20",
  },
  rose: {
    bg: "bg-rose-950/40",
    bar: "bg-rose-500",
    text: "text-rose-400",
    border: "border-rose-800/30",
    glow: "shadow-rose-500/20",
  },
  blue: {
    bg: "bg-sky-950/40",
    bar: "bg-sky-500",
    text: "text-sky-400",
    border: "border-sky-800/30",
    glow: "shadow-sky-500/20",
  },
  green: {
    bg: "bg-emerald-950/40",
    bar: "bg-emerald-500",
    text: "text-emerald-400",
    border: "border-emerald-800/30",
    glow: "shadow-emerald-500/20",
  },
};

export function ScoreBadge({ label, score, color = "gold" }: ScoreBadgeProps) {
  const c = colorMap[color];
  const pct = Math.round(score * 100);

  return (
    <div className={`${c.bg} border ${c.border} rounded px-2 py-1.5 min-w-[80px] shadow-lg ${c.glow}`}>
      <div className={`text-[10px] uppercase tracking-wider ${c.text} mb-1 font-medium`}>
        {label}
      </div>
      <div className="flex items-center gap-1.5">
        <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full ${c.bar} rounded-full`}
            style={{
              width: `${pct}%`,
              transition: "width 1s cubic-bezier(0.34, 1.56, 0.64, 1)",
              boxShadow: `0 0 6px currentColor`,
            }}
          />
        </div>
        <span className={`text-xs font-mono font-medium ${c.text}`}>
          <CountUp value={pct} duration={900} />
        </span>
      </div>
    </div>
  );
}
