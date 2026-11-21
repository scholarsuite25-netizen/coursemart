import React, { useEffect, useState } from 'react';
import { generateWatermarkOverlayConfig } from '../../utils/contentProtection';

export interface DynamicWatermarkOverlayProps {
  user?: { id?: string; email?: string; name?: string } | null;
  timestampIso?: string;
  visible?: boolean;
  opacity?: number;
  className?: string;
}

export function DynamicWatermarkOverlay({
  user = null,
  timestampIso,
  visible = true,
  opacity,
  className = '',
}: DynamicWatermarkOverlayProps) {
  const [driftOffset, setDriftOffset] = useState(0);

  // Periodic subtle drift animation (advances offset slightly every 2.5 seconds)
  useEffect(() => {
    if (!visible) return;
    const interval = window.setInterval(() => {
      setDriftOffset((prev) => (prev + 1) % 360);
    }, 2500);
    return () => window.clearInterval(interval);
  }, [visible]);

  if (!visible) return null;

  const config = generateWatermarkOverlayConfig(user, timestampIso);
  const resolvedOpacity = opacity ?? config.opacity; // 0.18

  // Compute subtle harmonic sinusoidal translation
  const rad = (driftOffset * Math.PI) / 180;
  const driftX = Math.sin(rad) * 16;
  const driftY = Math.cos(rad) * 10;

  // Grid rows and columns for repeating diagonal watermark pattern
  const gridRows = Array.from({ length: 6 });
  const gridCols = Array.from({ length: 4 });

  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 pointer-events-none select-none overflow-hidden z-30 ${className}`}
      style={{
        opacity: resolvedOpacity,
      }}
    >
      <div
        className="w-[160%] h-[160%] -left-[30%] -top-[30%] absolute flex flex-col justify-around transition-transform duration-1000 ease-in-out"
        style={{
          transform: `translate(${driftX}px, ${driftY}px) rotate(${config.layout.angle}deg)`,
        }}
      >
        {gridRows.map((_, rIdx) => (
          <div key={`wm-row-${rIdx}`} className="flex justify-around items-center w-full my-6">
            {gridCols.map((_, cIdx) => (
              <div
                key={`wm-cell-${rIdx}-${cIdx}`}
                className="font-mono text-xs sm:text-sm font-semibold tracking-wider text-slate-400 dark:text-slate-300 drop-shadow-sm whitespace-nowrap px-4"
              >
                {config.text}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
