"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, ArrowRight, AlertCircle, Sun, Moon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CyathLogo } from "@/components/common/Logo";
import type { EmailOtpType } from "@supabase/supabase-js";

function AuthConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [theme, setTheme] = useState<"night" | "day">("night");

  // Sync theme
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("cyath_theme");
      const active = saved === "day" || saved === "night" ? saved : "night";
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
    let isCancelled = false;

    async function handleVerification() {
      try {
        const token_hash = searchParams.get("token_hash");
        const type = searchParams.get("type") as EmailOtpType | null;
        const code = searchParams.get("code");
        const emailParam = searchParams.get("email");

        let verifiedEmail = emailParam;

        // 1. Verify OTP token_hash (Standard Supabase email confirmation)
        if (token_hash && type) {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash,
            type,
          });

          if (error) {
            // If already verified or token expired, check if we currently have a session
            const { data: sessionData } = await supabase.auth.getSession();
            if (sessionData.session?.user?.email) {
              verifiedEmail = sessionData.session.user.email;
            } else {
              throw error;
            }
          } else if (data.user?.email) {
            verifiedEmail = data.user.email;
          }
        }
        // 2. Exchange PKCE code (if sent as code)
        else if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            const { data: sessionData } = await supabase.auth.getSession();
            if (sessionData.session?.user?.email) {
              verifiedEmail = sessionData.session.user.email;
            } else {
              throw error;
            }
          } else if (data.user?.email) {
            verifiedEmail = data.user.email;
          }
        }
        // 3. Check existing active session or URL hash fragment
        else {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData.session?.user?.email) {
            verifiedEmail = sessionData.session.user.email;
          } else if (typeof window !== "undefined" && window.location.hash.includes("access_token")) {
            // Supabase client auto-parses hash fragments on mount
            await new Promise((r) => setTimeout(r, 600));
            const { data: hashSession } = await supabase.auth.getSession();
            if (hashSession.session?.user?.email) {
              verifiedEmail = hashSession.session.user.email;
            }
          }
        }

        if (isCancelled) return;

        setUserEmail(verifiedEmail || null);
        setStatus("success");

        // Broadcast success to original window
        const payload = {
          type: "AUTH_VERIFIED",
          email: verifiedEmail || null,
          timestamp: Date.now(),
        };

        // Channel A: BroadcastChannel (same browser tab-to-tab)
        try {
          const bc = new BroadcastChannel("cyath_auth_channel");
          bc.postMessage(payload);
          bc.close();
        } catch {
          // BroadcastChannel not available in older environments
        }

        // Channel B: LocalStorage storage event
        try {
          localStorage.setItem("cyath_auth_verified", JSON.stringify(payload));
        } catch {
          // ignore
        }

        // Channel C: Supabase Realtime broadcast (cross-device/cross-browser support)
        if (verifiedEmail) {
          try {
            const channelId = `auth_sync_${verifiedEmail.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
            const syncChannel = supabase.channel(channelId);
            syncChannel.subscribe(async (subStatus) => {
              if (subStatus === "SUBSCRIBED") {
                await syncChannel.send({
                  type: "broadcast",
                  event: "verified",
                  payload,
                });
                setTimeout(() => {
                  supabase.removeChannel(syncChannel);
                }, 2000);
              }
            });
          } catch {
            // ignore
          }
        }
      } catch (err: unknown) {
        if (isCancelled) return;
        setStatus("error");
        setErrorMessage(
          err instanceof Error ? err.message : "Verification link is invalid or has expired."
        );
      }
    }

    handleVerification();

    return () => {
      isCancelled = true;
    };
  }, [searchParams, supabase]);

  const isDay = theme === "day";

  return (
    <div
      className={`relative min-h-screen w-full flex flex-col transition-colors duration-300 font-sans selection:bg-[#38BDF8]/20 ${isDay ? "bg-[#F5F3EC] text-[#1C1A18]" : "bg-[#141312] text-[#F3F1EC]"
        }`}
    >
      {/* Precision Drafting Grid Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: isDay
            ? "radial-gradient(#1C1A18 0.75px, transparent 0.75px)"
            : "radial-gradient(#FFFFFF 0.75px, transparent 0.75px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Top Header */}
      <header className="relative z-10 h-16 px-6 sm:px-12 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto">
          <Link href="/">
            <CyathLogo theme={theme} />
          </Link>
        </div>

        <div className="flex items-center gap-3 pointer-events-auto">
          <button
            onClick={toggleTheme}
            title={isDay ? "Switch to Night Mode" : "Switch to Day Mode"}
            className={`p-2 rounded-full border transition-colors flex items-center justify-center cursor-pointer ${isDay
              ? "border-black/15 bg-white/70 hover:bg-white text-black shadow-sm"
              : "border-white/15 bg-white/5 hover:bg-white/10 text-white"
              }`}
          >
            {isDay ? <Moon className="w-4 h-4 text-[#1C1A18]" /> : <Sun className="w-4 h-4 text-white" />}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-6 sm:p-10">
        <div
          className={`w-full max-w-[440px] rounded-2xl border p-8 sm:p-10 text-center shadow-xl backdrop-blur-md transition-all ${isDay
            ? "bg-[#FAF8F2]/90 border-black/15 shadow-[0_20px_50px_rgba(28,26,24,0.06)]"
            : "bg-[#1B1A18]/90 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
            }`}
        >
          {status === "verifying" && (
            <div className="py-8 space-y-4">
              <div
                className={`w-12 h-12 mx-auto rounded-full border-2 border-t-transparent animate-spin ${isDay ? "border-black/20 border-t-black" : "border-white/20 border-t-white"
                  }`}
              />
              <h2 className="text-xl font-normal font-serif tracking-tight">
                Verifying Studio Credentials
              </h2>
              <p className={`text-xs ${isDay ? "text-black/60" : "text-white/60"}`}>
                Establishing cryptographic session across windows...
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="py-4 space-y-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/10 border border-white/20 text-white mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div className="space-y-1">
                <h1 className="text-2xl sm:text-[28px] font-normal font-serif tracking-[-0.02em]">
                  Email Verified
                </h1>
                {userEmail && (
                  <p className="font-mono text-xs text-zinc-400 truncate max-w-xs mx-auto">
                    {userEmail}
                  </p>
                )}
              </div>

              <div
                className={`p-4 rounded-xl border text-left space-y-2 ${isDay ? "bg-white/80 border-black/10" : "bg-black/30 border-white/10"
                  }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-white/80 mt-1.5 shrink-0" />
                  <div className="space-y-1">
                    <p className={`text-xs font-semibold ${isDay ? "text-[#1C1A18]" : "text-white"}`}>
                      Return to your original window
                    </p>
                    <p className={`text-[11px] leading-relaxed ${isDay ? "text-black/65" : "text-white/65"}`}>
                      Your original window has been updated automatically. You can safely close this tab now.
                    </p>
                  </div>
                </div>
              </div>

              {/* Secondary Fallback Action */}
              <div className="pt-2">
                <button
                  onClick={() => router.push("/dashboard")}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-medium border transition-colors flex items-center justify-center gap-2 cursor-pointer ${isDay
                    ? "border-black/15 hover:bg-black/5 text-[#1C1A18]"
                    : "border-white/15 hover:bg-white/5 text-white"
                    }`}
                >
                  <span>Continue in this window instead</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="py-4 space-y-5">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 mx-auto">
                <AlertCircle className="w-7 h-7" />
              </div>

              <div className="space-y-1">
                <h2 className="text-xl font-normal font-serif tracking-tight text-red-400">
                  Verification Failed
                </h2>
                <p className={`text-xs leading-relaxed ${isDay ? "text-black/60" : "text-white/60"}`}>
                  {errorMessage || "The verification link may have expired or was already used."}
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href="/login"
                  className={`inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-xs font-medium cursor-pointer ${isDay
                    ? "bg-[#1C1A18] text-white hover:bg-black"
                    : "bg-white text-[#141312] hover:bg-white/90"
                    }`}
                >
                  <span>Back to Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function AuthConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#141312] text-white/50 flex items-center justify-center text-xs font-mono">
          Verifying session...
        </div>
      }
    >
      <AuthConfirmContent />
    </Suspense>
  );
}

