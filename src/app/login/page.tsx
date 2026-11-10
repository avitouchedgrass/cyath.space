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
  CheckCircle2,
  RefreshCw,
  X,
  Sun,
  Moon,
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

  // Cross-Window Email Verification Synchronization State
  const [awaitingEmail, setAwaitingEmail] = useState<string | null>(null);
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Cooldown timer for resending email
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  // Sync theme with URL param or localStorage (set by landing page)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlTheme = params.get("theme");
      let active: "day" | "night" = "night";
      if (urlTheme === "day" || urlTheme === "night") {
        active = urlTheme;
      } else {
        const saved = localStorage.getItem("cyath_theme");
        if (saved === "day" || saved === "night") {
          active = saved;
        }
      }
      setTheme(active);
      document.documentElement.setAttribute("data-theme", active);
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "night" ? "day" : "night";
    setTheme(next);
    localStorage.setItem("cyath_theme", next);
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", next);
    }
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.replace("/dashboard");
      }
    });
  }, [router, supabase]);

  // Active Cross-Window / Cross-Device Listener for Email Verification
  useEffect(() => {
    if (!awaitingEmail) return;

    let isDone = false;

    const handleVerified = () => {
      if (isDone) return;
      isDone = true;
      setVerifiedSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 1200);
    };

    // 1. BroadcastChannel (Same Browser Tab-to-Tab Instant Sync)
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("cyath_auth_channel");
      bc.onmessage = (event) => {
        if (event.data?.type === "AUTH_VERIFIED") {
          handleVerified();
        }
      };
    } catch {
      // BroadcastChannel unsupported in older contexts
    }

    // 2. Storage Event (Cross-Tab LocalStorage Event)
    const onStorage = (e: StorageEvent) => {
      if (e.key === "cyath_auth_verified") {
        handleVerified();
      }
    };
    window.addEventListener("storage", onStorage);

    // 3. Supabase Realtime Broadcast (Cross-Browser & Cross-Device like Mobile to Desktop)
    const cleanEmail = awaitingEmail.toLowerCase().replace(/[^a-z0-9]/g, "_");
    const channelId = `auth_sync_${cleanEmail}`;
    const syncChannel = supabase.channel(channelId);
    syncChannel
      .on("broadcast", { event: "verified" }, () => {
        handleVerified();
      })
      .subscribe();

    // 4. Supabase Auth State Change Listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || session) {
        handleVerified();
      }
    });

    // 5. Gentle Periodic Session Polling (fallback every 3.5s)
    const pollTimer = setInterval(async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        handleVerified();
      }
    }, 3500);

    return () => {
      window.removeEventListener("storage", onStorage);
      if (bc) bc.close();
      supabase.removeChannel(syncChannel);
      subscription.unsubscribe();
      clearInterval(pollTimer);
    };
  }, [awaitingEmail, router, supabase]);

  const handleResendVerification = async () => {
    if (!awaitingEmail || resendCooldown > 0) return;
    setResendCooldown(45);
    setErrorMsg(null);
    setInfoMsg(null);

    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: awaitingEmail,
        options: {
          emailRedirectTo: `${origin}/auth/confirm?email=${encodeURIComponent(awaitingEmail)}`,
        },
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setInfoMsg("Fresh verification link sent to your inbox.");
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Unable to resend verification email.");
    }
  };

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
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${origin}/auth/confirm?email=${encodeURIComponent(email.trim())}`,
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
          setAwaitingEmail(email.trim());
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

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/dashboard`,
        },
      });
      if (error) {
        setErrorMsg(error.message);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Unable to initialize Google Sign In.");
      }
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setErrorMsg("Enter your email address above to receive a password reset link.");
      return;
    }
    setErrorMsg(null);
    setInfoMsg(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/login?reset=true`,
      });
      if (error) {
        setErrorMsg(error.message);
      } else {
        setInfoMsg("Password reset email sent! Check your inbox.");
      }
    } catch {
      setErrorMsg("Unable to process password reset request.");
    } finally {
      setLoading(false);
    }
  };

  const isDay = theme === "day";

  return (
    <div
      className={`min-h-screen relative flex flex-col justify-between selection:bg-[#F59E0B] selection:text-[#09090B] overflow-x-hidden ${
        isDay ? "bg-[#F5F3EC] text-[#1C1A18]" : "bg-[#1b1b1b] text-[#FAFAFA]"
      }`}
      style={{
        fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* 1. Full-screen 3D Halftone Dither Canvas (Zero text over dither, fading to plain bg on right) */}
      <div className="fixed inset-0 z-0 pointer-events-auto">
        <AuthTesseractCanvas theme={theme} />
      </div>

      {/* 2. Top Header Bar */}
      <header className="relative z-20 h-16 px-6 sm:px-12 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto">
          <Link href="/">
            <CyathLogo theme={theme} />
          </Link>
        </div>

        <div className="flex items-center gap-3 pointer-events-auto">
          {/* Day / Night Toggle (Synchronized with landing page) */}
          <button
            onClick={toggleTheme}
            title={`Switch to ${isDay ? "Night" : "Day"} mode`}
            className={`inline-flex items-center justify-center p-2 rounded-full border transition-colors cursor-pointer ${
              isDay
                ? "border-black/15 bg-white/70 hover:bg-white text-[#1C1A18] shadow-sm"
                : "border-white/15 bg-black/40 hover:bg-black/70 text-zinc-300 hover:text-white shadow-sm"
            }`}
          >
            {isDay ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Simple "X" Close Button */}
          <Link
            href="/"
            title="Close"
            className={`p-2 rounded-full border transition-colors flex items-center justify-center cursor-pointer ${
              isDay
                ? "border-black/15 bg-white/70 hover:bg-white text-black shadow-sm"
                : "border-white/15 bg-black/40 hover:bg-black/70 text-white shadow-sm"
            }`}
          >
            <X className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* 3. Main Body: Card shifted further left, with generous solid-background buffer avoiding dither */}
      <main className="relative z-10 flex-1 flex items-center justify-center lg:justify-end px-6 sm:px-12 lg:pr-72 xl:pr-80 py-8 pointer-events-none">
        <div
          className={`w-full max-w-md rounded-2xl p-7 sm:p-9 transition-all shadow-2xl pointer-events-auto ${
            isDay
              ? "bg-[#EBE7DC] border border-black/15 shadow-black/5 text-[#1C1A18]"
              : "bg-[#242424] border border-white/15 shadow-black/80 text-[#FAFAFA]"
          }`}
        >
          {awaitingEmail ? (
            verifiedSuccess ? (
              <div className="py-6 text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] px-2.5 py-0.5 rounded border border-emerald-500/30 text-emerald-500 bg-emerald-500/5">
                    Access Granted
                  </span>
                  <h2
                    className="text-[26px] font-normal tracking-tight mt-2"
                    style={{ fontFamily: "var(--font-serif, 'Oranienbaum', Georgia, serif)" }}
                  >
                    Login Successful
                  </h2>
                  <p className={`text-xs mt-1.5 ${isDay ? "text-zinc-600" : "text-zinc-400"}`}>
                    Email confirmed. Synchronizing session and entering studio dashboard...
                  </p>
                </div>
                <div className="w-full bg-black/10 dark:bg-white/10 rounded-full h-1 overflow-hidden mt-4">
                  <div className="bg-emerald-500 h-full w-full animate-pulse" />
                </div>
              </div>
            ) : (
              <div className="py-1 space-y-5">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] px-2.5 py-0.5 rounded border border-amber-500/30 text-amber-500 bg-amber-500/5">
                    Awaiting Verification
                  </span>
                  <h2
                    className="text-[26px] sm:text-[28px] font-normal tracking-tight mt-2.5 mb-1.5"
                    style={{ fontFamily: "var(--font-serif, 'Oranienbaum', Georgia, serif)" }}
                  >
                    Check Your Inbox
                  </h2>
                  <p className={`text-xs ${isDay ? "text-zinc-600" : "text-zinc-400"}`}>
                    We sent a confirmation link to activate your studio account.
                  </p>
                </div>

                <div
                  className={`p-3.5 rounded-xl border font-mono text-xs text-center truncate ${
                    isDay
                      ? "bg-white/80 border-black/15 text-[#1C1A18]"
                      : "bg-black/40 border-white/10 text-[#38BDF8]"
                  }`}
                >
                  {awaitingEmail}
                </div>

                {/* Real-time synchronization signal card */}
                <div
                  className={`p-4 rounded-xl border space-y-2 text-left ${
                    isDay ? "bg-white/60 border-black/10" : "bg-black/30 border-white/10"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span
                      className={`text-[11px] font-mono tracking-wide ${
                        isDay ? "text-zinc-700 font-medium" : "text-zinc-300 font-medium"
                      }`}
                    >
                      Listening for email confirmation...
                    </span>
                  </div>
                  <p className={`text-[11px] leading-relaxed pl-5 ${isDay ? "text-zinc-600" : "text-zinc-400"}`}>
                    Click the link in your email to verify. This window will automatically update and sign you in.
                  </p>
                </div>

                {infoMsg && (
                  <div className="p-3 rounded-lg border text-xs bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
                    {infoMsg}
                  </div>
                )}
                {errorMsg && (
                  <div className="p-3 rounded-lg border text-xs bg-red-500/10 border-red-500/30 text-red-400">
                    {errorMsg}
                  </div>
                )}

                <div className="space-y-2.5 pt-1">
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resendCooldown > 0}
                    className={`w-full py-2.5 px-4 rounded-lg text-xs font-medium border transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
                      isDay
                        ? "border-black/15 bg-white/70 hover:bg-white text-black"
                        : "border-white/15 bg-white/5 hover:bg-white/10 text-white"
                    }`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${resendCooldown > 0 ? "animate-spin" : ""}`} />
                    <span>
                      {resendCooldown > 0
                        ? `Resend link in ${resendCooldown}s`
                        : "Resend verification link"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAwaitingEmail(null);
                      setErrorMsg(null);
                      setInfoMsg(null);
                    }}
                    className={`w-full py-2 text-[11px] font-mono underline cursor-pointer text-center ${
                      isDay ? "text-zinc-600 hover:text-black" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Use a different email / Back to Sign In
                  </button>
                </div>
              </div>
            )
          ) : (
            <>
              {/* Terminal Title (No eyebrows, no screws) */}
              <div className="mb-6">
                <h1
                  className="text-[28px] sm:text-[30px] font-normal tracking-[-0.02em] leading-tight mb-2"
                  style={{ fontFamily: "var(--font-serif, 'Oranienbaum', Georgia, serif)" }}
                >
                  {mode === "signin" ? "Sign In to Cyath" : "Create Studio Account"}
                </h1>
                <p className={`text-xs ${isDay ? "text-zinc-600" : "text-zinc-400"}`}>
                  {mode === "signin"
                    ? "Access your staging canvases, punchlists, and client sign-off seals."
                    : "Start free on your current project. Upgrade only when handling multiple rollouts."}
                </p>
              </div>

              {/* Segmented Mode Selector */}
              <div
                className={`grid grid-cols-2 p-1 rounded-xl border mb-5 text-xs font-medium ${
                  isDay ? "bg-[#DFD9CB] border-black/10" : "bg-[#1b1b1b] border-white/10"
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

              {/* Google OAuth Bar */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className={`w-full py-2.5 px-4 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2.5 border cursor-pointer mb-4 ${
                  isDay
                    ? "bg-white hover:bg-zinc-50 border-black/15 text-black shadow-sm"
                    : "bg-[#1b1b1b] hover:bg-[#222222] border-white/10 text-white shadow-sm"
                }`}
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* Divider */}
              <div className="relative my-4 flex items-center justify-center">
                <div className={`w-full border-t ${isDay ? "border-black/10" : "border-white/10"}`} />
                <span
                  className={`absolute px-2 text-[10px] font-mono uppercase tracking-widest ${
                    isDay ? "bg-[#EBE7DC] text-zinc-500" : "bg-[#242424] text-zinc-400"
                  }`}
                >
                  OR
                </span>
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

              {/* Form */}
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
                        placeholder="e.g. North Creative Studio"
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
                      placeholder="designer@agency.com"
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
                      ? "Authenticating..."
                      : mode === "signin"
                      ? "Sign In to Studio"
                      : "Create Account"}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>

              {/* Footer switcher note / Forgot Password */}
              <div className="mt-5 text-center">
                {mode === "signin" ? (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className={`text-[11px] font-mono underline cursor-pointer transition-colors ${
                      isDay ? "text-zinc-600 hover:text-black" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Forgot your password?
                  </button>
                ) : (
                  <span className="text-[11px] text-zinc-500 font-mono">
                    Already registered?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("signin");
                        setErrorMsg(null);
                        setInfoMsg(null);
                      }}
                      className={`underline font-medium cursor-pointer ${
                        isDay ? "text-black hover:text-zinc-700" : "text-white hover:text-zinc-300"
                      }`}
                    >
                      Sign in here
                    </button>
                  </span>
                )}

                <div className={`mt-4 pt-3 border-t ${isDay ? "border-black/10" : "border-white/10"}`}>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        localStorage.setItem("cyath_guest_session", "true");
                      }
                      router.push("/dashboard");
                    }}
                    className={`text-[11px] font-mono transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                      isDay ? "text-zinc-500 hover:text-black" : "text-zinc-500 hover:text-white"
                    }`}
                  >
                    <span>Explore Studio Workbench as Guest</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* 4. Minimal Footer */}
      <footer className="relative z-10 h-10 px-6 sm:px-12 flex items-center justify-end text-[10px] font-mono text-zinc-500 pointer-events-none">
        <span>CRYPTOGRAPHIC MILESTONE CERTIFICATION</span>
      </footer>
    </div>
  );
}
