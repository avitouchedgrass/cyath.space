"use client";

import React from "react";

interface LogoProps {
  size?: number;
  showWordmark?: boolean;
  showBadge?: boolean;
  badgeText?: string;
  locked?: boolean;
  className?: string;
}

/**
 * Dual Viewport Frame Mark
 * Two offset architectural hairline frames (Staging Canvas + Review Layer)
 * locked at a precision coordinate inspection datum. Zero 'C' glyph.
 */
export const DualViewportMark: React.FC<{
  size?: number;
  locked?: boolean;
  className?: string;
}> = ({ size = 25, locked = false, className = "" }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`flex-shrink-0 transition-transform duration-200 group-hover:scale-105 ${className}`}
    >
      {/* Staging Viewport Base Frame (Rear) */}
      <rect
        x="2.5"
        y="3.5"
        width="13"
        height="12"
        rx="2.5"
        stroke="#FAFAFA"
        strokeWidth="1.5"
        strokeOpacity="0.75"
      />
      {/* Client Inspection Layer Frame (Front with Occlusion) */}
      <rect
        x="8.5"
        y="8.5"
        width="13"
        height="12"
        rx="2.5"
        fill="#09090B"
        stroke={locked ? "#10B981" : "#F59E0B"}
        strokeWidth="1.5"
        className="transition-colors duration-300"
      />
      {/* Pinned Coordinate Datum Point */}
      <circle
        cx="15.5"
        cy="8.5"
        r="2"
        fill={locked ? "#10B981" : "#F59E0B"}
        className="transition-colors duration-300"
      />
    </svg>
  );
};

export const CyathLogo: React.FC<LogoProps> = ({
  size = 25,
  showWordmark = true,
  showBadge = false,
  badgeText = "Staging",
  locked = false,
  className = "",
}) => {
  return (
    <div
      className={`inline-flex items-center gap-[7.5px] select-none group cursor-pointer ${className}`}
    >
      <DualViewportMark size={size} locked={locked} />

      {showWordmark && (
        <span className="font-bold text-[15.5px] tracking-[-0.035em] text-[#FAFAFA] group-hover:text-white transition-colors">
          cyath
        </span>
      )}

      {showBadge && (
        <span className="font-mono text-[9.5px] font-semibold tracking-wider uppercase text-[#71717A] bg-white/[0.05] border border-white/[0.08] px-1.5 py-0.5 rounded leading-tight">
          {badgeText}
        </span>
      )}
    </div>
  );
};

export const MilestoneDial = CyathLogo;
