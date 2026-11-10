"use client";

import React from "react";
import { X, ArrowUpRight } from "lucide-react";
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
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
            <TesseractMark size={22} />
          </div>
          <div>
            <h3 className="font-serif text-lg font-medium text-white tracking-wide">Cyath Studio License</h3>
            <p className="text-xs text-zinc-400 font-mono tracking-wider">ARCHIVAL STUDIO EDITION</p>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] mb-5">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="font-serif text-3xl font-normal tracking-tight text-white">$15</span>
            <span className="text-xs text-zinc-400 font-mono">/ seat / month · $12 billed annually</span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed font-sans">
            Eliminate client email chaos across every project and client contract with unlimited review staging viewports.
          </p>
        </div>

        <ul className="space-y-2.5 mb-6 text-xs text-zinc-300 font-mono">
          <li className="flex items-center gap-2">
            <span className="text-zinc-500 font-mono">[+]</span>
            <span>Unlimited review canvases (Websites, PDFs, Images)</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-zinc-500 font-mono">[+]</span>
            <span>Device-isolated responsive feedback viewports</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-zinc-500 font-mono">[+]</span>
            <span>Cryptographic client approval milestone seals</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-zinc-500 font-mono">[+]</span>
            <span>Automated Linear / GitHub markdown export</span>
          </li>
        </ul>

        <button
          onClick={() => {
            alert("Studio Pro billing is launching soon. Your account has been prioritized for early access!");
            onClose();
          }}
          className="w-full py-2.5 bg-white hover:bg-zinc-200 text-black font-mono font-medium text-xs tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
        >
          <span>ACTIVATE STUDIO PRO ($15/MO)</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

