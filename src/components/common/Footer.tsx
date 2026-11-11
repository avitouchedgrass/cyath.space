"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { TesseractMark } from "@/components/common/Logo";

interface FooterProps {
  onOpenGuide?: () => void;
  className?: string;
  theme?: "night" | "day";
}

export const Footer: React.FC<FooterProps> = ({ onOpenGuide, className = "", theme: propTheme }) => {
  const [currentTheme, setCurrentTheme] = useState<"night" | "day">(propTheme || "night");

  useEffect(() => {
    if (propTheme) {
      setCurrentTheme(propTheme);
      return;
    }
    const updateTheme = () => {
      const docTheme = document.documentElement.getAttribute("data-theme") as "night" | "day";
      if (docTheme) {
        setCurrentTheme(docTheme);
      } else {
        const stored = localStorage.getItem("cyath_theme") as "night" | "day";
        if (stored) setCurrentTheme(stored);
      }
    };
    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, [propTheme]);

  const isDay = currentTheme === "day";

  return (
    <footer
      className={`border-t font-sans transition-colors duration-300 ${
        isDay
          ? "border-stone-200/90 bg-[#FBF9F4] text-stone-600"
          : "border-white/[0.08] bg-[#000000] text-zinc-400"
      } ${className}`}
    >
      <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        {/* Brand & Mission */}
        <div className="space-y-2 max-w-sm">
          <Link href="/dashboard" prefetch={true} className="flex items-center gap-2.5 group">
            <TesseractMark
              size={20}
              className={`transition-transform group-hover:scale-105 ${
                isDay ? "text-stone-900" : "text-white"
              }`}
            />
            <span
              className={`font-serif tracking-tight font-medium text-lg ${
                isDay ? "text-stone-900" : "text-white"
              }`}
            >
              cyath
            </span>
          </Link>
          <p className={`text-xs leading-relaxed font-sans ${isDay ? "text-stone-500" : "text-zinc-400"}`}>
            High-precision visual client feedback and autonomous code patch coordination for modern software teams.
          </p>
        </div>

        {/* Links Column */}
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-xs font-mono">
          <Link
            href="/dashboard"
            prefetch={true}
            className={`transition-colors ${isDay ? "text-stone-600 hover:text-stone-950" : "text-zinc-400 hover:text-white"}`}
          >
            Dashboard
          </Link>
          <Link
            href="/pro"
            prefetch={true}
            className={`transition-colors ${isDay ? "text-stone-600 hover:text-stone-950" : "text-zinc-400 hover:text-white"}`}
          >
            Pro Plan
          </Link>
          <Link
            href="/settings"
            prefetch={true}
            className={`transition-colors ${isDay ? "text-stone-600 hover:text-stone-950" : "text-zinc-400 hover:text-white"}`}
          >
            Settings
          </Link>
          {onOpenGuide ? (
            <button
              onClick={onOpenGuide}
              className={`transition-colors cursor-pointer ${isDay ? "text-stone-600 hover:text-stone-950" : "text-zinc-400 hover:text-white"}`}
            >
              Guide
            </button>
          ) : (
            <Link
              href="/settings?tab=mcp"
              prefetch={true}
              className={`transition-colors ${isDay ? "text-stone-600 hover:text-stone-950" : "text-zinc-400 hover:text-white"}`}
            >
              MCP Documentation
            </Link>
          )}
        </div>

        {/* Operational System Status & Year */}
        <div className="space-y-1 text-left md:text-right font-mono text-[11px]">
          <div className={`flex items-center md:justify-end gap-2 ${isDay ? "text-stone-700" : "text-zinc-300"}`}>
            <span>Edge Infrastructure Operational</span>
          </div>
          <p className={isDay ? "text-stone-400" : "text-zinc-500"}>© 2026 Cyath. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
