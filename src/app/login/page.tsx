"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Building2, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CyathLogo } from "@/components/common/Logo";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

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

        // If email confirmation is disabled, user is immediately logged in
        if (data.session) {
          router.push("/dashboard");
          router.refresh();
        } else {
          setInfoMsg("Verification link sent! Check your inbox to confirm your account.");
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

  return (
    <div className="min-h-screen bg-[#1b1b1b] text-[#FAFAFA] flex flex-col justify-between selection:bg-[#F59E0B] selection:text-[#09090B]">
      {/* Minimal Header */}
      <header className="h-16 border-b border-white/10 px-6 sm:px-12 flex items-center justify-between">
        <Link href="/">
          <CyathLogo />
        </Link>

        <Link
          href="/"
          className="text-xs font-mono text-zinc-400 hover:text-white transition-colors"
        >
          ← Back to Overview
        </Link>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md bg-[#242424] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/60 relative">
          {/* Header & Mode Switcher */}
          <div className="mb-6 text-center">
            <h1 className="text-xl font-bold tracking-tight text-white mb-1.5 font-sans">
              {mode === "signin" ? "Sign In to Cyath" : "Create Studio Account"}
            </h1>
            <p className="text-xs text-zinc-400">
              {mode === "signin"
                ? "Manage your staging review canvases and milestone certificates."
                : "One active staging project free forever. No client logins required."}
            </p>
          </div>

          {/* Tab Selector */}
          <div className="grid grid-cols-2 p-1 bg-[#1b1b1b] rounded-xl border border-white/10 mb-6 text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setErrorMsg(null);
                setInfoMsg(null);
              }}
              className={`py-2 rounded-lg transition-all ${
                mode === "signin"
                  ? "bg-[#2d2d2d] text-white shadow-sm font-semibold"
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
              className={`py-2 rounded-lg transition-all ${
                mode === "signup"
                  ? "bg-[#2d2d2d] text-white shadow-sm font-semibold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Alerts */}
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
                <label className="block text-xs font-mono text-zinc-300 mb-1.5 uppercase tracking-wider">
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
                    className="w-full bg-[#1b1b1b] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#F59E0B] transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-mono text-zinc-300 mb-1.5 uppercase tracking-wider">
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
                  className="w-full bg-[#1b1b1b] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#F59E0B] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-300 mb-1.5 uppercase tracking-wider">
                Password
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
                  className="w-full bg-[#1b1b1b] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#F59E0B] transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-md cursor-pointer"
            >
              <span>{loading ? "Authenticating..." : mode === "signin" ? "Sign In" : "Get Started Free"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Footer note */}
          <div className="mt-6 pt-4 border-t border-white/10 text-center">
            <span className="text-[11px] text-zinc-500">
              {mode === "signin" ? "Don't have an agency account yet?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "signin" ? "signup" : "signin");
                  setErrorMsg(null);
                  setInfoMsg(null);
                }}
                className="text-zinc-300 hover:text-white underline font-medium cursor-pointer"
              >
                {mode === "signin" ? "Create one free" : "Sign in here"}
              </button>
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-12 border-t border-white/10 px-6 text-center flex items-center justify-center text-[11px] font-mono text-zinc-500">
        Cyath Staging Review Engine · Cryptographic Milestone Verification
      </footer>
    </div>
  );
}
