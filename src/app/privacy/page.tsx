"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Moon, Sun } from "lucide-react";
import { TesseractMark } from "@/components/common/Logo";
import { Footer } from "@/components/common/Footer";

export default function PrivacyPolicyPage() {
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
          <Link href="/dashboard" prefetch={true} className="flex items-center gap-2.5">
            <TesseractMark size={22} className={isDay ? "text-stone-900" : "text-white"} />
            <span className={`font-serif tracking-tight font-medium text-lg ${isDay ? "text-stone-900" : "text-white"}`}>
              cyath
            </span>
            <span className={`text-xs font-mono uppercase px-2 py-0.5 rounded border ${
              isDay ? "border-stone-300 text-stone-600" : "border-white/20 text-zinc-400"
            }`}>
              Privacy
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
          <p className="text-xs font-mono uppercase tracking-widest text-zinc-500">Legal Document</p>
          <h1 className={`font-serif text-3xl sm:text-4xl font-medium tracking-tight ${isDay ? "text-stone-900" : "text-white"}`}>
            Privacy Policy
          </h1>
          <p className={`text-xs font-mono ${isDay ? "text-stone-500" : "text-zinc-500"}`}>
            Effective Date: November 13, 2026
          </p>
        </div>

        <div className={`space-y-8 text-sm leading-relaxed ${isDay ? "text-stone-700" : "text-zinc-300"}`}>
          <section className="space-y-2">
            <h2 className={`font-serif text-lg font-medium ${isDay ? "text-stone-900" : "text-white"}`}>
              1. Information We Collect
            </h2>
            <p>
              When you use Cyath, we collect minimal information required to deliver staging review canvases, client annotations, and MCP server integrations:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li><strong>Account Identifiers:</strong> Email address and studio or company name provided during registration or authentication.</li>
              <li><strong>Review Staging Data:</strong> Target URLs, staging session identifiers, uploaded layout assets (images and PDF documents), and client review notes (feedback pins, browser coordinates, device viewports, and discussion threads).</li>
              <li><strong>Client Telemetry:</strong> Viewport resolution, approximate browser user-agent strings, and operating system details attached to feedback pins to assist developers with reproducing layout bugs.</li>
              <li><strong>Integration Telemetry:</strong> Machine-generated API keys for Cursor, Claude Code, and Antigravity MCP connections.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className={`font-serif text-lg font-medium ${isDay ? "text-stone-900" : "text-white"}`}>
              2. How We Use Information
            </h2>
            <p>
              We use collected information solely for operating, securing, and maintaining the Cyath review service:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li>Displaying visual annotations and thread comments on your staging canvas.</li>
              <li>Syncing open punchlist pins to your connected MCP server and local code editors.</li>
              <li>Enforcing workspace canvas limits based on your subscription tier.</li>
              <li>Facilitating client approvals and timestamped milestone certificates.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className={`font-serif text-lg font-medium ${isDay ? "text-stone-900" : "text-white"}`}>
              3. Client Review & Proxy Architecture
            </h2>
            <p>
              When testing remote websites, Cyath routes content through a zero-retention edge proxy to strip frame-busting scripts and neutralize blocking CORS and CSP headers. We do not store, parse, or harvest sensitive form inputs, passwords, or end-user session cookies processed through the proxy stream.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className={`font-serif text-lg font-medium ${isDay ? "text-stone-900" : "text-white"}`}>
              4. Data Retention & Storage
            </h2>
            <p>
              Your canvas metadata, notes, and profile settings are stored securely via Supabase and local browser cache. You may delete individual canvases, review pins, or your account at any time from your settings panel. Deleting a canvas immediately purges its associated feedback pins and uploaded assets.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className={`font-serif text-lg font-medium ${isDay ? "text-stone-900" : "text-white"}`}>
              5. Third-Party Services
            </h2>
            <p>
              We do not sell, rent, or trade your personal data. We utilize vetted service providers exclusively for hosting and authentication:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li><strong>Supabase:</strong> Authentication and PostgreSQL database infrastructure.</li>
              <li><strong>Vercel:</strong> Edge hosting, serverless compute, and static delivery.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className={`font-serif text-lg font-medium ${isDay ? "text-stone-900" : "text-white"}`}>
              6. Contact & Enquiries
            </h2>
            <p>
              For privacy inquiries, data deletion requests, or enterprise compliance queries, contact us directly at{" "}
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

