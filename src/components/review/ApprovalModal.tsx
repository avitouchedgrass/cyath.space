"use client";

import React, { useState } from "react";
import { Check, ShieldCheck, X } from "lucide-react";
import { Project } from "@/types";
import { TesseractMark } from "@/components/common/Logo";

interface ApprovalModalProps {
  project: Project;
  onApprove: (approverName: string, organization?: string) => void;
  onClose: () => void;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({ project, onApprove, onClose }) => {
  const [approverName, setApproverName] = useState("");
  const [organization, setOrganization] = useState("");

  const pins = Array.isArray(project?.pins) ? project.pins.filter(Boolean) : [];
  const openPins = pins.filter((p) => p && p.status !== "resolved").length;
  const resolvedPins = pins.filter((p) => p && p.status === "resolved").length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!approverName.trim()) return;
    onApprove(approverName.trim(), organization.trim() || undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-200 selection:bg-white selection:text-black font-sans">
      <div className="w-full max-w-lg bg-[#070709] border border-white/20 rounded-2xl shadow-[0_25px_90px_rgba(0,0,0,0.95),0_0_50px_rgba(255,255,255,0.06)] overflow-hidden flex flex-col relative text-white animate-in zoom-in-[0.98] duration-200">
        
        {/* Certificate Top Header */}
        <div className="h-12 border-b border-white/15 px-6 flex items-center justify-between select-none bg-black">
          <div className="flex items-center gap-2">
            <TesseractMark size={16} className="text-white shrink-0" />
            <span className="font-serif text-xs font-medium text-zinc-200">
              Milestone Acceptance
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

        <div className="p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <h3 className="font-serif text-2xl font-normal text-white tracking-wide">
              Certify Staging Milestone
            </h3>
            <p className="text-xs font-mono text-zinc-400 truncate">
              {project.title} · {project.targetUrl}
            </p>
          </div>

          {/* Audit Verification Summary */}
          <div className="p-4 rounded-xl border border-white/15 bg-black/60 grid grid-cols-2 gap-4 font-mono text-xs">
            <div>
              <span className="text-[10px] uppercase text-zinc-500 block mb-1">Resolved Items</span>
              <span className="text-sm font-semibold text-white">{resolvedPins} Completed</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-zinc-500 block mb-1">Open Feedback</span>
              <span className={`text-sm font-semibold ${openPins === 0 ? "text-zinc-400" : "text-white"}`}>
                {openPins === 0 ? "Zero Conflicts" : `${openPins} Unresolved`}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                Authorized Signer Full Name
              </label>
              <input
                type="text"
                required
                autoFocus
                value={approverName}
                onChange={(e) => setApproverName(e.target.value)}
                placeholder="e.g. Jane Cooper"
                className="w-full bg-white/[0.04] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/20 font-sans"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                Client Organization / Company (Optional)
              </label>
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="e.g. Acme Corp Studio"
                className="w-full bg-white/[0.04] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/20 font-sans"
              />
            </div>

            <div className="p-3 rounded-lg border border-white/10 bg-white/[0.02] text-[11px] text-zinc-400 font-sans leading-relaxed">
              By certifying this milestone, you record an immutable acceptance seal on this staging review session. Scope is locked and certified for deployment.
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-mono text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-white hover:bg-zinc-200 text-black font-semibold text-xs rounded-xl transition-all flex items-center gap-2 shadow-lg cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-black" />
                <span>Certify & Seal Milestone</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
