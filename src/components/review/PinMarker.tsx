"use client";

import React from "react";
import { Check } from "lucide-react";
import { Pin } from "@/types";

interface PinMarkerProps {
  pin: Pin;
  isActive: boolean;
  onClick: (pinId: string) => void;
}

export const PinMarker: React.FC<PinMarkerProps> = ({ pin, isActive, onClick }) => {
  const isResolved = pin.status === "resolved";

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
      className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-200 z-20 flex items-center justify-center font-bold text-xs select-none ${
        isResolved
          ? "w-6 h-6 bg-[#121215] border border-[#10B981] text-[#10B981] opacity-75 hover:opacity-100 shadow-sm"
          : isActive
          ? "w-8 h-8 bg-[#F59E0B] text-[#09090B] shadow-[0_0_24px_rgba(245,158,11,0.6)] ring-4 ring-[#F59E0B]/30 scale-110"
          : "w-7 h-7 bg-[#121215] border-2 border-[#F59E0B] text-[#FAFAFA] hover:scale-110 shadow-[0_0_12px_rgba(245,158,11,0.35)]"
      }`}
      title={`Pin #${pin.number}: ${pin.comments[0]?.content || ""}`}
    >
      {isResolved ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : pin.number}
    </button>
  );
};

