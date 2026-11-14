"use client";

import React, { useState } from "react";

interface WarmTooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
  theme?: "night" | "day";
}

export function WarmTooltip({
  content,
  children,
  position = "right",
  className = "",
  theme = "night",
}: WarmTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2.5",
    right: "left-full top-1/2 -translate-y-1/2 ml-2.5",
  };

  const transformAnimation = {
    top: isVisible ? "translate-y-0 opacity-100 scale-100" : "translate-y-1 opacity-0 scale-95",
    bottom: isVisible ? "translate-y-0 opacity-100 scale-100" : "-translate-y-1 opacity-0 scale-95",
    left: isVisible ? "translate-x-0 opacity-100 scale-100" : "translate-x-1 opacity-0 scale-95",
    right: isVisible ? "translate-x-0 opacity-100 scale-100" : "-translate-x-1 opacity-0 scale-95",
  };

  const isDay = theme === "day";

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}

      <div
        className={`absolute ${positionClasses[position]} z-50 pointer-events-none transition-all duration-150 ease-out origin-center ${transformAnimation[position]}`}
      >
        <div
          className={`px-2.5 py-1 rounded-lg text-[11px] font-mono tracking-wide whitespace-nowrap shadow-xl border backdrop-blur-md flex items-center gap-1.5 select-none ${
            isDay
              ? "bg-white/95 text-stone-900 border-stone-200/90 shadow-stone-300/40"
              : "bg-[#141417]/95 text-zinc-100 border-white/15 shadow-black/80"
          }`}
        >
          {content}
        </div>
      </div>
    </div>
  );
}

