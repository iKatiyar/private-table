"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import type { SearchState } from "@/lib/types";
import { parseQuery, generateExplanation } from "@/lib/agent";
import { RestaurantCard } from "@/components/RestaurantCard";

const EXAMPLE_QUERIES = [
  "Date night, quiet, under $30, near USC",
  "Business lunch, good ambiance, downtown LA",
  "Casual brunch with friends near Koreatown",
  "Romantic Italian dinner, not too loud",
  "Quick solo lunch, budget friendly, near USC",
];

export default function AppPage() {
  const [input, setInput] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [state, setState] = useState<SearchState>({ status: "idle", query: "" });
  const [showReasoningJSON, setShowReasoningJSON] = useState(false);
  const [showExplanation, setShowExplanation] = useState(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/8 bg-[#0a0a0a]/95 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="text-[#c9a96e] text-lg">✦</span>
            <span className="font-serif text-lg font-medium text-white/90 group-hover:text-white transition-colors">
              The Private Table
            </span>
          </Link>
          <span className="text-xs text-white/30 hidden sm:block">
            Powered by OpenStreetMap · No hallucinations
          </span>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        {/* Search Section */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl md:text-4xl font-medium text-white mb-2">
            Find your perfect{" "}
            <span className="italic text-[#c9a96e]">table</span>
          </h1>
          <p className="text-white/40 text-sm mb-6">
            Describe what you&apos;re looking for in plain English.
          </p>

          {/* Search box */}
          <div className="relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='e.g. "Date night, quiet, under $30, near USC"'
              rows={2}
              disabled={isLoading}
              className="w-full bg-[#111] border border-white/15 rounded-xl px-5 py-4 pr-28 text-white placeholder-white/25 text-sm resize-none focus:outline-none focus:border-[#c9a96e]/50 focus:shadow-[0_0_0_1px_rgba(201,169,110,0.2)] transition-all disabled:opacity-50"
            />
            <button
              onClick={() => handleSearch()}
              disabled={isLoading || !input.trim()}
              className="absolute right-3 bottom-3 px-4 py-2 bg-[#c9a96e] text-black text-sm font-semibold rounded-lg hover:bg-[#e8d5b0] transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Searching
                </span>
              ) : (
                "Search"
              )}
            </button>
          </div>

          {/* Zip code input */}
          <div className="flex items-center gap-3 mt-3">
            <div className="relative flex items-center">
              <svg className="absolute left-3 w-3.5 h-3.5 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <input
                type="text"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                placeholder="Zip code (e.g. 90007)"
                maxLength={10}
                disabled={isLoading}
                className="bg-[#111] border border-white/15 rounded-lg pl-8 pr-4 py-2 text-white placeholder-white/25 text-sm w-44 focus:outline-none focus:border-[#c9a96e]/50 focus:shadow-[0_0_0_1px_rgba(201,169,110,0.2)] transition-all disabled:opacity-50"
              />
            </div>
            <span className="text-white/25 text-xs">
              {zipCode.trim()
                ? `Searching near ${zipCode.trim()}`
                : "Leave blank to use location from your query"}
            </span>
          </div>

          {/* Example queries */}
          <div className="flex flex-wrap gap-2 mt-3">
            {EXAMPLE_QUERIES.map((q) => (
              <button
                key={q}
                onClick={() => {
                  setInput(q);
                  handleSearch(q);
                }}
                disabled={isLoading}
                className="text-xs px-3 py-1.5 rounded-full border border-white/10 text-white/40 hover:border-[#c9a96e]/40 hover:text-white/70 transition-all disabled:opacity-30"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-2 border-[#c9a96e]/20 rounded-full" />
              <div className="absolute inset-0 border-t-2 border-[#c9a96e] rounded-full animate-spin" />
              <div className="absolute inset-3 border-t-2 border-[#c9a96e]/40 rounded-full animate-spin [animation-direction:reverse] [animation-duration:1.5s]" />
            </div>
            <div className="text-white/40 text-sm space-y-1 text-center">
              <p>Searching OpenStreetMap…</p>
              <p className="text-white/20 text-xs">
                Geocoding · Overpass query · Scoring {state.preferences?.radius_m ?? 2000}m radius
              </p>
            </div>
          </div>
        )}

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
          <div className="space-y-6">
            {/* Meta bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/8">
              <div className="text-sm text-white/50">
                <span className="text-white font-medium">{ranked.length}</span> restaurants found
                {state.geocode && (
                  <span className="ml-2 text-white/30">
                    near {zipCode.trim() || state.geocode.display_name.split(",").slice(0, 2).join(",")}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-white/40">
                {state.preferences?.occasion && (
                  <span className="px-2 py-1 bg-white/5 rounded border border-white/8 capitalize">
                    {state.preferences.occasion.replace("_", " ")}
                  </span>
                )}
                {state.preferences?.vibe && (
                  <span className="px-2 py-1 bg-white/5 rounded border border-white/8 capitalize">
                    {state.preferences.vibe}
                  </span>
                )}
                {state.preferences?.max_price_usd && (
                  <span className="px-2 py-1 bg-white/5 rounded border border-white/8">
                    under ${state.preferences.max_price_usd}
                  </span>
                )}
              </div>
            </div>

            {/* Explanation panel */}
            {state.explanation && (
              <div className="border border-[#c9a96e]/20 bg-gradient-to-br from-amber-950/20 to-transparent rounded-xl overflow-hidden">
                <button
                  onClick={() => setShowExplanation(!showExplanation)}
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/3 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-[#c9a96e]">✦</span>
                    <span className="text-sm font-medium text-[#c9a96e]">AI Explanation</span>
                    <span className="text-xs text-white/30">grounded in real scores</span>
                  </div>
                  <svg
                    className={`w-4 h-4 text-white/30 transition-transform ${showExplanation ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showExplanation && (
                  <div className="px-5 pb-5">
                    <div className="text-sm text-white/70 leading-relaxed space-y-2">
                      {state.explanation.split("\n\n").map((para, i) => (
                        <p key={i}>
                          {para.split(/\*\*(.*?)\*\*/g).map((part, j) =>
                            j % 2 === 1 ? (
                              <strong key={j} className="text-white font-semibold">
                                {part}
                              </strong>
                            ) : (
                              part
                            )
                          )}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* No results */}
            {ranked.length === 0 && (
              <div className="text-center py-16 text-white/40">
                <span className="text-4xl block mb-4">🔍</span>
                <p className="text-lg mb-2">No restaurants found</p>
                <p className="text-sm">
                  Try increasing the radius or broadening your search.
                </p>
              </div>
            )}

            {/* Results grid */}
            {ranked.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {ranked.map((item, i) => (
                  <RestaurantCard
                    key={item.place.id}
                    item={item}
                    rank={i + 1}
                    isTop={i < 3}
                  />
                ))}
              </div>
            )}

            {/* Reasoning JSON toggle */}
            <div className="border border-white/8 rounded-xl overflow-hidden">
              <button
                onClick={() => setShowReasoningJSON(!showReasoningJSON)}
                className="w-full flex items-center justify-between px-5 py-3 hover:bg-white/3 transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <svg className="w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  <span className="text-sm text-white/40 font-mono">Show reasoning JSON</span>
                </div>
                <svg
                  className={`w-4 h-4 text-white/20 transition-transform ${showReasoningJSON ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showReasoningJSON && (
                <div className="border-t border-white/8 bg-[#0d0d0d] p-4">
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-white/30 mb-2 font-mono uppercase tracking-wider">
                        Parsed Constraints
                      </p>
                      <pre className="text-xs text-emerald-400/80 font-mono overflow-auto max-h-40 bg-black/40 rounded p-3">
                        {JSON.stringify(state.preferences, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <p className="text-xs text-white/30 mb-2 font-mono uppercase tracking-wider">
                        Geocode Result
                      </p>
                      <pre className="text-xs text-sky-400/80 font-mono overflow-auto max-h-32 bg-black/40 rounded p-3">
                        {JSON.stringify(state.geocode, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <p className="text-xs text-white/30 mb-2 font-mono uppercase tracking-wider">
                        Scoring Weights & Facts
                      </p>
                      <pre className="text-xs text-amber-400/80 font-mono overflow-auto max-h-40 bg-black/40 rounded p-3">
                        {JSON.stringify(state.rankResult?.explanation_facts, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <p className="text-xs text-white/30 mb-2 font-mono uppercase tracking-wider">
                        Top 5 Ranked (full)
                      </p>
                      <pre className="text-xs text-white/40 font-mono overflow-auto max-h-60 bg-black/40 rounded p-3">
                        {JSON.stringify(ranked.slice(0, 5), null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-5">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/20">
          <span>© 2026 The Private Table</span>
          <span>Data: © OpenStreetMap contributors (ODbL)</span>
        </div>
      </footer>
    </div>
  );
}
