"use client";

import React from "react";
import Link from "next/link";
import { TesseractMark } from "@/components/common/Logo";

interface FooterProps {
  onOpenGuide?: () => void;
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({ onOpenGuide, className = "" }) => {
  return (
    <footer className={`border-t border-white/[0.08] bg-[#000000] text-zinc-400 font-sans ${className}`}>
      <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        {/* Brand & Mission */}
        <div className="space-y-2 max-w-sm">
          <Link href="/dashboard" prefetch={true} className="flex items-center gap-2.5 group">
            <TesseractMark size={20} className="text-white group-hover:scale-105 transition-transform" />
            <span className="font-serif tracking-tight text-white font-medium text-lg">cyath</span>
          </Link>
          <p className="text-xs text-zinc-400 leading-relaxed font-sans">
            High-precision visual client feedback and autonomous code patch coordination for modern software teams.
          </p>
        </div>

        {/* Links Column */}
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-xs font-mono">
          <Link href="/dashboard" prefetch={true} className="text-zinc-400 hover:text-white transition-colors">
            Dashboard
          </Link>
          <Link href="/pro" prefetch={true} className="text-zinc-400 hover:text-white transition-colors">
            Pro Plan
          </Link>
          <Link href="/settings" prefetch={true} className="text-zinc-400 hover:text-white transition-colors">
            Settings
          </Link>
          {onOpenGuide ? (
            <button
              onClick={onOpenGuide}
              className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              Guide
            </button>
          ) : (
            <Link href="/settings?tab=mcp" prefetch={true} className="text-zinc-400 hover:text-white transition-colors">
              MCP Documentation
            </Link>
          )}
        </div>

        {/* Operational System Status & Year */}
        <div className="space-y-1 text-left md:text-right font-mono text-[11px] text-zinc-400">
          <div className="flex items-center md:justify-end gap-2 text-zinc-300">
            <span>Edge Infrastructure Operational</span>
          </div>
          <p className="text-zinc-500">© 2026 Cyath. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
