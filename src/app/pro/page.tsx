"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  Terminal,
  Copy,
  Shield,
  Layers,
  ArrowRight,
  ArrowUpRight,
  Cpu,
} from "lucide-react";
import { useReviewStore } from "@/store/useReviewStore";
import { AppSidebar } from "@/components/common/AppSidebar";
import { Footer } from "@/components/common/Footer";
import { useTheme } from "@/lib/theme";
import { openBilling, reviewErrorMessage, ReviewRequestError } from "@/lib/reviews/client";

export default function ProPricingPage() {
  const router = useRouter();
  const { isPro, refreshPro } = useReviewStore();
  const [billingCycle, setBillingCycle] = useState<"annual" | "monthly">("annual");
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const { theme, isDay } = useTheme();

  const [billingError, setBillingError] = useState("");
  useEffect(() => {
    void refreshPro().catch(error => setBillingError(reviewErrorMessage(error)));
  }, [refreshPro]);

  const handleBilling = async () => {
    setIsActivating(true);
    setBillingError("");
    try {
      await openBilling(isPro ? "manage" : billingCycle);
    } catch (error) {
      if (error instanceof ReviewRequestError && error.status === 401) router.push("/login");
      else setBillingError(reviewErrorMessage(error));
    } finally {
      setIsActivating(false);
    }
  };

  const prompt = "Use Cyath MCP to list open pins with cyath_get_pins, fix and verify the feedback in the repository, then call cyath_resolve_pin with a brief explanation. Set up the server and key from Cyath Settings first.";
  const copyAiPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2500);
    } catch {
      setBillingError("Could not copy the prompt. Select and copy it below.");
    }
  };

  return (
    <div
      className={`min-h-screen font-sans flex flex-col md:flex-row transition-colors duration-200 selection:bg-stone-300 selection:text-black ${isDay ? "bg-[#FBF9F4] text-[#1C1917]" : "bg-[#000000] text-white"
        }`}
    >
      {/* Shared Persistent Left Sidebar */}
      <AppSidebar activeItem="plans" />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto relative page-enter">
        <div className="max-w-4xl w-full mx-auto px-6 pt-10 pb-20 space-y-10 flex-1">
          {/* Header & Bold Claim */}
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              PRO UNLOCKED BY DEFAULT
            </div>
            <h1
              className={`text-3xl sm:text-4xl lg:text-5xl font-serif font-medium tracking-tight leading-[1.15] ${isDay ? "text-stone-950" : "text-white"
                }`}
              style={{ fontFamily: "var(--font-serif, 'Oranienbaum', Georgia, serif)" }}
            >
              100% Free. No paywalls.
            </h1>
            <p className={`text-sm sm:text-base leading-relaxed ${isDay ? "text-stone-600" : "text-zinc-400"}`}>
              Unlike MarkUp.io or Pastel, there are no 5-project caps, no export fees, and no $29/seat monthly subscriptions. Every studio feature is completely unlocked for solo creators, agencies, and students.
            </p>
          </div>

          {/* Pro Capabilities Feature Card */}
          <div
            className={`rounded-2xl border p-8 transition-all relative overflow-hidden shadow-xl ${isDay
              ? "bg-white border-stone-300 text-stone-900 shadow-stone-200/50"
              : "bg-[#0b0c10] border-white/15 text-white shadow-black/80"
              }`}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
              <div className="flex items-start gap-3">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-mono font-semibold">Unlimited Review Canvases</h4>
                  <p className={`text-[11px] mt-0.5 ${isDay ? "text-stone-500" : "text-zinc-400"}`}>
                    Live websites, staging URLs, PDFs, and static design mockups.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-mono font-semibold">Autonomous MCP Pipeline</h4>
                  <p className={`text-[11px] mt-0.5 ${isDay ? "text-stone-500" : "text-zinc-400"}`}>
                    Connect Cursor, Claude Code, and Antigravity agents directly to review pins.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-mono font-semibold">Automated DOM & Screen Telemetry</h4>
                  <p className={`text-[11px] mt-0.5 ${isDay ? "text-stone-500" : "text-zinc-400"}`}>
                    Silent capture of viewport width, browser version, and DOM selectors.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-mono font-semibold">Milestone Sign-Off Receipts</h4>
                  <p className={`text-[11px] mt-0.5 ${isDay ? "text-stone-500" : "text-zinc-400"}`}>
                    Cryptographically hashed audit certificates to prevent scope creep.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-inherit flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className={`text-xs font-mono ${isDay ? "text-stone-500" : "text-zinc-400"}`}>
                Status: <span className="text-emerald-400 font-semibold">Pro Active (Public Beta)</span>
              </p>
              <Link
                href="/dashboard"
                prefetch={true}
                className={`px-6 py-2.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all active:scale-[0.96] shadow-sm ${isDay
                  ? "bg-stone-900 text-white hover:bg-stone-800"
                  : "bg-white text-black hover:bg-zinc-200"
                  }`}
              >
                <span>Go to Studio Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Developer Integration Console Block with Copy AI Prompt */}
          <div
            className={`border rounded-2xl p-6 sm:p-8 transition-all ${isDay ? "bg-white border-stone-300 shadow-sm" : "bg-[#08080a] border-white/10"
              }`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Terminal className={`w-4 h-4 ${isDay ? "text-stone-700" : "text-zinc-400"}`} />
                  <h3 className={`font-mono text-sm font-semibold ${isDay ? "text-stone-900" : "text-white"}`}>
                    Cyath Model Context Protocol (MCP) Agent Pipeline
                  </h3>
                </div>
                <p className={`text-xs ${isDay ? "text-stone-600" : "text-zinc-400"}`}>
                  Instruct Cursor, Claude Code, and Antigravity agents to inspect client pins and resolve tickets directly.
                </p>
              </div>

              <button
                type="button"
                onClick={copyAiPrompt}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all duration-150 active:scale-[0.96] cursor-pointer shadow-sm ${copiedPrompt
                  ? "bg-emerald-500 text-white border border-emerald-500"
                  : isDay
                    ? "bg-stone-900 text-white hover:bg-stone-800"
                    : "bg-white text-black hover:bg-zinc-200"
                  }`}
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedPrompt ? "Copied AI Prompt!" : "Copy AI Prompt"}</span>
              </button>
            </div>

            <div className={`p-4 rounded-xl font-mono text-xs overflow-x-auto border ${isDay ? "bg-stone-100 border-stone-300 text-stone-800" : "bg-black/80 border-white/10 text-zinc-300"
              }`}>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2 font-semibold">
                Prompt Preview for AI Coding Agents
              </div>
              <pre className="whitespace-pre-wrap leading-relaxed select-all font-code">
                {prompt}
              </pre>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
