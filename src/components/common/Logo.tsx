"use client";

import React from "react";

interface NameplateProps {
  locked?: boolean;
  className?: string;
}

export const CyathLogo: React.FC<NameplateProps> = ({
  locked = false,
  className = "",
}) => {
  return (
    <div className={`inline-flex items-center select-none group ${className}`}>
      <div
        className="flex items-center gap-1.5 h-[34px] px-3 rounded-full border border-white/[0.09] border-b-white/[0.04] transition-all duration-200 group-hover:border-white/[0.14]"
        style={{
          background: "linear-gradient(180deg, #131317 0%, #0f0f12 100%)",
          boxShadow:
            "inset 0 1px 0 rgba(0,0,0,0.8), inset 0 -1px 0 rgba(255,255,255,0.055), 0 1px 0 rgba(255,255,255,0.07), 0 2px 8px rgba(0,0,0,0.5)",
        }}
      >
        {/* Flush-mounted LED indicator */}
        <span
          className="w-[5px] h-[5px] rounded-full flex-shrink-0 transition-all duration-300"
          style={
            locked
              ? {
                  background:
                    "radial-gradient(circle at 40% 35%, #6EE7B7, #10B981 60%, #065F46)",
                  boxShadow:
                    "0 0 0 1px rgba(0,0,0,0.5), 0 0 5px 1px rgba(16,185,129,0.55), 0 0 10px 2px rgba(16,185,129,0.2)",
                }
              : {
                  background:
                    "radial-gradient(circle at 40% 35%, #FCD34D, #F59E0B 60%, #B45309)",
                  boxShadow:
                    "0 0 0 1px rgba(0,0,0,0.5), 0 0 5px 1px rgba(245,158,11,0.55), 0 0 10px 2px rgba(245,158,11,0.2)",
                }
          }
        />

        {/* Engraved wordmark */}
        <span
          className="font-semibold text-sm tracking-[-0.02em]"
          style={{
            color: "transparent",
            background:
              "linear-gradient(180deg, #C4C4C8 0%, #FAFAFA 45%, #E8E8EC 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            filter:
              "drop-shadow(0 1px 0 rgba(255,255,255,0.12)) drop-shadow(0 -1px 0 rgba(0,0,0,0.6))",
          }}
        >
          Cyath
        </span>
      </div>
    </div>
  );
};

export const MilestoneDial = CyathLogo;
