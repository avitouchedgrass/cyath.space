"use client";

import React, { useState } from "react";
import { X, CheckCircle2, Clock, Globe, Copy, Check, ExternalLink, Monitor, Smartphone, Tablet } from "lucide-react";
import { Project, Pin } from "@/types";
import { useReviewStore } from "@/store/useReviewStore";

interface ProjectPunchlistDrawerProps {
  project: Project | null;
  onClose: () => void;
  theme: "night" | "day";
}

export function ProjectPunchlistDrawer({ project, onClose, theme }: ProjectPunchlistDrawerProps) {
  const { toggleResolvePin } = useReviewStore();
  const [filter, setFilter] = useState<"all" | "open" | "resolved">("all");
  const [copiedExport, setCopiedExport] = useState(false);

  if (!project) return null;

  const isDay = theme === "day";

  const totalPins = project.pins.length;
  const resolvedPins = project.pins.filter((p) => p.status === "resolved").length;
  const openPins = totalPins - resolvedPins;

  const filteredPins = project.pins.filter((p) => {
    if (filter === "open") return p.status !== "resolved";
    if (filter === "resolved") return p.status === "resolved";
    return true;
  });

  const handleExportMarkdown = () => {
    if (!project) return;

    let md = `# Cyath Punchlist Audit: ${project.title}\n`;
    md += `**Staging Target:** ${project.targetUrl}\n`;
    md += `**Agency / Studio:** ${project.agencyName}\n`;
    md += `**Generated At:** ${new Date().toISOString()}\n`;
    md += `**Status:** ${project.isApproved ? "Approved & Milestone Signed" : "Active Staging Review"}\n\n`;

    md += `## Summary\n`;
    md += `- Total Feedback Items: ${totalPins}\n`;
    md += `- Open Issues: ${openPins}\n`;
    md += `- Resolved Fixes: ${resolvedPins}\n\n`;

    md += `## Punchlist Items\n\n`;

    project.pins.forEach((pin) => {
      const isResolved = pin.status === "resolved";
      md += `### Pin #${pin.number} [${isResolved ? "RESOLVED" : "OPEN"}]\n`;
      md += `- **Location:** (${pin.xPercent}%, ${pin.yPercent}%)\n`;
      md += `- **Hardware Telemetry:** ${pin.telemetry.viewportWidth}×${pin.telemetry.viewportHeight} (DPR: ${pin.telemetry.devicePixelRatio}) • ${pin.telemetry.browser} • ${pin.telemetry.os}\n`;
      md += `- **Scroll Depth:** ${pin.telemetry.scrollDepthPercent}%\n`;
      md += `- **Captured At:** ${pin.createdAt}\n\n`;

      if (pin.comments.length > 0) {
        md += `**Discussion Notes:**\n`;
        pin.comments.forEach((c) => {
          md += `> **${c.authorName} (${c.authorRole}):** ${c.content}\n`;
        });
        md += `\n`;
      }
      md += `---\n\n`;
    });

    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(md);
      setCopiedExport(true);
      setTimeout(() => setCopiedExport(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-xl h-full border-l shadow-2xl flex flex-col transition-all ${
          isDay ? "bg-[#FAF8F2] border-black/15 text-[#1C1A18]" : "bg-[#181716] border-white/15 text-[#F3F1EC]"
        }`}
      >
        {/* Header */}
        <div
          className={`px-6 py-5 border-b flex items-center justify-between ${
            isDay ? "border-black/10 bg-[#F5F3EC]" : "border-white/10 bg-[#141312]"
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] px-2 py-0.5 rounded border border-black/10 dark:border-white/10">
                PUNCHLIST INSPECTOR
              </span>
              {project.isApproved ? (
                <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  MILESTONE SIGNED
                </span>
              ) : (
                <span className="text-[10px] font-mono text-amber-500 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  REVISIONS ACTIVE
                </span>
              )}
            </div>
            <h2
              className="text-xl sm:text-2xl font-normal tracking-tight truncate max-w-md"
              style={{ fontFamily: "var(--font-serif, 'Oranienbaum', Georgia, serif)" }}
            >
              {project.title}
            </h2>
            <div className="flex items-center gap-1.5 text-xs font-mono opacity-70 truncate">
              <Globe className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{project.targetUrl}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-full border transition-colors cursor-pointer shrink-0 ml-4 ${
              isDay
                ? "border-black/15 bg-white/70 hover:bg-white text-black"
                : "border-white/15 bg-white/5 hover:bg-white/10 text-white"
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Battery Style Progress Strip (Section 02 design) */}
        <div
          className={`px-6 py-4 border-b space-y-2.5 ${
            isDay ? "border-black/10 bg-white/60" : "border-white/10 bg-[#141312]/60"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-semibold tracking-wide">PUNCHLIST HEALTH</span>
            <span>
              <strong className="text-emerald-500">{resolvedPins}</strong> / {totalPins} Resolved (
              {totalPins > 0 ? Math.round((resolvedPins / totalPins) * 100) : 100}%)
            </span>
          </div>

          {/* 10-Segment Architectural Battery Gauge */}
          <div className="grid grid-cols-10 gap-1 h-3 rounded p-0.5 border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5">
            {Array.from({ length: 10 }).map((_, idx) => {
              const ratio = totalPins > 0 ? (resolvedPins / totalPins) * 10 : 10;
              const isFilled = idx < Math.round(ratio);

              return (
                <div
                  key={idx}
                  className={`h-full rounded-sm transition-all duration-300 ${
                    isFilled
                      ? "bg-emerald-500"
                      : totalPins === 0
                      ? "bg-emerald-500/30"
                      : "bg-amber-500/20 dark:bg-amber-500/20"
                  }`}
                />
              );
            })}
          </div>

          {/* Filter & Export Row */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1 text-xs font-mono">
              <button
                onClick={() => setFilter("all")}
                className={`px-2.5 py-1 rounded border text-[11px] cursor-pointer transition-colors ${
                  filter === "all"
                    ? isDay
                      ? "bg-black text-white border-black font-semibold"
                      : "bg-white text-black border-white font-semibold"
                    : isDay
                    ? "border-black/15 text-black hover:bg-black/5"
                    : "border-white/15 text-white hover:bg-white/5"
                }`}
              >
                All ({totalPins})
              </button>
              <button
                onClick={() => setFilter("open")}
                className={`px-2.5 py-1 rounded border text-[11px] cursor-pointer transition-colors ${
                  filter === "open"
                    ? "bg-amber-500 text-black border-amber-500 font-semibold"
                    : isDay
                    ? "border-black/15 text-black hover:bg-black/5"
                    : "border-white/15 text-white hover:bg-white/5"
                }`}
              >
                Open ({openPins})
              </button>
              <button
                onClick={() => setFilter("resolved")}
                className={`px-2.5 py-1 rounded border text-[11px] cursor-pointer transition-colors ${
                  filter === "resolved"
                    ? "bg-emerald-500 text-black border-emerald-500 font-semibold"
                    : isDay
                    ? "border-black/15 text-black hover:bg-black/5"
                    : "border-white/15 text-white hover:bg-white/5"
                }`}
              >
                Resolved ({resolvedPins})
              </button>
            </div>

            <button
              onClick={handleExportMarkdown}
              className={`px-2.5 py-1 rounded border text-[11px] font-mono flex items-center gap-1.5 transition-colors cursor-pointer ${
                copiedExport
                  ? "bg-emerald-500 text-black border-emerald-500 font-bold"
                  : isDay
                  ? "border-black/15 bg-white hover:bg-black/5 text-black"
                  : "border-white/15 bg-white/5 hover:bg-white/10 text-white"
              }`}
              title="Copy Linear/GitHub Markdown Summary"
            >
              {copiedExport ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copiedExport ? "Copied!" : "Export Markdown"}</span>
            </button>
          </div>
        </div>

        {/* Pins List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {filteredPins.length === 0 ? (
            <div className="py-12 text-center font-mono text-xs opacity-50 space-y-1">
              <p>No punchlist items found for this filter.</p>
              <p className="text-[11px]">Pins dropped on the live staging canvas appear here automatically.</p>
            </div>
          ) : (
            filteredPins.map((pin: Pin) => {
              const isResolved = pin.status === "resolved";

              return (
                <div
                  key={pin.id}
                  className={`p-4 rounded-xl border transition-all space-y-3 ${
                    isDay
                      ? isResolved
                        ? "bg-white/50 border-black/10 opacity-75"
                        : "bg-white border-black/15 shadow-sm"
                      : isResolved
                      ? "bg-[#141312]/60 border-white/5 opacity-75"
                      : "bg-[#1E1D1B] border-white/10 shadow-md"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                          isResolved
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/40"
                        }`}
                      >
                        {pin.number}
                      </span>
                      <span className="font-mono text-[11px] font-semibold uppercase tracking-wider">
                        Location: ({pin.xPercent}%, {pin.yPercent}%)
                      </span>
                    </div>

                    <button
                      onClick={() => toggleResolvePin(project.id, pin.id)}
                      className={`px-2.5 py-1 rounded text-[10px] font-mono font-semibold transition-colors flex items-center gap-1 cursor-pointer border ${
                        isResolved
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                          : isDay
                          ? "bg-black text-white border-black hover:bg-black/80"
                          : "bg-white text-black border-white hover:bg-white/90"
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{isResolved ? "Resolved" : "Mark Resolved"}</span>
                    </button>
                  </div>

                  {/* Telemetry pill box */}
                  <div
                    className={`p-2.5 rounded-lg border text-[10px] font-mono grid grid-cols-2 gap-1.5 ${
                      isDay ? "bg-[#FAF8F2] border-black/10" : "bg-black/30 border-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-1 truncate">
                      {pin.deviceMode === "mobile" ? (
                        <Smartphone className="w-3 h-3 text-[#38BDF8] shrink-0" />
                      ) : pin.deviceMode === "tablet" ? (
                        <Tablet className="w-3 h-3 text-[#38BDF8] shrink-0" />
                      ) : (
                        <Monitor className="w-3 h-3 text-[#38BDF8] shrink-0" />
                      )}
                      <span className="truncate">
                        {pin.telemetry.viewportWidth}×{pin.telemetry.viewportHeight} (DPR {pin.telemetry.devicePixelRatio})
                      </span>
                    </div>
                    <div className="truncate text-right opacity-80">
                      {pin.telemetry.browser} • {pin.telemetry.os}
                    </div>
                  </div>

                  {/* Comments Thread */}
                  <div className="space-y-2 pt-1">
                    {pin.comments.map((comment) => (
                      <div
                        key={comment.id}
                        className={`p-3 rounded-lg border text-xs space-y-1 ${
                          comment.authorRole === "client"
                            ? isDay
                              ? "bg-amber-500/5 border-amber-500/20"
                              : "bg-amber-500/10 border-amber-500/20"
                            : isDay
                            ? "bg-black/5 border-black/10"
                            : "bg-white/5 border-white/10"
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono opacity-60">
                          <span className="font-semibold text-foreground">{comment.authorName}</span>
                          <span>{new Date(comment.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                        <p className="text-xs leading-relaxed">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div
          className={`px-6 py-4 border-t flex items-center justify-between ${
            isDay ? "border-black/10 bg-[#F5F3EC]" : "border-white/10 bg-[#141312]"
          }`}
        >
          <a
            href={`/r/${project.shareId}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`py-2 px-4 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer border ${
              isDay
                ? "bg-[#1C1A18] text-white hover:bg-black border-black"
                : "bg-white text-black hover:bg-white/90 border-white"
            }`}
          >
            <span>Open Staging Canvas</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={onClose}
            className={`py-2 px-4 rounded-lg text-xs font-mono border transition-colors cursor-pointer ${
              isDay
                ? "border-black/15 bg-white hover:bg-black/5 text-black"
                : "border-white/15 bg-white/5 hover:bg-white/10 text-white"
            }`}
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
