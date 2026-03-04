"use client";

import { useEffect, useState } from "react";
import { Lora } from "next/font/google";

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const f = lora.style.fontFamily;

const STEPS = [
  { label: "Geocoding location", detail: "Finding coordinates via Nominatim" },
  { label: "Searching nearby", detail: "Querying OpenStreetMap Overpass" },
  { label: "Scoring & ranking", detail: "Applying your preferences" },
];

export function LoadingSteps() {
  const [activeStep, setActiveStep] = useState(0);
  const [dots, setDots] = useState("");

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setActiveStep((s) => Math.min(s + 1, STEPS.length - 1));
    }, 2200);

    const dotTimer = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 400);

    return () => {
      clearInterval(stepTimer);
      clearInterval(dotTimer);
    };
  }, []);

  return (
    /* Full-screen backdrop */
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(26,19,8,0.94) 0%, rgba(10,10,10,0.97) 100%)",
        backdropFilter: "blur(8px)",
      }}
    >
      {/* Single centered card — spinner + steps share one container */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2rem" }}>

        {/* Spinner */}
        <div style={{ position: "relative", width: 96, height: 96, flexShrink: 0 }}>
          <div style={{ position: "absolute", inset: 0, border: "2px solid rgba(255,255,255,0.06)", borderRadius: "50%" }} />
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%" }} className="border-t-2 border-[#c9a96e] animate-spin" />
          <div style={{ position: "absolute", inset: 16, borderRadius: "50%" }} className="border-t-2 border-[#c9a96e]/30 animate-spin [animation-duration:2s] [animation-direction:reverse]" />
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#c9a96e", fontSize: "1.5rem" }}>✦</span>
          </div>
        </div>

        {/* Steps — all same fixed width, left-aligned text, whole block centered */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          {STEPS.map((step, i) => {
            const isDone = i < activeStep;
            const isActive = i === activeStep;
            return (
              <div
                key={step.label}
                style={{
                  display: "flex", alignItems: "center", gap: "0.9rem",
                  width: 260,
                  opacity: isDone ? 0.45 : isActive ? 1 : 0.22,
                  transition: "opacity 0.5s",
                }}
              >
                {/* Circle icon */}
                <div style={{
                  width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: isActive ? "2px solid #c9a96e" : isDone ? "1px solid rgba(201,169,110,0.45)" : "1px solid rgba(255,255,255,0.18)",
                  background: isActive ? "rgba(201,169,110,0.12)" : isDone ? "rgba(201,169,110,0.1)" : "transparent",
                  transition: "all 0.5s",
                }}>
                  {isDone ? (
                    <svg style={{ width: 12, height: 12, color: "#c9a96e" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : isActive ? (
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#c9a96e" }} className="animate-pulse" />
                  ) : (
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.2)" }} />
                  )}
                </div>

                {/* Text */}
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: f, fontSize: "1.05rem", fontWeight: isActive ? 600 : 400, color: isActive ? "#ffffff" : "rgba(255,255,255,0.55)", margin: 0, lineHeight: 1.3 }}>
                    {step.label}{isActive ? dots : isDone ? " ✓" : ""}
                  </p>
                  {isActive && (
                    <p style={{ fontFamily: f, fontSize: "0.85rem", color: "#c9a96e", margin: "0.15rem 0 0", lineHeight: 1.3 }} className="animate-pulse">
                      {step.detail}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
