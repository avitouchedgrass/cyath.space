"use client";

import React from "react";

interface LogoProps {
  size?: number;
  showWordmark?: boolean;
  showBadge?: boolean;
  badgeText?: string;
  locked?: boolean;
  className?: string;
  theme?: "night" | "day";
  wordmarkClassName?: string;
}

/**
 * TesseractMark
 * An isometric 4D hypercube (tesseract) projection:
 * Outer isometric cube nested with an inner suspended cube and connecting vertices.
 * Rendered with solid white faces and precision black 1.5px architectural drafting outlines.
 */
export const TesseractMark: React.FC<{
  size?: number;
  locked?: boolean;
  className?: string;
}> = ({ size = 26, locked = false, className = "" }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`flex-shrink-0 transition-transform duration-200 group-hover:scale-105 ${className}`}
      aria-label="Cyath Tesseract Logo"
    >
      {/* Outer Hexagon (Solid White with Black Drafting Outline) */}
      <polygon
        points="16,3.5 26.8,9.75 26.8,22.25 16,28.5 5.2,22.25 5.2,9.75"
        fill="#FFFFFF"
        stroke="#000000"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />

      {/* 6 Outer-to-Inner Hypercube Struts */}
      <line x1="16" y1="3.5" x2="16" y2="10.2" stroke="#000000" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="26.8" y1="9.75" x2="21.2" y2="13" stroke="#000000" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="26.8" y1="22.25" x2="21.2" y2="19" stroke="#000000" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="16" y1="28.5" x2="16" y2="21.8" stroke="#000000" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="5.2" y1="22.25" x2="10.8" y2="19" stroke="#000000" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="5.2" y1="9.75" x2="10.8" y2="13" stroke="#000000" strokeWidth="1.4" strokeLinecap="round" />

      {/* Inner Suspended Cube (Solid White with Black Drafting Outline) */}
      <polygon
        points="16,10.2 21.2,13 21.2,19 16,21.8 10.8,19 10.8,13"
        fill="#FFFFFF"
        stroke="#000000"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Inner Cube 3 Center Ridges Meeting at (16, 16) */}
      <line x1="16" y1="16" x2="10.8" y2="13" stroke="#000000" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="16" y1="16" x2="21.2" y2="13" stroke="#000000" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="16" y1="16" x2="16" y2="21.8" stroke="#000000" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
};

export const CyathLogo: React.FC<LogoProps> = ({
  size = 26,
  showWordmark = true,
  showBadge = false,
  badgeText = "Staging",
  locked = false,
  className = "",
  theme = "night",
  wordmarkClassName = "",
}) => {
  return (
    <div
      className={`inline-flex items-center gap-[10px] select-none group cursor-pointer ${className}`}
    >
      <TesseractMark size={size} locked={locked} />

      {showWordmark && (
        <span
          className={`font-bold text-[17px] tracking-[-0.035em] transition-colors ${
            wordmarkClassName
              ? wordmarkClassName
              : theme === "day"
              ? "text-[#1C1A18] group-hover:text-black"
              : "text-[#FFFFFF] group-hover:text-white"
          }`}
        >
          cyath
        </span>
      )}

      {showBadge && (
        <span className="font-mono text-[9.5px] font-semibold tracking-wider uppercase text-[#A1A1AA] bg-white/[0.06] border border-white/[0.12] px-1.5 py-0.5 rounded leading-tight">
          {badgeText}
        </span>
      )}
    </div>
  );
};

// Aliases for compatibility
export const RefractivePrismMark = TesseractMark;
export const DualViewportMark = TesseractMark;
export const MilestoneDial = CyathLogo;
