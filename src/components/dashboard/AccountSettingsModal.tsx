"use client";

import React, { useState, useMemo } from "react";
import { X, ArrowUpRight, LogOut, Download, Key, Terminal, Copy, Check, ShieldCheck, Code2, Globe } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { useReviewStore } from "@/store/useReviewStore";
import { TesseractMark } from "@/components/common/Logo";

interface AccountSettingsModalProps {
  user: User | null;
  agencyName: string;
  isPro?: boolean;
  theme?: "night" | "day";
  onUpdateAgencyName: (name: string) => void;
  onSignOut: () => void;
  onOpenUpgrade: () => void;
  onClose: () => void;
}

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({
  user,
  agencyName,
  isPro = false,
  theme = "night",
  onUpdateAgencyName,
  onSignOut,
  onOpenUpgrade,
  onClose,
}) => {
  const [editingAgency, setEditingAgency] = useState(agencyName);
  const [isSaved, setIsSaved] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedConfig, setCopiedConfig] = useState(false);
  const [activeConfigTab, setActiveConfigTab] = useState<"cursor" | "claude" | "cli">("cursor");
  const rawProjects = useReviewStore((s) => s.projects);
  const projects = useMemo(() => {
    return rawProjects.filter((p) => {
      if (!p) return false;
      if (p.ownerId && user?.id) return p.ownerId === user.id;
      if (p.ownerEmail && user?.email) return p.ownerEmail.toLowerCase() === user.email.toLowerCase();
      if (p.agencyName && p.agencyName.includes("@")) {
        return p.agencyName.toLowerCase() === (user?.email || "").toLowerCase();
      }
      return false;
    });
  }, [rawProjects, user]);

  const isDay = theme === "day";

  const apiKey = useMemo(() => {
    const seed = user?.id || user?.email || "studio_member";
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, "0");
    const suffix = seed.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toLowerCase();
    return `cyath_pro_${hex}_${suffix || "studio"}`;
  }, [user]);

  const cursorConfigJson = useMemo(() => {
    return JSON.stringify(
      {
        mcpServers: {
          cyath: {
            command: "npx",
            args: ["-y", "cyath-mcp@latest"],
            env: {
              CYATH_API_KEY: apiKey,
              CYATH_STAGING_ENDPOINT: "https://cyath-space.vercel.app/api/mcp",
            },
          },
        },
      },
      null,
      2
    );
  }, [apiKey]);

  const claudeConfigJson = useMemo(() => {
    return JSON.stringify(
      {
        mcpServers: {
          "cyath-reviews": {
            command: "npx",
            args: ["-y", "cyath-mcp@latest"],
            env: {
              CYATH_API_KEY: apiKey,
            },
          },
        },
      },
      null,
      2
    );
  }, [apiKey]);

  const cliEnvSnippet = useMemo(() => {
    return `# Export to your environment (.env.local or ~/.bashrc)\nexport CYATH_API_KEY="${apiKey}"\nexport CYATH_STAGING_ENDPOINT="https://cyath-space.vercel.app/api/mcp"\n\n# Run inspector directly\nnpx cyath-mcp --test`;
  }, [apiKey]);

  const activeSnippet = useMemo(() => {
    switch (activeConfigTab) {
      case "cursor":
        return cursorConfigJson;
      case "claude":
        return claudeConfigJson;
      case "cli":
        return cliEnvSnippet;
    }
  }, [activeConfigTab, cursorConfigJson, claudeConfigJson, cliEnvSnippet]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAgency.trim()) return;
    onUpdateAgencyName(editingAgency.trim());
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopyConfig = () => {
    navigator.clipboard.writeText(activeSnippet);
    setCopiedConfig(true);
    setTimeout(() => setCopiedConfig(false), 2000);
  };

  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(projects, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `cyath_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-2xl animate-in fade-in duration-200 selection:bg-white selection:text-black font-sans">
      <div
        className={`w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col relative max-h-[92vh] animate-in zoom-in-95 duration-200 border transition-all ${
          isDay
            ? "bg-white border-stone-200 text-stone-900 shadow-[0_25px_90px_rgba(0,0,0,0.15)]"
            : "bg-[#070709] border-white/20 text-white shadow-[0_25px_90px_rgba(0,0,0,0.95)]"
        }`}
      >
        {/* Physical Keycard Top Header */}
        <div
          className={`h-12 border-b px-6 flex items-center justify-between select-none ${
            isDay ? "bg-[#FBF9F4] border-stone-200" : "bg-black border-white/15"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <TesseractMark size={18} className={`shrink-0 ${isDay ? "text-stone-900" : "text-white"}`} />
            <span className={`font-serif text-sm font-medium ${isDay ? "text-stone-900" : "text-white"}`}>
              Account Settings
            </span>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDay ? "text-stone-400 hover:text-stone-900 hover:bg-stone-100" : "text-zinc-400 hover:text-white hover:bg-white/10"
            }`}
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto">
          {/* Member Card Dossier */}
          <div
            className={`p-5 rounded-2xl border relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              isDay ? "bg-stone-50 border-stone-200" : "bg-[#0d0d12] border-white/15"
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <span className={`font-serif text-lg font-medium tracking-wide ${isDay ? "text-stone-900" : "text-white"}`}>
                  {editingAgency && !editingAgency.includes("@") ? editingAgency : "Workspace"}
                </span>
                <span
                  className={`text-[9px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold ${
                    isPro
                      ? isDay
                        ? "bg-stone-900 text-white"
                        : "bg-white text-black"
                      : isDay
                      ? "bg-stone-200 text-stone-700"
                      : "bg-white/10 text-zinc-400"
                  }`}
                >
                  {isPro ? "Pro Plan" : "Free Plan"}
                </span>
              </div>
              <p className={`text-xs font-mono flex items-center gap-1.5 ${isDay ? "text-stone-500" : "text-zinc-400"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isDay ? "bg-stone-400" : "bg-white/40"}`} />
                <span>{user?.email || "Member Account"}</span>
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              {!isPro ? (
                <button
                  onClick={() => {
                    onClose();
                    onOpenUpgrade();
                  }}
                  className={`px-4 py-2 font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md ${
                    isDay ? "bg-stone-900 text-white hover:bg-stone-800" : "bg-white text-black hover:bg-zinc-200"
                  }`}
                >
                  <span>Upgrade to Pro</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <div
                  className={`px-3 py-1.5 rounded-xl border font-mono text-[11px] flex items-center gap-1.5 ${
                    isDay ? "border-stone-200 bg-white text-stone-800" : "border-white/20 bg-white/5 text-zinc-200"
                  }`}
                >
                  <ShieldCheck className={`w-3.5 h-3.5 ${isDay ? "text-stone-900" : "text-white"}`} />
                  <span>UNLIMITED CANVASES</span>
                </div>
              )}
            </div>
          </div>

          {/* Company Brand Identity Form */}
          <form onSubmit={handleSave} className="space-y-3">
            <label className={`block text-xs font-mono uppercase tracking-wider ${isDay ? "text-stone-700 font-medium" : "text-zinc-300"}`}>
              Company / Agency Name
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                required
                value={editingAgency.includes("@") ? "" : editingAgency}
                onChange={(e) => setEditingAgency(e.target.value)}
                placeholder="e.g. North Creative Agency"
                className={`flex-1 border rounded-xl px-3.5 py-2.5 text-xs font-mono outline-none transition-all ${
                  isDay
                    ? "bg-stone-50 border-stone-200 focus:border-stone-900 focus:bg-white text-stone-900 placeholder:text-stone-400"
                    : "bg-white/[0.04] border-white/15 text-white placeholder:text-zinc-500 focus:border-white/50 focus:ring-1 focus:ring-white/20"
                }`}
              />
              <button
                type="submit"
                className={`px-4 py-2.5 font-semibold text-xs rounded-xl transition-colors whitespace-nowrap cursor-pointer shadow-sm ${
                  isDay ? "bg-stone-900 text-white hover:bg-stone-800" : "bg-white text-black hover:bg-zinc-200"
                }`}
              >
                {isSaved ? "Saved ✓" : "Save Changes"}
              </button>
            </div>
          </form>

          {/* Autonomous MCP Agent Station */}
          <div className="p-5 rounded-2xl border border-stone-800 bg-[#121215] space-y-4 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-white" />
                <span className="font-mono text-xs font-semibold text-white uppercase tracking-wider">
                  Model Context Protocol (MCP) Server
                </span>
              </div>
              <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${isPro ? "bg-white/10 text-white border border-white/20" : "bg-white/5 text-zinc-500 border border-white/10"}`}>
                {isPro ? "PRO UNLOCKED" : "PRO EXCLUSIVE"}
              </span>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed font-sans">
              Connect AI coding agents (Cursor, Claude Code, Antigravity) directly to your review threads. Agents can inspect visual pins and push fixes with zero manual copy-paste.
            </p>

            {isPro ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1.5">
                    Pro API Key
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-black border border-white/15 rounded-xl px-3 py-2 font-mono text-xs text-zinc-200 truncate select-all">
                      {apiKey}
                    </div>
                    <button
                      onClick={handleCopyKey}
                      className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-mono text-white flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      {copiedKey ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey ? "Copied" : "Copy Key"}</span>
                    </button>
                  </div>
                </div>

                {/* Agent Config Drawer */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 p-0.5 rounded-lg border border-white/10 bg-white/[0.03] text-[11px] font-mono">
                      <button
                        onClick={() => setActiveConfigTab("cursor")}
                        className={`px-2.5 py-1 rounded transition-colors ${activeConfigTab === "cursor" ? "bg-white text-black font-semibold" : "text-zinc-400 hover:text-white"}`}
                      >
                        Cursor
                      </button>
                      <button
                        onClick={() => setActiveConfigTab("claude")}
                        className={`px-2.5 py-1 rounded transition-colors ${activeConfigTab === "claude" ? "bg-white text-black font-semibold" : "text-zinc-400 hover:text-white"}`}
                      >
                        Claude Desktop
                      </button>
                      <button
                        onClick={() => setActiveConfigTab("cli")}
                        className={`px-2.5 py-1 rounded transition-colors ${activeConfigTab === "cli" ? "bg-white text-black font-semibold" : "text-zinc-400 hover:text-white"}`}
                      >
                        CLI / Env
                      </button>
                    </div>

                    <button
                      onClick={handleCopyConfig}
                      className="px-3 py-1 rounded-lg bg-white text-black hover:bg-zinc-200 text-[11px] font-mono font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    >
                      {copiedConfig ? <Check className="w-3.5 h-3.5 text-black" /> : <Copy className="w-3.5 h-3.5 text-black" />}
                      <span>{copiedConfig ? "Copied!" : "Copy Config"}</span>
                    </button>
                  </div>

                  <pre className="bg-black border border-white/15 rounded-xl p-3 text-[11px] font-mono text-zinc-300 overflow-x-auto max-h-36 selection:bg-white selection:text-black">
                    <code>{activeSnippet}</code>
                  </pre>
                </div>
              </div>
            ) : (
              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs font-mono text-zinc-400">
                  Upgrade to unlock instant autonomous agent resolutions.
                </span>
                <button
                  onClick={() => {
                    onClose();
                    onOpenUpgrade();
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-white text-black text-xs font-semibold flex items-center gap-1.5 hover:bg-zinc-200 transition-all cursor-pointer shadow-sm"
                >
                  <span>Unlock MCP</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Backup & Sign Out Footer */}
          <div className={`pt-4 border-t flex items-center justify-between text-xs font-mono ${isDay ? "border-stone-200 text-stone-600" : "border-white/10 text-zinc-400"}`}>
            <button
              onClick={handleExportData}
              className={`flex items-center gap-1.5 transition-colors cursor-pointer ${isDay ? "hover:text-stone-900" : "hover:text-white"}`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Studio Data (.json)</span>
            </button>

            <button
              onClick={onSignOut}
              className="text-rose-500 hover:text-rose-600 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out Session</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
