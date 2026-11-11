"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Terminal,
  Zap,
  ShieldCheck,
  Globe,
  Clock,
  ArrowRight,
  Layers,
  GitPullRequest,
  Sun,
  Moon,
} from "lucide-react";
import { useReviewStore } from "@/store/useReviewStore";
import { TesseractMark } from "@/components/common/Logo";
import { Footer } from "@/components/common/Footer";

export default function ProPricingPage() {
  const router = useRouter();
  const { isPro, activatePro } = useReviewStore();
  const [billingCycle, setBillingCycle] = useState<"annual" | "monthly">("annual");
  const [activeStep, setActiveStep] = useState(0);
  const [reviewsPerMonth, setReviewsPerMonth] = useState(6);
  const [isActivating, setIsActivating] = useState(false);
  const [activatedSuccess, setActivatedSuccess] = useState(false);
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

  // Terminal animated step simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4);
    }, 2400);
    return () => clearInterval(timer);
  }, []);

  const handleActivatePro = () => {
    setIsActivating(true);
    setTimeout(() => {
      activatePro();
      setIsActivating(false);
      setActivatedSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    }, 800);
  };

  const hoursSaved = reviewsPerMonth * 4.5;
  const dollarsSaved = hoursSaved * 95;

  return (
    <div
      className={`min-h-screen transition-colors duration-300 font-sans flex flex-col animate-in fade-in duration-200 selection:bg-stone-300 selection:text-black ${
        isDay ? "bg-[#FBF9F4] text-[#1C1917]" : "bg-[#000000] text-white"
      }`}
    >
      {/* Top Navigation */}
      <header
        className={`border-b backdrop-blur-xl sticky top-0 z-40 transition-colors ${
          isDay ? "border-stone-200/80 bg-[#FBF9F4]/90" : "border-white/[0.08] bg-[#000000]/80"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/dashboard"
            prefetch={true}
            className="flex items-center gap-2.5 group p-1"
          >
            <TesseractMark
              size={22}
              className={`transition-transform group-hover:scale-105 ${
                isDay ? "text-stone-900" : "text-white"
              }`}
            />
            <span
              className={`font-serif tracking-tight font-medium text-lg ${
                isDay ? "text-stone-900" : "text-white"
              }`}
            >
              cyath
            </span>
            <span className={`text-xs font-serif italic ml-1 ${isDay ? "text-stone-500" : "text-zinc-400"}`}>
              pro
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                isDay ? "text-stone-700 hover:text-stone-950 hover:bg-stone-100" : "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
              }`}
              title="Toggle theme"
            >
              {isDay ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            <Link
              href="/dashboard"
              prefetch={true}
              className={`px-3.5 py-1.5 rounded-lg border text-xs font-mono transition-all flex items-center gap-2 ${
                isDay
                  ? "bg-white border-stone-200 text-stone-700 hover:text-stone-950 hover:bg-stone-50 shadow-sm"
                  : "bg-white/[0.04] border-white/10 text-zinc-300 hover:text-white hover:bg-white/[0.08]"
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Dashboard</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section with Generous Breathing Room */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center relative flex-1">
        <h1
          className={`text-4xl sm:text-5xl lg:text-6xl font-serif font-medium tracking-tight max-w-3xl mx-auto leading-[1.12] mb-6 ${
            isDay ? "text-stone-900" : "text-white"
          }`}
        >
          Your AI coding agent fixes client feedback{" "}
          <span
            className={`italic font-normal underline underline-offset-8 ${
              isDay
                ? "text-stone-800 decoration-stone-400"
                : "text-zinc-200 decoration-white/30"
            }`}
          >
            automatically
          </span>
          .
        </h1>

        <p
          className={`text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-10 ${
            isDay ? "text-stone-600" : "text-zinc-400"
          }`}
        >
          Stop manually retyping client feedback into your code editor. Connect Cursor, Claude Code, and Antigravity directly to staging review canvases via our native Model Context Protocol server.
        </p>

        {/* Tactile Billing Switcher */}
        <div
          className={`inline-flex items-center p-1 rounded-full border shadow-xl mb-12 transition-colors ${
            isDay ? "bg-stone-200/80 border-stone-300" : "bg-white/[0.04] border-white/15"
          }`}
        >
          <button
            onClick={() => setBillingCycle("annual")}
            className={`px-5 py-2 rounded-full text-xs font-mono transition-all flex items-center gap-2 cursor-pointer ${
              billingCycle === "annual"
                ? isDay
                  ? "bg-stone-900 text-white font-semibold shadow-md"
                  : "bg-white text-black font-semibold shadow-md"
                : isDay
                ? "text-stone-700 hover:text-stone-950"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <span>Annual Billing</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                billingCycle === "annual"
                  ? isDay
                    ? "bg-stone-800 text-stone-200"
                    : "bg-black text-white"
                  : isDay
                  ? "bg-stone-300 text-stone-800"
                  : "bg-white/15 text-zinc-300"
              }`}
            >
              SAVE 20%
            </span>
          </button>
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`px-5 py-2 rounded-full text-xs font-mono transition-all cursor-pointer ${
              billingCycle === "monthly"
                ? isDay
                  ? "bg-stone-900 text-white font-semibold shadow-md"
                  : "bg-white text-black font-semibold shadow-md"
                : isDay
                ? "text-stone-700 hover:text-stone-950"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Monthly Billing
          </button>
        </div>

        {/* Pricing Card & Terminal Showcase Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left items-stretch mb-20">
          {/* Left: Real-Time MCP Terminal Showcase */}
          <div className="lg:col-span-7 bg-[#121215] border border-stone-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden group text-white">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.02] rounded-full blur-3xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
                <div className="flex items-center gap-2 text-white">
                  <Terminal className="w-4 h-4" />
                  <span className="font-mono text-xs text-white font-medium">
                    MCP Agent Integration
                  </span>
                </div>
                <div className="font-mono text-xs text-zinc-400">
                  <span>Connected</span>
                </div>
              </div>

              {/* Terminal Screen with Simulated Motion */}
              <div className="bg-[#050508] border border-white/10 rounded-2xl p-5 font-mono text-xs text-zinc-300 space-y-3 shadow-inner min-h-[220px]">
                <div className="text-zinc-500 text-[11px]">
                  $ cursor-agent --connect-cyath-mcp --session b7AxCdqz
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-white">
                    <span>✓</span>
                    <span>MCP Server Handshake Established [Key: cyath_pro_live]</span>
                  </div>

                  <div className={`transition-opacity duration-300 ${activeStep >= 1 ? "opacity-100 text-zinc-200" : "opacity-30"}`}>
                    <span className="text-zinc-500">→</span> Found Pin #1: &quot;Fix mobile button overflow on Safari&quot;
                  </div>

                  <div className={`transition-opacity duration-300 ${activeStep >= 2 ? "opacity-100 text-zinc-300" : "opacity-30"}`}>
                    <span className="text-zinc-500">→</span> Telemetry: 375×812 (iOS Safari) · Selector: <code className="text-white bg-white/10 px-1 py-0.5 rounded">header.sticky &gt; button.cta</code>
                  </div>

                  <div className={`transition-opacity duration-300 ${activeStep >= 3 ? "opacity-100 text-white font-semibold" : "opacity-30"}`}>
                    <span>✓ Auto-patched Tailwind classes in Hero.tsx:42</span>
                    <span className="block text-zinc-400 font-normal mt-0.5">
                      ✓ Resolved Pin #1 in Cyath Staging Stage · Client Notified
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/10 mt-6 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-zinc-400">
              <span>Zero manual copy-pasting of emails</span>
              <span className="text-white">Compatible with Cursor, Claude, & Antigravity</span>
            </div>
          </div>

          {/* Right: High-Contrast Pricing & Activation Card */}
          <div
            className={`lg:col-span-5 border rounded-3xl p-6 sm:p-8 flex flex-col justify-between relative transition-all ${
              isDay
                ? "bg-white border-stone-200/90 shadow-xl text-stone-900"
                : "bg-[#0a0a0d] border-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.8)] text-white"
            }`}
          >
            <div>
              <div className="mb-4">
                <h3 className={`font-serif text-2xl font-normal ${isDay ? "text-stone-900" : "text-white"}`}>
                  Pro Plan
                </h3>
              </div>

              <div className="flex items-baseline gap-2 mb-2">
                <span className={`font-serif text-5xl font-medium tracking-tight ${isDay ? "text-stone-900" : "text-white"}`}>
                  {billingCycle === "annual" ? "$12" : "$15"}
                </span>
                <span className={`text-xs font-mono ${isDay ? "text-stone-500" : "text-zinc-400"}`}>
                  / seat / month
                </span>
              </div>

              <p className={`text-xs font-mono mb-6 ${isDay ? "text-stone-500" : "text-zinc-400"}`}>
                {billingCycle === "annual"
                  ? "Billed annually ($144/yr). Cancel anytime."
                  : "Billed monthly. Cancel anytime."}
              </p>

              {/* Core Feature Checklist */}
              <div className={`space-y-3 pt-4 border-t mb-8 ${isDay ? "border-stone-200" : "border-white/10"}`}>
                {[
                  "Full Model Context Protocol (MCP) Server Key",
                  "Unlimited Client Review Canvases",
                  "Full Screen & Multi-Viewport Breakpoints",
                  "Multi-Page Subpage Color Tagging & Sorting",
                  "Milestone Acceptance Deeds (Scope-Lock Legal Seals)",
                  "Computed DOM Selector & Telemetry Capture",
                  "One-Click GitHub & Linear Issue Synchronization",
                ].map((feat) => (
                  <div key={feat} className={`flex items-start gap-2.5 text-xs ${isDay ? "text-stone-700" : "text-zinc-200"}`}>
                    <Check className={`w-4 h-4 shrink-0 mt-0.5 stroke-[2.5] ${isDay ? "text-stone-900" : "text-white"}`} />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <button
                onClick={handleActivatePro}
                disabled={isActivating || activatedSuccess}
                className={`w-full py-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
                  isDay
                    ? "bg-stone-900 hover:bg-stone-800 text-white shadow-lg hover:shadow-xl"
                    : "bg-white hover:bg-zinc-200 text-black shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,255,255,0.35)]"
                }`}
              >
                {isActivating ? (
                  <span>Activating Cyath Pro...</span>
                ) : activatedSuccess ? (
                  <span>✓ Cyath Pro Active!</span>
                ) : (
                  <>
                    <span>Activate Cyath Pro</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              <p className={`text-[11px] font-mono text-center mt-3 ${isDay ? "text-stone-500" : "text-zinc-400"}`}>
                Instant activation · MCP key generated immediately for workstation
              </p>
            </div>
          </div>
        </div>

        {/* Interactive ROI Calculator Section (Breathing Room) */}
        <div className={`max-w-4xl mx-auto pt-16 pb-20 border-t ${isDay ? "border-stone-200" : "border-white/[0.08]"}`}>
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className={`text-3xl font-serif font-medium tracking-tight mb-3 ${isDay ? "text-stone-900" : "text-white"}`}>
              Calculate your recovered engineering hours
            </h2>
            <p className={`text-xs ${isDay ? "text-stone-600" : "text-zinc-400"}`}>
              See how much manual QA overhead Cyath eliminates each month for your development team.
            </p>
          </div>

          <div
            className={`p-8 rounded-3xl border shadow-xl text-left transition-all ${
              isDay ? "bg-white border-stone-200/90 text-stone-900 shadow-sm" : "bg-[#07070a] border-white/15 text-white"
            }`}
          >
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3 text-xs font-mono">
                <span className={isDay ? "text-stone-700" : "text-zinc-300"}>Client Staging Reviews Per Month:</span>
                <span className={`text-lg font-serif font-medium ${isDay ? "text-stone-900" : "text-white"}`}>{reviewsPerMonth} reviews</span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                value={reviewsPerMonth}
                onChange={(e) => setReviewsPerMonth(Number(e.target.value))}
                className={`w-full h-2 rounded-lg cursor-pointer ${isDay ? "accent-stone-900 bg-stone-200" : "accent-white bg-white/10"}`}
              />
              <div className={`flex justify-between text-[10px] font-mono mt-1 ${isDay ? "text-stone-500" : "text-zinc-500"}`}>
                <span>1 review</span>
                <span>10 reviews</span>
                <span>20 reviews</span>
              </div>
            </div>

            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t text-center ${isDay ? "border-stone-200" : "border-white/10"}`}>
              <div className={`p-5 rounded-2xl border ${isDay ? "bg-stone-50 border-stone-200" : "bg-white/[0.02] border-white/10"}`}>
                <span className={`text-xs block mb-1 ${isDay ? "text-stone-500" : "text-zinc-400"}`}>
                  Engineering Hours Recovered
                </span>
                <span className={`text-4xl font-serif font-medium ${isDay ? "text-stone-900" : "text-white"}`}>
                  {hoursSaved.toFixed(0)} hrs
                </span>
                <span className={`text-xs font-mono block mt-1 ${isDay ? "text-stone-500" : "text-zinc-500"}`}>
                  per month in eliminated back-and-forth
                </span>
              </div>

              <div className={`p-5 rounded-2xl border ${isDay ? "bg-stone-50 border-stone-200" : "bg-white/[0.02] border-white/10"}`}>
                <span className={`text-xs block mb-1 ${isDay ? "text-stone-500" : "text-zinc-400"}`}>
                  Value of Prevented Scope Creep
                </span>
                <span className={`text-4xl font-serif font-medium ${isDay ? "text-stone-900" : "text-white"}`}>
                  ${dollarsSaved.toLocaleString()}
                </span>
                <span className={`text-xs font-mono block mt-1 ${isDay ? "text-stone-500" : "text-zinc-500"}`}>
                  based on standard $95/hr developer rate
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Deep Dive Grid - Meaningful Capabilities */}
        <div className={`max-w-5xl mx-auto pt-16 pb-20 border-t text-left ${isDay ? "border-stone-200" : "border-white/[0.08]"}`}>
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className={`text-3xl font-serif font-medium tracking-tight mb-3 ${isDay ? "text-stone-900" : "text-white"}`}>
              Core capabilities built into Cyath Pro
            </h2>
            <p className={`text-xs ${isDay ? "text-stone-600" : "text-zinc-400"}`}>
              Engineered for high-performing product teams, design studios, and autonomous coding agent workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`p-6 rounded-2xl border space-y-3 ${isDay ? "bg-white border-stone-200 shadow-sm" : "bg-[#070709] border-white/10"}`}>
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${isDay ? "bg-stone-100 border-stone-200 text-stone-900" : "bg-white/10 border-white/20 text-white"}`}>
                <Terminal className="w-4 h-4" />
              </div>
              <h3 className={`font-serif text-base font-medium ${isDay ? "text-stone-900" : "text-white"}`}>
                Autonomous MCP Agent Pipeline
              </h3>
              <p className={`text-xs leading-relaxed ${isDay ? "text-stone-600" : "text-zinc-400"}`}>
                Full Model Context Protocol server key for Cursor, Claude Code, and Antigravity. Agents autonomously fetch pin telemetry (DOM selector, viewport, user-agent), apply Git code patches, and resolve client feedback in real time.
              </p>
            </div>

            <div className={`p-6 rounded-2xl border space-y-3 ${isDay ? "bg-white border-stone-200 shadow-sm" : "bg-[#070709] border-white/10"}`}>
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${isDay ? "bg-stone-100 border-stone-200 text-stone-900" : "bg-white/10 border-white/20 text-white"}`}>
                <Layers className="w-4 h-4" />
              </div>
              <h3 className={`font-serif text-base font-medium ${isDay ? "text-stone-900" : "text-white"}`}>
                Enterprise Edge Proxy Tunneling
              </h3>
              <p className={`text-xs leading-relaxed ${isDay ? "text-stone-600" : "text-zinc-400"}`}>
                Custom zero-CORS proxy engine that neutralizes strict Content-Security-Policy headers, strips frame-busting scripts, and dynamically rewrites Next.js Turbopack chunks and assets for 100% faithful client hydration.
              </p>
            </div>

            <div className={`p-6 rounded-2xl border space-y-3 ${isDay ? "bg-white border-stone-200 shadow-sm" : "bg-[#070709] border-white/10"}`}>
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${isDay ? "bg-stone-100 border-stone-200 text-stone-900" : "bg-white/10 border-white/20 text-white"}`}>
                <Globe className="w-4 h-4" />
              </div>
              <h3 className={`font-serif text-base font-medium ${isDay ? "text-stone-900" : "text-white"}`}>
                Route-Aware Multi-Page Isolation
              </h3>
              <p className={`text-xs leading-relaxed ${isDay ? "text-stone-600" : "text-zinc-400"}`}>
                Full multi-page review navigation with isolated per-route pin threads. Pins placed on subpages stay pinned strictly to that subpage with distinct palette badges, chronological ordering, and deep route preservation.
              </p>
            </div>

            <div className={`p-6 rounded-2xl border space-y-3 ${isDay ? "bg-white border-stone-200 shadow-sm" : "bg-[#070709] border-white/10"}`}>
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${isDay ? "bg-stone-100 border-stone-200 text-stone-900" : "bg-white/10 border-white/20 text-white"}`}>
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className={`font-serif text-base font-medium ${isDay ? "text-stone-900" : "text-white"}`}>
                Cryptographic Milestone Sign-Off
              </h3>
              <p className={`text-xs leading-relaxed ${isDay ? "text-stone-600" : "text-zinc-400"}`}>
                Legally binding digital acceptance deeds that clients formalize upon sign-off. Freezes project scope, locks commit hashes, and issues timestamped milestone certificates to prevent revisions creep.
              </p>
            </div>

            <div className={`p-6 rounded-2xl border space-y-3 ${isDay ? "bg-white border-stone-200 shadow-sm" : "bg-[#070709] border-white/10"}`}>
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${isDay ? "bg-stone-100 border-stone-200 text-stone-900" : "bg-white/10 border-white/20 text-white"}`}>
                <GitPullRequest className="w-4 h-4" />
              </div>
              <h3 className={`font-serif text-base font-medium ${isDay ? "text-stone-900" : "text-white"}`}>
                Bi-Directional Linear & GitHub Sync
              </h3>
              <p className={`text-xs leading-relaxed ${isDay ? "text-stone-600" : "text-zinc-400"}`}>
                Two-way telemetry synchronization with GitHub Issues and Linear. Resolving a pin in code automatically marks client feedback as resolved on the live canvas with author attribution and diff logs.
              </p>
            </div>

            <div className={`p-6 rounded-2xl border space-y-3 ${isDay ? "bg-white border-stone-200 shadow-sm" : "bg-[#070709] border-white/10"}`}>
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${isDay ? "bg-stone-100 border-stone-200 text-stone-900" : "bg-white/10 border-white/20 text-white"}`}>
                <Clock className="w-4 h-4" />
              </div>
              <h3 className={`font-serif text-base font-medium ${isDay ? "text-stone-900" : "text-white"}`}>
                White-Label Client Staging Portals
              </h3>
              <p className={`text-xs leading-relaxed ${isDay ? "text-stone-600" : "text-zinc-400"}`}>
                Deploy unlimited review canvases under your company identity. Clients require zero accounts, logins, or browser extensions—simply open a universal staging link and annotate immediately.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom CTA Banner */}
        <div className="max-w-4xl mx-auto pb-16 text-center">
          <div
            className={`p-10 rounded-3xl border shadow-2xl transition-all ${
              isDay ? "bg-white border-stone-200/90 text-stone-900 shadow-sm" : "bg-[#0a0a0d] border-white/20 text-white"
            }`}
          >
            <h2 className={`text-3xl font-serif font-medium mb-3 ${isDay ? "text-stone-900" : "text-white"}`}>
              Ready to upgrade your team review workflow?
            </h2>
            <p className={`text-sm max-w-md mx-auto mb-6 ${isDay ? "text-stone-600" : "text-zinc-400"}`}>
              Join engineering teams and agencies building with Cyath Pro. Instant setup in under 60 seconds.
            </p>
            <button
              onClick={handleActivatePro}
              className={`px-8 py-4 rounded-xl font-semibold text-sm transition-all shadow-lg hover:shadow-2xl cursor-pointer ${
                isDay
                  ? "bg-stone-900 hover:bg-stone-800 text-white shadow-stone-900/10"
                  : "bg-white hover:bg-zinc-200 text-black shadow-white/10"
              }`}
            >
              Activate Cyath Pro ($12/mo)
            </button>
          </div>
        </div>
      </section>

      {/* Standardized Unified Footer */}
      <Footer theme={theme} />
    </div>
  );
}
