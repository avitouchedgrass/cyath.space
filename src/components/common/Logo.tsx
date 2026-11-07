import React from "react";

interface LogoProps {
  size?: number;
  showWordmark?: boolean;
  className?: string;
}

/**
 * Cyath Brand Identity — The Harmonic Chiasm
 * A continuous, mathematically balanced geometric mark:
 * An aerodynamic golden-ratio crescent (C) that loops into a precision coordinate node,
 * holding an Electric Amber radiant focal point at its optical center.
 */
export const CyathLogo: React.FC<LogoProps> = ({
  size = 28,
  showWordmark = true,
  className = "",
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* The Harmonic Chiasm Mark */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0 transition-transform duration-200 hover:scale-105"
      >
        <defs>
          <linearGradient id="cyath-crescent" x1="6" y1="6" x2="30" y2="30" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="60%" stopColor="#E4E4E7" />
            <stop offset="100%" stopColor="#71717A" />
          </linearGradient>
          <linearGradient id="cyath-amber" x1="16" y1="12" x2="28" y2="24" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
          <filter id="amber-glow" x="12" y="12" width="16" height="16" filterUnits="userSpaceOnUse">
            <feGaussianBlur stdDeviation="1.5" result="glow" />
            <feComposite in="SourceGraphic" in2="glow" operator="over" />
          </filter>
        </defs>

        {/* Outer Radiant Aura Ring (Subtle) */}
        <circle cx="18" cy="18" r="16.5" stroke="#27272A" strokeWidth="1" strokeDasharray="2 3" opacity="0.6" />

        {/* The Harmonic Crescent Sweep (Forms the primary 'C' silhouette) */}
        <path
          d="M26.5 10C24.2 7.2 20.8 5.5 17 5.5C10.1 5.5 4.5 11.1 4.5 18C4.5 24.9 10.1 30.5 17 30.5C21.2 30.5 24.8 28.5 27 25.3"
          stroke="url(#cyath-crescent)"
          strokeWidth="2.75"
          strokeLinecap="round"
        />

        {/* The Inward Coordinate Convergence Loop */}
        <path
          d="M27 10.5C23.5 14 19.5 15.5 15 15.5"
          stroke="url(#cyath-amber)"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.85"
        />

        {/* The Optical Coordinate Node (Amber Core) */}
        <circle
          cx="20"
          cy="18"
          r="3"
          fill="url(#cyath-amber)"
          filter="url(#amber-glow)"
        />

        {/* Core Pin Center */}
        <circle cx="20" cy="18" r="1.25" fill="#FFFFFF" />
      </svg>

      {/* Wordmark */}
      {showWordmark && (
        <div className="flex items-baseline gap-1.5">
          <span className="font-semibold text-base tracking-[-0.035em] text-[#FAFAFA]">
            Cyath
          </span>
          <span className="font-mono text-[9px] uppercase tracking-widest text-[#71717A]">
            Review
          </span>
        </div>
      )}
    </div>
  );
};
