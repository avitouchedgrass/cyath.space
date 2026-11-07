import React from "react";

interface LogoProps {
  size?: number;
  showWordmark?: boolean;
  className?: string;
}

/**
 * Cyath Brand Identity
 * Clean geometric monogram 'C' with optical Electric Amber focal coordinate.
 */
export const CyathLogo: React.FC<LogoProps> = ({
  size = 28,
  showWordmark = true,
  className = "",
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0 transition-transform duration-200 hover:scale-105"
      >
        <path
          d="M21 7.5C18.8 5.3 15.6 4 12 4C5.92487 4 1 8.92487 1 15C1 21.0751 5.92487 26 12 26C15.6 26 18.8 24.7 21 22.5"
          stroke="#FAFAFA"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="15.5" cy="15" r="3" fill="#F59E0B" />
      </svg>

      {showWordmark && (
        <span className="font-semibold text-[16px] tracking-[-0.025em] text-[#FAFAFA]">
          Cyath
        </span>
      )}
    </div>
  );
};
