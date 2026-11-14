"use client";

import React, { useState } from "react";
import { Check, ShieldCheck, X, Printer, RotateCcw } from "lucide-react";
import { Project } from "@/types";
import { TesseractMark } from "@/components/common/Logo";

interface ApprovalModalProps {
  project: Project;
  theme?: "day" | "night";
  onApprove: (approverName: string, organization?: string) => void;
  onRevoke?: () => void;
  onClose: () => void;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
  project,
  theme = "night",
  onApprove,
  onRevoke,
  onClose,
}) => {
  const isDay = theme === "day";
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

  const handlePrintCertificate = () => {
    if (typeof window === "undefined") return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const signature = project.approvalSignature || `CYATH-SEAL-${project.id.slice(0, 8).toUpperCase()}`;
    const timestamp = project.approvedAt ? new Date(project.approvedAt).toUTCString() : new Date().toUTCString();

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Milestone Acceptance Certificate — ${project.title || "Project"}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 48px; color: #111; max-width: 720px; margin: 0 auto; line-height: 1.5; }
            .header { border-bottom: 2px solid #111; padding-bottom: 16px; margin-bottom: 32px; display: flex; justify-content: space-between; align-items: flex-end; }
            .title { font-size: 24px; font-weight: 700; margin: 0; letter-spacing: -0.02em; }
            .subtitle { font-size: 13px; color: #555; margin-top: 4px; }
            .seal-box { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 24px 0; background: #fafafa; }
            .field { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; border-bottom: 1px dashed #e5e5e5; }
            .field:last-child { border-bottom: none; }
            .field-label { color: #666; font-family: monospace; font-size: 11px; text-transform: uppercase; }
            .field-value { font-weight: 600; font-family: monospace; }
            .legal { font-size: 12px; color: #555; margin-top: 32px; line-height: 1.6; border-top: 1px solid #eee; padding-top: 16px; }
            .stamp { text-align: right; margin-top: 24px; font-family: monospace; font-size: 11px; color: #888; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">Milestone Acceptance Certificate</h1>
              <div class="subtitle">Cyath Hardware-Anchored Review Verification Protocol</div>
            </div>
            <div style="font-family: monospace; font-size: 12px; font-weight: bold;">SEAL VERIFIED ✓</div>
          </div>

          <div class="seal-box">
            <div class="field">
              <span class="field-label">Target Review:</span>
              <span class="field-value">${project.title || "Staging Project"}</span>
            </div>
            <div class="field">
              <span class="field-label">Target URL:</span>
              <span class="field-value">${project.targetUrl || "—"}</span>
            </div>
            <div class="field">
              <span class="field-label">Authorized Signer:</span>
              <span class="field-value">${project.approvedBy || "Client Reviewer"}</span>
            </div>
            <div class="field">
              <span class="field-label">Timestamp:</span>
              <span class="field-value">${timestamp}</span>
            </div>
            <div class="field">
              <span class="field-label">Signature Digest:</span>
              <span class="field-value">${signature}</span>
            </div>
            <div class="field">
              <span class="field-label">Scope Audit:</span>
              <span class="field-value">${resolvedPins} Resolved / ${openPins} Open</span>
            </div>
          </div>

          <div class="legal">
            <strong>Formal Scope Acceptance Statement:</strong><br>
            The authorized reviewer certifies that the deployed staging milestone has been inspected against requirements and client feedback. All items listed above have been audited, and the milestone is certified and sealed for deployment.
          </div>

          <div class="stamp">
            Generated via Cyath Review Platform · ${new Date().toLocaleDateString()}
          </div>

          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-2xl animate-in fade-in duration-200 font-sans">
      <div
        className={`w-full max-w-lg border rounded-2xl shadow-2xl overflow-hidden flex flex-col relative animate-in zoom-in-[0.98] duration-200 ${
          isDay
            ? "bg-white border-stone-300 text-stone-900 shadow-[0_25px_90px_rgba(0,0,0,0.18)]"
            : "bg-[#070709] border-white/20 text-white shadow-[0_25px_90px_rgba(0,0,0,0.95)]"
        }`}
      >
        {/* Certificate Top Header */}
        <div
          className={`h-12 border-b px-6 flex items-center justify-between select-none ${
            isDay ? "bg-stone-50 border-stone-200" : "bg-black border-white/15"
          }`}
        >
          <div className="flex items-center gap-2">
            <TesseractMark size={16} className={isDay ? "text-stone-900 shrink-0" : "text-white shrink-0"} />
            <span className={`font-serif text-xs font-medium ${isDay ? "text-stone-700" : "text-zinc-200"}`}>
              Milestone Acceptance Seal
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

        {project.isApproved ? (
          <div className="p-6 sm:p-8 space-y-6 text-center">
            <div
              className={`inline-flex p-4 rounded-full mx-auto animate-seal-stamp ${
                isDay
                  ? "bg-stone-100 border border-stone-300 shadow-md text-stone-900"
                  : "bg-white/10 border border-white/25 shadow-[0_0_35px_rgba(255,255,255,0.25)] text-white"
              }`}
            >
              <ShieldCheck className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h3 className={`font-serif text-2xl font-normal tracking-wide ${isDay ? "text-stone-900" : "text-white"}`}>
                Milestone Certified & Sealed
              </h3>
              <p className={`text-xs font-mono ${isDay ? "text-stone-500" : "text-zinc-400"}`}>
                Authorized by {project.approvedBy || "Client Reviewer"}
              </p>
            </div>

            <div
              className={`p-4 rounded-xl border text-left font-mono text-xs space-y-2.5 ${
                isDay ? "border-stone-200 bg-stone-50/70" : "border-white/15 bg-black/60"
              }`}
            >
              <div className="flex justify-between">
                <span className={isDay ? "text-stone-500" : "text-zinc-400"}>Timestamp:</span>
                <span className={isDay ? "text-stone-900 font-semibold" : "text-white"}>
                  {project.approvedAt ? new Date(project.approvedAt).toLocaleString() : "Confirmed"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={isDay ? "text-stone-500" : "text-zinc-400"}>Signature Hash:</span>
                <span className={`font-mono text-[11px] truncate max-w-[200px] ${isDay ? "text-stone-800" : "text-zinc-300"}`}>
                  {project.approvalSignature || `CYATH-SEAL-${project.id.slice(0, 8).toUpperCase()}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={isDay ? "text-stone-500" : "text-zinc-400"}>Scope Status:</span>
                <span className="text-emerald-500 font-semibold">Locked for Deployment ✓</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={handlePrintCertificate}
                className={`w-full sm:flex-1 py-2.5 rounded-xl border font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.98] ${
                  isDay
                    ? "border-stone-300 bg-stone-100 hover:bg-stone-200 text-stone-900"
                    : "border-white/20 bg-white/5 hover:bg-white/10 text-white"
                }`}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Certificate</span>
              </button>

              {onRevoke && (
                <button
                  type="button"
                  onClick={onRevoke}
                  className={`w-full sm:w-auto px-4 py-2.5 rounded-xl border font-mono text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98] ${
                    isDay
                      ? "border-stone-200 text-stone-500 hover:text-stone-900 hover:bg-stone-100"
                      : "border-white/10 text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                  title="Reopen review session and revoke milestone seal"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reopen</span>
                </button>
              )}

              <button
                onClick={onClose}
                className={`w-full sm:flex-1 py-2.5 font-semibold text-xs rounded-xl transition-all shadow-md cursor-pointer active:scale-[0.98] ${
                  isDay
                    ? "bg-stone-900 hover:bg-stone-800 text-white"
                    : "bg-white hover:bg-zinc-200 text-black"
                }`}
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="space-y-1">
              <h3 className={`font-serif text-2xl font-normal tracking-wide ${isDay ? "text-stone-900" : "text-white"}`}>
                Certify Staging Milestone
              </h3>
              <p className={`text-xs font-mono truncate ${isDay ? "text-stone-500" : "text-zinc-400"}`}>
                {project.title} · {project.targetUrl}
              </p>
            </div>

            {/* Audit Verification Summary */}
            <div
              className={`p-4 rounded-xl border grid grid-cols-2 gap-4 font-mono text-xs ${
                isDay ? "border-stone-200 bg-stone-50/70" : "border-white/15 bg-black/60"
              }`}
            >
              <div>
                <span className={`text-[10px] uppercase block mb-1 ${isDay ? "text-stone-500" : "text-zinc-500"}`}>
                  Resolved Items
                </span>
                <span className={`text-sm font-semibold ${isDay ? "text-stone-900" : "text-white"}`}>
                  {resolvedPins} Completed
                </span>
              </div>
              <div>
                <span className={`text-[10px] uppercase block mb-1 ${isDay ? "text-stone-500" : "text-zinc-500"}`}>
                  Open Feedback
                </span>
                <span className={`text-sm font-semibold ${openPins === 0 ? "text-emerald-500" : isDay ? "text-stone-900" : "text-white"}`}>
                  {openPins === 0 ? "Zero Conflicts" : `${openPins} Unresolved`}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`block text-xs font-mono uppercase tracking-wider mb-1.5 ${isDay ? "text-stone-700" : "text-zinc-300"}`}>
                  Authorized Signer Full Name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={approverName}
                  onChange={(e) => setApproverName(e.target.value)}
                  placeholder="e.g. Jane Cooper"
                  className={`w-full rounded-xl px-3.5 py-2.5 text-xs focus:outline-none font-sans border ${
                    isDay
                      ? "bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-400 focus:border-stone-900"
                      : "bg-white/[0.04] border-white/15 text-white placeholder:text-zinc-600 focus:border-white/50"
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-mono uppercase tracking-wider mb-1.5 ${isDay ? "text-stone-700" : "text-zinc-300"}`}>
                  Client Organization / Company (Optional)
                </label>
                <input
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="e.g. Acme Corp Studio"
                  className={`w-full rounded-xl px-3.5 py-2.5 text-xs focus:outline-none font-sans border ${
                    isDay
                      ? "bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-400 focus:border-stone-900"
                      : "bg-white/[0.04] border-white/15 text-white placeholder:text-zinc-600 focus:border-white/50"
                  }`}
                />
              </div>

              <div
                className={`p-3 rounded-xl border text-[11px] font-sans leading-relaxed ${
                  isDay ? "border-stone-200 bg-stone-50 text-stone-600" : "border-white/10 bg-white/[0.02] text-zinc-400"
                }`}
              >
                By certifying this milestone, you record an immutable acceptance seal on this staging review session. Scope is locked and certified for deployment.
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className={`px-4 py-2 text-xs font-mono transition-colors cursor-pointer ${
                    isDay ? "text-stone-500 hover:text-stone-900" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2.5 font-semibold text-xs rounded-xl transition-all flex items-center gap-2 shadow-lg cursor-pointer active:scale-[0.97] ${
                    isDay
                      ? "bg-stone-900 hover:bg-stone-800 text-white"
                      : "bg-white hover:bg-zinc-200 text-black"
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Certify & Seal Milestone</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
