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
 * Refractive Prism Mark (Direction 1)
 * Isometric geometric crystal with 3 calibrated light planes. Zero 'C', zero dots.
 */
export const RefractivePrismMark: React.FC<{
  size?: number;
  locked?: boolean;
  className?: string;
}> = ({ size = 24, locked = false, className = "" }) => {
  const accentColor = locked ? "#10B981" : "#EF4444";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`flex-shrink-0 transition-transform duration-200 group-hover:scale-105 ${className}`}
    >
      {/* Top face (platinum highlight) */}
      <path d="M12 2.5L19.5 6.7L12 10.9L4.5 6.7L12 2.5Z" fill="#FFF5F5" fillOpacity="0.95" />
      {/* Right face (accent) */}
      <path d="M12 10.9L19.5 6.7V16.3L12 20.5V10.9Z" fill={accentColor} className="transition-colors duration-300" />
      {/* Left face (deep shadow) */}
      <path d="M12 10.9L4.5 6.7V16.3L12 20.5V10.9Z" fill="#FFF5F5" fillOpacity="0.25" />
    </svg>
  );
};

export const CyathLogo: React.FC<LogoProps> = ({
  size = 24,
  showWordmark = true,
  showBadge = false,
  badgeText = "Staging",
  locked = false,
  className = "",
}) => {
  return (
    <div
      className={`inline-flex items-center gap-[8px] select-none group cursor-pointer ${className}`}
    >
      <RefractivePrismMark size={size} locked={locked} />

      {showWordmark && (
        <span className="font-bold text-[15.5px] tracking-[-0.035em] text-[#FFF5F5] group-hover:text-white transition-colors">
          cyath
        </span>
      )}

      {showBadge && (
        <span className="font-mono text-[9.5px] font-semibold tracking-wider uppercase text-[#9E7B7B] bg-white/[0.05] border border-white/[0.08] px-1.5 py-0.5 rounded leading-tight">
          {badgeText}
        </span>
      )}
    </div>
  );
};

export const DualViewportMark = RefractivePrismMark;
export const MilestoneDial = CyathLogo;
