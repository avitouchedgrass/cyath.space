"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Shield,
  Terminal,
  Zap,
  Download,
  LogOut,
  Copy,
  Check,
  Building,
  Sun,
  Moon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useReviewStore } from "@/store/useReviewStore";
import { TesseractMark } from "@/components/common/Logo";
import { Footer } from "@/components/common/Footer";

type SettingsTab = "profile" | "account" | "mcp" | "billing";

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as SettingsTab) || "profile";

  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [user, setUser] = useState<any>(null);
  const [agencyName, setAgencyName] = useState("");
  const [greetingMessage, setGreetingMessage] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedConfig, setCopiedConfig] = useState<string | null>(null);
  const [mcpClientTab, setMcpClientTab] = useState<"cursor" | "claude" | "cli">("cursor");
  const [theme, setTheme] = useState<"night" | "day">("night");

  const { isPro, proCancelled, cancelPro, projects } = useReviewStore();

  const userProjects = projects.filter((p) => {
    if (!p) return false;
    if (p.ownerId && user?.id) return p.ownerId === user.id;
    if (p.ownerEmail && user?.email) return p.ownerEmail.toLowerCase() === user.email.toLowerCase();
    if (p.agencyName && p.agencyName.includes("@")) {
      return p.agencyName.toLowerCase() === (user?.email || "").toLowerCase();
    }
    return false;
  });

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
          setAgencyName("North Creative Agency");
        }

        const storedGreeting = localStorage.getItem("cyath_staging_greeting");
        if (storedGreeting) setGreetingMessage(storedGreeting);
      } else {
        setAgencyName("My Company");
      }
    });
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      localStorage.setItem("cyath_agency_name", agencyName);
      if (greetingMessage) {
        localStorage.setItem("cyath_staging_greeting", greetingMessage);
      }
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    if (typeof window !== "undefined") {
      localStorage.removeItem("cyath_guest_session");
      localStorage.removeItem("cyath_pro_member");
      localStorage.removeItem("cyath_pro_api_key");
      document.querySelectorAll("iframe").forEach((f) => {
        try {
          f.src = "about:blank";
          f.remove();
        } catch { }
      });
    }
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const handleExportData = () => {
    const backup = {
      agency: agencyName,
      exportedAt: new Date().toISOString(),
      account: user?.email,
      projectsCount: userProjects.length,
      projects: userProjects,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cyath-studio-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
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
    navigator.clipboard.writeText(text);
    if (id === "key") {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedConfig(id);
      setTimeout(() => setCopiedConfig(null), 2000);
    }
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 relative selection:bg-stone-300 selection:text-black font-sans ${isDay ? "bg-[#FBF9F4] text-[#1C1917]" : "bg-black text-white"
        }`}
    >
      <header
        className={`border-b backdrop-blur-xl sticky top-0 z-30 transition-colors ${isDay
            ? "bg-[#FBF9F4]/90 border-stone-200/80"
            : "bg-black/80 border-white/[0.08]"
          }`}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              prefetch={true}
              className="flex items-center gap-2.5 group p-1"
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
              <span className={`text-xs font-mono uppercase px-2 py-0.5 rounded border ml-1 ${
                isDay ? "border-stone-300 text-stone-600 bg-stone-100" : "border-white/20 text-zinc-400 bg-white/5"
              }`}>
                Settings
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full border transition-all cursor-pointer ${isDay
                  ? "bg-stone-100 border-stone-200 text-stone-700 hover:text-stone-900"
                  : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
                }`}
              title={isDay ? "Switch to Night Mode" : "Switch to Day Mode"}
            >
              {isDay ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
            </button>

            {!isPro && (
              <Link
                href="/pro"
                className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold text-xs transition-all shadow-sm ${isDay
                    ? "bg-stone-900 text-white hover:bg-stone-800"
                    : "bg-white text-black hover:bg-zinc-200"
                  }`}
              >
                <Zap className="w-3 h-3 fill-current" />
                <span>Upgrade to Pro ($12/mo)</span>
              </Link>
            )}
            <button
              onClick={handleSignOut}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer ${isDay
                  ? "border-stone-200 bg-white hover:bg-stone-100 text-stone-700 hover:text-stone-900"
                  : "border-white/10 hover:border-white/20 bg-white/[0.03] hover:bg-white/[0.06] text-zinc-300 hover:text-white"
                }`}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Navigation Sidebar */}
          <aside className="md:col-span-4 lg:col-span-3 space-y-2">
            <div
              className={`p-4 rounded-2xl border mb-6 transition-all ${isDay
                  ? "bg-white border-stone-200 shadow-sm"
                  : "bg-[#07070a] border-white/10"
                }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span
                  className={`w-9 h-9 rounded-full border flex items-center justify-center font-mono font-bold text-sm ${isDay
                      ? "bg-stone-100 border-stone-200 text-stone-900"
                      : "bg-white/10 border-white/20 text-white"
                    }`}
                >
                  {agencyName ? agencyName.charAt(0).toUpperCase() : "M"}
                </span>
                <div className="overflow-hidden">
                  <h3
                    className={`font-serif text-sm font-medium truncate ${isDay ? "text-stone-900" : "text-white"
                      }`}
                  >
                    {agencyName || "My Company"}
                  </h3>
                  <span
                    className={`text-[10px] font-mono block truncate ${isDay ? "text-stone-500" : "text-zinc-400"
                      }`}
                  >
                    {user?.email || "Team Member"}
                  </span>
                </div>
              </div>
              <div
                className={`pt-2 border-t flex items-center justify-between text-[11px] font-mono ${isDay ? "border-stone-100" : "border-white/10"
                  }`}
              >
                <span className={isDay ? "text-stone-500" : "text-zinc-500"}>Plan:</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] uppercase font-semibold ${isPro
                      ? isDay
                        ? "bg-stone-900 text-white"
                        : "bg-white text-black"
                      : isDay
                        ? "bg-stone-100 text-stone-700"
                        : "bg-white/10 text-zinc-300"
                    }`}
                >
                  {isPro ? "Pro Plan" : "Free Plan"}
                </span>
              </div>
            </div>

            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab("profile")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${activeTab === "profile"
                    ? isDay
                      ? "bg-stone-900 text-white font-semibold shadow-sm"
                      : "bg-white text-black font-semibold shadow-sm"
                    : isDay
                      ? "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                      : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                  }`}
              >
                <Building className="w-4 h-4" />
                <span>Company Profile</span>
              </button>

              <button
                onClick={() => setActiveTab("account")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${activeTab === "account"
                    ? isDay
                      ? "bg-stone-900 text-white font-semibold shadow-sm"
                      : "bg-white text-black font-semibold shadow-sm"
                    : isDay
                      ? "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                      : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                  }`}
              >
                <Shield className="w-4 h-4" />
                <span>Account & Security</span>
              </button>

              <button
                onClick={() => setActiveTab("mcp")}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${activeTab === "mcp"
                    ? isDay
                      ? "bg-stone-900 text-white font-semibold shadow-sm"
                      : "bg-white text-black font-semibold shadow-sm"
                    : isDay
                      ? "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                      : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Terminal className="w-4 h-4" />
                  <span>Autonomous MCP</span>
                </div>
                {!isPro && (
                  <span
                    className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${isDay ? "bg-stone-200 text-stone-700" : "bg-white/10 text-zinc-400"
                      }`}
                  >
                    Pro
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab("billing")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${activeTab === "billing"
                    ? isDay
                      ? "bg-stone-900 text-white font-semibold shadow-sm"
                      : "bg-white text-black font-semibold shadow-sm"
                    : isDay
                      ? "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                      : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                  }`}
              >
                <Zap className="w-4 h-4" />
                <span>Plan & Subscription</span>
              </button>
            </nav>
          </aside>

          {/* Right Content Surface */}
          <section className="md:col-span-8 lg:col-span-9 animate-in fade-in duration-200">
            {/* Tab 1: Profile */}
            {activeTab === "profile" && (
              <div className="space-y-8">
                <div>
                  <h1
                    className={`text-2xl font-serif font-medium tracking-tight mb-2 ${isDay ? "text-stone-900" : "text-white"
                      }`}
                  >
                    Company Profile & Branding
                  </h1>
                  <p
                    className={`text-sm leading-relaxed max-w-2xl ${isDay ? "text-stone-600" : "text-zinc-400"
                      }`}
                  >
                    Configure your firm or company name and default presentation details shown to clients on shareable staging viewports.
                  </p>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-6">
                  <div
                    className={`p-6 rounded-2xl border space-y-6 ${isDay
                        ? "bg-white border-stone-200 shadow-sm"
                        : "bg-[#07070a] border-white/15"
                      }`}
                  >
                    <div>
                      <label
                        className={`block text-xs font-mono uppercase tracking-wider mb-2 ${isDay ? "text-stone-700" : "text-zinc-300"
                          }`}
                      >
                        Company / Firm Name
                      </label>
                      <input
                        type="text"
                        required
                        value={agencyName}
                        onChange={(e) => setAgencyName(e.target.value)}
                        placeholder="e.g. North Creative Agency"
                        className={`w-full max-w-md rounded-xl px-4 py-3 text-sm font-mono border focus:outline-none transition-all ${isDay
                            ? "bg-stone-50 border-stone-300 text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-stone-900"
                            : "bg-white/[0.04] border-white/15 text-white placeholder:text-zinc-600 focus:border-white/50 focus:ring-1 focus:ring-white/20"
                          }`}
                      />
                      <p
                        className={`text-xs mt-2 ${isDay ? "text-stone-500" : "text-zinc-500"
                          }`}
                      >
                        This name appears in milestone approval certificates and link previews.
                      </p>
                    </div>

                    <div
                      className={`pt-6 border-t ${isDay ? "border-stone-100" : "border-white/10"
                        }`}
                    >
                      <label
                        className={`block text-xs font-mono uppercase tracking-wider mb-2 ${isDay ? "text-stone-700" : "text-zinc-300"
                          }`}
                      >
                        Default Client Greeting (Optional)
                      </label>
                      <textarea
                        rows={3}
                        value={greetingMessage}
                        onChange={(e) => setGreetingMessage(e.target.value)}
                        placeholder="Welcome to our design review. Click anywhere on the viewport to annotate feedback."
                        className={`w-full max-w-lg rounded-xl p-3.5 text-sm resize-none font-sans border focus:outline-none transition-all ${isDay
                            ? "bg-stone-50 border-stone-300 text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-stone-900"
                            : "bg-white/[0.04] border-white/15 text-white placeholder:text-zinc-600 focus:border-white/50 focus:ring-1 focus:ring-white/20"
                          }`}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <button
                      type="submit"
                      className={`px-6 py-3 font-semibold text-xs rounded-xl transition-all shadow-sm cursor-pointer ${isDay
                          ? "bg-stone-900 text-white hover:bg-stone-800"
                          : "bg-white text-black hover:bg-zinc-200"
                        }`}
                    >
                      {isSaved ? "Saved ✓" : "Save Profile Changes"}
                    </button>
                    {isSaved && (
                      <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 animate-in fade-in">
                        Settings stored successfully.
                      </span>
                    )}
                  </div>
                </form>
              </div>
            )}

            {/* Tab 2: Account & Security */}
            {activeTab === "account" && (
              <div className="space-y-8">
                <div>
                  <h1
                    className={`text-2xl font-serif font-medium tracking-tight mb-2 ${isDay ? "text-stone-900" : "text-white"
                      }`}
                  >
                    Account & Security
                  </h1>
                  <p
                    className={`text-sm leading-relaxed max-w-2xl ${isDay ? "text-stone-600" : "text-zinc-400"
                      }`}
                  >
                    Manage your authenticated credentials, session tokens, and local cache backups.
                  </p>
                </div>

                <div
                  className={`p-6 rounded-2xl border space-y-6 ${isDay
                      ? "bg-white border-stone-200 shadow-sm"
                      : "bg-[#07070a] border-white/15"
                    }`}
                >
                  <div
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b ${isDay ? "border-stone-100" : "border-white/10"
                      }`}
                  >
                    <div>
                      <span
                        className={`text-xs font-mono uppercase tracking-wider block mb-1 ${isDay ? "text-stone-500" : "text-zinc-400"
                          }`}
                      >
                        Primary Authentication
                      </span>
                      <span
                        className={`text-base font-serif font-medium ${isDay ? "text-stone-900" : "text-white"
                          }`}
                      >
                        {user?.email || "Anonymous Local Session"}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-mono px-3 py-1 rounded-full border self-start sm:self-auto ${isDay
                          ? "bg-stone-100 border-stone-200 text-stone-800"
                          : "bg-white/10 border-white/20 text-zinc-200"
                        }`}
                    >
                      Session Active
                    </span>
                  </div>

                  <div
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b ${isDay ? "border-stone-100" : "border-white/10"
                      }`}
                  >
                    <div>
                      <span
                        className={`text-xs font-mono uppercase tracking-wider block mb-1 ${isDay ? "text-stone-500" : "text-zinc-400"
                          }`}
                      >
                        Studio Data Export
                      </span>
                      <p
                        className={`text-xs ${isDay ? "text-stone-600" : "text-zinc-400"
                          }`}
                      >
                        Download a machine-readable JSON archive containing all canvas pins, threads, and sign-offs.
                      </p>
                    </div>
                    <button
                      onClick={handleExportData}
                      className={`px-4 py-2.5 rounded-xl border text-xs font-mono flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto ${isDay
                          ? "border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-900"
                          : "border-white/15 hover:border-white/30 bg-white/[0.04] hover:bg-white/[0.08] text-white"
                        }`}
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export Archive (.json)</span>
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span
                        className={`text-xs font-mono uppercase tracking-wider block mb-1 ${isDay ? "text-stone-500" : "text-zinc-400"
                          }`}
                      >
                        Session Exit
                      </span>
                      <p
                        className={`text-xs ${isDay ? "text-stone-600" : "text-zinc-400"
                          }`}
                      >
                        Sign out of this workstation to clear local session tokens.
                      </p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className={`px-4 py-2.5 rounded-xl border text-xs font-mono flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto ${isDay
                          ? "border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800"
                          : "border-rose-500/20 hover:border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300"
                        }`}
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Terminate Session</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Model Context Protocol (MCP) */}
            {activeTab === "mcp" && (
              <div className="space-y-8">
                <div>
                  <h1
                    className={`text-2xl font-serif font-medium tracking-tight mb-2 ${isDay ? "text-stone-900" : "text-white"
                      }`}
                  >
                    Autonomous MCP Agent Pipeline
                  </h1>
                  <p
                    className={`text-sm leading-relaxed max-w-2xl ${isDay ? "text-stone-600" : "text-zinc-400"
                      }`}
                  >
                    Connect AI coding agents (Cursor, Claude Code, Antigravity) directly to your review threads. Agents autonomously inspect visual annotations and push code fixes directly to git branches.
                  </p>
                </div>

                {!isPro && (
                  <div
                    className={`p-6 rounded-2xl border relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xl ${isDay
                        ? "bg-white border-stone-200"
                        : "bg-gradient-to-b from-[#111116] to-[#07070a] border-white/20"
                      }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Zap className={`w-4 h-4 ${isDay ? "text-stone-900" : "text-white"}`} />
                        <h2
                          className={`font-serif text-lg font-medium ${isDay ? "text-stone-900" : "text-white"
                            }`}
                        >
                          Cyath Pro Exclusive
                        </h2>
                      </div>
                      <p
                        className={`text-xs max-w-md leading-relaxed ${isDay ? "text-stone-600" : "text-zinc-300"
                          }`}
                      >
                        Autonomous MCP integration is reserved for Cyath Pro members. Unlock continuous agent loops, live pin telemetry, and automated PR generation.
                      </p>
                    </div>
                    <Link
                      href="/pro"
                      className={`px-5 py-3 rounded-xl font-semibold text-xs transition-colors shadow-md whitespace-nowrap self-start sm:self-auto ${isDay
                          ? "bg-stone-900 text-white hover:bg-stone-800"
                          : "bg-white text-black hover:bg-zinc-200"
                        }`}
                    >
                      Unlock MCP Keycard ($12/mo) →
                    </Link>
                  </div>
                )}

                {isPro && (
                  <div
                    className={`p-6 rounded-2xl border space-y-6 ${isDay
                        ? "bg-white border-stone-200 shadow-sm"
                        : "bg-[#07070a] border-white/15"
                      }`}
                  >
                    {/* Keycard display */}
                    <div>
                      <label
                        className={`block text-xs font-mono uppercase tracking-wider mb-2 ${isDay ? "text-stone-700" : "text-zinc-400"
                          }`}
                      >
                        Studio MCP License Key
                      </label>
                      <div className="flex items-center gap-2 max-w-xl">
                        <input
                          type="password"
                          readOnly
                          value={mcpKey}
                          className={`flex-1 rounded-xl px-4 py-2.5 text-xs font-mono tracking-wider border ${isDay
                              ? "bg-stone-50 border-stone-200 text-stone-900"
                              : "bg-white/[0.04] border-white/15 text-zinc-300"
                            }`}
                        />
                        <button
                          onClick={() => copyToClipboard(mcpKey, "key")}
                          className={`px-4 py-2.5 rounded-xl border text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer ${isDay
                              ? "border-stone-200 bg-stone-100 hover:bg-stone-200 text-stone-900"
                              : "border-white/15 hover:border-white/30 bg-white/[0.05] hover:bg-white/[0.1] text-white"
                            }`}
                        >
                          {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedKey ? "Copied" : "Copy Key"}</span>
                        </button>
                      </div>
                    </div>

                    {/* Client Setup Instructions */}
                    <div
                      className={`pt-6 border-t space-y-4 ${isDay ? "border-stone-100" : "border-white/10"
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-mono uppercase tracking-wider ${isDay ? "text-stone-600" : "text-zinc-400"
                            }`}
                        >
                          Configuration Template:
                        </span>
                        <div
                          className={`flex items-center p-1 rounded-lg border ${isDay
                              ? "bg-stone-100 border-stone-200"
                              : "bg-white/[0.04] border-white/10"
                            }`}
                        >
                          {(["cursor", "claude", "cli"] as const).map((tab) => (
                            <button
                              key={tab}
                              onClick={() => setMcpClientTab(tab)}
                              className={`px-3 py-1 rounded text-xs font-mono uppercase transition-all cursor-pointer ${mcpClientTab === tab
                                  ? isDay
                                    ? "bg-stone-900 text-white font-semibold shadow-sm"
                                    : "bg-white text-black font-semibold shadow-sm"
                                  : isDay
                                    ? "text-stone-600 hover:text-stone-900"
                                    : "text-zinc-400 hover:text-white"
                                }`}
                            >
                              {tab}
                            </button>
                          ))}
                        </div>
                      </div>

                      {mcpClientTab === "cursor" && (
                        <div className="space-y-3">
                          <p
                            className={`text-xs ${isDay ? "text-stone-600" : "text-zinc-400"
                              }`}
                          >
                            Add to{" "}
                            <code
                              className={`px-1 py-0.5 rounded ${isDay ? "bg-stone-100 text-stone-900" : "bg-white/10 text-zinc-200"
                                }`}
                            >
                              ~/.cursor/mcp.json
                            </code>{" "}
                            or Settings → MCP:
                          </p>
                          <div className="relative">
                            <pre className="p-4 rounded-xl bg-[#0c0c0f] border border-stone-800 text-xs font-mono text-stone-200 overflow-x-auto leading-relaxed">
                              {cursorJson}
                            </pre>
                            <button
                              onClick={() => copyToClipboard(cursorJson, "cursor")}
                              className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-mono text-white flex items-center gap-1.5 cursor-pointer"
                            >
                              {copiedConfig === "cursor" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedConfig === "cursor" ? "Copied" : "Copy JSON"}</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {mcpClientTab === "claude" && (
                        <div className="space-y-3">
                          <p
                            className={`text-xs ${isDay ? "text-stone-600" : "text-zinc-400"
                              }`}
                          >
                            Add to Claude Desktop{" "}
                            <code
                              className={`px-1 py-0.5 rounded ${isDay ? "bg-stone-100 text-stone-900" : "bg-white/10 text-zinc-200"
                                }`}
                            >
                              claude_desktop_config.json
                            </code>
                            :
                          </p>
                          <div className="relative">
                            <pre className="p-4 rounded-xl bg-[#0c0c0f] border border-stone-800 text-xs font-mono text-stone-200 overflow-x-auto leading-relaxed">
                              {claudeJson}
                            </pre>
                            <button
                              onClick={() => copyToClipboard(claudeJson, "claude")}
                              className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-mono text-white flex items-center gap-1.5 cursor-pointer"
                            >
                              {copiedConfig === "claude" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedConfig === "claude" ? "Copied" : "Copy JSON"}</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {mcpClientTab === "cli" && (
                        <div className="space-y-3">
                          <p
                            className={`text-xs ${isDay ? "text-stone-600" : "text-zinc-400"
                              }`}
                          >
                            Inspect and resolve pins directly from your terminal:
                          </p>
                          <pre className="p-4 rounded-xl bg-[#0c0c0f] border border-stone-800 text-xs font-mono text-stone-200 overflow-x-auto leading-relaxed">
                            {`# Inspect unresolved client annotations\n$ npx cyath-mcp inspect --canvas <shareId>\n\n# Push code resolution\n$ npx cyath-mcp resolve <pinId> --msg "Fixed header layout"`}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 4: Billing & Subscription */}
            {activeTab === "billing" && (
              <div className="space-y-8">
                <div>
                  <h1
                    className={`text-2xl font-serif font-medium tracking-tight mb-2 ${isDay ? "text-stone-900" : "text-white"
                      }`}
                  >
                    Plan & Subscription
                  </h1>
                  <p
                    className={`text-sm leading-relaxed max-w-2xl ${isDay ? "text-stone-600" : "text-zinc-400"
                      }`}
                  >
                    Review your workspace subscription tier, seat allocations, and milestone sign-off capabilities.
                  </p>
                </div>

                <div
                  className={`p-6 rounded-2xl border space-y-6 ${isDay
                      ? "bg-white border-stone-200 shadow-sm"
                      : "bg-[#07070a] border-white/15"
                    }`}
                >
                  <div
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b ${isDay ? "border-stone-100" : "border-white/10"
                      }`}
                  >
                    <div>
                      <span
                        className={`text-xs font-mono uppercase tracking-wider block mb-1 ${isDay ? "text-stone-500" : "text-zinc-400"
                          }`}
                      >
                        Active Membership
                      </span>
                      <h2
                        className={`text-xl font-serif font-medium ${isDay ? "text-stone-900" : "text-white"
                          }`}
                      >
                        {isPro ? "Cyath Pro Plan" : proCancelled ? "Pro Membership Cancelled" : "Free Plan"}
                      </h2>
                      <p
                        className={`text-xs mt-1 ${isDay ? "text-stone-600" : "text-zinc-400"
                          }`}
                      >
                        {isPro
                          ? "Includes unlimited review staging viewports and autonomous MCP agents."
                          : proCancelled
                            ? "Your subscription has ended. Canvases are locked in read-only mode until reactivated."
                            : "Basic staging review with local annotation threads."}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 self-start sm:self-auto">
                      {isPro ? (
                        <button
                          onClick={() => {
                            if (window.confirm("Cancel your Cyath Pro membership? Your review viewports and MCP integrations will be locked until reactivated.")) {
                              cancelPro();
                            }
                          }}
                          className={`px-4 py-2 rounded-xl text-xs font-mono border transition-colors cursor-pointer ${isDay
                              ? "border-red-200 text-red-600 hover:bg-red-50"
                              : "border-red-500/30 text-red-400 hover:bg-red-500/10"
                            }`}
                        >
                          Cancel Membership
                        </button>
                      ) : (
                        <Link
                          href="/pro"
                          prefetch={true}
                          className={`px-5 py-2.5 rounded-xl font-semibold text-xs transition-colors shadow-sm whitespace-nowrap ${isDay
                              ? "bg-stone-900 text-white hover:bg-stone-800"
                              : "bg-white text-black hover:bg-zinc-200"
                            }`}
                        >
                          {proCancelled ? "Reactivate Pro ($12/mo)" : "Upgrade to Pro ($12/mo)"}
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div
                      className={`p-4 rounded-xl border ${isDay ? "bg-stone-50 border-stone-200" : "bg-white/[0.02] border-white/10"
                        }`}
                    >
                      <span
                        className={`text-[10px] font-mono uppercase block mb-1 ${isDay ? "text-stone-500" : "text-zinc-500"
                          }`}
                      >
                        Active Canvases
                      </span>
                      <span
                        className={`text-xl font-serif ${isDay ? "text-stone-900" : "text-white"
                          }`}
                      >
                        {userProjects.length}
                      </span>
                      <span
                        className={`text-[11px] font-mono block mt-1 ${isDay ? "text-stone-500" : "text-zinc-500"
                          }`}
                      >
                        {isPro ? "Unlimited" : "Up to 5 on free tier"}
                      </span>
                    </div>

                    <div
                      className={`p-4 rounded-xl border ${isDay ? "bg-stone-50 border-stone-200" : "bg-white/[0.02] border-white/10"
                        }`}
                    >
                      <span
                        className={`text-[10px] font-mono uppercase block mb-1 ${isDay ? "text-stone-500" : "text-zinc-500"
                          }`}
                      >
                        MCP Keycards
                      </span>
                      <span
                        className={`text-xl font-serif ${isDay ? "text-stone-900" : "text-white"
                          }`}
                      >
                        {isPro ? "1 Active" : "0"}
                      </span>
                      <span
                        className={`text-[11px] font-mono block mt-1 ${isDay ? "text-stone-500" : "text-zinc-500"
                          }`}
                      >
                        {isPro ? "Autonomous Loop Active" : "Requires Pro"}
                      </span>
                    </div>

                    <div
                      className={`p-4 rounded-xl border ${isDay ? "bg-stone-50 border-stone-200" : "bg-white/[0.02] border-white/10"
                        }`}
                    >
                      <span
                        className={`text-[10px] font-mono uppercase block mb-1 ${isDay ? "text-stone-500" : "text-zinc-500"
                          }`}
                      >
                        Milestone Deeds
                      </span>
                      <span
                        className={`text-xl font-serif ${isDay ? "text-stone-900" : "text-white"
                          }`}
                      >
                        Unlimited
                      </span>
                      <span
                        className={`text-[11px] font-mono block mt-1 ${isDay ? "text-stone-500" : "text-zinc-500"
                          }`}
                      >
                        Zero Scope Creep Seals
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer theme={theme} />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center text-xs text-zinc-500 font-mono">
          Loading settings...
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
