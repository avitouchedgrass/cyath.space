"use client";

import React, { useState } from "react";
import { X, Check, ArrowRight, ShieldCheck, Sparkles as SparklesIcon, Layers } from "lucide-react";
import { TesseractMark } from "@/components/common/Logo";

interface StudioUpgradeModalProps {
  onClose: () => void;
}

export const StudioUpgradeModal: React.FC<StudioUpgradeModalProps> = ({ onClose }) => {
  const [billingCycle, setBillingCycle] = useState<"annual" | "monthly">("annual");
  const [isSuccess, setIsSuccess] = useState(false);

  const price = billingCycle === "annual" ? "12" : "15";

  const handleUpgrade = () => {
    setIsSuccess(true);
    setTimeout(() => {
      onClose();
    }, 2400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-150 selection:bg-white selection:text-black font-sans">
      <div className="w-full max-w-3xl bg-[#0a0a0d] border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col relative text-white">
        {/* Top Hairline Header */}
        <div className="h-12 border-b border-white/[0.08] px-5 flex items-center justify-between select-none bg-black">
          <div className="flex items-center gap-2">
            <TesseractMark size={18} className="text-white shrink-0" />
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
          <div className="md:col-span-5 p-6 sm:p-8 bg-[#060608] border-b md:border-b-0 md:border-r border-white/[0.08] flex flex-col justify-between space-y-6 relative">
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
            <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] space-y-2.5 relative z-10">
              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                <span>SPECIFICATION</span>
                <span className="text-white">UNLIMITED</span>
              </div>
              <div className="text-xs font-serif text-zinc-200">
                &ldquo;Clients don&rsquo;t just approve faster &mdash; they treat our studio with an entirely different level of authority.&rdquo;
              </div>
              <div className="text-[10px] font-mono text-zinc-500">
                &mdash; Principal Architect, Atelier Nord
              </div>
            </div>

            <div className="text-[10px] font-mono text-zinc-600">
              IMMUTABLE REVIEW CADENCE · 2026 EDITION
            </div>
          </div>

          {/* Right Column: Interactive Pricing & Specification */}
          <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6 bg-[#0a0a0d]">
            <div className="space-y-6">
              {/* Billing Cycle Capsule Switcher */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                  Membership Tier
                </span>

                <div className="flex items-center gap-1 p-1 rounded-full border border-white/10 bg-white/[0.04] text-xs font-mono">
                  <button
                    onClick={() => setBillingCycle("annual")}
                    className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                      billingCycle === "annual"
                        ? "bg-white text-black font-semibold shadow-sm"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Annual <span className="text-[10px] opacity-75">(-25%)</span>
                  </button>
                  <button
                    onClick={() => setBillingCycle("monthly")}
                    className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                      billingCycle === "monthly"
                        ? "bg-white text-black font-semibold shadow-sm"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Monthly
                  </button>
                </div>
              </div>

              {/* Price Display */}
              <div className="pb-4 border-b border-white/[0.08]">
                <div className="flex items-baseline gap-2">
                  <span className="font-serif text-4xl sm:text-5xl font-normal text-white">
                    ${price}
                  </span>
                  <div className="text-xs font-mono text-zinc-400">
                    <span>/ seat / month</span>
                    <p className="text-[10px] text-zinc-500">
                      {billingCycle === "annual" ? "Billed annually ($144/yr)" : "Billed monthly · cancel anytime"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature Specifications */}
              <div className="space-y-3.5">
                <div className="flex items-start gap-3">
                  <div className="w-4 h-4 rounded-full border border-white/20 bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-2.5 h-2.5 text-white stroke-[2.5]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-sans font-medium text-white">
                      Unlimited Review Canvases
                    </h4>
                    <p className="text-[11px] font-sans text-zinc-400 leading-normal">
                      Deploy unlimited live site URLs, staging domains, and high-res PDFs with zero storage caps.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-4 h-4 rounded-full border border-white/20 bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-2.5 h-2.5 text-white stroke-[2.5]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-sans font-medium text-white">
                      Device-Isolated Viewports
                    </h4>
                    <p className="text-[11px] font-sans text-zinc-400 leading-normal">
                      Separate desktop (1440px), tablet (768px), and mobile (375px) feedback so responsive notes never conflict.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-4 h-4 rounded-full border border-white/20 bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-2.5 h-2.5 text-white stroke-[2.5]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-sans font-medium text-white">
                      Client Milestone Approval Seals
                    </h4>
                    <p className="text-[11px] font-sans text-zinc-400 leading-normal">
                      One-click digital milestone sign-off that locks project scope and captures authorized client signatures.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-4 h-4 rounded-full border border-white/20 bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-2.5 h-2.5 text-white stroke-[2.5]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-sans font-medium text-white">
                      Direct Issue Sync & Export
                    </h4>
                    <p className="text-[11px] font-sans text-zinc-400 leading-normal">
                      Instant Markdown export with full hardware telemetry for Linear, GitHub Issues, and Notion.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Area */}
            <div className="pt-4 border-t border-white/[0.08] space-y-2.5">
              {isSuccess ? (
                <div className="py-3 px-4 rounded-xl bg-white text-black text-xs font-mono font-semibold flex items-center justify-center gap-2 animate-in zoom-in-95 duration-150">
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>STUDIO PRO ACTIVATED · WELCOME</span>
                </div>
              ) : (
                <button
                  onClick={handleUpgrade}
                  className="w-full py-3 px-4 bg-white hover:bg-zinc-200 text-black font-sans font-semibold text-xs tracking-tight rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  <span>Activate Studio Pro (${price}/mo)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
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
