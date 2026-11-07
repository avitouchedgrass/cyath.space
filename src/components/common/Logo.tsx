import React from "react";

export type LogoVariant = "datum" | "monolith" | "seal";

interface LogoProps {
  size?: number;
  showWordmark?: boolean;
  variant?: LogoVariant;
  className?: string;
}

/**
 * Cyath Brand Identity System
 * Direction 01 (Default): The Calibrated Datum — Surveying optic & coordinate pin.
 * Direction 02: The Monolith Aperture — Brutalist architectural keystone.
 * Direction 03: The Scope Seal — Continuous unbroken signature knot.
 */
export const CyathLogo: React.FC<LogoProps> = ({
  size = 32,
  showWordmark = true,
  variant = "datum",
  className = "",
}) => {
  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Mark */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0 transition-transform duration-200 hover:scale-105"
      >
        {variant === "datum" && (
          <>
            {/* Calibrated alignment ticks */}
            <line x1="18" y1="2" x2="18" y2="7" stroke="#71717A" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="18" y1="29" x2="18" y2="34" stroke="#71717A" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="2" y1="18" x2="7" y2="18" stroke="#71717A" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="29" y1="18" x2="34" y2="18" stroke="#71717A" strokeWidth="1.5" strokeLinecap="round" />

            {/* Architectural Caliper 'C' */}
            <path
              d="M25 11H14C11.7909 11 10 12.7909 10 15V21C10 23.2091 11.7909 25 14 25H25"
              stroke="#FAFAFA"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Electric Amber Focal Pin Core */}
            <circle cx="21" cy="18" r="3.2" fill="#F59E0B" />
            <circle cx="21" cy="18" r="1.1" fill="#09090B" />
          </>
        )}

        {variant === "monolith" && (
          <>
            <rect x="3" y="3" width="30" height="30" rx="7" fill="#141417" stroke="#27272A" strokeWidth="1.5" />
            <path
              d="M24 11.5H13.5C11.567 11.5 10 13.067 10 15V21C10 22.933 11.567 24.5 13.5 24.5H24"
              stroke="#FAFAFA"
              strokeWidth="2.75"
              strokeLinecap="square"
            />
            <path d="M19 18L26 13.5V22.5L19 18Z" fill="#F59E0B" />
          </>
        )}

        {variant === "seal" && (
          <>
            <path
              d="M26 10C21.5 6.5 10.5 8.5 10 18C9.5 26.5 20.5 29.5 25.5 26C28 24 28 20.5 24.5 19C21 17.5 16 19.5 16.5 23C17 25.5 19.5 26.5 22 26"
              stroke="#FAFAFA"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="22" cy="26" r="2.75" fill="#F59E0B" />
          </>
        )}
      </svg>

      {/* Wordmark */}
      {showWordmark && (
        <div className="flex items-baseline gap-2">
          <span className="font-bold text-[15px] tracking-[0.14em] text-[#FAFAFA] uppercase">
            CYATH
          </span>
          <span className="font-mono text-[9px] uppercase tracking-wider text-[#A1A1AA]">
            CANVAS
          </span>
        </div>
      )}
    </div>
  );
};
