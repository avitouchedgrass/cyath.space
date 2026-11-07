import React from "react";

interface LogoProps {
  size?: number;
  showWordmark?: boolean;
  className?: string;
}

/**
 * Cyath Brand Identity
 * Solid geometric compound monogram 'C' with Electric Amber focal coordinate.
 * Highly legible, bold, and architectural at 16px to 256px.
 */
export const CyathLogo: React.FC<LogoProps> = ({
  size = 24,
  showWordmark = true,
  className = "",
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0 transition-transform duration-200 hover:scale-105"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 2.5C6.75329 2.5 2.5 6.75329 2.5 12C2.5 17.2467 6.75329 21.5 12 21.5C15.426 21.5 18.4239 19.6896 20.0865 16.9749L16.6946 15.1437C15.6542 16.8427 13.9592 18 12 18C8.68629 18 6 15.3137 6 12C6 8.68629 8.68629 6 12 6C13.9592 6 15.6542 7.15732 16.6946 8.85626L20.0865 7.02507C18.4239 4.31039 15.426 2.5 12 2.5Z"
          fill="#FAFAFA"
        />
        <circle cx="16" cy="12" r="3.25" fill="#F59E0B" />
      </svg>

      {showWordmark && (
        <span className="font-semibold text-[15px] tracking-[-0.025em] text-[#FAFAFA]">
          Cyath
        </span>
      )}
    </div>
  );
};
