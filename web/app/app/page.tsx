"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import type { SearchState } from "@/lib/types";
import { parseQuery, generateExplanation } from "@/lib/agent";
import { RestaurantCard } from "@/components/RestaurantCard";
import { LoadingSteps } from "@/components/LoadingSteps";
import { SearchHistory, useSearchHistory } from "@/components/SearchHistory";
import { ParticleField } from "@/components/ParticleField";
import { ScrambleText } from "@/components/ScrambleText";
import { MagneticButton } from "@/components/MagneticButton";

const EXAMPLE_QUERIES = [
  "Date night, intimate, under $80, near USC",
  "Client lunch, upscale ambiance, downtown LA",
  "Sunday brunch with girlfriends near Koreatown",
  "Cozy French bistro, candlelit, not too loud",
  "Quick solo ramen, budget friendly, near USC",
];

export default function AppPage() {
  const [input, setInput] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [state, setState] = useState<SearchState>({ status: "idle", query: "" });
  const [showExplanation, setShowExplanation] = useState(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { history, addToHistory, clearHistory } = useSearchHistory();

  async function handleSearch(queryOverride?: string) {
    const query = queryOverride ?? input;
    if (!query.trim()) return;

    const parsed = parseQuery(query);

    // If user provided a zip code, use it as the location (overrides NL-parsed location)
    if (zipCode.trim()) {
      parsed.location = zipCode.trim();
      parsed.preferences.location = zipCode.trim();
    }

    if (parsed.clarificationNeeded) {
      setState({
        status: "error",
        query,
        clarificationNeeded: parsed.clarificationNeeded,
      });
      return;
    }

    setState({ status: "loading", query, preferences: parsed.preferences });

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferences: parsed.preferences,
          location: parsed.location,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setState({
          status: "error",
          query,
          preferences: parsed.preferences,
          error: data.error ?? "Search failed. Please try again.",
        });
        return;
      }

      const explanation = generateExplanation(
        data.rankResult.ranked,
        parsed.preferences
      );

      addToHistory(query, zipCode.trim() || undefined);

      setState({
        status: "success",
        query,
        preferences: parsed.preferences,
        geocode: data.geocode,
        rankResult: data.rankResult,
        explanation,
      });
    } catch (err) {
      setState({
        status: "error",
        query,
        error: err instanceof Error ? err.message : "Network error. Please try again.",
      });
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  }

  const isLoading = state.status === "loading";
  const hasResults = state.status === "success" && state.rankResult;
  const ranked = state.rankResult?.ranked ?? [];

  return (
    <div className="min-h-screen text-white flex flex-col" style={{ background: "#080808" }}>
      <ParticleField />

      {/* Ambient glow orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[180px] opacity-8"
                style={{ background: "radial-gradient(ellipse, #c9a96e 0%, transparent 70%)" }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#c9a96e]/10 bg-black/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <span className="text-[#c9a96e] text-xl transition-transform group-hover:rotate-12 duration-300">✦</span>
            <span className="font-serif text-lg font-medium text-white/90 group-hover:text-white transition-colors tracking-wide">
              The Private Table
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-white/25 hidden sm:block tracking-wider">Live · OpenStreetMap</span>
          </div>
        </div>
      </header>

      <main className="flex-1 relative z-10 max-w-7xl mx-auto w-full px-8 py-10">

        {/* Hero search section */}
        <div className={`transition-all duration-700 ${hasResults ? "mb-8" : "mb-0 min-h-[60vh] flex flex-col justify-center"}`}>

          {/* Decorative top line */}
          {!hasResults && (
            <div className="flex items-center gap-4 mb-8 justify-center">
              <div className="h-px flex-1 max-w-16 bg-gradient-to-r from-transparent to-[#c9a96e]" />
              <span className="text-[#c9a96e] text-xs font-semibold tracking-[0.35em] uppercase font-serif">Restaurant Finder</span>
              <div className="h-px flex-1 max-w-16 bg-gradient-to-l from-transparent to-[#c9a96e]" />
            </div>
          )}

          {/* Headline */}
          <h1 className={`font-serif font-bold text-white mb-3 transition-all duration-500 ${hasResults ? "text-3xl" : "text-6xl md:text-7xl text-center"}`}>
            <ScrambleText text="Find your perfect " duration={1000} />
            <span className="italic text-[#c9a96e]">
              <ScrambleText text="table" delay={600} duration={800} />
            </span>
          </h1>

          {!hasResults && (
            <p className="text-white/80 text-center text-lg mb-10 font-serif tracking-wide">
              Describe the occasion in plain English. We&apos;ll handle the rest.
            </p>
          )}

          {/* Search card */}
          <div className="relative rounded-2xl border border-[#c9a96e]/35 bg-[#0f0f0f] p-6 shadow-[0_0_40px_rgba(201,169,110,0.08)]">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='e.g. "Date night, intimate, under $80, near USC"'
              rows={2}
              disabled={isLoading}
              className="w-full bg-transparent border-0 text-white placeholder-white/40 text-xl resize-none focus:outline-none font-serif leading-relaxed"
            />

            {/* Bottom row */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/12 gap-3 flex-wrap">
              {/* Zip code */}
              <div className="relative flex items-center">
                <svg className="absolute left-3 w-4 h-4 text-[#c9a96e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <input
                  type="text"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  placeholder="Zip code (optional)"
                  maxLength={10}
                  disabled={isLoading}
                  className="bg-white/8 border border-white/20 rounded-lg pl-9 pr-4 py-2 text-white placeholder-white/40 text-sm font-serif w-52 focus:outline-none focus:border-[#c9a96e]/60 transition-all"
                />
              </div>

              <MagneticButton
                onClick={() => handleSearch()}
                disabled={isLoading || !input.trim()}
                className="px-10 py-3 bg-[#c9a96e] text-black text-sm font-bold tracking-[0.15em] uppercase rounded-xl hover:bg-[#e8d5b0] transition-all disabled:opacity-30 disabled:cursor-not-allowed font-serif"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Searching
                  </span>
                ) : "Find My Table"}
              </MagneticButton>
            </div>
          </div>

          {/* Search history */}
          {state.status === "idle" && (
            <div className="mt-5">
              <SearchHistory
                history={history}
                onSelect={(q, zip) => { setInput(q); if (zip) setZipCode(zip); handleSearch(q); }}
                onClear={clearHistory}
              />
            </div>
          )}

          {/* Example queries */}
          {!hasResults && (
            <div className="flex flex-wrap gap-3 mt-6 justify-center">
              {EXAMPLE_QUERIES.map((q) => (
                <button
                  key={q}
                  onClick={() => { setInput(q); handleSearch(q); }}
                  disabled={isLoading}
                  style={{
                    fontFamily: "var(--font-lora), Georgia, serif",
                    fontSize: "0.95rem",
                    color: "#ffffff",
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.22)",
                    padding: "0.5rem 1.1rem",
                    borderRadius: 999,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "#c9a96e";
                    (e.currentTarget as HTMLButtonElement).style.color = "#c9a96e";
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(201,169,110,0.1)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.22)";
                    (e.currentTarget as HTMLButtonElement).style.color = "#ffffff";
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)";
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Loading state */}
        {isLoading && <LoadingSteps />}

        {/* Clarification needed */}
        {state.status === "error" && state.clarificationNeeded && (
          <div className="border border-[#c9a96e]/30 bg-amber-950/20 rounded-xl p-6 text-center">
            <span className="text-2xl mb-3 block">🤔</span>
            <p className="text-[#c9a96e] font-medium mb-1">Could use a bit more detail</p>
            <p className="text-white/60 text-sm">{state.clarificationNeeded}</p>
          </div>
        )}

        {/* Error */}
        {state.status === "error" && state.error && (
          <div className="border border-red-800/40 bg-red-950/20 rounded-xl p-6 text-center">
            <span className="text-2xl mb-3 block">⚠️</span>
            <p className="text-red-400 font-medium mb-1">Something went wrong</p>
            <p className="text-white/50 text-sm">{state.error}</p>
          </div>
        )}

        {/* Results */}
        {hasResults && (
          <div className="space-y-8">

            {/* Meta bar */}
            <div className="flex flex-col items-center text-center gap-4 py-6 border-b border-white/8">
              <div className="flex items-center gap-4">
                <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#c9a96e]" />
                <span className="text-[#c9a96e] text-base font-semibold tracking-[0.2em] uppercase font-serif">
                  {ranked.length} Curated Recommendations
                </span>
                <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#c9a96e]" />
              </div>
              {state.geocode && (
                <p className="text-white text-base font-serif">
                  Near{" "}
                  <span className="text-[#c9a96e] font-semibold">
                    {zipCode.trim() || state.geocode.display_name.split(",").slice(0, 3).join(",")}
                  </span>
                </p>
              )}
              <div className="flex items-center gap-2 flex-wrap justify-center">
                {state.preferences?.occasion && (
                  <span className="px-4 py-1.5 rounded-full border border-[#c9a96e]/60 text-[#c9a96e] text-sm font-semibold capitalize tracking-wide font-serif bg-[#c9a96e]/8">
                    {state.preferences.occasion.replace("_", " ")}
                  </span>
                )}
                {state.preferences?.vibe && (
                  <span className="px-4 py-1.5 rounded-full border border-[#c9a96e]/60 text-[#c9a96e] text-sm font-semibold capitalize tracking-wide font-serif bg-[#c9a96e]/8">
                    {state.preferences.vibe}
                  </span>
                )}
                {state.preferences?.max_price_usd && (
                  <span className="px-4 py-1.5 rounded-full border border-[#c9a96e]/60 text-[#c9a96e] text-sm font-semibold tracking-wide font-serif bg-[#c9a96e]/8">
                    under ${state.preferences.max_price_usd}
                  </span>
                )}
              </div>
            </div>

            {/* AI Explanation panel */}
            {state.explanation && (
              <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #c9a96e" }}>
                {/* Header — dark */}
                <button
                  onClick={() => setShowExplanation(!showExplanation)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "1.1rem 1.75rem", background: "#1a1508", cursor: "pointer", border: "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ color: "#c9a96e", fontSize: "1.2rem" }}>✦</span>
                    <span style={{ fontFamily: "var(--font-lora), Georgia, serif", fontSize: "1.2rem", fontWeight: 700, color: "#c9a96e", letterSpacing: "0.02em" }}>
                      Our Recommendation
                    </span>
                  </div>
                  <svg
                    style={{ width: 22, height: 22, color: "#c9a96e", transition: "transform 0.3s", transform: showExplanation ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Body */}
                {showExplanation && (
                  <div style={{ background: "#1c1a14", padding: "1.75rem 2rem", borderTop: "1px solid rgba(201,169,110,0.3)" }}>
                    {state.explanation.split("\n\n").map((para, i) => (
                      para.trim() ? (
                        <p key={i} style={{
                          fontFamily: "var(--font-lora), Georgia, serif",
                          fontSize: "1.1rem",
                          lineHeight: 1.9,
                          color: "#e8e0d0",
                          margin: i === 0 ? "0" : "1rem 0 0",
                          fontWeight: 400,
                        }}>
                          {para.split(/\*\*(.*?)\*\*/g).map((part, j) =>
                            j % 2 === 1 ? (
                              <strong key={j} style={{ color: "#c9a96e", fontWeight: 700 }}>{part}</strong>
                            ) : part
                          )}
                        </p>
                      ) : null
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* No results */}
            {ranked.length === 0 && (
              <div className="text-center py-20">
                <span className="text-[#c9a96e]/30 text-5xl block mb-4">✦</span>
                <p className="text-white/40 text-lg mb-2 font-serif italic">No restaurants found</p>
                <p className="text-white/25 text-sm">Try broadening your search or increasing the radius.</p>
              </div>
            )}

            {/* Results grid */}
            {ranked.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {ranked.map((item, i) => (
                  <RestaurantCard
                    key={item.place.id}
                    item={item}
                    rank={i + 1}
                    isTop={i < 3}
                    animationDelay={i * 60}
                  />
                ))}
              </div>
            )}

          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#c9a96e]/8 py-5 mt-8">
        <div className="max-w-7xl mx-auto px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-xs text-white/20 font-serif italic">© 2026 The Private Table</span>
          <span className="text-xs text-white/15 tracking-wider">Data: © OpenStreetMap contributors (ODbL)</span>
        </div>
      </footer>
    </div>
  );
}
