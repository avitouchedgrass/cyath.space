"use client";

import React, { useState } from "react";
import { X, User as UserIcon, ShieldCheck, ArrowUpRight, LogOut, Download, Building } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { useReviewStore } from "@/store/useReviewStore";

interface AccountSettingsModalProps {
  user: User | null;
  agencyName: string;
  onUpdateAgencyName: (name: string) => void;
  onSignOut: () => void;
  onOpenUpgrade: () => void;
  onClose: () => void;
}

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({
  user,
  agencyName,
  onUpdateAgencyName,
  onSignOut,
  onOpenUpgrade,
  onClose,
}) => {
  const [editingAgency, setEditingAgency] = useState(agencyName);
  const [isSaved, setIsSaved] = useState(false);
  const projects = useReviewStore((s) => s.projects);

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
      <div className="w-full max-w-md bg-[#0a0a0a] border border-white/15 rounded-2xl shadow-2xl p-6 text-white relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white font-mono text-sm font-bold">
            {user?.email?.slice(0, 2).toUpperCase() || "CY"}
          </div>
          <div>
            <h3 className="font-serif text-lg font-medium text-white">Studio Account</h3>
            <p className="text-xs text-zinc-500 font-mono truncate max-w-[240px]">{user?.email}</p>
          </div>
        </div>

        {/* Studio / Agency Settings Form */}
        <form onSubmit={handleSave} className="space-y-4 mb-6">
          <div>
            <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-400 mb-1.5">
              Studio / Agency Name
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                required
                value={editingAgency}
                onChange={(e) => setEditingAgency(e.target.value)}
                placeholder="e.g. North Creative Atelier"
                className="flex-1 bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-white text-black font-semibold text-xs rounded-lg hover:bg-zinc-200 transition-colors whitespace-nowrap shadow-sm"
              >
                {isSaved ? "Saved!" : "Save"}
              </button>
            </div>
          </div>
        </form>

        {/* Plan & Subscription Card */}
        <div className="p-3.5 rounded-xl border border-white/10 bg-white/[0.02] mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="font-mono text-xs font-semibold text-white">Free Atelier Tier</span>
              <span className="text-[10px] font-mono bg-white/10 px-1.5 py-0.5 rounded text-zinc-400">1 Canvas Max</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed font-mono">
              Active Canvases: {projects.length} / 1
            </p>
          </div>

          <button
            onClick={() => {
              onClose();
              onOpenUpgrade();
            }}
            className="px-3 py-1.5 bg-white text-black font-semibold text-xs rounded-lg hover:bg-zinc-200 transition-colors flex items-center gap-1 shadow-sm"
          >
            <span>Upgrade</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Data Management & Session Actions */}
        <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between">
          <button
            onClick={handleExportData}
            className="text-xs text-zinc-400 hover:text-white font-mono flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Data</span>
          </button>

          <button
            onClick={onSignOut}
            className="text-xs text-zinc-400 hover:text-red-400 font-mono flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
