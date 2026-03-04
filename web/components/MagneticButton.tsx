"use client";

import { useRef, MouseEvent, ReactNode, useState } from "react";

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  strength?: number;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
}

export function MagneticButton({
  children,
  className = "",
  onClick,
  disabled,
  strength = 0.3,
}: MagneticButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  let rippleId = useRef(0);

  function handleMouseMove(e: MouseEvent<HTMLButtonElement>) {
    const btn = btnRef.current;
    if (!btn || disabled) return;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    btn.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
    btn.style.transition = "transform 0.15s ease";
  }

  function handleMouseLeave() {
    const btn = btnRef.current;
    if (!btn) return;
    btn.style.transform = "translate(0px, 0px)";
    btn.style.transition = "transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)";
  }

  function handleClick(e: MouseEvent<HTMLButtonElement>) {
    const btn = btnRef.current;
    if (!btn || disabled) return;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = rippleId.current++;
    setRipples((prev) => [...prev, { id, x, y }]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 600);
    onClick?.();
  }

  return (
    <button
      ref={btnRef}
      className={`relative overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      disabled={disabled}
    >
      {ripples.map((r) => (
        <span
          key={r.id}
          className="absolute rounded-full bg-white/30 animate-ping pointer-events-none"
          style={{
            left: r.x,
            top: r.y,
            width: 8,
            height: 8,
            transform: "translate(-50%, -50%)",
            animationDuration: "0.6s",
            animationIterationCount: 1,
          }}
        />
      ))}
      {children}
    </button>
  );
}
