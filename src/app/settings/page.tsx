"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  User,
  Shield,
  Terminal,
  Zap,
  Download,
  LogOut,
  Copy,
  Check,
  Building,
  KeyRound,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useReviewStore } from "@/store/useReviewStore";
import { TesseractMark } from "@/components/common/Logo";

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
          setAgencyName("North Creative Agency");
        }

        const storedGreeting = localStorage.getItem("cyath_staging_greeting");
        if (storedGreeting) setGreetingMessage(storedGreeting);
      } else {
        // Fallback for guest testing
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
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleExportData = () => {
    const backup = {
      agency: agencyName,
      exportedAt: new Date().toISOString(),
      account: user?.email,
      projectsCount: projects.length,
      projects,
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
    <div className="min-h-screen bg-[#000000] text-white selection:bg-white selection:text-black font-sans">
      {/* Top Header */}
      <header className="border-b border-white/[0.08] bg-[#000000]/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-zinc-400 hover:text-white transition-all flex items-center gap-2 text-xs font-mono"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Link>
            <div className="h-4 w-px bg-white/15" />
            <div className="flex items-center gap-2.5">
              <TesseractMark size={22} />
              <span className="font-serif text-sm font-medium tracking-wide text-white">
                Studio Settings
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isPro && (
              <Link
                href="/pro"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-black font-semibold text-xs transition-all hover:bg-zinc-200 shadow-sm"
              >
                <Zap className="w-3 h-3 fill-black" />
                <span>Upgrade to Pro ($12/mo)</span>
              </Link>
            )}
            <button
              onClick={handleSignOut}
              className="px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 bg-white/[0.03] hover:bg-white/[0.06] text-zinc-300 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container with Generous Breathing Room */}
      <main className="max-w-6xl mx-auto px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Navigation Sidebar */}
          <aside className="md:col-span-4 lg:col-span-3 space-y-2">
            <div className="p-4 rounded-2xl border border-white/10 bg-[#07070a] mb-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-mono font-bold text-sm text-white">
                  {agencyName ? agencyName.charAt(0).toUpperCase() : "M"}
                </span>
                <div className="overflow-hidden">
                  <h3 className="font-serif text-sm font-medium text-white truncate">
                    {agencyName || "My Company"}
                  </h3>
                  <span className="text-[10px] font-mono text-zinc-400 block truncate">
                    {user?.email || "Team Member"}
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-mono">
                <span className="text-zinc-500">Plan:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-semibold ${isPro ? "bg-white text-black" : "bg-white/10 text-zinc-300"}`}>
                  {isPro ? "Pro Plan" : "Free Plan"}
                </span>
              </div>
            </div>

            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab("profile")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                  activeTab === "profile"
                    ? "bg-white text-black font-semibold shadow-sm"
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                <Building className="w-4 h-4" />
                <span>Company Profile</span>
              </button>

              <button
                onClick={() => setActiveTab("account")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                  activeTab === "account"
                    ? "bg-white text-black font-semibold shadow-sm"
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Account & Security</span>
              </button>

              <button
                onClick={() => setActiveTab("mcp")}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                  activeTab === "mcp"
                    ? "bg-white text-black font-semibold shadow-sm"
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Terminal className="w-4 h-4" />
                  <span>Autonomous MCP</span>
                </div>
                {!isPro && (
                  <span className="text-[9px] font-mono uppercase bg-white/10 text-zinc-400 px-1.5 py-0.5 rounded">
                    Pro
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab("billing")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                  activeTab === "billing"
                    ? "bg-white text-black font-semibold shadow-sm"
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>Plan & Subscription</span>
              </button>
            </nav>
          </aside>

          {/* Right Content Surface */}
          <section className="md:col-span-8 lg:col-span-9">
            {/* Tab 1: Profile */}
            {activeTab === "profile" && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-2xl font-serif font-medium text-white tracking-tight mb-2">
                    Company Profile & Branding
                  </h1>
                  <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
                    Configure your agency or company name and default presentation details shown to clients on shareable staging viewports.
                  </p>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-6">
                  <div className="p-6 rounded-2xl border border-white/15 bg-[#07070a] space-y-6">
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-2">
                        Company / Agency Name
                      </label>
                      <input
                        type="text"
                        required
                        value={agencyName}
                        onChange={(e) => setAgencyName(e.target.value)}
                        placeholder="e.g. North Creative Agency"
                        className="w-full max-w-md bg-white/[0.04] border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/20 font-mono"
                      />
                      <p className="text-xs text-zinc-500 mt-2">
                        This name appears in milestone approval certificates and link previews.
                      </p>
                    </div>

                    <div className="pt-6 border-t border-white/10">
                      <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-2">
                        Default Client Greeting (Optional)
                      </label>
                      <textarea
                        rows={3}
                        value={greetingMessage}
                        onChange={(e) => setGreetingMessage(e.target.value)}
                        placeholder="Welcome to our design review. Click anywhere on the viewport to annotate feedback."
                        className="w-full max-w-lg bg-white/[0.04] border border-white/15 rounded-xl p-3.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/20 resize-none font-sans"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <button
                      type="submit"
                      className="px-6 py-3 bg-white text-black font-semibold text-xs rounded-xl hover:bg-zinc-200 transition-colors shadow-sm cursor-pointer"
                    >
                      {isSaved ? "Saved ✓" : "Save Profile Changes"}
                    </button>
                    {isSaved && (
                      <span className="text-xs font-mono text-emerald-400 animate-in fade-in">
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
                  <h1 className="text-2xl font-serif font-medium text-white tracking-tight mb-2">
                    Account & Security
                  </h1>
                  <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
                    Manage your authenticated credentials, session tokens, and local cache backups.
                  </p>
                </div>

                <div className="p-6 rounded-2xl border border-white/15 bg-[#07070a] space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
                    <div>
                      <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 block mb-1">
                        Primary Authentication
                      </span>
                      <span className="text-base font-serif font-medium text-white">
                        {user?.email || "Anonymous Local Session"}
                      </span>
                    </div>
                    <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 self-start sm:self-auto">
                      Session Active
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
                    <div>
                      <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 block mb-1">
                        Studio Data Export
                      </span>
                      <p className="text-xs text-zinc-400">
                        Download a machine-readable JSON archive containing all canvas pins, threads, and sign-offs.
                      </p>
                    </div>
                    <button
                      onClick={handleExportData}
                      className="px-4 py-2.5 rounded-xl border border-white/15 hover:border-white/30 bg-white/[0.04] hover:bg-white/[0.08] text-white text-xs font-mono flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
                    >
                      <Download className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Export Archive (.json)</span>
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 block mb-1">
                        Terminal Session Exit
                      </span>
                      <p className="text-xs text-zinc-400">
                        Sign out of this workstation to invalidate all cached session tokens.
                      </p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="px-4 py-2.5 rounded-xl border border-rose-500/20 hover:border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-mono flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
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
                  <h1 className="text-2xl font-serif font-medium text-white tracking-tight mb-2">
                    Autonomous MCP Agent Pipeline
                  </h1>
                  <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
                    Connect AI coding agents (Cursor, Claude Code, Antigravity) directly to your review threads. Agents autonomously inspect visual annotations and push code fixes directly to git branches.
                  </p>
                </div>

                {!isPro && (
                  <div className="p-6 rounded-2xl border border-white/20 bg-gradient-to-b from-[#111116] to-[#07070a] relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xl">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-white" />
                        <h2 className="font-serif text-lg font-medium text-white">
                          Cyath Pro Exclusive
                        </h2>
                      </div>
                      <p className="text-xs text-zinc-300 max-w-md leading-relaxed">
                        Autonomous MCP integration is reserved for Cyath Pro members. Unlock continuous agent loops, live pin telemetry, and automated PR generation.
                      </p>
                    </div>
                    <Link
                      href="/pro"
                      className="px-5 py-3 rounded-xl bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-colors shadow-md whitespace-nowrap self-start sm:self-auto"
                    >
                      Unlock MCP Keycard ($12/mo) →
                    </Link>
                  </div>
                )}

                <div className="p-6 rounded-2xl border border-white/15 bg-[#07070a] space-y-6">
                  {/* Keycard display */}
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-2">
                      Studio MCP License Key
                    </label>
                    <div className="flex items-center gap-2 max-w-xl">
                      <input
                        type="password"
                        readOnly
                        value={mcpKey}
                        className="flex-1 bg-white/[0.04] border border-white/15 rounded-xl px-4 py-2.5 text-xs text-zinc-300 font-mono tracking-wider"
                      />
                      <button
                        onClick={() => copyToClipboard(mcpKey, "key")}
                        className="px-4 py-2.5 rounded-xl border border-white/15 hover:border-white/30 bg-white/[0.05] hover:bg-white/[0.1] text-white text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey ? "Copied" : "Copy Key"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Client Setup Instructions */}
                  <div className="pt-6 border-t border-white/10 space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                        Configuration Template:
                      </span>
                      <div className="flex items-center bg-white/[0.04] p-1 rounded-lg border border-white/10">
                        {(["cursor", "claude", "cli"] as const).map((tab) => (
                          <button
                            key={tab}
                            onClick={() => setMcpClientTab(tab)}
                            className={`px-3 py-1 rounded text-xs font-mono uppercase transition-all cursor-pointer ${
                              mcpClientTab === tab
                                ? "bg-white text-black font-semibold shadow-sm"
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
                        <p className="text-xs text-zinc-400">
                          Add to <code className="text-zinc-200 bg-white/10 px-1 py-0.5 rounded">~/.cursor/mcp.json</code> or Settings → MCP:
                        </p>
                        <div className="relative">
                          <pre className="p-4 rounded-xl bg-black border border-white/10 text-xs font-mono text-zinc-300 overflow-x-auto leading-relaxed">
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
                        <p className="text-xs text-zinc-400">
                          Add to Claude Desktop <code className="text-zinc-200 bg-white/10 px-1 py-0.5 rounded">claude_desktop_config.json</code>:
                        </p>
                        <div className="relative">
                          <pre className="p-4 rounded-xl bg-black border border-white/10 text-xs font-mono text-zinc-300 overflow-x-auto leading-relaxed">
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
                        <p className="text-xs text-zinc-400">
                          Inspect and resolve pins directly from your terminal:
                        </p>
                        <pre className="p-4 rounded-xl bg-black border border-white/10 text-xs font-mono text-zinc-300 overflow-x-auto leading-relaxed">
                          {`# Inspect unresolved client annotations\n$ npx cyath-mcp inspect --canvas <shareId>\n\n# Push code resolution\n$ npx cyath-mcp resolve <pinId> --msg "Fixed header layout"`}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Billing & Subscription */}
            {activeTab === "billing" && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-2xl font-serif font-medium text-white tracking-tight mb-2">
                    Plan & Subscription
                  </h1>
                  <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
                    Review your workspace subscription tier, seat allocations, and milestone sign-off capabilities.
                  </p>
                </div>

                <div className="p-6 rounded-2xl border border-white/15 bg-[#07070a] space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
                    <div>
                      <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 block mb-1">
                        Active Membership
                      </span>
                      <h2 className="text-xl font-serif font-medium text-white">
                        {isPro ? "Cyath Pro Plan" : "Free Plan"}
                      </h2>
                      <p className="text-xs text-zinc-400 mt-1">
                        {isPro
                          ? "Includes unlimited review staging viewports and autonomous MCP agents."
                          : "Basic staging review with local annotation threads."}
                      </p>
                    </div>

                    <Link
                      href="/pro"
                      className="px-5 py-2.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-colors shadow-sm self-start sm:self-auto whitespace-nowrap"
                    >
                      {isPro ? "Manage Billing" : "Upgrade to Studio Pro ($12/mo)"}
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10">
                      <span className="text-[10px] font-mono uppercase text-zinc-500 block mb-1">Active Canvases</span>
                      <span className="text-xl font-serif text-white">{projects.length}</span>
                      <span className="text-[11px] font-mono text-zinc-500 block mt-1">
                        {isPro ? "Unlimited" : "Up to 5 on free tier"}
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10">
                      <span className="text-[10px] font-mono uppercase text-zinc-500 block mb-1">MCP Keycards</span>
                      <span className="text-xl font-serif text-white">{isPro ? "1 Active" : "0"}</span>
                      <span className="text-[11px] font-mono text-zinc-500 block mt-1">
                        {isPro ? "Autonomous Loop Active" : "Requires Pro"}
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10">
                      <span className="text-[10px] font-mono uppercase text-zinc-500 block mb-1">Milestone Deeds</span>
                      <span className="text-xl font-serif text-white">Unlimited</span>
                      <span className="text-[11px] font-mono text-zinc-500 block mt-1">
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
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#000000] flex items-center justify-center text-xs text-zinc-500 font-mono">
          Loading studio settings...
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}

