"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { RefreshCw, ArrowLeft } from "lucide-react";
import { TesseractMark } from "@/components/common/Logo";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Cyath root global error caught:", error);
  }, [error]);

  const handleHardReset = () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("cyath_staging_store");
      }
    } catch {}
    reset();
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#000000] text-white selection:bg-white selection:text-black flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-full max-w-md bg-[#0a0a0d] border border-white/10 rounded-2xl p-8 shadow-2xl relative">
          <div className="flex justify-center mb-6">
            <TesseractMark size={36} />
          </div>

          <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 block mb-2">
            System Level Fault Recovery
          </span>
          <h1 className="text-xl font-serif font-medium text-white mb-2">
            Staging Session Suspended
          </h1>
          <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
            A state discrepancy occurred during session bootstrap. Reset the local cache to re-sync this workspace.
          </p>

          <div className="space-y-3">
            <button
              onClick={handleHardReset}
              className="w-full py-2.5 bg-white hover:bg-zinc-200 text-black font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Cache & Reload Session</span>
            </button>

            <Link
              href="/dashboard"
              className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white text-xs font-mono rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Studio Dashboard</span>
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
