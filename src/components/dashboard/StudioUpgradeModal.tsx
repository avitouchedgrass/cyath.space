"use client";

import React, { useState } from "react";
import { X, Check, ArrowRight, Terminal, Layers, ShieldCheck, Maximize2 } from "lucide-react";
import { TesseractMark } from "@/components/common/Logo";
import { useReviewStore } from "@/store/useReviewStore";

interface StudioUpgradeModalProps {
  onClose: () => void;
  theme?: "night" | "day";
}

export const StudioUpgradeModal: React.FC<StudioUpgradeModalProps> = ({ onClose, theme = "night" }) => {
  const { activatePro } = useReviewStore();
  const [billingCycle, setBillingCycle] = useState<"annual" | "monthly">("annual");
  const [isSuccess, setIsSuccess] = useState(false);

  const isDay = theme === "day";
  const price = billingCycle === "annual" ? "19" : "24";

  const handleUpgrade = () => {
    setIsSuccess(true);
    activatePro();
    setTimeout(() => {
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-2xl animate-in fade-in duration-200 selection:bg-white selection:text-black font-sans">
      <div
        className={`w-full max-w-4xl rounded-2xl overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200 shadow-2xl border transition-all ${
          isDay
            ? "bg-white border-stone-200 text-stone-900 shadow-[0_25px_90px_rgba(0,0,0,0.15)]"
            : "bg-[#070709] border-white/20 text-white shadow-[0_25px_90px_rgba(0,0,0,0.95)]"
        }`}
      >
        {/* Top Header Bar */}
        <div
          className={`h-14 px-6 flex items-center justify-between select-none border-b ${
            isDay ? "bg-[#FBF9F4] border-stone-200" : "bg-black border-white/10"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <TesseractMark size={20} className={`shrink-0 ${isDay ? "text-stone-900" : "text-white"}`} />
            <span className={`font-serif text-base font-medium ${isDay ? "text-stone-900" : "text-white"}`}>
              Upgrade to Cyath Pro
            </span>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDay ? "text-stone-400 hover:text-stone-900 hover:bg-stone-100" : "text-zinc-400 hover:text-white hover:bg-white/10"
            }`}
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2-Column Monograph Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Left Column: Live MCP Pipeline Terminal */}
          <div
            className={`lg:col-span-5 p-6 sm:p-8 border-b lg:border-b-0 lg:border-r flex flex-col justify-between space-y-6 relative overflow-hidden ${
              isDay ? "bg-stone-50/80 border-stone-200" : "bg-[#09090c] border-white/10"
            }`}
          >
            <div className="space-y-3 relative z-10">
              <h3 className={`font-serif text-2xl sm:text-3xl font-normal leading-tight ${isDay ? "text-stone-900" : "text-white"}`}>
                Your AI agent fixes client notes <span className="italic">automatically</span>.
              </h3>

              <p className={`text-xs font-sans leading-relaxed ${isDay ? "text-stone-600" : "text-zinc-300"}`}>
                Connect Cursor, Claude Code, and Antigravity directly to your projects via our native Model Context Protocol (MCP) server.
              </p>
            </div>

            {/* Interactive Terminal Emulation */}
            <div className="rounded-xl border border-stone-800 bg-[#121215] p-3.5 space-y-2 relative font-mono text-[11px] shadow-inner select-none text-zinc-300">
              <div className="flex items-center justify-between pb-2 border-b border-white/10 text-[10px] text-zinc-400">
                <span className="flex items-center gap-1.5 text-zinc-300">
                  <Terminal className="w-3 h-3 text-white" />
                  cursor-agent --cyath-mcp
                </span>
                <span className="text-zinc-400">Connected</span>
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

            <div className={`pt-2 text-xs font-mono flex items-center justify-between ${isDay ? "text-stone-500" : "text-zinc-400"}`}>
              <span>Zero manual copy-pasting</span>
              <span className={isDay ? "text-stone-700" : "text-zinc-300"}>Works with all agents</span>
            </div>
          </div>

          {/* Right Column: Pricing & Specifications */}
          <div className={`lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6 relative ${isDay ? "bg-white" : "bg-[#050507]"}`}>
            <div className="space-y-5">
              {/* Billing Switcher */}
              <div className="flex items-center justify-between">
                <span className={`text-xs font-mono ${isDay ? "text-stone-600" : "text-zinc-300"}`}>
                  Billing Frequency
                </span>

                <div
                  className={`flex items-center p-1 rounded-full border text-xs font-mono ${
                    isDay ? "border-stone-200 bg-stone-100" : "border-white/20 bg-white/[0.04]"
                  }`}
                >
                  <button
                    onClick={() => setBillingCycle("annual")}
                    className={`px-3.5 py-1 rounded-full transition-all duration-200 cursor-pointer ${
                      billingCycle === "annual"
                        ? isDay
                          ? "bg-stone-900 text-white font-semibold shadow-sm"
                          : "bg-white text-black font-semibold shadow-sm"
                        : isDay
                        ? "text-stone-600 hover:text-stone-900"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Annual <span className="text-[10px] opacity-75 font-mono">(-20%)</span>
                  </button>

                  <button
                    onClick={() => setBillingCycle("monthly")}
                    className={`px-3.5 py-1 rounded-full transition-all duration-200 cursor-pointer ${
                      billingCycle === "monthly"
                        ? isDay
                          ? "bg-stone-900 text-white font-semibold shadow-sm"
                          : "bg-white text-black font-semibold shadow-sm"
                        : isDay
                        ? "text-stone-600 hover:text-stone-900"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Monthly
                  </button>
                </div>
              </div>

              {/* Price Hero Display */}
              <div className={`pb-4 border-b ${isDay ? "border-stone-200" : "border-white/10"}`}>
                <div className="flex items-baseline gap-2">
                  <span className={`font-serif text-5xl font-normal ${isDay ? "text-stone-900" : "text-white"}`}>
                    ${price}
                  </span>
                  <div className={`text-xs font-mono ${isDay ? "text-stone-500" : "text-zinc-400"}`}>
                    <span className={isDay ? "text-stone-800" : "text-zinc-200"}>/ seat / month</span>
                    <p className={`text-[11px] mt-0.5 ${isDay ? "text-stone-500" : "text-zinc-400"}`}>
                      {billingCycle === "annual" ? "Billed annually ($144/yr)" : "Billed monthly · cancel anytime"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature Specifications */}
              <div className="space-y-3 font-sans">
                <div className={`flex items-start gap-3 p-2 -mx-2 rounded-xl transition-colors ${isDay ? "hover:bg-stone-50" : "hover:bg-white/[0.04]"}`}>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                      isDay ? "border-stone-300 bg-stone-100 text-stone-900" : "border-white/30 bg-white/10 text-white"
                    }`}
                  >
                    <Terminal className="w-3 h-3" />
                  </div>
                  <div>
                    <h4 className={`text-xs font-semibold ${isDay ? "text-stone-900" : "text-white"}`}>
                      Full Model Context Protocol (MCP) Server Key
                    </h4>
                    <p className={`text-[11px] leading-normal ${isDay ? "text-stone-600" : "text-zinc-400"}`}>
                      Allows Cursor, Claude Code, and Antigravity to autonomously fetch pins, inspect telemetry, and resolve issues directly in code.
                    </p>
                  </div>
                </div>

                <div className={`flex items-start gap-3 p-2 -mx-2 rounded-xl transition-colors ${isDay ? "hover:bg-stone-50" : "hover:bg-white/[0.04]"}`}>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                      isDay ? "border-stone-300 bg-stone-100 text-stone-900" : "border-white/30 bg-white/10 text-white"
                    }`}
                  >
                    <Layers className="w-3 h-3" />
                  </div>
                  <div>
                    <h4 className={`text-xs font-semibold ${isDay ? "text-stone-900" : "text-white"}`}>
                      Unlimited Client Review Canvases
                    </h4>
                    <p className={`text-[11px] leading-normal ${isDay ? "text-stone-600" : "text-zinc-400"}`}>
                      Deploy unlimited staging URLs, live websites, Figma prototypes, and multi-page PDFs with zero storage caps.
                    </p>
                  </div>
                </div>

                <div className={`flex items-start gap-3 p-2 -mx-2 rounded-xl transition-colors ${isDay ? "hover:bg-stone-50" : "hover:bg-white/[0.04]"}`}>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                      isDay ? "border-stone-300 bg-stone-100 text-stone-900" : "border-white/30 bg-white/10 text-white"
                    }`}
                  >
                    <Maximize2 className="w-3 h-3" />
                  </div>
                  <div>
                    <h4 className={`text-xs font-semibold ${isDay ? "text-stone-900" : "text-white"}`}>
                      Full Page & Breakpoint Viewports
                    </h4>
                    <p className={`text-[11px] leading-normal ${isDay ? "text-stone-600" : "text-zinc-400"}`}>
                      Isolate client feedback across Full Width (100%), Desktop (1440px), Tablet (768px), and Mobile (375px).
                    </p>
                  </div>
                </div>

                <div className={`flex items-start gap-3 p-2 -mx-2 rounded-xl transition-colors ${isDay ? "hover:bg-stone-50" : "hover:bg-white/[0.04]"}`}>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                      isDay ? "border-stone-300 bg-stone-100 text-stone-900" : "border-white/30 bg-white/10 text-white"
                    }`}
                  >
                    <ShieldCheck className="w-3 h-3" />
                  </div>
                  <div>
                    <h4 className={`text-xs font-semibold ${isDay ? "text-stone-900" : "text-white"}`}>
                      Client Milestone Approval Seals
                    </h4>
                    <p className={`text-[11px] font-sans leading-normal ${isDay ? "text-stone-600" : "text-zinc-400"}`}>
                      Formal milestone acceptance deeds that lock scope, capture digital signatures, and prevent scope creep.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className={`pt-4 border-t space-y-2.5 ${isDay ? "border-stone-200" : "border-white/10"}`}>
              {isSuccess ? (
                <div
                  className={`py-3.5 px-4 rounded-xl text-xs font-mono font-semibold flex items-center justify-center gap-2 animate-in zoom-in-95 duration-200 shadow-xl ${
                    isDay ? "bg-stone-900 text-white" : "bg-white text-black"
                  }`}
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Cyath Pro Activated</span>
                </div>
              ) : (
                <button
                  onClick={handleUpgrade}
                  className={`w-full py-3.5 px-5 font-semibold text-xs tracking-tight rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg cursor-pointer hover:scale-[1.01] active:scale-[0.99] ${
                    isDay
                      ? "bg-stone-900 hover:bg-stone-800 text-white shadow-stone-900/10"
                      : "bg-white hover:bg-zinc-200 text-black shadow-white/10"
                  }`}
                >
                  <span>Activate Cyath Pro (${price}/mo)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              <div className={`flex items-center justify-between text-[11px] font-mono px-1 ${isDay ? "text-stone-500" : "text-zinc-400"}`}>
                <span>Cancel anytime · No lock-in</span>
                <span>Immediate MCP key generated</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
