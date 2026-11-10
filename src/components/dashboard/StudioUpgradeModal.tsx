"use client";

import React from "react";
import { X, ArrowUpRight, Check } from "lucide-react";
import { TesseractMark } from "@/components/common/Logo";

interface StudioUpgradeModalProps {
  onClose: () => void;
}

export const StudioUpgradeModal: React.FC<StudioUpgradeModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150 selection:bg-white selection:text-black">
      <div className="w-full max-w-md bg-[#09090c] border border-white/15 rounded-2xl shadow-2xl p-6 text-white relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
            <TesseractMark size={20} />
          </div>
          <div>
            <h3 className="font-serif text-xl font-normal text-white">Cyath Pro</h3>
            <p className="text-xs text-zinc-400 font-sans">For designers, agencies, and studios.</p>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] mb-5">
          <div className="flex items-baseline gap-1.5 mb-1">
            <span className="font-serif text-3xl font-normal text-white">$15</span>
            <span className="text-xs text-zinc-400 font-sans">/ month</span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed font-sans">
            Unlimited client review canvases with instant visual markup and sign-off.
          </p>
        </div>

        <ul className="space-y-2.5 mb-6 text-xs text-zinc-300 font-sans">
          <li className="flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-white shrink-0" />
            <span>Unlimited review canvases (Websites, PDFs, Images)</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-white shrink-0" />
            <span>Isolated desktop, tablet, and mobile feedback</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-white shrink-0" />
            <span>One-click client milestone approval</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-white shrink-0" />
            <span>Export notes to Markdown, Linear, or GitHub</span>
          </li>
        </ul>

        <button
          onClick={() => {
            alert("Cyath Pro billing is opening soon. Your account is on the priority list!");
            onClose();
          }}
          className="w-full py-2.5 bg-white hover:bg-zinc-200 text-black font-sans font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
        >
          <span>Upgrade to Pro ($15/mo)</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
