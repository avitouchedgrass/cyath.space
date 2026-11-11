"use client";

import React, { useState, useMemo } from "react";
import { X, ArrowUpRight, LogOut, Download, Key, Terminal, Copy, Check, ShieldCheck } from "lucide-react";
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

  const handleCopyKey = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(apiKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const handleCopyConfig = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(cursorConfigJson);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150 selection:bg-white selection:text-black">
      <div className="w-full max-w-lg bg-[#0a0a0a] border border-white/15 rounded-2xl shadow-2xl p-6 text-white relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white shrink-0">
            <TesseractMark size={20} />
          </div>
          <div>
            <h3 className="font-serif text-lg font-medium text-white tracking-wide">Studio Profile & Settings</h3>
            <p className="text-xs text-zinc-400 font-mono truncate max-w-[260px]">{user?.email || "Studio Workspace"}</p>
          </div>
        </div>

        {/* Studio / Agency Settings Form */}
        <form onSubmit={handleSave} className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
              Studio / Atelier Name
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                required
                value={editingAgency}
                onChange={(e) => setEditingAgency(e.target.value)}
                placeholder="e.g. North Creative Atelier"
                className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 font-mono"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-white text-black font-mono font-medium text-xs rounded-xl hover:bg-zinc-200 transition-colors whitespace-nowrap shadow-sm cursor-pointer"
              >
                {isSaved ? "SAVED" : "SAVE"}
              </button>
            </div>
          </div>
        </form>

        {/* Plan & Subscription Card */}
        <div className="p-3.5 rounded-xl border border-white/10 bg-white/[0.02] mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="font-mono text-xs font-semibold text-white uppercase">
                {isPro ? "Studio Pro Tier" : "Free Atelier Tier"}
              </span>
              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${isPro ? "bg-white text-black font-semibold" : "bg-white/10 text-zinc-400"}`}>
                {isPro ? "UNLIMITED CANVASES" : "1 CANVAS MAX"}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-mono">
              {isPro
                ? `Active Canvases: ${projects.length} (Unlimited)`
                : `Active Canvases: ${projects.length} / 1`}
            </p>
          </div>

          {!isPro ? (
            <button
              onClick={() => {
                onClose();
                onOpenUpgrade();
              }}
              className="px-3 py-1.5 bg-white text-black font-mono font-medium text-xs rounded-lg hover:bg-zinc-200 transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
            >
              <span>UPGRADE</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          ) : (
            <div className="px-2.5 py-1 rounded bg-white/10 border border-white/20 text-zinc-200 font-mono text-[10px] flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-white" />
              <span>PRO ACTIVE</span>
            </div>
          )}
        </div>

        {/* Autonomous MCP Server Section */}
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-zinc-300" />
              <span className="font-mono text-xs font-semibold text-white uppercase tracking-wider">
                Autonomous MCP Server
              </span>
            </div>
            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${isPro ? "bg-white/10 text-white border border-white/20" : "bg-white/5 text-zinc-500 border border-white/10"}`}>
              {isPro ? "PRO UNLOCKED" : "PRO EXCLUSIVE"}
            </span>
          </div>

          <p className="text-[11px] text-zinc-400 leading-relaxed mb-3">
            Mount your review feedback directly into Cursor, Claude Desktop, and Antigravity. Agents can fetch pins, inspect telemetry, and resolve threads upon code delivery.
          </p>

          {isPro ? (
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-1">
                  Studio Pro API Key
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 font-mono text-xs text-zinc-200 truncate select-all">
                    {apiKey}
                  </div>
                  <button
                    onClick={handleCopyKey}
                    className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-mono text-white flex items-center gap-1 transition-all"
                    title="Copy API key to clipboard"
                  >
                    {copiedKey ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
                <span className="text-[11px] font-mono text-zinc-400">
                  Agent Config (Cursor / Claude)
                </span>
                <button
                  onClick={handleCopyConfig}
                  className="px-2.5 py-1 rounded-md bg-white text-black hover:bg-zinc-200 text-[11px] font-mono font-medium flex items-center gap-1 transition-all"
                >
                  {copiedConfig ? <Check className="w-3 h-3 text-black" /> : <Terminal className="w-3 h-3 text-black" />}
                  <span>{copiedConfig ? "Config Copied!" : "Copy Cursor Config"}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
              <span className="text-[11px] font-mono text-zinc-500">
                Requires Studio Pro membership
              </span>
              <button
                onClick={() => {
                  onClose();
                  onOpenUpgrade();
                }}
                className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white text-[11px] font-mono flex items-center gap-1 transition-all"
              >
                <span>Unlock MCP Server</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Data Management & Session Actions */}
        <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between">
          <button
            onClick={handleExportData}
            className="text-xs text-zinc-400 hover:text-white font-sans flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Data</span>
          </button>

          <button
            onClick={onSignOut}
            className="text-xs text-zinc-400 hover:text-red-400 font-sans flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
