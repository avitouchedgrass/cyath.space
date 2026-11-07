import React from "react";

interface LogoProps {
  size?: number;
  showWordmark?: boolean;
  integrated?: boolean;
  className?: string;
}

/**
 * Cyath Brand Identity
 * Clean geometric monogram 'C' with optical Electric Amber focal coordinate.
 * Can be rendered standalone or as an integrated machined Origin Anchor.
 */
export const CyathLogo: React.FC<LogoProps> = ({
  size = 26,
  showWordmark = true,
  integrated = false,
  className = "",
}) => {
  if (integrated) {
    return (
      <div
        className={`inline-flex items-center gap-2 h-9 px-2.5 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.14] rounded-full transition-colors select-none ${className}`}
      >
        <div className="w-6 h-6 rounded-full bg-[#09090B] border border-white/[0.14] flex items-center justify-center flex-shrink-0 shadow-sm">
          <svg
            width={14}
            height={14}
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M21 7.5C18.8 5.3 15.6 4 12 4C5.92487 4 1 8.92487 1 15C1 21.0751 5.92487 26 12 26C15.6 26 18.8 24.7 21 22.5"
              stroke="#FAFAFA"
              strokeWidth="3.25"
              strokeLinecap="round"
            />
            <circle cx="15.5" cy="15" r="3" fill="#F59E0B" />
          </svg>
        </div>
        {showWordmark && (
          <span className="font-semibold text-sm tracking-[-0.025em] text-[#FAFAFA]">
            Cyath
          </span>
        )}
        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] border border-white/20 ml-0.5" />
      </div>
    );
  }

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
