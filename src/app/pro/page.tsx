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

export default function ProPricingPage() {
  const router = useRouter();
  const { isPro, activatePro } = useReviewStore();
  const [billingCycle, setBillingCycle] = useState<"annual" | "monthly">("annual");
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const { theme, isDay } = useTheme();

  const handleActivatePro = () => {
    setIsActivating(true);
    setTimeout(() => {
      activatePro();
      setIsActivating(false);
      router.push("/dashboard");
    }, 600);
  };

  const copyAiPrompt = () => {
    const aiPrompt = `You are assisting me as an autonomous AI software engineer.
I have connected Cyath (https://cyath.space), our visual staging and client review platform.
Please configure and connect to the Cyath MCP server to inspect open visual review notes and client feedback directly.

MCP Configuration:
\`\`\`json
{
  "mcpServers": {
    "cyath": {
      "command": "npx",
      "args": ["-y", "cyath-mcp@latest"],
      "env": {
        "CYATH_API_KEY": "${isPro ? "cyath_live_mcp_k994f0e21a81bc" : "cyath_preview_mcp_key"}",
        "CYATH_STAGING_ENDPOINT": "https://cyath.space/api/mcp"
      }
    }
  }
}
\`\`\`

Workflow:
1. Call \`cyath_list_open_pins\` or \`cyath_get_project_notes\` to fetch all open client feedback.
2. Inspect the DOM selector, viewport resolution, device mode, and snapshot attached to each note.
3. Locate corresponding code files in our repository, resolve the requested UX/UI or copy changes, and verify fixes.
4. Mark the items as resolved with a concise changelog comment.`;

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(aiPrompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2500);
    }
  };

  return (
    <div
      className={`min-h-screen font-sans flex flex-col md:flex-row transition-colors duration-200 selection:bg-stone-300 selection:text-black ${
        isDay ? "bg-[#FBF9F4] text-[#1C1917]" : "bg-[#000000] text-white"
      }`}
    >
      {/* Shared Persistent Left Sidebar */}
      <AppSidebar activeItem="plans" />

      {/* Main Content Area Shifted Upwards without Plans Heading */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto relative page-enter">
        <div className="max-w-6xl w-full mx-auto px-6 pt-6 pb-20 space-y-10 flex-1">
          {/* Subtitle & Billing Switcher */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h1
              className={`text-3xl sm:text-4xl lg:text-5xl font-serif font-medium tracking-tight leading-[1.15] ${
                isDay ? "text-stone-950" : "text-white"
              }`}
              style={{ fontFamily: "var(--font-serif, 'Oranienbaum', Georgia, serif)" }}
            >
              Fair pricing. Zero lock-in.
            </h1>
            <p className={`text-sm sm:text-base leading-relaxed ${isDay ? "text-stone-600" : "text-zinc-400"}`}>
              Start free on your current project. Upgrade to agency tier when you manage multiple concurrent client rollouts.
            </p>

            {/* Interactive Billing Frequency Switcher */}
            <div className={`mt-6 inline-flex items-center p-1 rounded-full border shadow-sm transition-colors ${
              isDay ? "bg-stone-200/80 border-stone-300" : "bg-white/[0.04] border-white/15"
            }`}>
              <button
                type="button"
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
                <span>Billed Annually</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    billingCycle === "annual"
                      ? isDay
                        ? "bg-stone-800 text-stone-200"
                        : "bg-zinc-200 text-black"
                      : isDay
                      ? "bg-stone-300 text-stone-800"
                      : "bg-white/10 text-zinc-300"
                  }`}
                >
                  Save 20%
                </span>
              </button>
              <button
                type="button"
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
                Billed Monthly ($15)
              </button>
            </div>
          </div>

          {/* 3 Tier Pricing Cards Styled Exactly Like Landing Page */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {/* Card 1: SOLO FREELANCER */}
            <div
              className={`rounded-2xl border p-7 flex flex-col justify-between transition-all duration-200 relative ${
                isDay
                  ? "bg-white border-stone-300 text-stone-900 shadow-sm"
                  : "bg-[#0a0a0d] border-white/[0.12] text-white"
              }`}
            >
              <div>
                <div className={`text-[11px] font-mono uppercase tracking-widest font-semibold mb-3 ${
                  isDay ? "text-stone-600" : "text-zinc-400"
                }`}>
                  SOLO FREELANCER
                </div>

                <div
                  className="text-4xl sm:text-5xl font-serif font-medium mb-1.5 tracking-tight"
                  style={{ fontFamily: "var(--font-serif, 'Oranienbaum', Georgia, serif)" }}
                >
                  $0
                </div>

                <div className={`text-xs font-mono mb-4 ${isDay ? "text-stone-500 font-medium" : "text-zinc-400"}`}>
                  Free forever. No credit card required.
                </div>

                <p className={`text-xs mb-6 leading-relaxed ${isDay ? "text-stone-600" : "text-zinc-400"}`}>
                  Perfect for independent developers and designers delivering one client project at a time.
                </p>

                <div className={`w-full h-px mb-6 ${isDay ? "bg-stone-200" : "bg-white/[0.08]"}`} />

                <ul className="space-y-3 text-xs mb-8">
                  <li className="flex items-start gap-2.5">
                    <span className="font-mono text-zinc-400 shrink-0 select-none">—</span>
                    <span className={isDay ? "text-stone-700" : "text-zinc-300"}>1 active staging project</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="font-mono text-zinc-400 shrink-0 select-none">—</span>
                    <span className={isDay ? "text-stone-700" : "text-zinc-300"}>Unlimited client pin notes</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="font-mono text-zinc-400 shrink-0 select-none">—</span>
                    <span className={isDay ? "text-stone-700" : "text-zinc-300"}>Automated browser & screen metadata</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="font-mono text-zinc-400 shrink-0 select-none">—</span>
                    <span className={isDay ? "text-stone-700" : "text-zinc-300"}>1-click milestone approval receipts</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/dashboard"
                prefetch={true}
                className={`w-full py-2.5 rounded-xl border font-mono text-xs font-semibold text-center block transition-all duration-150 active:scale-[0.96] cursor-pointer ${
                  isDay
                    ? "border-stone-300 text-stone-900 bg-stone-100 hover:bg-stone-200"
                    : "border-white/20 text-white bg-white/[0.04] hover:bg-white/10"
                }`}
              >
                Start Free
              </Link>
            </div>

            {/* Card 2: PRO (With Animated Dashed Border) */}
            <div
              className={`rounded-2xl border p-7 flex flex-col justify-between transition-all duration-200 relative overflow-hidden shadow-2xl ${
                isDay
                  ? "bg-white border-stone-400 text-stone-900 shadow-stone-200/60"
                  : "bg-[#0c0c10] border-white/30 text-white shadow-black/80"
              }`}
            >
              {/* Landing Page Style Animated Dashed Border */}
              <svg className="animated-dashed-border" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <rect x="1" y="1" width="calc(100% - 2px)" height="calc(100% - 2px)" rx="16" />
              </svg>

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[11px] font-mono uppercase tracking-widest font-bold ${
                    isDay ? "text-stone-900" : "text-white"
                  }`}>
                    PRO
                  </span>
                  <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    isDay ? "bg-stone-900 text-white" : "bg-white text-black"
                  }`}>
                    Recommended
                  </span>
                </div>

                <div className="flex items-baseline gap-1 mb-1.5">
                  <span
                    className="text-4xl sm:text-5xl font-serif font-medium tracking-tight"
                    style={{ fontFamily: "var(--font-serif, 'Oranienbaum', Georgia, serif)" }}
                  >
                    ${billingCycle === "annual" ? "12" : "15"}
                  </span>
                  <span className={`text-xs font-mono ${isDay ? "text-stone-500 font-medium" : "text-zinc-400"}`}>
                    / seat / month
                  </span>
                </div>

                <div className={`text-xs font-mono mb-4 ${isDay ? "text-stone-500 font-medium" : "text-zinc-400"}`}>
                  {billingCycle === "annual" ? "Billed annually ($144/year)" : "Billed monthly ($15/month)"}
                </div>

                <p className={`text-xs mb-6 leading-relaxed ${isDay ? "text-stone-600" : "text-zinc-400"}`}>
                  For studios, agencies, and autonomous builders delivering pixel-perfect production rollouts.
                </p>

                <div className={`w-full h-px mb-6 ${isDay ? "bg-stone-200" : "bg-white/[0.08]"}`} />

                <ul className="space-y-3 text-xs mb-8">
                  <li className="flex items-start gap-2.5">
                    <span className="font-mono text-zinc-400 shrink-0 select-none">—</span>
                    <span>
                      <strong className={isDay ? "text-stone-900" : "text-white"}>Autonomous MCP Agent Pipeline</strong> (Cursor, Claude, Antigravity)
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="font-mono text-zinc-400 shrink-0 select-none">—</span>
                    <span className={isDay ? "text-stone-700" : "text-zinc-300"}>Unlimited review canvases (Live Sites, Staging, PDFs)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="font-mono text-zinc-400 shrink-0 select-none">—</span>
                    <span className={isDay ? "text-stone-700" : "text-zinc-300"}>Isolated viewports (Full Page, Desktop, Tablet, Mobile)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="font-mono text-zinc-400 shrink-0 select-none">—</span>
                    <span className={isDay ? "text-stone-700" : "text-zinc-300"}>One-click client milestone approval & audit deed</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="font-mono text-zinc-400 shrink-0 select-none">—</span>
                    <span className={isDay ? "text-stone-700" : "text-zinc-300"}>Instant punchlist sync to Linear, GitHub Issues & Markdown</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={handleActivatePro}
                disabled={isPro || isActivating}
                className={`w-full py-2.5 rounded-xl font-mono text-xs font-bold transition-all duration-150 active:scale-[0.96] text-center cursor-pointer relative z-10 ${
                  isPro
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default"
                    : isDay
                    ? "bg-stone-900 text-white hover:bg-stone-800 shadow-md"
                    : "bg-white text-black hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                }`}
              >
                {isActivating ? "Activating..." : isPro ? "Active Pro Member" : "Upgrade to Pro"}
              </button>
            </div>

            {/* Card 3: ENTERPRISE */}
            <div
              className={`rounded-2xl border p-7 flex flex-col justify-between transition-all duration-200 relative ${
                isDay
                  ? "bg-white border-stone-300 text-stone-900 shadow-sm"
                  : "bg-[#0a0a0d] border-white/[0.12] text-white"
              }`}
            >
              <div>
                <div className={`text-[11px] font-mono uppercase tracking-widest font-semibold mb-3 ${
                  isDay ? "text-stone-600" : "text-zinc-400"
                }`}>
                  ENTERPRISE
                </div>

                <div
                  className="text-4xl sm:text-5xl font-serif font-medium mb-1.5 tracking-tight"
                  style={{ fontFamily: "var(--font-serif, 'Oranienbaum', Georgia, serif)" }}
                >
                  Custom
                </div>

                <div className={`text-xs font-mono mb-4 ${isDay ? "text-stone-500 font-medium" : "text-zinc-400"}`}>
                  Flexible deployment for engineering teams.
                </div>

                <p className={`text-xs mb-6 leading-relaxed ${isDay ? "text-stone-600" : "text-zinc-400"}`}>
                  For design engineering orgs and agencies requiring multiple team seats and dedicated agent pipelines.
                </p>

                <div className={`w-full h-px mb-6 ${isDay ? "bg-stone-200" : "bg-white/[0.08]"}`} />

                <ul className="space-y-3 text-xs mb-8">
                  <li className="flex items-start gap-2.5">
                    <span className="font-mono text-zinc-400 shrink-0 select-none">—</span>
                    <span>
                      <strong className={isDay ? "text-stone-900" : "text-white"}>Multi-Seat Team Workspaces</strong> with role permissions
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="font-mono text-zinc-400 shrink-0 select-none">—</span>
                    <span className={isDay ? "text-stone-700" : "text-zinc-300"}>Dedicated MCP API endpoints with custom rate limits</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="font-mono text-zinc-400 shrink-0 select-none">—</span>
                    <span className={isDay ? "text-stone-700" : "text-zinc-300"}>Centralized team billing & pooled review bandwidth</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="font-mono text-zinc-400 shrink-0 select-none">—</span>
                    <span className={isDay ? "text-stone-700" : "text-zinc-300"}>Custom domain staging canvases & white-label reviews</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="font-mono text-zinc-400 shrink-0 select-none">—</span>
                    <span className={isDay ? "text-stone-700" : "text-zinc-300"}>Priority 24/7 engineering SLA & custom onboarding</span>
                  </li>
                </ul>
              </div>

              <a
                href="mailto:enterprise@cyath.space?subject=Cyath%20Enterprise%20Tier%20Inquiry"
                className={`w-full py-2.5 rounded-xl border font-mono text-xs font-semibold text-center block transition-all duration-150 active:scale-[0.96] cursor-pointer ${
                  isDay
                    ? "border-stone-300 text-stone-900 bg-stone-100 hover:bg-stone-200"
                    : "border-white/20 text-white bg-white/[0.04] hover:bg-white/10"
                }`}
              >
                Enquire
              </a>
            </div>
          </div>

          {/* Developer Integration Console Block with Copy AI Prompt */}
          <div
            className={`border rounded-2xl p-6 sm:p-8 transition-all ${
              isDay ? "bg-white border-stone-300 shadow-sm" : "bg-[#08080a] border-white/10"
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
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all duration-150 active:scale-[0.96] cursor-pointer shadow-sm ${
                  copiedPrompt
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

            <div className={`p-4 rounded-xl font-mono text-xs overflow-x-auto border ${
              isDay ? "bg-stone-100 border-stone-300 text-stone-800" : "bg-black/80 border-white/10 text-zinc-300"
            }`}>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2 font-semibold">
                Prompt Preview for AI Coding Agents
              </div>
              <pre className="whitespace-pre-wrap leading-relaxed select-all font-code">
{`You are assisting me as an autonomous AI software engineer.
I have connected Cyath (https://cyath.space), our visual staging and client review platform.
Please configure and connect to the Cyath MCP server to inspect open visual review notes and client feedback.

MCP Configuration:
npx -y cyath-mcp@latest --endpoint https://cyath.space/api/mcp

Workflow:
1. Fetch all open pins on our active canvas using Cyath MCP.
2. Inspect exact DOM element selectors, viewport dimensions, and annotated screenshots.
3. Locate corresponding codebase files and resolve the client's requested changes.
4. Mark notes as resolved with verification evidence.`}
              </pre>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
