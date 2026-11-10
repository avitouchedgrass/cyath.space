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

    let md = `# Cyath Review Notes: ${project.title}\n`;
    md += `**URL:** ${project.targetUrl}\n`;
    md += `**Studio:** ${project.agencyName}\n`;
    md += `**Date:** ${new Date().toISOString()}\n`;
    md += `**Status:** ${project.isApproved ? "Approved" : "Needs Review"}\n\n`;

    md += `## Summary\n`;
    md += `- Total Notes: ${totalPins}\n`;
    md += `- Open: ${openPins}\n`;
    md += `- Resolved: ${resolvedPins}\n\n`;

    md += `## Notes\n\n`;

    project.pins.forEach((pin) => {
      const isResolved = pin.status === "resolved";
      md += `### #${pin.number} [${isResolved ? "RESOLVED" : "OPEN"}]\n`;
      md += `- **Location:** (${pin.xPercent}%, ${pin.yPercent}%)\n`;
      md += `- **Device:** ${pin.telemetry.viewportWidth}×${pin.telemetry.viewportHeight} • ${pin.telemetry.browser} • ${pin.telemetry.os}\n`;
      md += `- **Created:** ${pin.createdAt}\n\n`;

      if (pin.comments.length > 0) {
        md += `**Comments:**\n`;
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
          isDay ? "bg-[#FAF8F2] border-black/15 text-[#1C1A18]" : "bg-[#0a0a0a] border-white/10 text-[#FAFAFA]"
        }`}
      >
        <div
          className={`px-6 py-5 border-b flex items-center justify-between ${
            isDay ? "border-black/10 bg-[#F5F3EC]" : "border-white/10 bg-black"
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border border-white/10 text-zinc-400">
                Notes
              </span>
              {project.isApproved ? (
                <span className="text-[10px] font-mono text-white bg-white/10 border border-white/20 px-2 py-0.5 rounded flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Approved
                </span>
              ) : (
                <span className="text-[10px] font-mono text-zinc-300 bg-white/5 border border-white/10 px-2 py-0.5 rounded flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Needs Review
                </span>
              )}
            </div>
            <h2 className="text-xl font-serif font-normal tracking-wide truncate max-w-md text-white">
              {project.title}
            </h2>
            <div className="flex items-center gap-1.5 text-xs font-mono opacity-70 truncate text-zinc-400">
              <Globe className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{project.targetUrl}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 text-white transition-colors cursor-pointer shrink-0 ml-4"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div
          className={`px-6 py-4 border-b space-y-2.5 ${
            isDay ? "border-black/10 bg-white/60" : "border-white/10 bg-[#141414]"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="tracking-wide text-zinc-400">Progress</span>
            <span className="text-white">
              <strong>{resolvedPins}</strong> of {totalPins} resolved ({totalPins > 0 ? Math.round((resolvedPins / totalPins) * 100) : 100}%)
            </span>
          </div>

          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-300"
              style={{
                width: `${totalPins > 0 ? (resolvedPins / totalPins) * 100 : 100}%`,
              }}
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1 text-xs font-mono">
              <button
                onClick={() => setFilter("all")}
                className={`px-2.5 py-1 rounded-lg border text-[11px] cursor-pointer transition-colors ${
                  filter === "all"
                    ? "bg-white text-black border-white font-semibold"
                    : "border-white/10 text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                All ({totalPins})
              </button>
              <button
                onClick={() => setFilter("open")}
                className={`px-2.5 py-1 rounded-lg border text-[11px] cursor-pointer transition-colors ${
                  filter === "open"
                    ? "bg-white text-black border-white font-semibold"
                    : "border-white/10 text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                Open ({openPins})
              </button>
              <button
                onClick={() => setFilter("resolved")}
                className={`px-2.5 py-1 rounded-lg border text-[11px] cursor-pointer transition-colors ${
                  filter === "resolved"
                    ? "bg-white text-black border-white font-semibold"
                    : "border-white/10 text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                Resolved ({resolvedPins})
              </button>
            </div>

            <button
              onClick={handleExportMarkdown}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono flex items-center gap-1.5 transition-colors cursor-pointer ${
                copiedExport
                  ? "bg-white text-black border-white font-bold"
                  : "border-white/15 bg-white/5 hover:bg-white/10 text-white"
              }`}
              title="Copy notes as Markdown"
            >
              {copiedExport ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copiedExport ? "Copied" : "Export Markdown"}</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {filteredPins.length === 0 ? (
            <div className="py-12 text-center font-mono text-xs opacity-50 space-y-1 text-zinc-400">
              <p>No notes found.</p>
              <p className="text-[11px]">Notes added on the canvas will appear here.</p>
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
                      ? "bg-white/[0.02] border-white/5 opacity-75"
                      : "bg-white/[0.04] border-white/10 shadow-md"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                          isResolved
                            ? "bg-white/10 text-zinc-400 border border-white/15"
                            : "bg-white text-black"
                        }`}
                      >
                        {pin.number}
                      </span>
                      <span className="font-mono text-[11px] font-medium text-zinc-400">
                        {pin.deviceMode} · ({pin.xPercent}%, {pin.yPercent}%)
                      </span>
                    </div>

                    <button
                      onClick={() => toggleResolvePin(project.id, pin.id)}
                      className={`px-2 py-1 rounded text-[10px] font-mono border transition-all flex items-center gap-1 cursor-pointer ${
                        isResolved
                          ? "border-white/20 text-zinc-400 hover:text-white"
                          : "border-white/30 text-white hover:bg-white/10"
                      }`}
                    >
                      <Check className="w-3 h-3" />
                      <span>{isResolved ? "Resolved" : "Mark Resolved"}</span>
                    </button>
                  </div>

                  {pin.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="p-3 rounded-lg border border-white/5 bg-black/40 space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                        <span className="font-semibold text-white">{comment.authorName}</span>
                        <span className="text-[10px] text-zinc-500">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-200 leading-relaxed font-sans">{comment.content}</p>
                    </div>
                  ))}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
