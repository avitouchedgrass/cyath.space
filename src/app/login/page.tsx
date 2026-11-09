"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  Building2,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Sun,
  Moon,
  Terminal,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CyathLogo } from "@/components/common/Logo";
import { AuthTesseractCanvas } from "@/components/auth/AuthTesseractCanvas";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [theme, setTheme] = useState<"night" | "day">("night");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  // Sync theme with localStorage or default to night
  useEffect(() => {
    const saved = localStorage.getItem("cyath_theme");
    if (saved === "day") {
      setTheme("day");
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "night" ? "day" : "night";
    setTheme(next);
    localStorage.setItem("cyath_theme", next);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.replace("/dashboard");
      }
    });
  }, [router, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);
    setLoading(true);

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          setErrorMsg(error.message);
          return;
        }

        router.push("/dashboard");
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              agency_name: agencyName.trim() || "Independent Studio",
            },
          },
        });

        if (error) {
          setErrorMsg(error.message);
          return;
        }

        if (data.session) {
          router.push("/dashboard");
          router.refresh();
        } else {
          setInfoMsg("Verification link sent! Check your inbox to confirm your studio account.");
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("An unexpected authentication error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const isDay = theme === "day";

  return (
    <div
      className={`min-h-screen transition-colors duration-300 flex flex-col ${
        isDay ? "bg-[#F5F3EC] text-[#1C1A18]" : "bg-[#1b1b1b] text-[#FAFAFA]"
      }`}
      style={{
        fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Top Architectural Navigation Bar */}
      <header
        className={`h-16 px-6 sm:px-10 border-b flex items-center justify-between transition-colors z-20 ${
          isDay
            ? "border-black/10 bg-[#EBE7DC]/80 backdrop-blur-md"
            : "border-white/10 bg-[#1b1b1b]/80 backdrop-blur-md"
        }`}
      >
        <Link href="/" className="flex items-center gap-2">
          <CyathLogo />
        </Link>

        {/* Right Segment Controls */}
        <div className="flex items-center gap-3">
          {/* Day / Night Toggle */}
          <button
            onClick={toggleTheme}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-medium border transition-colors cursor-pointer ${
              isDay
                ? "border-black/15 bg-black/5 hover:bg-black/10 text-[#1C1A18]"
                : "border-white/15 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white"
            }`}
          >
            {isDay ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            <span className="capitalize">{theme}</span>
          </button>

          <Link
            href="/"
            className={`text-xs font-mono transition-colors hidden sm:inline-block ${
              isDay ? "text-zinc-600 hover:text-black" : "text-zinc-400 hover:text-white"
            }`}
          >
            ← Back to Overview
          </Link>
        </div>
      </header>

      {/* Main Split Portal Area */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-4rem)]">
        {/* Left Column: Interactive 3D Halftone Tesseract Stage */}
        <section
          className={`relative hidden lg:flex lg:col-span-7 flex-col justify-between p-10 overflow-hidden border-r ${
            isDay ? "border-black/10 bg-[#EFECE3]" : "border-white/10 bg-[#171717]"
          }`}
        >
          {/* The Real-Time 3D Halftone Canvas */}
          <div className="absolute inset-0 z-0">
            <AuthTesseractCanvas theme={theme} />
          </div>

          {/* Top Left Metadata Stamp */}
          <div className="relative z-10 flex items-center gap-3">
            <span
              className={`px-2 py-0.5 rounded font-mono text-[10px] tracking-widest uppercase font-bold border ${
                isDay
                  ? "bg-black text-white border-black"
                  : "bg-white text-black border-white"
              }`}
            >
              SYS // ATELIER
            </span>
            <span
              className={`font-mono text-[11px] tracking-wider ${
                isDay ? "text-zinc-600" : "text-zinc-400"
              }`}
            >
              HALFTONE POST-PROCESSOR · caelangray.com SPEC
            </span>
          </div>

          {/* Center / Bottom Editorial Statement */}
          <div className="relative z-10 max-w-lg mt-auto pt-16">
            <h2
              className="text-4xl xl:text-5xl tracking-tight leading-[1.08] mb-4 font-normal"
              style={{ fontFamily: "'Oranienbaum', Georgia, serif" }}
            >
              <span className="italic font-normal">Stop</span> chasing client feedback across 15 emails.
            </h2>
            <p
              className={`text-sm leading-relaxed mb-6 ${
                isDay ? "text-zinc-600" : "text-zinc-400"
              }`}
            >
              Clients point and click directly on your live staging build. Every screen size, browser version, and DOM anchor is captured automatically.
            </p>

            {/* Monospace Drafting Specs */}
            <div
              className={`grid grid-cols-3 gap-3 p-3 rounded-xl border text-[11px] font-mono ${
                isDay
                  ? "bg-white/60 border-black/10 text-zinc-700 backdrop-blur-sm"
                  : "bg-black/40 border-white/10 text-zinc-300 backdrop-blur-sm"
              }`}
            >
              <div>
                <span className="block text-[9px] text-zinc-500 uppercase tracking-wider">CLIENT ACCESS</span>
                <strong>ZERO-LOGIN</strong>
              </div>
              <div>
                <span className="block text-[9px] text-zinc-500 uppercase tracking-wider">VERIFICATION</span>
                <strong>SHA-256 SEAL</strong>
              </div>
              <div>
                <span className="block text-[9px] text-zinc-500 uppercase tracking-wider">INTERACTION</span>
                <strong className="text-[#38BDF8]">3D ROTATABLE</strong>
              </div>
            </div>

            <div
              className={`mt-4 text-[10px] font-mono tracking-wider ${
                isDay ? "text-zinc-500" : "text-zinc-500"
              }`}
            >
              [ DRAG HYPERCUBE TO ROTATE · HOVER TO REPEL HALFTONE ]
            </div>
          </div>
        </section>

        {/* Right Column: Architectural Terminal Form */}
        <section className="col-span-1 lg:col-span-5 flex items-center justify-center p-6 sm:p-12 relative">
          <div
            className={`w-full max-w-md rounded-2xl p-7 sm:p-9 relative transition-all shadow-2xl ${
              isDay
                ? "bg-[#EBE7DC] border border-black/15 shadow-black/5 text-[#1C1A18]"
                : "bg-[#242424] border border-white/15 shadow-black/80 text-[#FAFAFA]"
            }`}
          >
            {/* Blueprint Corner Crosshair Ticks */}
            <div className="absolute top-2 left-2 font-mono text-[10px] text-zinc-500 select-none">+</div>
            <div className="absolute top-2 right-2 font-mono text-[10px] text-zinc-500 select-none">+</div>
            <div className="absolute bottom-2 left-2 font-mono text-[10px] text-zinc-500 select-none">+</div>
            <div className="absolute bottom-2 right-2 font-mono text-[10px] text-zinc-500 select-none">+</div>

            {/* Terminal Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`px-2 py-0.5 rounded font-mono text-[10px] tracking-widest uppercase font-bold ${
                    isDay
                      ? "bg-black text-white"
                      : "bg-white text-black"
                  }`}
                >
                  {mode === "signin" ? "AUTH // 01" : "REGISTER // 01"}
                </span>
                <span className="font-mono text-[10px] text-zinc-500">
                  SECURE PROTOCOL
                </span>
              </div>

              <h1 className="text-2xl font-bold tracking-tight mb-1">
                {mode === "signin" ? "Studio Sign In" : "Create Agency Account"}
              </h1>
              <p className={`text-xs ${isDay ? "text-zinc-600" : "text-zinc-400"}`}>
                {mode === "signin"
                  ? "Access your staging canvases, punchlists, and client sign-off seals."
                  : "Start free on your current project. Upgrade only when handling multiple rollouts."}
              </p>
            </div>

            {/* Segmented Mode Selector */}
            <div
              className={`grid grid-cols-2 p-1 rounded-xl border mb-6 text-xs font-medium ${
                isDay
                  ? "bg-[#DFD9CB] border-black/10"
                  : "bg-[#1b1b1b] border-white/10"
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setErrorMsg(null);
                  setInfoMsg(null);
                }}
                className={`py-2 rounded-lg transition-all font-mono text-xs cursor-pointer ${
                  mode === "signin"
                    ? isDay
                      ? "bg-white text-black shadow-sm font-bold"
                      : "bg-[#2d2d2d] text-white shadow-sm font-bold"
                    : isDay
                    ? "text-zinc-600 hover:text-black"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setErrorMsg(null);
                  setInfoMsg(null);
                }}
                className={`py-2 rounded-lg transition-all font-mono text-xs cursor-pointer ${
                  mode === "signup"
                    ? isDay
                      ? "bg-white text-black shadow-sm font-bold"
                      : "bg-[#2d2d2d] text-white shadow-sm font-bold"
                    : isDay
                    ? "text-zinc-600 hover:text-black"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Error & Info Feedback */}
            {errorMsg && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {infoMsg && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{infoMsg}</span>
              </div>
            )}

            {/* Main Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div>
                  <label className="block text-[11px] font-mono font-medium mb-1.5 uppercase tracking-wider text-zinc-400">
                    Studio / Agency Name
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={agencyName}
                      onChange={(e) => setAgencyName(e.target.value)}
                      placeholder="e.g. Aura Creative Atelier"
                      className={`w-full rounded-lg pl-9 pr-3 py-2 text-xs transition-colors focus:outline-none ${
                        isDay
                          ? "bg-white border border-black/15 text-black placeholder-zinc-400 focus:border-black"
                          : "bg-[#1b1b1b] border border-white/10 text-white placeholder-zinc-600 focus:border-[#38BDF8]"
                      }`}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-mono font-medium mb-1.5 uppercase tracking-wider text-zinc-400">
                  Work Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="partner@agency.com"
                    className={`w-full rounded-lg pl-9 pr-3 py-2 text-xs transition-colors focus:outline-none ${
                      isDay
                        ? "bg-white border border-black/15 text-black placeholder-zinc-400 focus:border-black"
                        : "bg-[#1b1b1b] border border-white/10 text-white placeholder-zinc-600 focus:border-[#38BDF8]"
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-medium mb-1.5 uppercase tracking-wider text-zinc-400">
                  Security Passkey
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className={`w-full rounded-lg pl-9 pr-3 py-2 text-xs transition-colors focus:outline-none ${
                      isDay
                        ? "bg-white border border-black/15 text-black placeholder-zinc-400 focus:border-black"
                        : "bg-[#1b1b1b] border border-white/10 text-white placeholder-zinc-600 focus:border-[#38BDF8]"
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full mt-2 py-2.5 px-4 rounded-lg font-semibold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-md cursor-pointer ${
                  isDay
                    ? "bg-[#1C1A18] hover:bg-black text-white"
                    : "bg-white hover:bg-zinc-200 text-black"
                }`}
              >
                <span>
                  {loading
                    ? "Verifying Credentials..."
                    : mode === "signin"
                    ? "Authenticate & Enter Hub"
                    : "Create Staging Account"}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Quick 1-Click Guest Test Drive */}
            <div className="mt-5 pt-4 border-t border-black/10 dark:border-white/10">
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className={`w-full py-2 px-3 rounded-lg text-xs font-mono transition-colors border flex items-center justify-center gap-2 cursor-pointer ${
                  isDay
                    ? "border-black/15 bg-black/5 hover:bg-black/10 text-[#1C1A18]"
                    : "border-white/15 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white"
                }`}
              >
                <Terminal className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>Explore Live Hub (Guest Preview) →</span>
              </button>
            </div>

            {/* Footer switcher note */}
            <div className="mt-4 text-center">
              <span className="text-[11px] text-zinc-500 font-mono">
                {mode === "signin"
                  ? "Need a studio workspace?"
                  : "Already registered?"}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === "signin" ? "signup" : "signin");
                    setErrorMsg(null);
                    setInfoMsg(null);
                  }}
                  className={`underline font-medium cursor-pointer ${
                    isDay ? "text-black hover:text-zinc-700" : "text-white hover:text-zinc-300"
                  }`}
                >
                  {mode === "signin" ? "Create one free" : "Sign in here"}
                </button>
              </span>
            </div>
          </div>
        </section>
      </main>

      {/* Archival Terminal Footer */}
      <footer
        className={`h-12 border-t px-6 sm:px-10 flex items-center justify-between text-[11px] font-mono transition-colors ${
          isDay
            ? "border-black/10 bg-[#EBE7DC] text-zinc-500"
            : "border-white/10 bg-[#1b1b1b] text-zinc-500"
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>CYATH STAGING ENGINE // ACTIVE</span>
        </div>
        <span>CRYPTOGRAPHIC MILESTONE CERTIFICATION</span>
      </footer>
    </div>
  );
}
