"use client";

import React, { useState } from "react";
import { Check, CheckCircle2, Download, MessageSquare, ArrowUpDown, Globe } from "lucide-react";
import { DeviceMode, Pin, Project } from "@/types";
import { exportProjectAsMarkdown } from "@/lib/export";
import { getPageColor, formatPageLabel } from "@/lib/colors";

interface FeedbackSidebarProps {
  project: Project;
  activePinId: string | null;
  activeDeviceMode?: DeviceMode;
  currentPageUrl?: string;
  onSelectPin: (pinId: string) => void;
  onToggleResolve: (pinId: string) => void;
  onDeviceChange?: (mode: DeviceMode) => void;
}

type SortOrder = "newest" | "oldest" | "page";

export const FeedbackSidebar: React.FC<FeedbackSidebarProps> = ({
  project,
  activePinId,
  activeDeviceMode = "desktop",
  currentPageUrl,
  onSelectPin,
  onToggleResolve,
  onDeviceChange,
}) => {
  const [filter, setFilter] = useState<"all" | "open" | "resolved">("open");
  const [deviceScope, setDeviceScope] = useState<"current" | "all">("current");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [pageFilter, setPageFilter] = useState<string>("all");
  const [isCopied, setIsCopied] = useState(false);

  const allPins = Array.isArray(project?.pins) ? project.pins.filter(Boolean) : [];
  const currentStageLabel = formatPageLabel(currentPageUrl);

  // Identify all unique subpages that have pins
  const uniquePages = Array.from(new Set(allPins.map((p) => formatPageLabel(p?.pageUrl))));

  // Filter by device scope
  let scopedPins =
    deviceScope === "current"
      ? allPins.filter((p) => p && p.deviceMode === activeDeviceMode)
      : allPins;

  // Filter by subpage if selected
  if (pageFilter !== "all") {
    scopedPins = scopedPins.filter((p) => p && formatPageLabel(p.pageUrl) === pageFilter);
  }

  // Filter by status
  const openPins = scopedPins.filter((p) => p && p.status !== "resolved");
  const resolvedPins = scopedPins.filter((p) => p && p.status === "resolved");

  let displayedPins =
    filter === "open" ? openPins : filter === "resolved" ? resolvedPins : scopedPins;

  // Sort pins
  displayedPins = [...displayedPins].filter(Boolean).sort((a, b) => {
    if (!a || !b) return 0;
    if (sortOrder === "newest") {
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      return timeB - timeA;
    } else if (sortOrder === "oldest") {
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      return timeA - timeB;
    } else if (sortOrder === "page") {
      const pageA = formatPageLabel(a.pageUrl);
      const pageB = formatPageLabel(b.pageUrl);
      return pageA.localeCompare(pageB);
    }
    return 0;
  });

  const handleExportMarkdown = () => {
    const md = exportProjectAsMarkdown({
      ...project,
      pins: allPins,
    });
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
          <h2 className="font-sans font-semibold text-sm text-zinc-100">Feedback Thread</h2>
        </div>
        <button
          onClick={handleExportMarkdown}
          className="text-xs px-2.5 py-1 rounded-md border border-white/[0.08] hover:border-white/20 bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors font-sans cursor-pointer"
          title="Export notes as Markdown for GitHub / Linear"
        >
          <Download className="w-3.5 h-3.5 text-zinc-400" />
          <span>{isCopied ? "Copied MD!" : "Export MD"}</span>
        </button>
      </div>

      {/* Scope & Sort Controls */}
      <div className="px-3 py-2 border-b border-white/[0.06] flex items-center justify-between bg-[#050507] text-[10px] font-mono text-zinc-400 gap-2">
        {/* Device Scope */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setDeviceScope("current")}
            className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
              deviceScope === "current"
                ? "bg-white text-black font-semibold shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            {activeDeviceMode.toUpperCase()} ({allPins.filter((p) => p.deviceMode === activeDeviceMode).length})
          </button>
          <button
            onClick={() => setDeviceScope("all")}
            className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
              deviceScope === "all"
                ? "bg-white text-black font-semibold shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            ALL ({allPins.length})
          </button>
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-1">
          <ArrowUpDown className="w-3 h-3 text-zinc-500" />
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as SortOrder)}
            className="bg-white/[0.05] border border-white/10 rounded px-1.5 py-0.5 text-[10px] text-zinc-300 focus:outline-none focus:border-white/30 cursor-pointer"
          >
            <option value="newest" className="bg-[#121215] text-white">Newest</option>
            <option value="oldest" className="bg-[#121215] text-white">Oldest</option>
            <option value="page" className="bg-[#121215] text-white">By Page</option>
          </select>
        </div>
      </div>

      {/* Multi-Page Filter Bar (Shows when multiple pages exist) */}
      {uniquePages.length > 1 && (
        <div className="px-3 py-1.5 border-b border-white/[0.06] bg-[#030304] flex items-center gap-1.5 overflow-x-auto text-[10px] font-mono">
          <Globe className="w-3 h-3 text-zinc-500 shrink-0" />
          <button
            onClick={() => setPageFilter("all")}
            className={`px-2 py-0.5 rounded whitespace-nowrap cursor-pointer transition-colors ${
              pageFilter === "all" ? "bg-white/20 text-white font-medium" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            All Subpages
          </button>
          {uniquePages.map((pg) => {
            const palette = getPageColor(pg);
            const isSelected = pageFilter === pg;
            return (
              <button
                key={pg}
                onClick={() => setPageFilter(pg)}
                className={`px-2 py-0.5 rounded flex items-center gap-1 whitespace-nowrap cursor-pointer border transition-colors ${
                  isSelected ? `${palette.bg} ${palette.border} text-white font-medium` : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${palette.dot}`} />
                <span className="truncate max-w-[100px]">{pg}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="px-3 py-2 border-b border-white/[0.08] flex items-center gap-1 bg-[#050505]">
        <button
          onClick={() => setFilter("open")}
          className={`px-3 py-1 rounded-md text-xs font-sans transition-all cursor-pointer ${
            filter === "open"
              ? "bg-white text-black font-semibold shadow-sm"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          Open ({openPins.length})
        </button>

        <button
          onClick={() => setFilter("resolved")}
          className={`px-3 py-1 rounded-md text-xs font-sans transition-all cursor-pointer ${
            filter === "resolved"
              ? "bg-white text-black font-semibold shadow-sm"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          Resolved ({resolvedPins.length})
        </button>

        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1 rounded-md text-xs font-sans transition-all cursor-pointer ${
            filter === "all"
              ? "bg-white text-black font-semibold shadow-sm"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          Total ({scopedPins.length})
        </button>
      </div>

      {/* Pins List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {displayedPins.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center p-4 text-zinc-600">
            <CheckCircle2 className="w-8 h-8 mb-2 stroke-1 text-zinc-700" />
            <p className="text-xs font-mono">
              {filter === "open"
                ? `Zero open notes on ${deviceScope === "current" ? activeDeviceMode : "any viewport"}.`
                : "No pins in this view."}
            </p>
          </div>
        ) : (
          displayedPins.map((pin) => {
            const isResolved = pin.status === "resolved";
            const isActive = pin.id === activePinId;
            const comments = Array.isArray(pin.comments) ? pin.comments : [];
            const firstComment = comments[0]?.content || "No comment provided";
            const author = comments[0]?.authorName || "Reviewer";
            const browserName = pin.telemetry?.browser || "Browser";
            const pagePalette = getPageColor(pin.pageUrl);
            const pageLabel = formatPageLabel(pin.pageUrl);

            return (
              <div
                key={pin.id}
                onClick={() => {
                  if (onDeviceChange && pin.deviceMode && pin.deviceMode !== activeDeviceMode) {
                    onDeviceChange(pin.deviceMode);
                  }
                  onSelectPin(pin.id);
                }}
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
                    className={`p-1 rounded transition-colors cursor-pointer ${
                      isResolved
                        ? "text-white bg-white/10"
                        : "text-zinc-500 hover:text-white hover:bg-white/10"
                    }`}
                    title={isResolved ? "Mark open" : "Mark resolved"}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </div>

                {/* Subpage Identification Tag */}
                <div className="mb-2">
                  <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-mono border ${pagePalette.bg} ${pagePalette.border} ${pagePalette.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${pagePalette.dot}`} />
                    <span className="truncate max-w-[180px]">{pageLabel}</span>
                  </div>
                </div>

                <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed mb-2.5">
                  {firstComment}
                </p>

                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                  <span className="uppercase">{pin.deviceMode || "desktop"} · {browserName}</span>
                  {comments.length > 1 && (
                    <span className="text-zinc-300">
                      {comments.length} replies
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
