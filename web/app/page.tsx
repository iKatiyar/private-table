"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Playfair_Display, DM_Sans } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export default function LandingPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.play().catch(() => {});
  }, []);

  return (
    <main
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "black",
        fontFamily: playfair.style.fontFamily,
      }}
    >
      {/* Background video */}
      <video
        ref={videoRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          objectFit: "cover",
          objectPosition: "center center",
          opacity: videoLoaded ? 0.6 : 0,
          transition: "opacity 1s ease",
          zIndex: 0,
        }}
        autoPlay
        loop
        muted
        playsInline
        onCanPlay={() => setVideoLoaded(true)}
      >
        <source src="/landing.mp4" type="video/mp4" />
      </video>

      {/* Gradient overlays */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 1,
        background: "linear-gradient(to bottom, rgba(0,0,0,0.7), rgba(0,0,0,0.4), rgba(0,0,0,0.8))",
      }} />
      <div style={{
        position: "fixed", inset: 0, zIndex: 1,
        background: "linear-gradient(to right, rgba(0,0,0,0.5), transparent, rgba(0,0,0,0.5))",
      }} />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "0 1.5rem", maxWidth: "56rem" }}>

        {/* Est. badge */}
        <div style={{ marginBottom: "2rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ width: 1, height: 40, background: "#c9a96e", opacity: 0.5 }} />
          <span style={{ color: "#c9a96e", fontSize: "0.7rem", letterSpacing: "0.4em", textTransform: "uppercase", fontWeight: 400 }}>
            Est. 2026
          </span>
          <div style={{ width: 1, height: 40, background: "#c9a96e", opacity: 0.5 }} />
        </div>

        {/* Headline */}
        <h1 style={{ fontSize: "clamp(3.5rem, 10vw, 6rem)", color: "white", marginBottom: "1rem", lineHeight: 1.1, fontWeight: 500 }}>
          The Private
          <br />
          <span style={{ fontStyle: "italic", color: "#c9a96e", fontWeight: 400 }}>Table</span>
        </h1>

        {/* Divider */}
        <div style={{ width: 80, height: 1, background: "#c9a96e", margin: "1.5rem 0", opacity: 0.6 }} />

        {/* Tagline */}
        <p style={{ fontSize: "clamp(1.1rem, 3vw, 1.5rem)", color: "rgba(255,255,255,0.8)", marginBottom: "0.75rem", lineHeight: 1.6, maxWidth: "42rem", fontWeight: 400 }}>
          Tell us the occasion. We&rsquo;ll find the perfect restaurant.
        </p>

        {/* Sub-tagline */}
        <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.4)", marginBottom: "3rem", letterSpacing: "0.05em", fontWeight: 400 }}>
          Powered by real data, no hallucinated reviews, just honest scores.
        </p>

        {/* CTA */}
        <Link
          href="/app"
          style={{
            display: "inline-flex", alignItems: "center", gap: "0.75rem",
            padding: "1rem 2.5rem", background: "#c9a96e", color: "black",
            fontSize: "0.875rem", letterSpacing: "0.18em", textTransform: "uppercase",
            textDecoration: "none", fontWeight: 600, transition: "background 0.3s",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "#e8d5b0")}
          onMouseLeave={e => (e.currentTarget.style.background = "#c9a96e")}
        >
          <span>Try it</span>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        {/* Example cards */}
        <div style={{ marginTop: "3.5rem", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", width: "100%", maxWidth: "52rem" }}>
          {[
            {
              icon: "🌹",
              label: "Romance",
              text: "Candlelit, quiet, French or Italian, under $60",
            },
            {
              icon: "💼",
              label: "Business",
              text: "Upscale client lunch, good wine, not too loud",
            },
            {
              icon: "🎂",
              label: "Celebration",
              text: "Birthday dinner for 6, rooftop, great cocktails",
            },
          ].map((example) => (
            <div key={example.text} style={{
              position: "relative",
              border: "1px solid rgba(201,169,110,0.35)",
              padding: "1.1rem 1.1rem 1.2rem",
              textAlign: "left",
              background: "rgba(10,8,4,0.22)",
              backdropFilter: "blur(12px)",
              overflow: "hidden",
            }}>
              {/* Gold top accent line */}
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(to right, transparent, #c9a96e, transparent)" }} />
              <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", marginBottom: "0.65rem" }}>
                <span style={{ fontSize: "0.95rem" }}>{example.icon}</span>
                <span style={{ fontFamily: dmSans.style.fontFamily, color: "#c9a96e", fontSize: "0.85rem", letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700 }}>{example.label}</span>
              </div>
              <span style={{ fontFamily: dmSans.style.fontFamily, color: "rgba(255,255,255,0.78)", fontSize: "0.97rem", fontWeight: 400, lineHeight: 1.7 }}>
                &ldquo;{example.text}&rdquo;
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ position: "absolute", bottom: "1.5rem", left: 0, right: 0, textAlign: "center", zIndex: 2 }}>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.72rem", letterSpacing: "0.18em", fontWeight: 400, fontStyle: "italic" }}>
          Brought to you by Ishita &amp; Co.
        </p>
      </div>
    </main>
  );
}
