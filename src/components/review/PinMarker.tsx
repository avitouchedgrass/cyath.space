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
  const isBox = pin.annotationType === "box" && typeof pin.widthPercent === "number" && typeof pin.heightPercent === "number";

  if (isBox) {
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          onClick(pin.id);
        }}
        style={{
          left: `${pin.xPercent}%`,
          top: `${pin.yPercent}%`,
          width: `${pin.widthPercent}%`,
          height: `${pin.heightPercent}%`,
        }}
        className={`absolute z-20 cursor-pointer transition-all duration-150 ease-out group rounded ${
          isResolved
            ? "border border-dashed border-white/25 bg-white/[0.02] hover:border-white/50"
            : isActive
            ? "border-2 border-solid border-white bg-white/10 shadow-[0_0_24px_rgba(255,255,255,0.3)] ring-1 ring-white/50"
            : "border border-dashed border-white/60 bg-black/20 hover:border-white hover:bg-white/[0.08]"
        }`}
        title={`Box #${pin.number}: ${pin.comments?.[0]?.content || ""}`}
      >
        <button
          className={`absolute -top-3 -left-3 rounded-full flex items-center justify-center font-mono font-bold select-none cursor-pointer transition-transform duration-150 active:scale-[0.96] ${
            isResolved
              ? "w-5 h-5 bg-black/90 border border-white/20 text-zinc-500 text-[10px]"
              : isActive
              ? "w-6 h-6 bg-white text-black text-xs shadow-md ring-2 ring-white/50"
              : "w-5 h-5 bg-black border border-white/60 text-white text-[10px] group-hover:scale-110"
          }`}
        >
          {isResolved ? <Check className="w-3 h-3 stroke-[2.5]" /> : pin.number}
        </button>
      </div>
    );
  }

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
      className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full z-20 flex items-center justify-center font-mono font-bold select-none cursor-pointer transition-all duration-150 ease-out active:scale-[0.96] hover:scale-110 ${
        isResolved
          ? "w-5 h-5 bg-black/90 border border-white/20 text-zinc-500 opacity-60 hover:opacity-100 shadow-sm"
          : isActive
          ? "w-7 h-7 bg-white text-black shadow-[0_0_24px_rgba(255,255,255,0.7)] ring-2 ring-white/60 scale-105 text-xs animate-pin-ripple"
          : "w-6 h-6 bg-black border border-white/50 text-white text-[11px] hover:border-white shadow-[0_0_12px_rgba(0,0,0,0.5)] hover:shadow-[0_0_18px_rgba(255,255,255,0.35)]"
      }`}
      title={`Pin #${pin.number}: ${pin.comments?.[0]?.content || ""}`}
    >
      {isResolved ? <Check className="w-3 h-3 stroke-[2.5]" /> : pin.number}
    </button>
  );
};
