"use client";

import type { RankedPlace } from "@/lib/types";
import { ScoreBadge } from "./ScoreBadge";

interface RestaurantCardProps {
  item: RankedPlace;
  rank: number;
  isTop?: boolean;
}

const AMENITY_ICONS: Record<string, string> = {
  restaurant: "🍽️",
  cafe: "☕",
  bar: "🍸",
  fast_food: "🍔",
  food_court: "🏪",
};

export function RestaurantCard({ item, rank, isTop }: RestaurantCardProps) {
  const { place, distance_m, quiet_score, date_night_score, price_score, fit_score, reasons } =
    item;

  const amenityIcon = AMENITY_ICONS[place.tags.amenity] ?? "📍";
  const cuisine = place.tags.cuisine;
  const distLabel =
    distance_m < 1000 ? `${distance_m}m` : `${(distance_m / 1000).toFixed(1)}km`;

  const rankLabel = rank === 1 ? "Top Pick" : rank === 2 ? "Runner-up" : rank === 3 ? "3rd" : `#${rank}`;
  const rankColors = {
    1: "bg-amber-500 text-black",
    2: "bg-zinc-400 text-black",
    3: "bg-amber-700 text-white",
  } as Record<number, string>;
  const rankColor = rankColors[rank] ?? "bg-zinc-700 text-white";

  return (
    <div
      className={`relative border rounded-xl p-5 transition-all duration-300 hover:border-[#c9a96e]/40 hover:shadow-[0_0_30px_rgba(201,169,110,0.07)] group ${
        isTop
          ? "border-[#c9a96e]/30 bg-gradient-to-br from-[#1a1710] to-[#0f0f0f]"
          : "border-white/8 bg-[#111111]"
      }`}
    >
      {/* Rank badge */}
      <div
        className={`absolute -top-3 -left-2 ${rankColor} text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-lg`}
      >
        {rankLabel}
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">{amenityIcon}</span>
            <h3 className="text-white font-semibold text-base truncate group-hover:text-[#e8d5b0] transition-colors">
              {place.name}
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            {cuisine && (
              <span className="text-xs px-2 py-0.5 rounded bg-white/8 text-white/60 border border-white/10">
                {cuisine}
              </span>
            )}
            {place.tags.amenity && (
              <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-white/40 border border-white/8 capitalize">
                {place.tags.amenity.replace("_", " ")}
              </span>
            )}
            <span className="text-xs text-white/40 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {distLabel}
            </span>
          </div>
        </div>

        {/* Fit score ring */}
        <div className="flex-shrink-0 flex flex-col items-center">
          <div className="relative w-14 h-14">
            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="22" fill="none" stroke="#222" strokeWidth="4" />
              <circle
                cx="28"
                cy="28"
                r="22"
                fill="none"
                stroke={isTop ? "#c9a96e" : "#4b5563"}
                strokeWidth="4"
                strokeDasharray={`${2 * Math.PI * 22}`}
                strokeDashoffset={`${2 * Math.PI * 22 * (1 - fit_score)}`}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className={`text-sm font-bold font-mono leading-none ${isTop ? "text-[#c9a96e]" : "text-white/70"}`}
              >
                {Math.round(fit_score * 100)}
              </span>
              <span className="text-[8px] text-white/30 uppercase tracking-wider mt-0.5">fit</span>
            </div>
          </div>
        </div>
      </div>

      {/* Address */}
      {place.address && (
        <p className="text-xs text-white/40 mb-3 flex items-center gap-1.5">
          <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h18M3 6h18M3 18h18" />
          </svg>
          {place.address}
        </p>
      )}

      {/* Scores row */}
      <div className="flex flex-wrap gap-2 mb-3">
        <ScoreBadge label="Quiet" score={quiet_score} color="blue" />
        <ScoreBadge label="Date Night" score={date_night_score} color="rose" />
        <ScoreBadge label="Price Fit" score={price_score} color="green" />
      </div>

      {/* Reasons */}
      {reasons.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {reasons.slice(0, 5).map((r, i) => (
            <span
              key={i}
              className="text-[11px] text-white/50 bg-white/5 px-2 py-0.5 rounded border border-white/8"
            >
              {r}
            </span>
          ))}
        </div>
      )}

      {/* Links */}
      <div className="flex gap-3 mt-3 pt-3 border-t border-white/5">
        {place.website && (
          <a
            href={place.website.startsWith("http") ? place.website : `https://${place.website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#c9a96e]/70 hover:text-[#c9a96e] transition-colors flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Website
          </a>
        )}
        {place.opening_hours && (
          <span className="text-xs text-white/30 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {place.opening_hours.length > 40
              ? place.opening_hours.substring(0, 40) + "…"
              : place.opening_hours}
          </span>
        )}
      </div>
    </div>
  );
}
