import { useEffect, useRef, useState } from "react";
import type { PaletteRing as PaletteRingData } from "../machines/palette";

interface PaletteRingProps {
  ring: PaletteRingData;
}

const TERMINAL_RADIUS = 100;
const GROW_DURATION = 800; // ms, must match CSS
const STEADY_ANGULAR_VELOCITY = 18; // deg/s at terminal radius

export function PaletteRing({ ring }: PaletteRingProps) {
  const { gifs, x, y } = ring;
  const [angle, setAngle] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const angleRef = useRef(0);
  const prevTimeRef = useRef<number | null>(null);

  useEffect(() => {
    // Reset on palette change
    startTimeRef.current = null;
    angleRef.current = 0;
    prevTimeRef.current = null;
    setAngle(0);

    let raf: number;
    function tick(now: number) {
      if (startTimeRef.current === null) {
        startTimeRef.current = now;
        prevTimeRef.current = now;
      }

      const elapsed = now - startTimeRef.current;
      const dt = (now - prevTimeRef.current!) / 1000; // seconds
      prevTimeRef.current = now;

      // Current radius follows the same ease-out curve as CSS
      // cubic-bezier(0.22, 1, 0.36, 1) approximated as ease-out
      const t = Math.min(elapsed / GROW_DURATION, 1);
      const eased = 1 - Math.pow(1 - t, 3); // cubic ease-out
      const currentRadius = Math.max(eased * TERMINAL_RADIUS, 2);

      // Angular momentum conservation: ω ∝ 1/r
      // Scale so that at terminal radius we get the steady velocity
      const omega = STEADY_ANGULAR_VELOCITY * (TERMINAL_RADIUS / currentRadius);

      angleRef.current += omega * dt;
      setAngle(angleRef.current);

      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ring.palette]);

  if (gifs.length === 0) return null;

  const count = gifs.length;

  return (
    <div
      className="palette-ring"
      key={ring.palette}
      style={{ left: x, top: y }}
    >
      <div
        className="palette-ring-orbit"
        style={{ transform: `rotate(${angle}deg)` }}
      >
        {gifs.map((gif, i) => {
          const thumbAngle = (360 / count) * i;
          return (
            <div
              key={gif}
              className="palette-ring-thumb"
              style={{
                "--angle": `${thumbAngle}deg`,
              } as React.CSSProperties}
            >
              <img src={gif} alt="" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
