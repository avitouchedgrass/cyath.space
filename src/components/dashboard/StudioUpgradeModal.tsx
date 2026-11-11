"use client";

import React, { useState } from "react";
import { X, Check, ArrowRight } from "lucide-react";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200 selection:bg-white selection:text-black font-sans">
      <div className="w-full max-w-3xl bg-[#0a0a0d] border border-white/15 rounded-2xl shadow-[0_20px_80px_rgba(0,0,0,0.9),0_0_40px_rgba(255,255,255,0.06)] overflow-hidden flex flex-col relative text-white animate-in zoom-in-[0.97] fade-in duration-300 ease-out">
        {/* Top Hairline Header */}
        <div className="h-12 border-b border-white/[0.08] px-5 flex items-center justify-between select-none bg-black">
          <div className="flex items-center gap-2 group cursor-default">
            <TesseractMark size={18} className="text-white shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300" />
            <span className="font-mono text-[10px] tracking-widest text-zinc-400 uppercase">
              CYATH ATELIER · ARCHIVAL STUDIO EDITION
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
        <div className="grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          {/* Left Column: Studio Narrative & Visual Artifact */}
          <div className="md:col-span-5 p-6 sm:p-8 bg-[#060608] border-b md:border-b-0 md:border-r border-white/[0.08] flex flex-col justify-between space-y-6 relative overflow-hidden">
            {/* Subtle Drafting Matrix Background */}
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:18px_18px] pointer-events-none opacity-80" />

            <div className="space-y-4 relative z-10">
              <span className="text-[10px] font-mono tracking-widest uppercase text-zinc-500">
                Studio Philosophy
              </span>

              <h3 className="font-serif text-2xl sm:text-3xl font-normal text-white leading-tight">
                Every design reviewed in its <span className="italic font-normal">true element</span>.
              </h3>

              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                Stop chasing client feedback across 15 emails, fragmented Figma comments, and video recordings. One private link unlocks immediate, pin-point clarity for your clients.
              </p>
            </div>

            {/* Visual Artifact: Miniature Certificate Stamp */}
            <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.05] space-y-2.5 relative z-10 transition-all duration-300 group overflow-hidden">
              <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full border border-white/5 pointer-events-none group-hover:scale-125 transition-transform duration-700 ease-out" />
              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                <span className="tracking-wider">SPECIFICATION</span>
                <span className="text-white px-2 py-0.5 rounded-full border border-white/10 bg-white/5 font-semibold group-hover:border-white/30 transition-colors">
                  UNLIMITED
                </span>
              </div>
              <div className="text-xs font-serif text-zinc-200 leading-snug">
                &quot;Clients don&apos;t just approve faster — they treat our studio with an entirely different level of authority.&quot;
              </div>
              <div className="text-[10px] font-mono text-zinc-500">
                — Principal Architect, Atelier Nord
              </div>
            </div>

            <div className="text-[10px] font-mono text-zinc-600 relative z-10">
              IMMUTABLE REVIEW CADENCE · 2026 EDITION
            </div>
          </div>

          {/* Right Column: Interactive Pricing & Specification */}
          <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6 bg-[#0a0a0d] relative">
            <div className="space-y-6">
              {/* Billing Cycle Capsule Switcher with Smooth Sliding Pill */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                  Membership Tier
                </span>

                <div className="relative flex items-center p-1 rounded-full border border-white/10 bg-white/[0.04] text-xs font-mono select-none">
                  {/* Smooth sliding pill indicator */}
                  <div
                    className={`absolute top-1 bottom-1 rounded-full bg-white transition-all duration-300 ease-out shadow-sm ${
                      billingCycle === "annual"
                        ? "left-1 w-[122px]"
                        : "left-[126px] w-[82px]"
                    }`}
                  />

                  <button
                    onClick={() => setBillingCycle("annual")}
                    className={`relative z-10 px-3.5 py-1 rounded-full transition-colors duration-200 cursor-pointer ${
                      billingCycle === "annual" ? "text-black font-semibold" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Annual <span className="text-[10px] opacity-75 font-mono">(-25%)</span>
                  </button>

                  <button
                    onClick={() => setBillingCycle("monthly")}
                    className={`relative z-10 px-3.5 py-1 rounded-full transition-colors duration-200 cursor-pointer ${
                      billingCycle === "monthly" ? "text-black font-semibold" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Monthly
                  </button>
                </div>
              </div>

              {/* Price Display with Animated Morph Counter */}
              <div className="pb-4 border-b border-white/[0.08]">
                <div className="flex items-baseline gap-2">
                  <span
                    key={price}
                    className="font-serif text-4xl sm:text-5xl font-normal text-white inline-block animate-in fade-in slide-in-from-bottom-2 duration-200"
                  >
                    ${price}
                  </span>
                  <div className="text-xs font-mono text-zinc-400">
                    <span>/ seat / month</span>
                    <p className="text-[10px] text-zinc-500 transition-all duration-200">
                      {billingCycle === "annual" ? "Billed annually ($144/yr)" : "Billed monthly · cancel anytime"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature Specifications with Hover Transitions */}
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-2 -mx-2 rounded-xl hover:bg-white/[0.04] hover:translate-x-0.5 transition-all duration-200 group cursor-default">
                  <div className="w-4 h-4 rounded-full border border-white/20 bg-white/5 flex items-center justify-center shrink-0 mt-0.5 group-hover:border-white group-hover:bg-white group-hover:scale-110 transition-all duration-200">
                    <Check className="w-2.5 h-2.5 text-white group-hover:text-black stroke-[2.5] transition-colors" />
                  </div>
                  <div>
                    <h4 className="text-xs font-sans font-medium text-white group-hover:text-white transition-colors">
                      Unlimited Review Canvases
                    </h4>
                    <p className="text-[11px] font-sans text-zinc-400 leading-normal">
                      Deploy unlimited live site URLs, staging domains, and high-res PDFs with zero storage caps.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2 -mx-2 rounded-xl hover:bg-white/[0.04] hover:translate-x-0.5 transition-all duration-200 group cursor-default">
                  <div className="w-4 h-4 rounded-full border border-white/20 bg-white/5 flex items-center justify-center shrink-0 mt-0.5 group-hover:border-white group-hover:bg-white group-hover:scale-110 transition-all duration-200">
                    <Check className="w-2.5 h-2.5 text-white group-hover:text-black stroke-[2.5] transition-colors" />
                  </div>
                  <div>
                    <h4 className="text-xs font-sans font-medium text-white group-hover:text-white transition-colors">
                      Device-Isolated Viewports
                    </h4>
                    <p className="text-[11px] font-sans text-zinc-400 leading-normal">
                      Separate desktop (1440px), tablet (768px), and mobile (375px) feedback so responsive notes never conflict.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2 -mx-2 rounded-xl hover:bg-white/[0.04] hover:translate-x-0.5 transition-all duration-200 group cursor-default">
                  <div className="w-4 h-4 rounded-full border border-white/20 bg-white/5 flex items-center justify-center shrink-0 mt-0.5 group-hover:border-white group-hover:bg-white group-hover:scale-110 transition-all duration-200">
                    <Check className="w-2.5 h-2.5 text-white group-hover:text-black stroke-[2.5] transition-colors" />
                  </div>
                  <div>
                    <h4 className="text-xs font-sans font-medium text-white group-hover:text-white transition-colors">
                      Client Milestone Approval Seals
                    </h4>
                    <p className="text-[11px] font-sans text-zinc-400 leading-normal">
                      One-click digital milestone sign-off that locks project scope and captures authorized client signatures.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2 -mx-2 rounded-xl hover:bg-white/[0.04] hover:translate-x-0.5 transition-all duration-200 group cursor-default">
                  <div className="w-4 h-4 rounded-full border border-white/20 bg-white/5 flex items-center justify-center shrink-0 mt-0.5 group-hover:border-white group-hover:bg-white group-hover:scale-110 transition-all duration-200">
                    <Check className="w-2.5 h-2.5 text-white group-hover:text-black stroke-[2.5] transition-colors" />
                  </div>
                  <div>
                    <h4 className="text-xs font-sans font-medium text-white group-hover:text-white transition-colors">
                      Direct Issue Sync & Export
                    </h4>
                    <p className="text-[11px] font-sans text-zinc-400 leading-normal">
                      Instant Markdown export with full hardware telemetry for Linear, GitHub Issues, and Notion.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Area with Magnetic Pulse Button */}
            <div className="pt-4 border-t border-white/[0.08] space-y-2.5">
              {isSuccess ? (
                <div className="py-3 px-4 rounded-xl bg-white text-black text-xs font-mono font-semibold flex items-center justify-center gap-2 animate-in zoom-in-95 duration-200 shadow-xl">
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>STUDIO PRO ACTIVATED · WELCOME</span>
                </div>
              ) : (
                <button
                  onClick={handleUpgrade}
                  className="group relative overflow-hidden w-full py-3.5 px-5 bg-white hover:bg-zinc-100 text-black font-sans font-semibold text-xs tracking-tight rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(255,255,255,0.18)] hover:shadow-[0_0_35px_rgba(255,255,255,0.35)] hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                >
                  <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full duration-1000 bg-gradient-to-r from-transparent via-black/10 to-transparent transition-transform ease-out pointer-events-none" />
                  <span className="relative z-10">Activate Studio Pro (${price}/mo)</span>
                  <ArrowRight className="relative z-10 w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
                </button>
              )}

              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 px-1">
                <span>Zero Risk · Cancel Anytime</span>
                <span>Instant Canvas Unlock</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
