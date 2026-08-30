"use client";

import { useEffect, useRef, useState } from "react";

// Eases toward `value` from its previous value over `duration`ms.
// Used for money figures so a balance change reads as movement, not a jump cut.
export function useAnimatedNumber(value: number, duration = 600): number {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef<number | undefined>(undefined);
  const prefersReducedMotion = useRef(false);

  useEffect(() => {
    prefersReducedMotion.current =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (prefersReducedMotion.current) {
      setDisplay(value);
      fromRef.current = value;
      return;
    }

    const from = fromRef.current;
    const delta = value - from;
    if (delta === 0) return;

    const start = performance.now();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    function tick(now: number) {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out-cubic
      setDisplay(from + delta * eased);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = value;
      }
    }
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return display;
}
