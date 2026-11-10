"use client";

import React, { useState } from "react";
import { Check, CheckCircle2, Download, MessageSquare } from "lucide-react";
import { Pin, Project } from "@/types";
import { exportProjectAsMarkdown } from "@/lib/export";

interface FeedbackSidebarProps {
  project: Project;
  activePinId: string | null;
  onSelectPin: (pinId: string) => void;
  onToggleResolve: (pinId: string) => void;
}

export const FeedbackSidebar: React.FC<FeedbackSidebarProps> = ({
  project,
  activePinId,
  onSelectPin,
  onToggleResolve,
}) => {
  const [filter, setFilter] = useState<"all" | "open" | "resolved">("open");
  const [isCopied, setIsCopied] = useState(false);

  const openPins = project.pins.filter((p) => p.status !== "resolved");
  const resolvedPins = project.pins.filter((p) => p.status === "resolved");

  const displayedPins =
    filter === "open" ? openPins : filter === "resolved" ? resolvedPins : project.pins;

  const handleExportMarkdown = () => {
    const md = exportProjectAsMarkdown(project);
    navigator.clipboard.writeText(md);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <aside className="w-80 lg:w-96 border-l border-white/[0.08] bg-[#000000] flex flex-col h-[calc(100vh-3.5rem)] select-none text-white selection:bg-white selection:text-black">
      {/* Top Sidebar Header */}
      <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-zinc-400" />
          <h2 className="font-serif font-medium text-sm text-zinc-100">Feedback Thread</h2>
        </div>
        <button
          onClick={handleExportMarkdown}
          className="text-xs px-2.5 py-1 rounded-md border border-white/[0.08] hover:border-white/20 bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors font-mono"
          title="Export notes as Markdown for GitHub / Linear"
        >
          <Download className="w-3.5 h-3.5 text-zinc-400" />
          <span>{isCopied ? "Copied MD!" : "Export MD"}</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="px-3 py-2 border-b border-white/[0.08] flex items-center gap-1 bg-[#050505]">
        <button
          onClick={() => setFilter("open")}
          className={`px-3 py-1 rounded-md text-xs font-mono transition-all ${
            filter === "open"
              ? "bg-white text-black font-semibold shadow-sm"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          Open ({openPins.length})
        </button>

        <button
          onClick={() => setFilter("resolved")}
          className={`px-3 py-1 rounded-md text-xs font-mono transition-all ${
            filter === "resolved"
              ? "bg-white text-black font-semibold shadow-sm"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          Resolved ({resolvedPins.length})
        </button>

        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1 rounded-md text-xs font-mono transition-all ${
            filter === "all"
              ? "bg-white text-black font-semibold shadow-sm"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          All ({project.pins.length})
        </button>
      </div>

      {/* Pins List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {displayedPins.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center p-4 text-zinc-600">
            <CheckCircle2 className="w-8 h-8 mb-2 stroke-1 text-zinc-700" />
            <p className="text-xs font-mono">
              {filter === "open"
                ? "All caught up! Zero open feedback items."
                : "No pins in this view."}
            </p>
          </div>
        ) : (
          displayedPins.map((pin) => {
            const isResolved = pin.status === "resolved";
            const isActive = pin.id === activePinId;
            const firstComment = pin.comments[0]?.content || "No comment provided";
            const author = pin.comments[0]?.authorName || "Reviewer";

            return (
              <div
                key={pin.id}
                onClick={() => onSelectPin(pin.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left ${
                  isActive
                    ? "bg-white/[0.08] border-white/40 shadow-[0_0_20px_rgba(255,255,255,0.06)]"
                    : isResolved
                    ? "bg-white/[0.01] border-white/[0.04] opacity-50 hover:opacity-100"
                    : "bg-[#0a0a0a] border-white/[0.06] hover:border-white/20 hover:bg-white/[0.03]"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center font-mono font-bold text-[10px] ${
                        isActive
                          ? "bg-white text-black"
                          : isResolved
                          ? "bg-white/5 border border-white/10 text-zinc-500"
                          : "bg-white/10 border border-white/20 text-white"
                      }`}
                    >
                      {pin.number}
                    </span>
                    <span className="font-medium text-xs text-zinc-200">{author}</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleResolve(pin.id);
                    }}
                    className={`p-1 rounded transition-colors ${
                      isResolved
                        ? "text-white bg-white/10"
                        : "text-zinc-500 hover:text-white hover:bg-white/10"
                    }`}
                    title={isResolved ? "Mark open" : "Mark resolved"}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </div>

                <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed mb-2.5">
                  {firstComment}
                </p>

                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                  <span>{pin.deviceMode.toUpperCase()} · {pin.telemetry.browser}</span>
                  {pin.comments.length > 1 && (
                    <span className="text-zinc-300">
                      {pin.comments.length} replies
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
