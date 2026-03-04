"use client";

import { useEffect, useRef, useState } from "react";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$✦★◆";

interface ScrambleTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
}

export function ScrambleText({ text, className = "", delay = 0, duration = 1200 }: ScrambleTextProps) {
  const [display, setDisplay] = useState(text);
  const frameRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let startTime: number | null = null;
    let iteration = 0;

    const timeout = setTimeout(() => {
      frameRef.current = setInterval(() => {
        if (startTime === null) startTime = Date.now();
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const revealedCount = Math.floor(progress * text.length);

        setDisplay(
          text
            .split("")
            .map((char, i) => {
              if (char === " ") return " ";
              if (i < revealedCount) return char;
              if (Math.random() < 0.3) return CHARS[Math.floor(Math.random() * CHARS.length)];
              return char;
            })
            .join("")
        );

        iteration++;
        if (progress >= 1) {
          setDisplay(text);
          if (frameRef.current) clearInterval(frameRef.current);
        }
      }, 40);
    }, delay);

    return () => {
      clearTimeout(timeout);
      if (frameRef.current) clearInterval(frameRef.current);
    };
  }, [text, delay, duration]);

  return <span className={className}>{display}</span>;
}
