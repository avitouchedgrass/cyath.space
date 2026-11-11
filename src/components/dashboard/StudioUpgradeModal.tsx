"use client";

import React, { useState } from "react";
import { X, Check, ArrowRight, Terminal, Layers, ShieldCheck, Maximize2, Zap } from "lucide-react";
import { TesseractMark } from "@/components/common/Logo";
import { useReviewStore } from "@/store/useReviewStore";

interface StudioUpgradeModalProps {
  onClose: () => void;
}

export const StudioUpgradeModal: React.FC<StudioUpgradeModalProps> = ({ onClose }) => {
  const { activatePro } = useReviewStore();
  const [billingCycle, setBillingCycle] = useState<"annual" | "monthly">("annual");
  const [isSuccess, setIsSuccess] = useState(false);

  const price = billingCycle === "annual" ? "12" : "15";

  const handleUpgrade = () => {
    setIsSuccess(true);
    activatePro();
    setTimeout(() => {
      onClose();
    }, 2200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-200 selection:bg-white selection:text-black font-sans">
      <div className="w-full max-w-4xl bg-[#050507] border border-white/20 rounded-2xl shadow-[0_25px_90px_rgba(0,0,0,0.95),0_0_50px_rgba(255,255,255,0.08)] overflow-hidden flex flex-col relative text-white animate-in zoom-in-[0.98] duration-200">
        
        {/* Top Architectural Header Bar */}
        <div className="h-12 border-b border-white/15 px-6 flex items-center justify-between select-none bg-black">
          <div className="flex items-center gap-2.5">
            <TesseractMark size={18} className="text-white shrink-0" />
            <span className="font-mono text-[10px] tracking-widest text-zinc-300 uppercase">
              CYATH STUDIO SPECIFICATION // PRO TIER
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2-Column Monograph Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* Left Column: Live MCP Pipeline Terminal & Studio Prestige */}
          <div className="lg:col-span-5 p-6 sm:p-8 bg-[#09090c] border-b lg:border-b-0 lg:border-r border-white/15 flex flex-col justify-between space-y-6 relative overflow-hidden">
            <div className="space-y-3 relative z-10">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-white/20 bg-white/5 font-mono text-[10px] text-zinc-300">
                <Zap className="w-3 h-3 text-white" />
                <span>AUTONOMOUS CODING WORKFLOW</span>
              </div>

              <h3 className="font-serif text-2xl sm:text-3xl font-normal text-white leading-tight">
                Your AI agent fixes client notes <span className="italic">automatically</span>.
              </h3>

              <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                Connect Cursor, Claude Code, and Antigravity directly to your staging canvas via our native Model Context Protocol (MCP) server.
              </p>
            </div>

            {/* Interactive Hardware Terminal Emulation */}
            <div className="rounded-xl border border-white/15 bg-black/80 p-3.5 space-y-2 relative font-mono text-[11px] shadow-inner select-none">
              <div className="flex items-center justify-between pb-2 border-b border-white/10 text-[10px] text-zinc-500">
                <span className="flex items-center gap-1.5 text-zinc-300">
                  <Terminal className="w-3 h-3 text-white" />
                  cursor-agent --cyath-mcp
                </span>
                <span className="text-white font-semibold">LIVE PIPELINE</span>
              </div>

              <div className="space-y-1.5 text-zinc-400 pt-1 leading-relaxed">
                <div className="text-zinc-500">$ agent inspect --canvas jjhe58ep</div>
                <div className="text-zinc-300">✓ Found Pin #1: &quot;Fix mobile button alignment&quot;</div>
                <div className="text-zinc-500">↳ Viewport: 375×812 (iOS Safari)</div>
                <div className="text-zinc-300">✓ Rewrote Tailwind classes at Hero.tsx:42</div>
                <div className="text-white flex items-center gap-1 font-semibold">
                  <span>✓ cyath_resolve_pin(&quot;1&quot;)</span>
                  <span className="text-zinc-400 font-normal">→ Client Notified</span>
                </div>
              </div>
            </div>

            <div className="pt-2 text-[10px] font-mono text-zinc-500 flex items-center justify-between">
              <span>ZERO MANUAL linear COPY-PASTE</span>
              <span className="text-zinc-300">2026 EDITION</span>
            </div>
          </div>

          {/* Right Column: Pricing Tiers & Specification Matrix */}
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6 bg-[#050507] relative">
            <div className="space-y-5">
              
              {/* Billing Switcher */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-zinc-300 uppercase tracking-wider">
                  Membership Term
                </span>

                <div className="flex items-center p-1 rounded-full border border-white/20 bg-white/[0.04] text-xs font-mono">
                  <button
                    onClick={() => setBillingCycle("annual")}
                    className={`px-3.5 py-1 rounded-full transition-all duration-200 cursor-pointer ${
                      billingCycle === "annual"
                        ? "bg-white text-black font-semibold shadow-sm"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Annual <span className="text-[10px] opacity-75 font-mono">(-20%)</span>
                  </button>

                  <button
                    onClick={() => setBillingCycle("monthly")}
                    className={`px-3.5 py-1 rounded-full transition-all duration-200 cursor-pointer ${
                      billingCycle === "monthly"
                        ? "bg-white text-black font-semibold shadow-sm"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Monthly
                  </button>
                </div>
              </div>

              {/* Price Hero Display */}
              <div className="pb-4 border-b border-white/15">
                <div className="flex items-baseline gap-2">
                  <span className="font-serif text-5xl font-normal text-white">
                    ${price}
                  </span>
                  <div className="text-xs font-mono text-zinc-400">
                    <span className="text-zinc-200">/ seat / month</span>
                    <p className="text-[10px] text-zinc-500">
                      {billingCycle === "annual" ? "Billed annually ($144/yr)" : "Billed monthly · cancel anytime"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature Specifications */}
              <div className="space-y-3 font-sans">
                <div className="flex items-start gap-3 p-2 -mx-2 rounded-xl hover:bg-white/[0.04] transition-colors">
                  <div className="w-5 h-5 rounded-full border border-white/30 bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Terminal className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">
                      Full Model Context Protocol (MCP) Server Key
                    </h4>
                    <p className="text-[11px] text-zinc-400 leading-normal">
                      Allows Cursor, Claude Code, and Antigravity to autonomously fetch pins, inspect telemetry, and resolve issues directly in code.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2 -mx-2 rounded-xl hover:bg-white/[0.04] transition-colors">
                  <div className="w-5 h-5 rounded-full border border-white/30 bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Layers className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">
                      Unlimited Client Review Canvases
                    </h4>
                    <p className="text-[11px] text-zinc-400 leading-normal">
                      Deploy unlimited staging URLs, live websites, Figma prototypes, and multi-page PDFs with zero storage caps.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2 -mx-2 rounded-xl hover:bg-white/[0.04] transition-colors">
                  <div className="w-5 h-5 rounded-full border border-white/30 bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Maximize2 className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">
                      Full Page & Breakpoint Viewports
                    </h4>
                    <p className="text-[11px] text-zinc-400 leading-normal">
                      Isolate client feedback across Full Width (100%), Desktop (1440px), Tablet (768px), and Mobile (375px).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2 -mx-2 rounded-xl hover:bg-white/[0.04] transition-colors">
                  <div className="w-5 h-5 rounded-full border border-white/30 bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">
                      Client Milestone Approval Seals
                    </h4>
                    <p className="text-[11px] font-sans text-zinc-400 leading-normal">
                      Formal milestone acceptance deeds that lock scope, capture digital signatures, and prevent scope creep.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-4 border-t border-white/15 space-y-2.5">
              {isSuccess ? (
                <div className="py-3.5 px-4 rounded-xl bg-white text-black text-xs font-mono font-semibold flex items-center justify-center gap-2 animate-in zoom-in-95 duration-200 shadow-xl">
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>STUDIO PRO ACTIVATED · ALL PERKS UNLOCKED</span>
                </div>
              ) : (
                <button
                  onClick={handleUpgrade}
                  className="w-full py-3.5 px-5 bg-white hover:bg-zinc-200 text-black font-semibold text-xs tracking-tight rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                >
                  <span>Activate Studio Pro (${price}/mo)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 px-1">
                <span>Cancel Anytime · No Long-Term Lock-in</span>
                <span>Immediate Pro Keycard Issued</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
