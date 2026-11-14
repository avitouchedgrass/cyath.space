"use client";

import React from "react";

interface StarBorderProps {
  as?: React.ElementType;
  className?: string;
  color?: string;
  speed?: string;
  children: React.ReactNode;
  id?: string;
}

export function StarBorder({
  as: Component = "div",
  className = "",
  color = "#ffffff",
  speed = "5s",
  children,
  id,
  ...rest
}: StarBorderProps) {
  return (
    <Component
      id={id}
      className={`relative inline-block p-[1.5px] overflow-hidden rounded-2xl w-full ${className}`}
      {...rest}
    >
      <div
        className="absolute w-[300%] h-[50%] opacity-75 bottom-[-11px] right-[-250%] rounded-full animate-star-movement-bottom z-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 14%)`,
          animationDuration: speed,
        }}
      />
      <div
        className="absolute w-[300%] h-[50%] opacity-75 top-[-10px] left-[-250%] rounded-full animate-star-movement-top z-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 14%)`,
          animationDuration: speed,
        }}
      />
      <div className="relative z-10 w-full h-full rounded-2xl">
        {children}
      </div>
    </Component>
  );
}

