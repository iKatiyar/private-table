"use client";

import React from "react";
import { Lora } from "next/font/google";
import type { RankedPlace } from "@/lib/types";
import { TiltCard } from "./TiltCard";
import { CountUp } from "./CountUp";

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

interface RestaurantCardProps {
  item: RankedPlace;
  rank: number;
  isTop?: boolean;
  animationDelay?: number;
}

const AMENITY_ICONS: Record<string, string> = {
  restaurant: "🍽️",
  cafe: "☕",
  bar: "🍸",
  fast_food: "🍔",
  food_court: "🏪",
};

const RANK_CONFIG: Record<number, { label: string; bg: string; text: string; border: string }> = {
  1: { label: "★ Top Pick",  bg: "#c9a96e",                text: "#000000", border: "transparent" },
  2: { label: "Runner-up",   bg: "rgba(255,255,255,0.12)", text: "#ffffff", border: "rgba(255,255,255,0.25)" },
  3: { label: "3rd Place",   bg: "rgba(255,255,255,0.08)", text: "#ffffff", border: "rgba(255,255,255,0.18)" },
};

const SCORE_BARS = [
  { key: "quiet_score",      label: "Quiet",      color: "#60a5fa" },
  { key: "date_night_score", label: "Date Night", color: "#f87171" },
  { key: "price_score",      label: "Price Fit",  color: "#4ade80" },
] as const;

