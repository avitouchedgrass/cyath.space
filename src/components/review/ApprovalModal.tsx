"use client";

import React, { useState } from "react";
import { CheckCircle2, ShieldCheck, X } from "lucide-react";
import { Project } from "@/types";

interface ApprovalModalProps {
  project: Project;
  onApprove: (approverName: string) => void;
  onClose: () => void;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({ project, onApprove, onClose }) => {
  const [approverName, setApproverName] = useState("");
  const [organization, setOrganization] = useState("");

  const openPins = project.pins.filter((p) => p.status !== "resolved").length;
  const resolvedPins = project.pins.filter((p) => p.status === "resolved").length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!approverName.trim()) return;
    onApprove(approverName.trim());
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

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
            <ShieldCheck className="w-5 h-5 stroke-[1.8]" />
          </div>
          <div>
            <h3 className="font-sans text-base font-semibold text-white">Approve Staging Milestone</h3>
            <p className="text-xs text-zinc-400 font-sans">{project.title}</p>
          </div>
        </div>

        {/* Status Snapshot */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 mb-5 flex items-center justify-between text-xs font-sans">
          <div>
            <span className="text-zinc-500 text-[11px]">Resolved Feedback</span>
            <p className="font-semibold text-sm text-zinc-100">{resolvedPins} items completed</p>
          </div>
          {openPins > 0 && (
            <div className="text-right">
              <span className="text-zinc-500 text-[11px]">Unresolved Items</span>
              <p className="font-semibold text-sm text-zinc-300">{openPins} remaining open</p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 font-sans">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Authorized Signer Full Name
            </label>
            <input
              type="text"
              required
              autoFocus
              value={approverName}
              onChange={(e) => setApproverName(e.target.value)}
              placeholder="e.g. Jane Cooper"
              className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/20 font-sans"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Client Organization / Atelier
            </label>
            <input
              type="text"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="e.g. Maison Élara Studio"
              className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/20 font-sans"
            />
          </div>

          <div className="pt-2 text-[11px] text-zinc-500 leading-relaxed font-sans">
            By confirming, you certify that the staging deliverables are approved as presented. An immutable timestamped verification seal will be pinned to this review session.
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!approverName.trim()}
              className="px-4 py-2 rounded-lg bg-white hover:bg-zinc-200 disabled:opacity-40 text-black font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2]" />
              <span>Confirm Sign-Off</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
