"use client";

import React, { useState } from "react";
import { Check, CheckCircle2, Download, MessageSquare, ArrowUpDown, Globe, ExternalLink, ChevronDown, Cpu } from "lucide-react";
import { DeviceMode, Pin, Project } from "@/types";
import { exportProjectAsMarkdown, getLinearExportUrl, getGitHubExportUrl } from "@/lib/export";
import { getPageColor, formatPageLabel } from "@/lib/colors";
import { SprintDigestModal } from "./SprintDigestModal";
import { GitHubExportModal } from "./GitHubExportModal";

interface FeedbackSidebarProps {
  project: Project;
  activePinId: string | null;
  activeDeviceMode?: DeviceMode;
  currentPageUrl?: string;
  theme?: "day" | "night";
  onSelectPin: (pinId: string) => void;
  onToggleResolve?: (pinId: string) => void;
  onDeviceChange?: (mode: DeviceMode) => void;
}

type SortOrder = "newest" | "oldest" | "page";

export const FeedbackSidebar: React.FC<FeedbackSidebarProps> = ({
  project,
  activePinId,
  activeDeviceMode = "desktop",
  currentPageUrl,
  theme = "night",
  onSelectPin,
  onToggleResolve,
  onDeviceChange,
}) => {
  const [filter, setFilter] = useState<"all" | "open" | "resolved">("open");
  const [deviceScope, setDeviceScope] = useState<"current" | "all">("current");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [pageFilter, setPageFilter] = useState<string>("all");
  const [isCopied, setIsCopied] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showDigestModal, setShowDigestModal] = useState(false);
  const [showGitHubModal, setShowGitHubModal] = useState(false);

  const isDay = theme === "day";

  const allPins = Array.isArray(project?.pins) ? project.pins.filter(Boolean) : [];
  const pageLabel = (url?: string) => {
    if (project.assetType === "image") return "Uploaded image";
    if (project.assetType === "pdf") return "Uploaded PDF";
    return formatPageLabel(url);
  };
  const currentStageLabel = pageLabel(currentPageUrl);

  const uniquePages = Array.from(new Set(allPins.map((p) => pageLabel(p.pageUrl))));

  let scopedPins =
    deviceScope === "current"
      ? allPins.filter((p) => p && p.deviceMode === activeDeviceMode)
      : allPins;

  if (pageFilter !== "all") {
    scopedPins = scopedPins.filter((p) => p && pageLabel(p.pageUrl) === pageFilter);
  }

  const openPins = scopedPins.filter((p) => p && p.status !== "resolved");
  const resolvedPins = scopedPins.filter((p) => p && p.status === "resolved");

  let displayedPins =
    filter === "open" ? openPins : filter === "resolved" ? resolvedPins : scopedPins;

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
      const pageA = pageLabel(a.pageUrl);
      const pageB = pageLabel(b.pageUrl);
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
    <aside
      className={`h-full w-full min-h-0 border-l flex flex-col ${isDay ? "bg-[#FBF9F4] border-stone-200 text-stone-900" : "bg-[#000000] border-white/[0.08] text-white"
        }`}
    >
      <div className={`p-4 border-b flex items-center justify-between ${isDay ? "border-stone-200 bg-[#FBF9F4]" : "border-white/[0.08] bg-[#000000]"}`}>
        <div className="flex items-center gap-2">
          <MessageSquare className={`w-4 h-4 ${isDay ? "text-stone-600" : "text-zinc-400"}`} />
          <h2 className={`font-sans font-semibold text-sm ${isDay ? "text-stone-900" : "text-zinc-100"}`}>Feedback Thread</h2>
        </div>
        {project.access?.canManage && <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowDigestModal(true)}
            className={`text-xs px-2 py-1 rounded-md border flex items-center gap-1.5 transition-colors font-sans cursor-pointer ${
              isDay
                ? "border-stone-200 bg-white hover:bg-stone-50 text-stone-700 shadow-xs"
                : "border-white/[0.08] hover:border-white/20 bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300"
            }`}
            title="Generate AI Sprint Digest with Gemini"
          >
            <Cpu className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden sm:inline">AI Digest</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowExportMenu((v) => !v)}
              className={`text-xs px-2.5 py-1 rounded-md border flex items-center gap-1.5 transition-colors font-sans cursor-pointer ${isDay
                  ? "border-stone-200 bg-white hover:bg-stone-50 text-stone-700 shadow-xs"
                  : "border-white/[0.08] hover:border-white/20 bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300"
                }`}
              title="Export feedback to Linear, GitHub, or Markdown"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isCopied ? "Copied!" : "Export"}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

          {showExportMenu && (
            <div
              className={`absolute right-0 mt-1.5 w-44 rounded-xl border p-1 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150 ${isDay
                  ? "bg-white border-stone-200 text-stone-900 shadow-stone-200/50"
                  : "bg-[#0d0d10] border-white/15 text-zinc-200 shadow-black/80"
                }`}
            >
              <button
                onClick={() => {
                  handleExportMarkdown();
                  setShowExportMenu(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-sans flex items-center justify-between cursor-pointer transition-colors ${isDay ? "hover:bg-stone-100" : "hover:bg-white/10"
                  }`}
              >
                <span>Copy Markdown</span>
                <span className="text-[10px] font-mono opacity-50">MD</span>
              </button>

              <a
                href={getLinearExportUrl(project)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowExportMenu(false)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-sans flex items-center justify-between cursor-pointer transition-colors ${isDay ? "hover:bg-stone-100" : "hover:bg-white/10"
                  }`}
              >
                <span>Push to Linear</span>
                <ExternalLink className="w-3 h-3 opacity-50" />
              </a>

              <button
                type="button"
                onClick={() => {
                  setShowExportMenu(false);
                  setShowGitHubModal(true);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-sans flex items-center justify-between cursor-pointer transition-colors ${isDay ? "hover:bg-stone-100" : "hover:bg-white/10"
                  }`}
              >
                <span>Push to GitHub</span>
                <ExternalLink className="w-3 h-3 opacity-50" />
              </button>
            </div>
          )}
        </div>
      </div>}
    </div>

      <div
        className={`px-3 py-2 border-b flex items-center justify-between text-[10px] font-mono gap-2 ${isDay ? "bg-stone-50 border-stone-200 text-stone-600" : "bg-[#050507] border-white/[0.06] text-zinc-400"
          }`}
      >
        <div className="flex items-center gap-1">
          <button
            onClick={() => setDeviceScope("current")}
            className={`px-2 py-0.5 rounded transition-all cursor-pointer ${deviceScope === "current"
                ? isDay
                  ? "bg-stone-900 text-white font-semibold shadow-xs"
                  : "bg-white text-black font-semibold shadow-sm"
                : isDay
                  ? "text-stone-600 hover:text-stone-900"
                  : "text-zinc-400 hover:text-white"
              }`}
          >
            {activeDeviceMode.toUpperCase()} ({allPins.filter((p) => p.deviceMode === activeDeviceMode).length})
          </button>
          <button
            onClick={() => setDeviceScope("all")}
            className={`px-2 py-0.5 rounded transition-all cursor-pointer ${deviceScope === "all"
                ? isDay
                  ? "bg-stone-900 text-white font-semibold shadow-xs"
                  : "bg-white text-black font-semibold shadow-sm"
                : isDay
                  ? "text-stone-600 hover:text-stone-900"
                  : "text-zinc-400 hover:text-white"
              }`}
          >
            ALL ({allPins.length})
          </button>
        </div>

        <div className="flex items-center gap-1">
          <ArrowUpDown className="w-3 h-3 opacity-60" />
          <select
            aria-label="Sort feedback"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as SortOrder)}
            className={`border rounded px-1.5 py-0.5 text-[10px] focus:outline-none cursor-pointer ${isDay ? "bg-white border-stone-200 text-stone-800" : "bg-white/[0.05] border-white/10 text-zinc-300"
              }`}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="page">By Page</option>
          </select>
        </div>
      </div>

      {uniquePages.length > 1 && (
        <div
          className={`px-3 py-1.5 border-b flex items-center gap-1.5 overflow-x-auto text-[10px] font-mono ${isDay ? "bg-stone-100/60 border-stone-200" : "bg-[#030304] border-white/[0.06]"
            }`}
        >
          <Globe className="w-3 h-3 text-zinc-500 shrink-0" />
          <button
            onClick={() => setPageFilter("all")}
            className={`px-2 py-0.5 rounded whitespace-nowrap cursor-pointer transition-colors ${pageFilter === "all"
                ? isDay
                  ? "bg-stone-900 text-white font-medium"
                  : "bg-white/20 text-white font-medium"
                : isDay
                  ? "text-stone-600 hover:text-stone-900"
                  : "text-zinc-500 hover:text-zinc-300"
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
                className={`px-2 py-0.5 rounded flex items-center gap-1 whitespace-nowrap cursor-pointer border transition-colors ${isSelected
                    ? `${palette.bg} ${palette.border} ${isDay ? "text-stone-950 font-semibold" : "text-white font-medium"}`
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                  }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${palette.dot}`} />
                <span className="truncate max-w-[100px]">{pg}</span>
              </button>
            );
          })}
        </div>
      )}

      <div
        className={`px-3 py-2 border-b flex items-center gap-1 ${isDay ? "bg-stone-100/40 border-stone-200" : "bg-[#050505] border-white/[0.08]"
          }`}
      >
        <button
          onClick={() => setFilter("open")}
          className={`px-3 py-1 rounded-md text-xs font-sans transition-all cursor-pointer ${filter === "open"
              ? isDay
                ? "bg-stone-900 text-white font-semibold shadow-xs"
                : "bg-white text-black font-semibold shadow-sm"
              : isDay
                ? "text-stone-600 hover:text-stone-900"
                : "text-zinc-400 hover:text-white"
            }`}
        >
          Open ({openPins.length})
        </button>

        <button
          onClick={() => setFilter("resolved")}
          className={`px-3 py-1 rounded-md text-xs font-sans transition-all cursor-pointer ${filter === "resolved"
              ? isDay
                ? "bg-stone-900 text-white font-semibold shadow-xs"
                : "bg-white text-black font-semibold shadow-sm"
              : isDay
                ? "text-stone-600 hover:text-stone-900"
                : "text-zinc-400 hover:text-white"
            }`}
        >
          Resolved ({resolvedPins.length})
        </button>

        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1 rounded-md text-xs font-sans transition-all cursor-pointer ${filter === "all"
              ? isDay
                ? "bg-stone-900 text-white font-semibold shadow-xs"
                : "bg-white text-black font-semibold shadow-sm"
              : isDay
                ? "text-stone-600 hover:text-stone-900"
                : "text-zinc-400 hover:text-white"
            }`}
        >
          Total ({scopedPins.length})
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 no-scrollbar">
        {displayedPins.length === 0 ? (
          <div className={`h-48 flex flex-col items-center justify-center text-center p-4 ${isDay ? "text-stone-700" : "text-zinc-300"}`}>
            <CheckCircle2 className="w-8 h-8 mb-2 stroke-1 opacity-60" />
            <p className="text-xs font-mono">
              {filter === "open"
                ? (project.pins.length ? "There are no open notes in this view." : "Select Add note or click the preview in Comment mode to leave feedback.")
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
            const pinPageLabel = pageLabel(pin.pageUrl);

            return (
              <div
                key={pin.id}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left ${isActive
                    ? isDay
                      ? "bg-white border-stone-800 shadow-[0_4px_16px_rgba(0,0,0,0.08)] ring-1 ring-stone-800"
                      : "bg-white/[0.08] border-white/40 shadow-[0_0_20px_rgba(255,255,255,0.06)]"
                    : isResolved
                      ? isDay
                        ? "bg-stone-100/60 border-stone-200/60 opacity-60 hover:opacity-100"
                        : "bg-white/[0.01] border-white/[0.04] opacity-50 hover:opacity-100"
                      : isDay
                        ? "bg-white border-stone-200/90 hover:border-stone-300 shadow-xs"
                        : "bg-[#0a0a0a] border-white/[0.06] hover:border-white/20 hover:bg-white/[0.03]"
                  }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <button type="button" className="flex min-w-0 items-center gap-2 text-left focus-visible:outline-2" onClick={() => {
                    if (pin.deviceMode !== activeDeviceMode) onDeviceChange?.(pin.deviceMode);
                    onSelectPin(pin.id);
                  }} aria-label={`Open pin ${pin.number}: ${firstComment}`}>
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center font-mono font-bold text-[10px] ${isActive
                          ? isDay
                            ? "bg-stone-900 text-white"
                            : "bg-white text-black"
                          : isResolved
                            ? isDay
                              ? "bg-stone-200 text-stone-500"
                              : "bg-white/5 border border-white/10 text-zinc-500"
                            : isDay
                              ? "bg-stone-200 text-stone-800"
                              : "bg-white/10 border border-white/20 text-white"
                        }`}
                    >
                      {pin.number}
                    </span>
                    <span className={`font-medium text-xs ${isDay ? "text-stone-900" : "text-zinc-200"}`}>{author}</span>
                  </button>

                  {onToggleResolve && <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleResolve(pin.id);
                    }}
                    className={`p-1 rounded transition-colors cursor-pointer ${isResolved
                        ? isDay
                          ? "text-stone-800 bg-stone-200"
                          : "text-white bg-white/10"
                        : isDay
                          ? "text-stone-400 hover:text-stone-900 hover:bg-stone-100"
                          : "text-zinc-500 hover:text-white hover:bg-white/10"
                      }`}
                    title={isResolved ? "Mark open" : "Mark resolved"}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>}
                </div>

                <div className="mb-2">
                  <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-mono border ${pagePalette.bg} ${pagePalette.border} ${pagePalette.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${pagePalette.dot}`} />
                    <span className="truncate max-w-[180px]">{pinPageLabel}</span>
                  </div>
                </div>

                <p className={`text-xs line-clamp-2 leading-relaxed mb-2.5 ${isDay ? "text-stone-700" : "text-zinc-300"}`}>
                  {firstComment}
                </p>

                <div className={`flex items-center justify-between text-[10px] font-mono ${isDay ? "text-stone-500" : "text-zinc-500"}`}>
                  <span className="uppercase">{pin.deviceMode || "desktop"} · {browserName}</span>
                  {comments.length > 1 && (
                    <span className={isDay ? "text-stone-800 font-medium" : "text-zinc-300"}>
                      {comments.length} replies
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <SprintDigestModal
        project={project}
        isOpen={showDigestModal}
        theme={theme}
        onClose={() => setShowDigestModal(false)}
      />

      <GitHubExportModal
        project={project}
        isOpen={showGitHubModal}
        isDay={isDay}
        onClose={() => setShowGitHubModal(false)}
      />
    </aside>
  );
};
