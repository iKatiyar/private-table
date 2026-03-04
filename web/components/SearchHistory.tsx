"use client";

import { useEffect, useState } from "react";
import { Lora } from "next/font/google";

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const STORAGE_KEY = "private-table-history";
const MAX_ITEMS = 5;

export interface HistoryItem {
  query: string;
  zipCode?: string;
  timestamp: number;
}

export function useSearchHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setHistory(JSON.parse(stored));
    } catch {}
  }, []);

  function addToHistory(query: string, zipCode?: string) {
    setHistory((prev) => {
      const filtered = prev.filter((h) => h.query !== query);
      const next = [{ query, zipCode, timestamp: Date.now() }, ...filtered].slice(0, MAX_ITEMS);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  function clearHistory() {
    setHistory([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }

  return { history, addToHistory, clearHistory };
}

interface SearchHistoryProps {
  history: HistoryItem[];
  onSelect: (query: string, zipCode?: string) => void;
  onClear: () => void;
}

const f = { fontFamily: "var(--font-lora), Georgia, serif" };

export function SearchHistory({ history, onSelect, onClear }: SearchHistoryProps) {
  if (history.length === 0) return null;

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      {/* Label row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
        <span style={{ ...f, fontSize: "0.78rem", fontWeight: 600, color: "#c9a96e", textTransform: "uppercase", letterSpacing: "0.18em" }}>
          Recent Searches
        </span>
        <button
          onClick={onClear}
          style={{ ...f, fontSize: "0.85rem", color: "rgba(255,255,255,0.55)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          onMouseEnter={e => (e.currentTarget.style.color = "#c9a96e")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.55)")}
        >
          Clear
        </button>
      </div>

      {/* History items */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {history.map((item) => (
          <button
            key={item.timestamp}
            onClick={() => onSelect(item.query, item.zipCode)}
            style={{
              display: "flex", alignItems: "center", gap: "0.75rem",
              padding: "0.75rem 1rem",
              borderRadius: 8,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.12)",
              cursor: "pointer", textAlign: "left",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(201,169,110,0.08)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(201,169,110,0.4)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.12)";
            }}
          >
            <svg style={{ width: 16, height: 16, color: "#c9a96e", flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span style={{ ...f, fontSize: "1rem", color: "#ffffff", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {item.query}
            </span>
            {item.zipCode && (
              <span style={{ ...f, fontSize: "0.85rem", color: "rgba(255,255,255,0.55)", flexShrink: 0 }}>
                {item.zipCode}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
