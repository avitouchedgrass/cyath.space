"use client";

import React, { useState } from "react";

export type DialState = "brand" | "active" | "locked";

export interface MilestoneDialProps {
  initialState?: DialState;
  state?: DialState;
  pinCount?: number;
  badgeText?: string;
  interactive?: boolean;
  className?: string;
  showWordmark?: boolean;
  size?: number;
}

export const MilestoneDial: React.FC<MilestoneDialProps> = ({
  initialState = "brand",
  state: controlledState,
  pinCount = 3,
  badgeText = "Engine",
  interactive = true,
  className = "",
}) => {
  const [internalState, setInternalState] = useState<DialState>(initialState);
  const currentState = controlledState ?? internalState;

  const cycleState = () => {
    if (!interactive) return;
    if (currentState === "brand") setInternalState("active");
    else if (currentState === "active") setInternalState("locked");
    else setInternalState("brand");
  };

  const isLocked = currentState === "locked";
  const isActive = currentState === "active";

  return (
    <div
      onClick={cycleState}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={(e) => {
        if (interactive && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          cycleState();
        }
      }}
      title={interactive ? "Click to toggle milestone dial state" : undefined}
      className={`inline-flex items-center cursor-pointer select-none group focus:outline-none focus-visible:ring-1 focus-visible:ring-amber-500/50 rounded-full ${className}`}
    >
      <div className="flex items-center gap-2.5 h-[34px] px-2.5 bg-[#111114] border border-white/10 rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.6),0_1px_0_rgba(255,255,255,0.08)] group-hover:bg-[#141418] group-hover:border-white/20 transition-all duration-200">
        {/* Mechanical Caliper Iris (CSS aperture ring) */}
        <div
          className={`relative w-4.5 h-4.5 rounded-full bg-[#09090B] border-[1.5px] flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
            isLocked
              ? "border-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.3)]"
              : "border-white/30 border-r-transparent group-hover:rotate-45 group-hover:border-white/60"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              isLocked
                ? "bg-[#10B981] shadow-[0_0_6px_rgba(16,185,129,0.9)]"
                : "bg-[#F59E0B] shadow-[0_0_5px_rgba(245,158,11,0.8)]"
            }`}
          />
        </div>

        {/* Rotary Drum Display */}
        <div className="relative h-5 min-w-[90px] overflow-hidden flex items-center">
          {/* Brand State */}
          <div
            className={`absolute inset-0 flex items-center gap-1.5 transition-all duration-300 whitespace-nowrap ${
              currentState === "brand"
                ? "translate-y-0 opacity-100"
                : "-translate-y-full opacity-0 pointer-events-none"
            }`}
          >
            <span className="font-semibold text-xs tracking-[-0.02em] text-[#FAFAFA]">
              Cyath
            </span>
            <span className="font-mono text-[9px] font-semibold tracking-wider uppercase text-[#A1A1AA] bg-white/[0.06] px-1.5 py-0.5 rounded border border-white/[0.08]">
              {badgeText}
            </span>
          </div>

          {/* Active Review State */}
          <div
            className={`absolute inset-0 flex items-center gap-1.5 transition-all duration-300 whitespace-nowrap ${
              isActive
                ? "translate-y-0 opacity-100"
                : currentState === "brand"
                ? "translate-y-full opacity-0 pointer-events-none"
                : "-translate-y-full opacity-0 pointer-events-none"
            }`}
          >
            <span className="font-mono text-xs font-semibold text-[#F59E0B]">
              {pinCount} Pins
            </span>
            <span className="text-[11px] text-[#A1A1AA]">Active</span>
          </div>

          {/* Scope Locked State */}
          <div
            className={`absolute inset-0 flex items-center gap-1.5 transition-all duration-300 whitespace-nowrap ${
              isLocked
                ? "translate-y-0 opacity-100"
                : "translate-y-full opacity-0 pointer-events-none"
            }`}
          >
            <span className="text-xs font-bold text-[#10B981]">✓</span>
            <span className="font-mono text-[10px] font-semibold tracking-wider uppercase text-[#10B981]">
              Scope Locked
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export interface LogoProps extends MilestoneDialProps {
  size?: number;
  showWordmark?: boolean;
}

export const CyathLogo: React.FC<LogoProps> = (props) => {
  return <MilestoneDial {...props} />;
};
