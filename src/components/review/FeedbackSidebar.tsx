"use client";

import React, { useState } from "react";
import { Check, CheckCircle2, ChevronRight, Download, Filter, MessageSquare } from "lucide-react";
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
    <aside className="w-80 lg:w-96 border-l border-[#27272A] bg-[#121215] flex flex-col h-[calc(100vh-3.5rem)] select-none">
      {/* Top Sidebar Header */}
      <div className="p-4 border-b border-[#27272A] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#F59E0B]" />
          <h2 className="font-semibold text-sm text-[#FAFAFA]">Feedback Thread</h2>
        </div>
        <button
          onClick={handleExportMarkdown}
          className="text-xs px-2.5 py-1 rounded border border-[#27272A] hover:border-[#3F3F46] bg-[#18181B] text-[#A1A1AA] hover:text-[#FAFAFA] flex items-center gap-1.5 transition-colors"
          title="Export as Markdown for GitHub / Linear"
        >
          <Download className="w-3.5 h-3.5 text-[#F59E0B]" />
          <span>{isCopied ? "Copied MD!" : "Export MD"}</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 py-2.5 border-b border-[#27272A] flex items-center gap-1 bg-[#18181B]/40">
        <button
          onClick={() => setFilter("open")}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
            filter === "open"
              ? "bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30"
              : "text-[#A1A1AA] hover:text-[#FAFAFA]"
          }`}
        >
          Open ({openPins.length})
        </button>

        <button
          onClick={() => setFilter("resolved")}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
            filter === "resolved"
              ? "bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30"
              : "text-[#A1A1AA] hover:text-[#FAFAFA]"
          }`}
        >
          Resolved ({resolvedPins.length})
        </button>

        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
            filter === "all"
              ? "bg-[#27272A] text-[#FAFAFA]"
              : "text-[#A1A1AA] hover:text-[#FAFAFA]"
          }`}
        >
          All ({project.pins.length})
        </button>
      </div>

      {/* Pins List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {displayedPins.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center p-4 text-[#52525B]">
            <CheckCircle2 className="w-8 h-8 mb-2 stroke-1 text-[#27272A]" />
            <p className="text-xs">
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
                className={`p-3 rounded-xl border transition-all cursor-pointer text-left ${
                  isActive
                    ? "bg-[#18181B] border-[#F59E0B] shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                    : isResolved
                    ? "bg-[#121215]/80 border-[#27272A]/70 opacity-70 hover:opacity-100"
                    : "bg-[#18181B]/70 border-[#27272A] hover:border-[#3F3F46] hover:bg-[#18181B]"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                        isResolved
                          ? "bg-[#10B981]/20 text-[#10B981]"
                          : "bg-[#F59E0B] text-[#09090B]"
                      }`}
                    >
                      {pin.number}
                    </span>
                    <span className="font-semibold text-xs text-[#FAFAFA]">{author}</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleResolve(pin.id);
                    }}
                    className={`p-1 rounded transition-colors ${
                      isResolved
                        ? "text-[#10B981] hover:bg-[#10B981]/20"
                        : "text-[#52525B] hover:text-[#10B981] hover:bg-[#27272A]"
                    }`}
                    title={isResolved ? "Mark open" : "Mark resolved"}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-xs text-[#A1A1AA] line-clamp-2 leading-relaxed mb-2">
                  {firstComment}
                </p>

                <div className="flex items-center justify-between text-[10px] font-mono text-[#52525B]">
                  <span>{pin.deviceMode} · {pin.telemetry.browser}</span>
                  {pin.comments.length > 1 && (
                    <span className="text-[#F59E0B] font-sans">
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