export function RestaurantCard({ item, rank, isTop, animationDelay = 0 }: RestaurantCardProps) {
  const { place, distance_m, quiet_score, date_night_score, price_score, fit_score, reasons } = item;
  const scores = { quiet_score, date_night_score, price_score };

  const amenityIcon = AMENITY_ICONS[place.tags.amenity] ?? "📍";
  const cuisine     = place.tags.cuisine?.replace(/;/g, " · ");
  const distMiles   = distance_m / 1609.34;
  const distLabel   = distMiles < 0.1
    ? `${Math.round(distance_m)} ft`
    : distMiles < 10
    ? `${distMiles.toFixed(1)} mi`
    : `${Math.round(distMiles)} mi`;

  const rankCfg = RANK_CONFIG[rank];
  const fitPct  = Math.round(fit_score * 100);
  const f       = lora.style.fontFamily;

  const cleanReasons = reasons.filter((r) => {
    const lower = r.toLowerCase();
    if (r.match(/\d+(\.\d+)?\s*(m|mi|km|ft)\s*(away)?/i)) return false;
    if (lower.includes("away")) return false;
    if (lower.startsWith("hours:")) return false;
    if (r.match(/^(mo|tu|we|th|fr|sa|su|mon|tue|wed|thu|fri|sat|sun)/i)) return false;
    return true;
  });

  /* Card colours: very dark neutral so text dominates */
  const cardBg     = isTop ? "#0f0e0c" : "#0d0d0d";
  const cardBorder = isTop ? "1px solid rgba(201,169,110,0.45)" : "1px solid rgba(255,255,255,0.14)";

  return (
    <TiltCard
      className="relative rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4"
      style={{ animationDelay: `${animationDelay}ms`, animationFillMode: "both", background: cardBg, border: cardBorder } as React.CSSProperties}
    >
      {/* Subtle gold top stripe for top-3 */}
      {isTop && <div style={{ height: 2, background: "linear-gradient(to right, transparent, #c9a96e 40%, transparent)" }} />}

      <div style={{ padding: "1.6rem" }}>

        {/* ── HEADER ── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "1.2rem" }}>
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* Rank badge */}
            {rankCfg ? (
              <span style={{
                display: "inline-block", marginBottom: "0.65rem",
                padding: "0.22rem 0.8rem", borderRadius: 999,
                background: rankCfg.bg, color: rankCfg.text,
                border: `1px solid ${rankCfg.border}`,
                fontSize: "0.72rem", fontWeight: 700,
                letterSpacing: "0.1em", textTransform: "uppercase",
                fontFamily: f,
              }}>
                {rankCfg.label}
              </span>
            ) : (
              <span style={{
                display: "inline-block", marginBottom: "0.65rem",
                padding: "0.22rem 0.7rem", borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.22)",
                color: "rgba(255,255,255,0.6)",
                fontSize: "0.72rem", letterSpacing: "0.1em", fontFamily: f,
              }}>
                #{rank}
              </span>
            )}

            {/* Restaurant name — the biggest, most prominent element */}
            <h3 style={{ fontFamily: f, fontSize: "1.75rem", fontWeight: 700, color: "#ffffff", lineHeight: 1.2, margin: "0 0 0.55rem" }}>
              {amenityIcon} {place.name}
            </h3>

            {/* Meta chips */}
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.45rem" }}>
              {cuisine && (
                <span style={{
                  fontFamily: f, fontSize: "0.88rem", fontWeight: 600,
                  color: "#c9a96e", border: "1px solid rgba(201,169,110,0.5)",
                  padding: "0.18rem 0.65rem", borderRadius: 4,
                }}>
                  {cuisine}
                </span>
              )}
              {place.tags.amenity && (
                <span style={{ fontFamily: f, fontSize: "0.88rem", color: "rgba(255,255,255,0.7)", textTransform: "capitalize" }}>
                  {place.tags.amenity.replace("_", " ")}
                </span>
              )}
              <span style={{ fontFamily: f, fontSize: "0.88rem", color: "rgba(255,255,255,0.65)" }}>
                📍 {distLabel}
              </span>
            </div>
          </div>

          {/* Fit score ring */}
          <div style={{ flexShrink: 0 }}>
            <div style={{ position: "relative", width: 72, height: 72 }}>
              <svg width="72" height="72" viewBox="0 0 72 72" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="36" cy="36" r="30" fill="none" stroke="#252525" strokeWidth="5" />
                <circle cx="36" cy="36" r="30" fill="none"
                  stroke={isTop ? "#c9a96e" : "#555"}
                  strokeWidth="5" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 30}`}
                  strokeDashoffset={`${2 * Math.PI * 30 * (1 - fit_score)}`}
                  style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.34,1.56,0.64,1)" }}
                />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: f, fontSize: "1.25rem", fontWeight: 700, color: isTop ? "#c9a96e" : "#fff", lineHeight: 1 }}>
                  <CountUp value={fitPct} duration={1200} />
                </span>
                <span style={{ fontFamily: f, fontSize: "0.6rem", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.15em", marginTop: 2 }}>fit</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── ADDRESS ── */}
        {place.address && (
          <p style={{
            fontFamily: f, fontSize: "0.95rem",
            color: "rgba(255,255,255,0.75)",
            margin: "0 0 1.2rem", paddingTop: "1rem",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            display: "flex", alignItems: "flex-start", gap: 6,
          }}>
            <span style={{ color: "#c9a96e", marginTop: 1 }}>≡</span>
            {place.address}
          </p>
        )}

        {/* ── SCORE BARS ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1.2rem" }}>
          {SCORE_BARS.map(({ key, label, color }) => {
            const val = scores[key];
            const pct = Math.round(val * 100);
            return (
              <div key={key}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 7 }}>
                  <span style={{ fontFamily: f, fontSize: "0.75rem", fontWeight: 700, color: "#ffffff", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                    {label}
                  </span>
                  <span style={{ fontFamily: f, fontSize: "1.05rem", fontWeight: 700, color }}>
                    <CountUp value={pct} duration={900} />
                  </span>
                </div>
                <div style={{ height: 5, background: "rgba(255,255,255,0.12)", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 99, width: `${pct}%`,
                    background: color, boxShadow: `0 0 8px ${color}99`,
                    transition: "width 1s cubic-bezier(0.34,1.56,0.64,1)",
                  }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* ── REASON CHIPS ── */}
        {cleanReasons.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.2rem" }}>
            {cleanReasons.slice(0, 4).map((r, i) => (
              <span key={i} style={{
                fontFamily: f, fontSize: "0.9rem",
                color: "#ffffff",
                background: "rgba(255,255,255,0.09)",
                border: "1px solid rgba(255,255,255,0.18)",
                padding: "0.28rem 0.8rem", borderRadius: 999,
              }}>
                {r}
              </span>
            ))}
          </div>
        )}

        {/* ── FOOTER ── */}
        {(place.website || place.opening_hours) && (
          <div style={{
            display: "flex", gap: "1.25rem", flexWrap: "wrap",
            paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.1)",
          }}>
            {place.website && (
              <a
                href={place.website.startsWith("http") ? place.website : `https://${place.website}`}
                target="_blank" rel="noopener noreferrer"
                style={{ fontFamily: f, fontSize: "0.95rem", fontWeight: 600, color: "#c9a96e", textDecoration: "none", display: "flex", alignItems: "center", gap: 5 }}
              >
                🔗 Visit Website
              </a>
            )}
            {place.opening_hours && (
              <span style={{ fontFamily: f, fontSize: "0.92rem", color: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", gap: 5 }}>
                🕐 {place.opening_hours.length > 45 ? place.opening_hours.substring(0, 45) + "…" : place.opening_hours}
              </span>
            )}
          </div>
        )}
      </div>
    </TiltCard>
  );
}
