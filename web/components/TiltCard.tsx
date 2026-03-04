"use client";

import { useRef, MouseEvent, ReactNode, CSSProperties } from "react";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  intensity?: number;
  style?: CSSProperties;
}

export function TiltCard({ children, className = "", intensity = 8, style }: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const card = cardRef.current;
    const glow = glowRef.current;
    if (!card || !glow) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    const rotateX = ((y - cy) / cy) * -intensity;
    const rotateY = ((x - cx) / cx) * intensity;

    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    card.style.transition = "transform 0.1s ease";

    // Move glow to cursor position
    glow.style.left = `${x}px`;
    glow.style.top = `${y}px`;
    glow.style.opacity = "1";
  }

  function handleMouseLeave() {
    const card = cardRef.current;
    const glow = glowRef.current;
    if (!card || !glow) return;
    card.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
    card.style.transition = "transform 0.5s ease";
    glow.style.opacity = "0";
  }

  return (
    <div
      ref={cardRef}
      className={`relative overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transformStyle: "preserve-3d", willChange: "transform", ...style }}
    >
      {/* Cursor glow */}
      <div
        ref={glowRef}
        className="pointer-events-none absolute w-40 h-40 rounded-full opacity-0 transition-opacity duration-300"
        style={{
          transform: "translate(-50%, -50%)",
          background: "radial-gradient(circle, rgba(201,169,110,0.15) 0%, transparent 70%)",
          zIndex: 10,
        }}
      />
      {children}
    </div>
  );
}
