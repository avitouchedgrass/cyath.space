"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Terminal,
  Copy,
  Sun,
  Moon,
  Shield,
  Layers,
  ArrowRight,
} from "lucide-react";
import { useReviewStore } from "@/store/useReviewStore";
import { TesseractMark } from "@/components/common/Logo";
import { Footer } from "@/components/common/Footer";

export default function ProPricingPage() {
  const router = useRouter();
  const { isPro, activatePro } = useReviewStore();
  const [billingCycle, setBillingCycle] = useState<"annual" | "monthly">("annual");
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [theme, setTheme] = useState<"night" | "day">("night");

  useEffect(() => {
    const saved = localStorage.getItem("cyath_theme") as "night" | "day";
    if (saved) {
      setTheme(saved);
      document.documentElement.setAttribute("data-theme", saved);
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "night" ? "day" : "night";
    setTheme(next);
    localStorage.setItem("cyath_theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };

  const isDay = theme === "day";

  const handleActivatePro = () => {
    setIsActivating(true);
    setTimeout(() => {
      activatePro();
      setIsActivating(false);
      router.push("/dashboard");
    }, 600);
  };

  const copyMcpCommand = () => {
    const cmd = `export CYATH_API_KEY="cyath_pro_live_..."\nnpx cyath-mcp --connect`;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(cmd);
      setCopiedCmd(true);
      setTimeout(() => setCopiedCmd(false), 2000);
    }
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-200 font-sans flex flex-col selection:bg-stone-300 selection:text-black ${
        isDay ? "bg-[#FBF9F4] text-[#1C1917]" : "bg-[#000000] text-white"
      }`}
    >
      {/* Unified Top Navigation */}
      <header
        className={`border-b backdrop-blur-xl sticky top-0 z-40 transition-colors ${
          isDay ? "border-stone-200/80 bg-[#FBF9F4]/90" : "border-white/[0.08] bg-[#000000]/80"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/dashboard"
            prefetch={true}
            className="flex items-center gap-2.5 group p-1 transition-transform active:scale-[0.96]"
          >
            <TesseractMark
              size={24}
              className={`shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                isDay ? "text-stone-900" : "text-white"
              }`}
            />
            <span
              className={`font-sans font-bold text-[19px] tracking-[-0.04em] leading-none transition-colors ${
                isDay ? "text-[#1C1A18] group-hover:text-black" : "text-white"
              }`}
            >
              cyath
            </span>
            <span
              className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ml-1 ${
                isDay ? "border-stone-300 text-stone-600 bg-stone-100" : "border-white/20 text-zinc-400 bg-white/5"
              }`}
            >
              Plans
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full transition-all duration-150 cursor-pointer active:scale-[0.96] ${
                isDay ? "text-stone-700 hover:text-stone-950 hover:bg-stone-100" : "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
              }`}
              title="Toggle theme"
            >
              {isDay ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            <Link
              href="/dashboard"
              prefetch={true}
              className={`px-3.5 py-1.5 rounded-lg border text-xs font-mono transition-all duration-150 active:scale-[0.96] flex items-center gap-2 ${
                isDay
                  ? "bg-white border-stone-200 text-stone-700 hover:text-stone-950 hover:bg-stone-50 shadow-xs"
                  : "bg-white/[0.04] border-white/10 text-zinc-300 hover:text-white hover:bg-white/[0.08]"
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero & Pricing Header */}
      <main className="max-w-6xl mx-auto px-6 pt-16 pb-24 flex-1">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1
            className={`text-4xl sm:text-5xl font-serif font-medium tracking-tight mb-4 leading-[1.15] ${
              isDay ? "text-stone-950" : "text-white"
            }`}
          >
            Find the plan for your workflow.
          </h1>
          <p
            className={`text-base sm:text-lg leading-relaxed ${
              isDay ? "text-stone-600" : "text-zinc-400"
            }`}
          >
            From solo designers and engineers to creative agencies shipping client work daily.
          </p>

          {/* Billing Cycle Switcher */}
          <div className="mt-8 inline-flex items-center p-1 rounded-full border shadow-sm transition-colors bg-white/[0.04] border-white/15">
            <button
              onClick={() => setBillingCycle("annual")}
              className={`px-4 py-1.5 rounded-full text-xs font-mono transition-all duration-150 cursor-pointer active:scale-[0.96] flex items-center gap-2 ${
                billingCycle === "annual"
                  ? isDay
                    ? "bg-stone-900 text-white font-semibold shadow-xs"
                    : "bg-white text-black font-semibold shadow-xs"
                  : isDay
                  ? "text-stone-700 hover:text-stone-950"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <span>Annual</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  billingCycle === "annual"
                    ? isDay
                      ? "bg-stone-800 text-stone-200"
                      : "bg-zinc-200 text-black"
                    : isDay
                    ? "bg-stone-200 text-stone-800"
                    : "bg-white/10 text-zinc-300"
                }`}
              >
                SAVE 20%
              </span>
            </button>
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-4 py-1.5 rounded-full text-xs font-mono transition-all duration-150 cursor-pointer active:scale-[0.96] ${
                billingCycle === "monthly"
                  ? isDay
                    ? "bg-stone-900 text-white font-semibold shadow-xs"
                    : "bg-white text-black font-semibold shadow-xs"
                  : isDay
                  ? "text-stone-700 hover:text-stone-950"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Monthly
            </button>
          </div>
        </div>

        {/* 3 Tier Cards (Vercel Grid Model with Cyath Personality) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch mb-16">
          {/* Tier 1: Free */}
          <div
            className={`border rounded-2xl p-7 flex flex-col justify-between transition-all duration-200 ${
              isDay
                ? "bg-white border-stone-200 text-stone-900 shadow-xs"
                : "bg-[#0a0a0a] border-white/[0.08] text-white"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-sans font-semibold text-base">Free</span>
                <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">Starter</span>
              </div>
              <p className={`text-xs mb-6 min-h-[36px] ${isDay ? "text-stone-600" : "text-zinc-400"}`}>
                For freelancers and solo creators sharing quick designs for review.
              </p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl font-mono font-bold">$0</span>
                <span className={`text-xs font-mono ${isDay ? "text-stone-500" : "text-zinc-500"}`}>
                  / month
                </span>
              </div>

              <div className="w-full h-px bg-white/[0.08] mb-6" />

              <ul className="space-y-3 text-xs mb-8">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                  <span>1 active review canvas</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                  <span>Pin & box comment annotations</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                  <span>Live website & image reviews</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                  <span>Desktop, tablet & mobile viewports</span>
                </li>
              </ul>
            </div>

            <button
              disabled={!isPro}
              onClick={() => router.push("/dashboard")}
              className={`w-full py-2.5 rounded-xl border text-xs font-mono transition-all duration-150 active:scale-[0.96] text-center cursor-pointer ${
                !isPro
                  ? isDay
                    ? "bg-stone-100 border-stone-200 text-stone-500 cursor-default"
                    : "bg-white/[0.03] border-white/10 text-zinc-500 cursor-default"
                  : isDay
                  ? "bg-white border-stone-300 text-stone-900 hover:bg-stone-50"
                  : "bg-white/[0.06] border-white/15 text-white hover:bg-white/10"
              }`}
            >
              {!isPro ? "Current Plan" : "Switch to Free"}
            </button>
          </div>

          {/* Tier 2: Pro (Elevated with subtle personality) */}
          <div
            className={`border rounded-2xl p-7 flex flex-col justify-between relative transition-all duration-200 shadow-xl ${
              isDay
                ? "bg-white border-stone-900 ring-1 ring-stone-900 shadow-stone-200/50"
                : "bg-[#0d0d0f] border-white/30 ring-1 ring-white/20 shadow-[0_0_50px_rgba(255,255,255,0.06)]"
            }`}
          >
            {/* High-contrast highlight badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-white text-black text-[10px] font-mono font-bold uppercase tracking-wider shadow-md">
              Recommended
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-sans font-semibold text-base">Pro</span>
                <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">Studios & Teams</span>
              </div>
              <p className={`text-xs mb-6 min-h-[36px] ${isDay ? "text-stone-600" : "text-zinc-400"}`}>
                For studios, agencies, and engineers connecting AI agents directly to staging reviews.
              </p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl font-mono font-bold">
                  {billingCycle === "annual" ? "$19" : "$24"}
                </span>
                <span className={`text-xs font-mono ${isDay ? "text-stone-500" : "text-zinc-500"}`}>
                  / month {billingCycle === "annual" && "(billed annually)"}
                </span>
              </div>

              <div className="w-full h-px bg-white/[0.12] mb-6" />

              <ul className="space-y-3 text-xs mb-8">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-white shrink-0 mt-0.5" />
                  <span className="font-medium text-white">Unlimited review links & canvases</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-white shrink-0 mt-0.5" />
                  <span className="font-medium text-white">Cyath MCP Server (Cursor & Claude Code)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-white shrink-0 mt-0.5" />
                  <span>Multi-page continuous PDF reviews</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-white shrink-0 mt-0.5" />
                  <span>Box selection & point pin annotations</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-white shrink-0 mt-0.5" />
                  <span>Custom firm branding on review links</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-white shrink-0 mt-0.5" />
                  <span>Digital sign-off approvals & audit export</span>
                </li>
              </ul>
            </div>

            <button
              onClick={handleActivatePro}
              disabled={isPro || isActivating}
              className={`w-full py-2.5 rounded-xl font-mono text-xs font-bold transition-all duration-150 active:scale-[0.96] text-center cursor-pointer ${
                isPro
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default"
                  : isDay
                  ? "bg-stone-900 text-white hover:bg-black shadow-md"
                  : "bg-white text-black hover:bg-zinc-200 shadow-md hover:shadow-[0_0_24px_rgba(255,255,255,0.4)]"
              }`}
            >
              {isActivating ? "Activating..." : isPro ? "Current Active Plan" : "Upgrade to Pro"}
            </button>
          </div>

          {/* Tier 3: Enterprise */}
          <div
            className={`border rounded-2xl p-7 flex flex-col justify-between transition-all duration-200 ${
              isDay
                ? "bg-white border-stone-200 text-stone-900 shadow-xs"
                : "bg-[#0a0a0a] border-white/[0.08] text-white"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-sans font-semibold text-base">Enterprise</span>
                <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">Custom</span>
              </div>
              <p className={`text-xs mb-6 min-h-[36px] ${isDay ? "text-stone-600" : "text-zinc-400"}`}>
                For large agencies needing custom proxy domains, SAML SSO, and priority SLAs.
              </p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl font-mono font-bold">Custom</span>
              </div>

              <div className="w-full h-px bg-white/[0.08] mb-6" />

              <ul className="space-y-3 text-xs mb-8">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                  <span>Everything in Pro</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                  <span>Custom review domains (review.yourfirm.com)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                  <span>Dedicated proxy clusters with zero throttling</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                  <span>SAML SSO / Okta & consolidated invoicing</span>
                </li>
              </ul>
            </div>

            <a
              href="mailto:enterprise@cyath.space?subject=Cyath%20Enterprise%20Inquiry"
              className={`w-full py-2.5 rounded-xl border text-xs font-mono transition-all duration-150 active:scale-[0.96] text-center block ${
                isDay
                  ? "bg-white border-stone-300 text-stone-900 hover:bg-stone-50 shadow-xs"
                  : "bg-white/[0.06] border-white/15 text-white hover:bg-white/10"
              }`}
            >
              Contact Sales
            </a>
          </div>
        </div>

        {/* Developer Integration Console Block */}
        <div
          className={`border rounded-2xl p-6 sm:p-8 mb-20 transition-all ${
            isDay ? "bg-white border-stone-200 shadow-sm" : "bg-[#08080a] border-white/10"
          }`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Terminal className="w-4 h-4 text-zinc-400" />
                <h3 className="font-mono text-sm font-semibold">Cyath Model Context Protocol (MCP)</h3>
              </div>
              <p className={`text-xs ${isDay ? "text-stone-600" : "text-zinc-400"}`}>
                Allow Cursor, Claude Code, and Antigravity to read client pins and resolve tickets directly.
              </p>
            </div>

            <button
              onClick={copyMcpCommand}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg border text-xs font-mono transition-all duration-150 active:scale-[0.96] cursor-pointer ${
                copiedCmd
                  ? "bg-white text-black font-semibold border-white"
                  : isDay
                  ? "bg-stone-100 hover:bg-stone-200 border-stone-300 text-stone-800"
                  : "bg-white/10 hover:bg-white/15 border-white/20 text-zinc-200"
              }`}
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedCmd ? "Copied Command" : "Copy Setup Command"}</span>
            </button>
          </div>

          <div
            className={`p-4 rounded-xl font-mono text-xs overflow-x-auto ${
              isDay ? "bg-stone-900 text-stone-100" : "bg-[#020202] text-zinc-300 border border-white/5"
            }`}
          >
            <div className="text-zinc-500 mb-2"># Install and start the Cyath MCP server</div>
            <div>export CYATH_API_KEY=&quot;cyath_pro_live_...&quot;</div>
            <div>npx cyath-mcp --connect</div>
          </div>
        </div>

        {/* Feature Comparison Table */}
        <div className="mb-12">
          <h2
            className={`text-2xl font-serif font-medium mb-6 ${
              isDay ? "text-stone-950" : "text-white"
            }`}
          >
            Compare Plans
          </h2>

          <div
            className={`border rounded-2xl overflow-hidden transition-colors ${
              isDay ? "bg-white border-stone-200" : "bg-[#0a0a0a] border-white/[0.08]"
            }`}
          >
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={`border-b ${isDay ? "border-stone-200 bg-stone-50" : "border-white/[0.08] bg-white/[0.02]"}`}>
                  <th className="py-3.5 px-6 font-mono font-medium text-zinc-400">Feature</th>
                  <th className="py-3.5 px-6 font-mono font-medium">Free</th>
                  <th className="py-3.5 px-6 font-mono font-medium text-white">Pro</th>
                  <th className="py-3.5 px-6 font-mono font-medium">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                <tr>
                  <td className="py-3.5 px-6 font-medium">Active Canvases</td>
                  <td className="py-3.5 px-6 text-zinc-400">1 canvas</td>
                  <td className="py-3.5 px-6 font-medium text-white">Unlimited</td>
                  <td className="py-3.5 px-6">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-medium">Annotation Types</td>
                  <td className="py-3.5 px-6 text-zinc-400">Pins & Boxes</td>
                  <td className="py-3.5 px-6 font-medium text-white">Pins & Boxes</td>
                  <td className="py-3.5 px-6">Pins & Boxes</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-medium">MCP Agent Server</td>
                  <td className="py-3.5 px-6 text-zinc-400">-</td>
                  <td className="py-3.5 px-6 font-medium text-white">Included</td>
                  <td className="py-3.5 px-6">Included</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-medium">Continuous PDF Proofing</td>
                  <td className="py-3.5 px-6 text-zinc-400">-</td>
                  <td className="py-3.5 px-6 font-medium text-white">Included</td>
                  <td className="py-3.5 px-6">Included</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-medium">Client Sign-Off Deed</td>
                  <td className="py-3.5 px-6 text-zinc-400">-</td>
                  <td className="py-3.5 px-6 font-medium text-white">Included</td>
                  <td className="py-3.5 px-6">Included</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-medium">Custom Review Domain</td>
                  <td className="py-3.5 px-6 text-zinc-400">-</td>
                  <td className="py-3.5 px-6 text-zinc-400">-</td>
                  <td className="py-3.5 px-6 font-medium text-white">Dedicated CNAME</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <Footer theme={theme} />
    </div>
  );
}
