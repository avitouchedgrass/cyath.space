"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Terminal,
  LogOut,
  Copy,
  Check,
  Building,
  SunMedium,
  Moon,
  User,
  Key,
  CreditCard,
  Sliders,
  Shield,
  Download,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useReviewStore } from "@/store/useReviewStore";
import { TesseractMark } from "@/components/common/Logo";
import { AppSidebar } from "@/components/common/AppSidebar";
import { useTheme, setThemeGlobally } from "@/lib/theme";

type SettingsTab = "profile" | "keys" | "firm" | "billing" | "preferences";

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as SettingsTab) || "profile";

  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [user, setUser] = useState<any>(null);
  const [agencyName, setAgencyName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedConfig, setCopiedConfig] = useState<string | null>(null);
  const { theme, isDay, toggle: toggleTheme } = useTheme();

  const { isPro, projects } = useReviewStore();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user);
        const storedAgency = localStorage.getItem("cyath_agency_name");
        if (storedAgency && !storedAgency.includes("@")) {
          setAgencyName(storedAgency);
        } else if (user.user_metadata?.agency_name) {
          setAgencyName(user.user_metadata.agency_name);
        } else {
          setAgencyName("Studio");
        }
        setDisplayName(user.user_metadata?.full_name || user.email?.split("@")[0] || "Reviewer");
      } else {
        const storedAgency = localStorage.getItem("cyath_agency_name");
        setAgencyName(storedAgency || "Independent Studio");
        setDisplayName("Guest Reviewer");
      }
    });
  }, []);

  const handleSaveFirm = async () => {
    const trimmed = agencyName.trim() || "Studio";
    setAgencyName(trimmed);
    localStorage.setItem("cyath_agency_name", trimmed);

    if (user) {
      const supabase = createClient();
      await supabase.auth.updateUser({
        data: { agency_name: trimmed },
      });
    }

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    localStorage.removeItem("cyath_auth_active");
    localStorage.removeItem("cyath_guest_session");
    router.push("/login");
  };

  const mcpKey = isPro
    ? "cyath_live_mcp_k994f0e21a81bc"
    : "cyath_mcp_preview_license_key";

  const cursorJson = JSON.stringify(
    {
      mcpServers: {
        cyath: {
          command: "npx",
          args: ["-y", "cyath-mcp@latest"],
          env: {
            CYATH_API_KEY: mcpKey,
            CYATH_STAGING_ENDPOINT: "https://cyath-space.vercel.app/api/mcp",
          },
        },
      },
    },
    null,
    2
  );

  const claudeJson = JSON.stringify(
    {
      mcpServers: {
        "cyath-reviews": {
          command: "npx",
          args: ["-y", "cyath-mcp@latest"],
          env: {
            CYATH_API_KEY: mcpKey,
          },
        },
      },
    },
    null,
    2
  );

  const copyToClipboard = (text: string, id: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      if (id === "key") {
        setCopiedKey(true);
        setTimeout(() => setCopiedKey(false), 2000);
      } else {
        setCopiedConfig(id);
        setTimeout(() => setCopiedConfig(null), 2000);
      }
    }
  };

  return (
    <div
      className={`min-h-screen font-sans flex flex-col md:flex-row transition-colors duration-200 selection:bg-stone-300 selection:text-black ${
        isDay ? "bg-[#FBF9F4] text-[#1C1917]" : "bg-[#000000] text-white"
      }`}
    >
      {/* Shared Persistent Left Sidebar */}
      <AppSidebar activeItem="settings" />

      {/* Main Settings Area with Smooth Fast Fade */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto relative page-enter">
        <div className="max-w-6xl w-full mx-auto px-6 py-8 space-y-8 flex-1">
          {/* Header Title matching Dashboard "Projects" */}
          <div className={`flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-3 border-b ${
            isDay ? "border-stone-200" : "border-white/[0.08]"
          }`}>
            <div>
              <h1
                className={`text-3xl sm:text-4xl lg:text-5xl font-serif font-medium tracking-tight ${
                  isDay ? "text-stone-950" : "text-white"
                }`}
                style={{ fontFamily: "var(--font-serif, 'Oranienbaum', Georgia, serif)" }}
              >
                Settings
              </h1>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Left Navigation Column */}
            <aside className="md:col-span-3 space-y-6">
            <div className="space-y-1">
              <div className={`text-[11px] font-mono uppercase tracking-wider px-3 py-1.5 ${
                isDay ? "text-stone-500 font-semibold" : "text-zinc-500"
              }`}>
                Account
              </div>
              <button
                onClick={() => setActiveTab("profile")}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 flex items-center gap-2.5 cursor-pointer active:scale-[0.96] ${
                  activeTab === "profile"
                    ? isDay
                      ? "bg-stone-200/80 text-stone-950 font-semibold"
                      : "bg-white/10 text-white font-semibold"
                    : isDay
                    ? "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                <User className="w-4 h-4 shrink-0" />
                <span>Profile</span>
              </button>
              <button
                onClick={() => setActiveTab("preferences")}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 flex items-center gap-2.5 cursor-pointer active:scale-[0.96] ${
                  activeTab === "preferences"
                    ? isDay
                      ? "bg-stone-200/80 text-stone-950 font-semibold"
                      : "bg-white/10 text-white font-semibold"
                    : isDay
                    ? "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                <Sliders className="w-4 h-4 shrink-0" />
                <span>Preferences</span>
              </button>
            </div>

            <div className="space-y-1">
              <div className={`text-[11px] font-mono uppercase tracking-wider px-3 py-1.5 ${
                isDay ? "text-stone-500 font-semibold" : "text-zinc-500"
              }`}>
                Workspace
              </div>
              <button
                onClick={() => setActiveTab("keys")}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 flex items-center gap-2.5 cursor-pointer active:scale-[0.96] ${
                  activeTab === "keys"
                    ? isDay
                      ? "bg-stone-200/80 text-stone-950 font-semibold"
                      : "bg-white/10 text-white font-semibold"
                    : isDay
                    ? "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                <Key className="w-4 h-4 shrink-0" />
                <span>API Keys</span>
              </button>
              <button
                onClick={() => setActiveTab("firm")}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 flex items-center gap-2.5 cursor-pointer active:scale-[0.96] ${
                  activeTab === "firm"
                    ? isDay
                      ? "bg-stone-200/80 text-stone-950 font-semibold"
                      : "bg-white/10 text-white font-semibold"
                    : isDay
                    ? "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                <Building className="w-4 h-4 shrink-0" />
                <span>Firm Details</span>
              </button>
              <button
                onClick={() => setActiveTab("billing")}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 flex items-center gap-2.5 cursor-pointer active:scale-[0.96] ${
                  activeTab === "billing"
                    ? isDay
                      ? "bg-stone-200/80 text-stone-950 font-semibold"
                      : "bg-white/10 text-white font-semibold"
                    : isDay
                    ? "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                <CreditCard className="w-4 h-4 shrink-0" />
                <span>Plans & Billing</span>
              </button>
            </div>

            <div className={`pt-4 border-t ${isDay ? "border-stone-200" : "border-white/[0.08]"}`}>
              <button
                onClick={handleSignOut}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 flex items-center gap-2.5 cursor-pointer active:scale-[0.96] text-rose-500 hover:bg-rose-500/10"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>Sign Out</span>
              </button>
            </div>
          </aside>

          {/* Right Content Panel */}
          <div className="md:col-span-9">
            {/* Tab 1: Profile */}
            {activeTab === "profile" && (
              <div
                className={`border rounded-2xl p-7 transition-all ${
                  isDay ? "bg-white border-stone-200 shadow-xs" : "bg-[#0a0a0a] border-white/[0.08]"
                }`}
              >
                <div className="mb-6">
                  <h2 className={`text-xl font-sans font-semibold mb-1 ${isDay ? "text-stone-900" : "text-white"}`}>Profile</h2>
                  <p className={`text-xs ${isDay ? "text-stone-600 font-medium" : "text-zinc-400"}`}>
                    Manage your personal account information and login details.
                  </p>
                </div>

                <div className="space-y-6 max-w-lg">
                  <div>
                    <label className={`block text-xs font-medium mb-1.5 ${isDay ? "text-stone-700 font-semibold" : "text-zinc-400"}`}>
                      Email Address
                    </label>
                    <input
                      type="text"
                      disabled
                      value={user?.email || "guest@cyath.space"}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono select-none ${
                        isDay ? "bg-stone-100 border-stone-300 text-stone-700 font-medium" : "bg-white/[0.03] border-white/10 text-zinc-400"
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1.5 ${isDay ? "text-stone-700 font-semibold" : "text-zinc-400"}`}>
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your name"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-sans transition-colors ${
                        isDay
                          ? "bg-white border-stone-300 text-stone-900 focus:border-stone-500 outline-none"
                          : "bg-white/[0.04] border-white/15 text-white focus:border-white/30 outline-none"
                      }`}
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setIsSaved(true);
                        setTimeout(() => setIsSaved(false), 2000);
                      }}
                      className={`px-5 py-2 rounded-xl text-xs font-mono font-medium transition-all duration-150 active:scale-[0.96] cursor-pointer ${
                        isSaved
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : isDay
                          ? "bg-stone-900 text-white hover:bg-stone-800"
                          : "bg-white text-black hover:bg-zinc-200"
                      }`}
                    >
                      {isSaved ? "Saved" : "Save Changes"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: API Keys */}
            {activeTab === "keys" && (
              <div
                className={`border rounded-2xl p-7 transition-all ${
                  isDay ? "bg-white border-stone-200 shadow-xs" : "bg-[#0a0a0a] border-white/[0.08]"
                }`}
              >
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-sans font-semibold">API Keys</h2>
                    {isPro ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Pro Active
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-500/20 text-zinc-400 border border-white/10">
                        Preview Key
                      </span>
                    )}
                  </div>
                  <p className={`text-xs ${isDay ? "text-stone-600" : "text-zinc-400"}`}>
                    Use these keys to connect Cursor, Claude Code, or Antigravity to your review canvases.
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className={`block text-xs font-medium mb-1.5 ${isDay ? "text-stone-700 font-semibold" : "text-zinc-400"}`}>
                      Live API Key
                    </label>
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex-1 px-3.5 py-2.5 rounded-xl border font-mono text-xs truncate ${
                          isDay ? "bg-white border-stone-300 text-stone-900 font-semibold" : "bg-white/[0.04] border-white/15 text-zinc-200"
                        }`}
                      >
                        {mcpKey}
                      </div>
                      <button
                        onClick={() => copyToClipboard(mcpKey, "key")}
                        className={`px-3.5 py-2.5 rounded-xl border text-xs font-mono transition-all duration-150 active:scale-[0.96] flex items-center gap-1.5 cursor-pointer ${
                          copiedKey
                            ? isDay ? "bg-stone-900 text-white font-semibold border-stone-900" : "bg-white text-black font-semibold border-white"
                            : isDay
                            ? "bg-white hover:bg-stone-100 border-stone-300 text-stone-900 font-medium"
                            : "bg-white/10 hover:bg-white/15 border-white/20 text-zinc-200"
                        }`}
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedKey ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className={`text-xs font-medium ${isDay ? "text-stone-700 font-semibold" : "text-zinc-400"}`}>
                        Cursor Configuration (~/.cursor/mcp.json)
                      </label>
                      <button
                        onClick={() => copyToClipboard(cursorJson, "cursor")}
                        className={`text-[11px] font-mono flex items-center gap-1 cursor-pointer transition-colors ${
                          isDay ? "text-stone-600 hover:text-stone-950 font-medium" : "text-zinc-400 hover:text-white"
                        }`}
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedConfig === "cursor" ? "Copied!" : "Copy JSON"}</span>
                      </button>
                    </div>
                    <pre
                      className={`p-4 rounded-xl font-mono text-xs overflow-x-auto ${
                        isDay ? "bg-stone-900 text-stone-100 border border-stone-800" : "bg-[#050505] border border-white/10 text-zinc-300"
                      }`}
                    >
                      {cursorJson}
                    </pre>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className={`text-xs font-medium ${isDay ? "text-stone-700 font-semibold" : "text-zinc-400"}`}>
                        Claude Code Configuration (claude_desktop_config.json)
                      </label>
                      <button
                        onClick={() => copyToClipboard(claudeJson, "claude")}
                        className={`text-[11px] font-mono flex items-center gap-1 cursor-pointer transition-colors ${
                          isDay ? "text-stone-600 hover:text-stone-950 font-medium" : "text-zinc-400 hover:text-white"
                        }`}
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedConfig === "claude" ? "Copied!" : "Copy JSON"}</span>
                      </button>
                    </div>
                    <pre
                      className={`p-4 rounded-xl font-mono text-xs overflow-x-auto ${
                        isDay ? "bg-stone-900 text-stone-100 border border-stone-800" : "bg-[#050505] border border-white/10 text-zinc-300"
                      }`}
                    >
                      {claudeJson}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Firm Details */}
            {activeTab === "firm" && (
              <div
                className={`border rounded-2xl p-7 transition-all ${
                  isDay ? "bg-white border-stone-200 shadow-xs" : "bg-[#0a0a0a] border-white/[0.08]"
                }`}
              >
                <div className="mb-6">
                  <h2 className={`text-xl font-sans font-semibold mb-1 ${isDay ? "text-stone-900" : "text-white"}`}>Firm Details</h2>
                  <p className={`text-xs ${isDay ? "text-stone-600 font-medium" : "text-zinc-400"}`}>
                    Your company or agency name is stamped across all review links and client approval certificates.
                  </p>
                </div>

                <div className="space-y-6 max-w-lg">
                  <div>
                    <label className={`block text-xs font-medium mb-1.5 ${isDay ? "text-stone-700 font-semibold" : "text-zinc-400"}`}>
                      Company or Studio Name
                    </label>
                    <input
                      type="text"
                      value={agencyName}
                      onChange={(e) => setAgencyName(e.target.value)}
                      placeholder="e.g. Acme Design Studio"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-sans transition-colors ${
                        isDay
                          ? "bg-white border-stone-300 text-stone-900 focus:border-stone-500 outline-none"
                          : "bg-white/[0.04] border-white/15 text-white focus:border-white/30 outline-none"
                      }`}
                    />
                  </div>

                  <div className={`p-4 rounded-xl border ${isDay ? "bg-stone-50 border-stone-200" : "border-white/10 bg-white/[0.02]"}`}>
                    <div className={`text-[11px] font-mono uppercase tracking-wider mb-1 ${isDay ? "text-stone-500 font-semibold" : "text-zinc-500"}`}>
                      Header Preview
                    </div>
                    <div className="flex items-center gap-2">
                      <TesseractMark size={16} className={isDay ? "text-stone-900" : "text-white"} />
                      <span className={`font-bold text-xs tracking-tight ${isDay ? "text-stone-900" : "text-white"}`}>cyath</span>
                      <span className="text-zinc-400 text-xs">/</span>
                      <span className={`font-medium text-xs ${isDay ? "text-stone-800 font-semibold" : "text-zinc-300"}`}>
                        {agencyName || "Your Firm"}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleSaveFirm}
                      className={`px-5 py-2 rounded-xl text-xs font-mono font-medium transition-all duration-150 active:scale-[0.96] cursor-pointer ${
                        isSaved
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : isDay
                          ? "bg-stone-900 text-white hover:bg-stone-800"
                          : "bg-white text-black hover:bg-zinc-200"
                      }`}
                    >
                      {isSaved ? "Saved" : "Update Firm Details"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Billing */}
            {activeTab === "billing" && (
              <div
                className={`border rounded-2xl p-7 transition-all ${
                  isDay ? "bg-white border-stone-200 shadow-xs" : "bg-[#0a0a0a] border-white/[0.08]"
                }`}
              >
                <div className="mb-6">
                  <h2 className={`text-xl font-sans font-semibold mb-1 ${isDay ? "text-stone-900" : "text-white"}`}>Plans & Billing</h2>
                  <p className={`text-xs ${isDay ? "text-stone-600 font-medium" : "text-zinc-400"}`}>
                    View your active plan, manage seats, or upgrade your workspace.
                  </p>
                </div>

                <div className={`p-5 rounded-2xl border flex items-center justify-between mb-6 ${
                  isDay ? "bg-stone-50 border-stone-200" : "border-white/10 bg-white/[0.03]"
                }`}>
                  <div>
                    <div className={`text-xs font-mono uppercase tracking-wider mb-1 ${isDay ? "text-stone-500 font-semibold" : "text-zinc-500"}`}>
                      Current Plan
                    </div>
                    <div className={`text-lg font-sans font-semibold ${isDay ? "text-stone-900" : "text-white"}`}>
                      {isPro ? "Studio Pro" : "Free Plan"}
                    </div>
                    <div className={`text-xs mt-1 ${isDay ? "text-stone-600" : "text-zinc-400"}`}>
                      {isPro ? "Unlimited canvases & MCP server access" : "Up to 5 review canvases"}
                    </div>
                  </div>

                  <Link
                    href="/pro"
                    className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all duration-150 active:scale-[0.96] cursor-pointer shadow-sm ${
                      isDay
                        ? "bg-stone-900 text-white hover:bg-stone-800"
                        : "bg-white text-black hover:bg-zinc-200"
                    }`}
                  >
                    {isPro ? "Manage Plan" : "Upgrade to Pro"}
                  </Link>
                </div>
              </div>
            )}

            {/* Tab 5: Preferences */}
            {activeTab === "preferences" && (
              <div
                className={`border rounded-2xl p-7 transition-all ${
                  isDay ? "bg-white border-stone-200 shadow-xs" : "bg-[#0a0a0a] border-white/[0.08]"
                }`}
              >
                <div className="mb-6">
                  <h2 className={`text-xl font-sans font-semibold mb-1 ${isDay ? "text-stone-900" : "text-white"}`}>Preferences</h2>
                  <p className={`text-xs ${isDay ? "text-stone-600 font-medium" : "text-zinc-400"}`}>
                    Customize your visual environment and review defaults.
                  </p>
                </div>

                <div className="space-y-6 max-w-lg">
                  <div>
                    <label className={`block text-xs font-medium mb-2 ${isDay ? "text-stone-700 font-semibold" : "text-zinc-400"}`}>
                      Interface Theme
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setThemeGlobally("night")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono border transition-all duration-150 active:scale-[0.96] cursor-pointer ${
                          !isDay ? "bg-white text-black font-semibold border-white" : "border-stone-300 text-stone-700 hover:bg-stone-100"
                        }`}
                      >
                        <Moon className="w-3.5 h-3.5" />
                        <span>Night</span>
                      </button>
                      <button
                        onClick={() => setThemeGlobally("day")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono border transition-all duration-150 active:scale-[0.96] cursor-pointer ${
                          isDay ? "bg-stone-900 text-white font-semibold border-stone-900" : "border-white/20 text-zinc-300 hover:bg-white/10"
                        }`}
                      >
                        <SunMedium className="w-3.5 h-3.5" />
                        <span>Day</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      </main>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <SettingsContent />
    </Suspense>
  );
}
