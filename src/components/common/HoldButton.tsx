"use client";

import React, { useState, useRef, useEffect } from "react";
import { Trash2 } from "lucide-react";

interface HoldButtonProps {
  onHoldComplete: () => void;
  holdDuration?: number; // ms
  fillColor?: string;
  className?: string;
  title?: string;
  children?: React.ReactNode;
}

export const HoldButton: React.FC<HoldButtonProps> = ({
  onHoldComplete,
  holdDuration = 900,
  fillColor = "#ff153e",
  className = "",
  title = "Hold to delete",
  children,
}) => {
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const startHold = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setHolding(true);
    startTimeRef.current = performance.now();

    const updateProgress = (now: number) => {
      if (!startTimeRef.current) return;
      const elapsed = now - startTimeRef.current;
      const pct = Math.min(100, (elapsed / holdDuration) * 100);
      setProgress(pct);

      if (pct >= 100) {
        cancelHold();
        onHoldComplete();
      } else {
        rafRef.current = requestAnimationFrame(updateProgress);
      }
    };

    rafRef.current = requestAnimationFrame(updateProgress);
  };

  const cancelHold = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) e.stopPropagation();
    setHolding(false);
    setProgress(0);
    startTimeRef.current = null;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <button
      type="button"
      onMouseDown={startHold}
      onMouseUp={cancelHold}
      onMouseLeave={cancelHold}
      onTouchStart={startHold}
      onTouchEnd={cancelHold}
      onClick={(e) => e.stopPropagation()}
      title={title}
      className={`relative overflow-hidden select-none cursor-pointer transition-transform duration-100 ${
        holding ? "scale-95 text-red-500" : ""
      } ${className}`}
    >
      {/* Fill Progress Bar */}
      <span
        className="absolute inset-y-0 left-0 pointer-events-none"
        style={{
          backgroundColor: fillColor,
          width: `${progress}%`,
          opacity: holding ? 0.35 : 0,
          transition: holding ? "width 20ms linear" : "width 150ms ease-out, opacity 150ms ease-out",
        }}
      />
      {/* Visual Icon / Children */}
      <span className="relative z-10 flex items-center justify-center">
        {children || <Trash2 className="w-3.5 h-3.5" />}
      </span>
    </button>
  );
};

