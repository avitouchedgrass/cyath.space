"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TesseractMark } from "@/components/common/Logo";

export default function NotFound() {
  const [theme, setTheme] = useState<"night" | "day">("night");

  useEffect(() => {
    const saved = localStorage.getItem("cyath_theme") as "night" | "day";
    if (saved === "day" || saved === "night") {
      setTheme(saved);
      document.documentElement.setAttribute("data-theme", saved);
    }
  }, []);

  const isDay = theme === "day";

  return (
    <main
      className={`relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-center p-6 select-none transition-colors duration-200 ${
        isDay ? "bg-[#FBF9F4] text-[#1C1917]" : "bg-[#000000] text-white"
      }`}
    >
      {/* Background Rotating Dither Receipt Paper */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <div
          className={`relative w-[340px] sm:w-[420px] aspect-[1/1.4] rounded-2xl border p-8 flex flex-col justify-between font-mono text-[11px] shadow-2xl opacity-20 sm:opacity-25 transition-transform duration-1000 animate-[spin_60s_linear_infinite] ${
            isDay
              ? "bg-[#F4EFE6] border-stone-400 text-stone-800 [background-image:radial-gradient(#78716c_0.75px,transparent_0.75px)] [background-size:6px_6px]"
              : "bg-[#0e0e12] border-white/25 text-zinc-300 [background-image:radial-gradient(#ffffff_0.75px,transparent_0.75px)] [background-size:6px_6px]"
          }`}
        >
          {/* Receipt Top Header */}
          <div className="border-b border-dashed border-current pb-4 text-center space-y-1">
            <p className="tracking-widest uppercase font-bold text-xs">CYATH STAGING DEED</p>
            <p className="opacity-75">ID: REC-404-NULL-VOID</p>
            <p className="opacity-75">TIMESTAMP: 2026-11-13</p>
          </div>

          {/* Receipt Items */}
          <div className="space-y-3 py-6 border-b border-dashed border-current">
            <div className="flex justify-between">
              <span>TARGET ROUTE</span>
              <span>UNRESOLVED</span>
            </div>
            <div className="flex justify-between">
              <span>COORDINATE [X, Y]</span>
              <span>[00.0%, 00.0%]</span>
            </div>
            <div className="flex justify-between">
              <span>ACTIVE PINS</span>
              <span>0 OF 0</span>
            </div>
            <div className="flex justify-between font-bold pt-2 border-t border-dotted border-current">
              <span>HTTP STATUS</span>
              <span>404 NOT FOUND</span>
            </div>
          </div>

          {/* Huge Question Mark Over Receipt */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className={`font-serif text-[180px] sm:text-[240px] font-bold leading-none select-none opacity-90 ${
                isDay ? "text-stone-900/40" : "text-white/30"
              }`}
            >
              ?
            </span>
          </div>

          {/* Receipt Jagged / Barcode Bottom */}
          <div className="pt-4 flex flex-col items-center gap-1.5 opacity-80">
            <div className="h-6 w-full flex items-center justify-center gap-[2px]">
              {Array.from({ length: 38 }).map((_, i) => (
                <span
                  key={i}
                  className="h-full bg-current"
                  style={{ width: `${(i % 3) + 1}px` }}
                />
              ))}
            </div>
            <span className="text-[9px] tracking-widest">CYATH-404-LOST-COORDINATE</span>
          </div>
        </div>
      </div>

      {/* Foreground 404 Overlay Content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-md mx-auto space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <TesseractMark size={24} className={isDay ? "text-stone-900" : "text-white"} />
          <span className="font-serif tracking-tight font-medium text-xl">cyath</span>
        </div>

        <div className="space-y-2">
          <h1 className="font-mono text-5xl sm:text-7xl font-bold tracking-tight">
            404
          </h1>
          <h2 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight">
            This canvas does not exist.
          </h2>
          <p className={`text-xs sm:text-sm font-sans max-w-sm mx-auto leading-relaxed ${
            isDay ? "text-stone-600" : "text-zinc-400"
          }`}>
            The route has wandered off or the staging session deed was never issued.
          </p>
        </div>

        <Link
          href="/dashboard"
          prefetch={true}
          className={`px-6 py-3 rounded-full text-xs font-mono font-semibold tracking-wide transition-all shadow-xl hover:scale-105 flex items-center gap-2 cursor-pointer ${
            isDay
              ? "bg-stone-900 text-white hover:bg-stone-800"
              : "bg-white text-black hover:bg-zinc-200"
          }`}
        >
          <span>Return to Dashboard</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </main>
  );
}

