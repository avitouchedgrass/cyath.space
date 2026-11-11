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
  onUpdateAgencyName: (name: string) => void;
  onSignOut: () => void;
  onOpenUpgrade: () => void;
  onClose: () => void;
}

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({
  user,
  agencyName,
  isPro = false,
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
  const projects = useReviewStore((s) => s.projects);

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
            command: "node",
            args: ["mcp/server.js"],
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

  const claudeConfigJson = useMemo(() => {
    return JSON.stringify(
      {
        mcpServers: {
          cyath: {
            command: "node",
            args: ["mcp/server.js"],
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

  const cliSnippet = `CYATH_API_KEY="${apiKey}" node mcp/server.js`;

  const activeSnippet = activeConfigTab === "cursor" ? cursorConfigJson : activeConfigTab === "claude" ? claudeConfigJson : cliSnippet;

  const handleCopyKey = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(apiKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const handleCopyConfig = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(activeSnippet);
      setCopiedConfig(true);
      setTimeout(() => setCopiedConfig(false), 2000);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAgency.trim()) return;
    onUpdateAgencyName(editingAgency.trim());
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-200 selection:bg-white selection:text-black font-sans">
      <div className="w-full max-w-xl bg-[#070709] border border-white/20 rounded-2xl shadow-[0_25px_90px_rgba(0,0,0,0.95),0_0_50px_rgba(255,255,255,0.06)] overflow-hidden flex flex-col relative text-white max-h-[92vh] animate-in zoom-in-[0.98] duration-200">
        
        {/* Physical Keycard Top Header */}
        <div className="h-12 border-b border-white/15 px-6 flex items-center justify-between select-none bg-black">
          <div className="flex items-center gap-2.5">
            <TesseractMark size={18} className="text-white shrink-0" />
            <span className="font-mono text-[10px] tracking-widest text-zinc-300 uppercase">
              STUDIO KEYCARD & CREDENTIALS
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto">
          {/* Member Card Dossier */}
          <div className="p-5 rounded-2xl border border-white/15 bg-[#0d0d12] relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-serif text-lg font-medium text-white tracking-wide">
                  {editingAgency || "Studio Atelier"}
                </span>
                <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold ${isPro ? "bg-white text-black" : "bg-white/10 text-zinc-400"}`}>
                  {isPro ? "Studio Pro" : "Free Atelier"}
                </span>
              </div>
              <p className="text-xs font-mono text-zinc-400 truncate max-w-xs">
                {user?.email || "Workspace Member"}
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              {!isPro ? (
                <button
                  onClick={() => {
                    onClose();
                    onOpenUpgrade();
                  }}
                  className="px-4 py-2 bg-white text-black font-semibold text-xs rounded-xl hover:bg-zinc-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <span>Upgrade to Pro</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <div className="px-3 py-1.5 rounded-xl border border-white/20 bg-white/5 font-mono text-[11px] text-zinc-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-white" />
                  <span>UNLIMITED CANVASES</span>
                </div>
              )}
            </div>
          </div>

          {/* Atelier Brand Identity Form */}
          <form onSubmit={handleSave} className="space-y-3">
            <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300">
              Studio / Atelier Brand Name
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                required
                value={editingAgency}
                onChange={(e) => setEditingAgency(e.target.value)}
                placeholder="e.g. North Creative Atelier"
                className="flex-1 bg-white/[0.04] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/20 font-mono"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-white text-black font-semibold text-xs rounded-xl hover:bg-zinc-200 transition-colors whitespace-nowrap cursor-pointer shadow-sm"
              >
                {isSaved ? "Saved ✓" : "Save Changes"}
              </button>
            </div>
          </form>

          {/* Autonomous MCP Agent Station */}
          <div className="p-5 rounded-2xl border border-white/15 bg-[#09090c] space-y-4">
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
                  <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-1.5">
                    Studio Pro API Key
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
                  className="px-3.5 py-1.5 rounded-xl bg-white text-black text-xs font-semibold flex items-center gap-1.5 hover:bg-zinc-200 transition-all cursor-pointer"
                >
                  <span>Unlock MCP</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Backup & Sign Out Footer */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono text-zinc-400">
            <button
              onClick={handleExportData}
              className="hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Studio Data (.json)</span>
            </button>

            <button
              onClick={onSignOut}
              className="hover:text-red-400 flex items-center gap-1.5 transition-colors cursor-pointer"
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
