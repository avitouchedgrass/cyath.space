"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Moon, Sun } from "lucide-react";
import { TesseractMark } from "@/components/common/Logo";
import { Footer } from "@/components/common/Footer";

export default function TermsOfServicePage() {
  const [theme, setTheme] = useState<"night" | "day">("night");

  useEffect(() => {
    const saved = localStorage.getItem("cyath_theme") as "night" | "day";
    if (saved === "day" || saved === "night") {
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

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        isDay ? "bg-[#FBF9F4] text-[#1C1917]" : "bg-[#000000] text-white"
      }`}
    >
      <header
        className={`border-b backdrop-blur-xl sticky top-0 z-40 transition-colors ${
          isDay ? "border-stone-200/80 bg-[#FBF9F4]/90" : "border-white/[0.08] bg-[#000000]/80"
        }`}
      >
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" prefetch={true} className="flex items-center gap-2.5 group p-1">
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
            <span className={`text-xs font-mono uppercase px-2 py-0.5 rounded border ml-1 ${
              isDay ? "border-stone-300 text-stone-600 bg-stone-100" : "border-white/20 text-zinc-400 bg-white/5"
            }`}>
              Terms
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                isDay ? "text-stone-700 hover:bg-stone-100" : "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
              }`}
              title="Toggle theme"
            >
              {isDay ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            <Link
              href="/dashboard"
              prefetch={true}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-colors ${
                isDay
                  ? "bg-white border-stone-200 text-stone-700 hover:bg-stone-50"
                  : "bg-white/[0.04] border-white/10 text-zinc-300 hover:text-white hover:bg-white/[0.08]"
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 sm:py-16">
        <div className="space-y-4 mb-10">
          <p className="text-xs font-mono uppercase tracking-widest text-zinc-500">Legal Agreement</p>
          <h1 className={`font-serif text-3xl sm:text-4xl font-medium tracking-tight ${isDay ? "text-stone-900" : "text-white"}`}>
            Terms of Service
          </h1>
          <p className={`text-xs font-mono ${isDay ? "text-stone-500" : "text-zinc-500"}`}>
            Effective Date: November 13, 2026
          </p>
        </div>

        <div className={`space-y-8 text-sm leading-relaxed ${isDay ? "text-stone-700" : "text-zinc-300"}`}>
          <section className="space-y-2">
            <h2 className={`font-serif text-lg font-medium ${isDay ? "text-stone-900" : "text-white"}`}>
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using Cyath (&quot;the Platform&quot;, &quot;Service&quot;), including staging review canvases, client annotation tools, and Model Context Protocol (MCP) integrations, you agree to be bound by these Terms of Service. If you do not agree, do not use the Platform.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className={`font-serif text-lg font-medium ${isDay ? "text-stone-900" : "text-white"}`}>
              2. Permitted Use & Staging Canvas Guidelines
            </h2>
            <p>
              Cyath provides collaborative review infrastructure for software agencies, developers, and clients. You agree that:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li>You have all necessary legal rights and authorizations to preview, stage, and annotate target URLs or uploaded design materials.</li>
              <li>You will not use the edge proxy to bypass access controls, probe undocumented third-party systems, or route unlawful, defamatory, or malicious content.</li>
              <li>You are solely responsible for all notes, media uploads, and comments posted under your staging link sessions.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className={`font-serif text-lg font-medium ${isDay ? "text-stone-900" : "text-white"}`}>
              3. Subscription Plans, Billing & Cancellations
            </h2>
            <p>
              Cyath provides a free tier and a Pro tier ($12/month billed annually or $15/month billed monthly):
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li><strong>Free Tier:</strong> Free accounts may deploy up to 1 active live website canvas with unlimited uploaded image or PDF design canvases.</li>
              <li><strong>Pro Tier:</strong> Grants unlimited website review canvases, native Model Context Protocol (MCP) server keys, multi-device viewport breakpoints, and automated IDE patch syncing.</li>
              <li><strong>Cancellation:</strong> You may cancel Pro membership at any time from your settings panel. Upon cancellation, your existing canvases switch to read-only lock state until reactivated.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className={`font-serif text-lg font-medium ${isDay ? "text-stone-900" : "text-white"}`}>
              4. Milestone Acceptance Deeds
            </h2>
            <p>
              Milestone sign-off deeds generated via Cyath capture client approval timestamps, approver identity, and scoped punchlist status. These deeds serve as collaborative records between parties. Cyath does not act as legal counsel or escrow guarantor in disputes between clients and contractors.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className={`font-serif text-lg font-medium ${isDay ? "text-stone-900" : "text-white"}`}>
              5. Intellectual Property
            </h2>
            <p>
              You retain 100% ownership and copyright over your website code, designs, branding, and feedback text. Cyath claims zero ownership over user-submitted assets or staging sessions.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className={`font-serif text-lg font-medium ${isDay ? "text-stone-900" : "text-white"}`}>
              6. Disclaimer of Warranties & Limitation of Liability
            </h2>
            <p>
              The Service is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. Cyath disclaims all warranties of any kind. In no event shall Cyath be liable for any indirect, incidental, or consequential damages resulting from lost server access, proxy latency, or staging inaccuracies.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className={`font-serif text-lg font-medium ${isDay ? "text-stone-900" : "text-white"}`}>
              7. Governing Law & Contact
            </h2>
            <p>
              These Terms shall be governed by standard commercial laws. For enterprise agreements or terms inquiries, contact us at{" "}
              <a href="mailto:avitouchedgrass@gmail.com" className="underline underline-offset-4 font-mono text-xs">
                avitouchedgrass@gmail.com
              </a>.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

