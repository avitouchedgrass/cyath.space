import React from "react";

interface LogoProps {
  size?: number; // e.g. 24, 28, 32
  showWordmark?: boolean;
  className?: string;
}

/**
 * Cyath Logo — Concept 2: The Viewport Notch (The Frame + The Anchor)
 * A precision rounded frame representing a staging viewport, with an architectural
 * top-right notch forming the letter 'C', anchored by an Electric Amber coordinate pin.
 */
export const CyathLogo: React.FC<LogoProps> = ({
  size = 28,
  showWordmark = true,
  className = "",
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Icon Mark: The Viewport Notch C */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Viewport Frame Base */}
        <rect
          x="3"
          y="3"
          width="26"
          height="26"
          rx="7"
          fill="#121215"
          stroke="#27272A"
          strokeWidth="1.5"
        />

        {/* The C Path (Architectural Viewport Curve) */}
        <path
          d="M21.5 10.5C19.8 8.8 17.2 8 14.5 8C9.8 8 6.5 11.6 6.5 16C6.5 20.4 9.8 24 14.5 24C17.2 24 19.8 23.2 21.5 21.5"
          stroke="#FAFAFA"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* The Viewport Top Notch Cutout */}
        <path
          d="M19 4L22 4"
          stroke="#F59E0B"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* The Coordinate Anchor Node (Electric Amber Pin) */}
        <circle cx="15.5" cy="16" r="2.25" fill="#F59E0B" />
      </svg>

      {/* Wordmark */}
      {showWordmark && (
        <div className="flex items-baseline gap-1.5">
          <span className="font-semibold text-sm tracking-[-0.03em] text-[#FAFAFA]">
            Cyath
          </span>
          <span className="font-mono text-[9px] uppercase tracking-wider text-[#71717A]">
            Review
          </span>
        </div>
      )}
    </div>
  );
};

