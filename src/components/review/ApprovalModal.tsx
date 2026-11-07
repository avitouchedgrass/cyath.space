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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#09090B]/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#121215] border border-[#27272A] rounded-2xl shadow-2xl p-6 text-[#FAFAFA] relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#18181B] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#10B981]/10 border border-[#10B981]/20 flex items-center justify-center text-[#10B981]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-base text-[#FAFAFA]">Approve Staging Milestone</h3>
            <p className="text-xs text-[#A1A1AA]">{project.title}</p>
          </div>
        </div>

        {/* Status Snapshot */}
        <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-3 mb-5 flex items-center justify-between text-xs">
          <div>
            <span className="text-[#A1A1AA]">Resolved Feedback</span>
            <p className="font-semibold text-sm text-[#10B981]">{resolvedPins} items completed</p>
          </div>
          {openPins > 0 && (
            <div className="text-right">
              <span className="text-[#A1A1AA]">Unresolved Pins</span>
              <p className="font-semibold text-sm text-[#F59E0B]">{openPins} open</p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
              Authorized Full Name (Sign-Off)
            </label>
            <input
              type="text"
              required
              value={approverName}
              onChange={(e) => setApproverName(e.target.value)}
              placeholder="e.g. Jane Cooper"
              className="w-full bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-xs text-[#FAFAFA] focus:outline-none focus:border-[#F59E0B]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
              Client Organization / Company
            </label>
            <input
              type="text"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="e.g. Apex Logistics LLC"
              className="w-full bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-xs text-[#FAFAFA] focus:outline-none focus:border-[#F59E0B]"
            />
          </div>

          <div className="pt-2 text-[11px] text-[#52525B] leading-relaxed">
            By clicking confirm, you certify that the staging deliverables are approved as presented. A timestamped receipt will be pinned to this review URL.
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#27272A]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!approverName.trim()}
              className="px-4 py-2 rounded-lg bg-[#10B981] hover:bg-[#059669] disabled:opacity-50 text-[#09090B] font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm Sign-Off</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

