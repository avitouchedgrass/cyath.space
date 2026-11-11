"use client";

import React from "react";
import { Check } from "lucide-react";
import { Pin } from "@/types";
import { getPageColor } from "@/lib/colors";

interface PinMarkerProps {
  pin: Pin;
  isActive: boolean;
  onClick: (pinId: string) => void;
}

export const PinMarker: React.FC<PinMarkerProps> = ({ pin, isActive, onClick }) => {
  const isResolved = pin.status === "resolved";
  const pagePalette = getPageColor(pin.pageUrl);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick(pin.id);
      }}
      style={{
        left: `${pin.xPercent}%`,
        top: `${pin.yPercent}%`,
      }}
      className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-200 z-20 flex items-center justify-center font-mono font-bold select-none cursor-pointer animate-in zoom-in-50 duration-200 active:scale-95 ${
        isResolved
          ? "w-5 h-5 bg-black/90 border border-white/20 text-zinc-500 opacity-60 hover:opacity-100 shadow-sm"
          : isActive
          ? "w-7 h-7 bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.5)] ring-2 ring-white/40 scale-110 text-xs"
          : "w-6 h-6 bg-black border border-white/50 text-white text-[11px] hover:border-white hover:scale-110 shadow-[0_0_12px_rgba(0,0,0,0.5)]"
      }`}
      title={`Pin #${pin.number}: ${pin.comments?.[0]?.content || ""}`}
    >
      {isResolved ? <Check className="w-3 h-3 stroke-[2.5]" /> : pin.number}
      {pagePalette && !isResolved && (
        <span
          className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-black shadow-sm"
          style={{ backgroundColor: pagePalette.hex }}
          title={`Page: ${pin.pageUrl || "Home"}`}
        />
      )}
    </button>
  );
};
