"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { TesseractMark } from "@/components/common/Logo";

export default function ReviewError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Cyath review stage error caught by error boundary:", error);
  }, [error]);

  const handleHardReset = () => {
    try {
      if (typeof window !== "undefined") {
        // Sanitize or reset local staging store to eliminate corrupted state
        localStorage.removeItem("cyath_staging_store");
      }
    } catch {}
    reset();
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] flex flex-col items-center justify-center p-6 text-center text-white selection:bg-white selection:text-black font-sans">
      <div className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 shadow-2xl relative">
        <div className="flex justify-center mb-6">
          <TesseractMark size={36} />
        </div>

        <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 block mb-2">
          Viewport Recovery Protocol
        </span>
        <h1 className="text-xl font-serif font-medium text-white mb-2">
          Staging Session Interrupted
        </h1>
        <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
          The canvas state encountered an unexpected rendering condition. Clear the local cache to re-sync this staging session directly from the cloud.
        </p>

        <div className="space-y-3">
          <button
            onClick={handleHardReset}
            className="w-full py-2.5 bg-white hover:bg-zinc-200 text-black font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Cache & Reload Session</span>
          </button>

          <Link
            href="/dashboard"
            className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white text-xs font-mono rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Studio Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

