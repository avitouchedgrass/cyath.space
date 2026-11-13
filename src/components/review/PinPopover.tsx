"use client";

import React, { useState, useEffect } from "react";
import { X, Check, Send, Trash2, Copy } from "lucide-react";
import { Pin } from "@/types";

interface PinPopoverProps {
  pin?: Pin;
  deviceMode?: string;
  xPercent: number;
  yPercent: number;
  isNew?: boolean;
  theme?: "day" | "night";
  authorName: string;
  onSaveNewPin?: (comment: string, authorName: string) => void;
  onAddComment?: (pinId: string, content: string, authorName: string) => void;
  onToggleResolve?: (pinId: string) => void;
  onDeletePin?: (pinId: string) => void;
  onClose: () => void;
}

export const PinPopover: React.FC<PinPopoverProps> = ({
  pin,
  deviceMode = "desktop",
  xPercent,
  yPercent,
  isNew = false,
  theme = "night",
  authorName: initialAuthorName,
  onSaveNewPin,
  onAddComment,
  onToggleResolve,
  onDeletePin,
  onClose,
}) => {
  const isDay = theme === "day";
  const [commentText, setCommentText] = useState("");
  const [name, setName] = useState(initialAuthorName || "Guest Reviewer");
  const [replyText, setReplyText] = useState("");
  const [copiedIssue, setCopiedIssue] = useState(false);

  const handleCopyIssue = () => {
    if (!pin) return;
    const firstComment = pin.comments?.[0]?.content || "No feedback content.";
    const extraComments = (pin.comments?.slice(1) || [])
      .map((c) => `- **${c.authorName || "Reviewer"}**: ${c.content}`)
      .join("\n");

    const text = [
      `### [Cyath Pin #${pin.number}] ${firstComment.slice(0, 80)}${firstComment.length > 80 ? "..." : ""}`,
      "",
      `- **Status:** ${pin.status === "resolved" ? "Resolved" : "Open"}`,
      `- **Page:** \`${pin.pageUrl || "/"}\``,
      `- **Viewport:** ${pin.deviceMode || deviceMode} (${pin.telemetry?.viewportWidth || 1440}×${pin.telemetry?.viewportHeight || 900})`,
      `- **Browser:** ${pin.telemetry?.browser || "Browser"}`,
      `- **Coordinates:** ${pin.xPercent.toFixed(1)}% X, ${pin.yPercent.toFixed(1)}% Y`,
      "",
      "#### Feedback",
      firstComment,
      extraComments ? `\n#### Discussion\n${extraComments}` : "",
      "",
      "---",
      "*Captured via [Cyath](https://cyath-space.vercel.app)*",
    ]
      .filter(Boolean)
      .join("\n");

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedIssue(true);
      setTimeout(() => setCopiedIssue(false), 2000);
    }
  };

  useEffect(() => {
    setName(initialAuthorName || "Guest Reviewer");
  }, [initialAuthorName]);

  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const isSmallScreen = windowWidth < 640;
  const isMobileLayout = deviceMode === "mobile" || isSmallScreen;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    if (onSaveNewPin) {
      onSaveNewPin(commentText.trim(), name.trim() || "Guest Reviewer");
      setCommentText("");
    }
  };

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !pin) return;
    if (onAddComment) {
      onAddComment(pin.id, replyText.trim(), name.trim() || "Guest Reviewer");
      setReplyText("");
    }
  };

  const isRight = xPercent > 50;
  const isBottom = yPercent > 65;

  const popoverStyle: React.CSSProperties = isMobileLayout
    ? {
      position: "absolute",
      bottom: "12px",
      left: "12px",
      right: "12px",
      width: "calc(100% - 24px)",
      maxWidth: "none",
      zIndex: 50,
    }
    : {
      position: "absolute",
      zIndex: 50,
      ...(isRight
        ? { right: `${Math.max(2, Math.min(65, 100 - xPercent + 2))}%`, left: "auto" }
        : { left: `${Math.max(2, Math.min(65, xPercent + 2))}%`, right: "auto" }),
      ...(isBottom
        ? { bottom: `${Math.max(2, Math.min(60, 100 - yPercent + 2))}%`, top: "auto" }
        : { top: `${Math.max(2, Math.min(60, yPercent + 2))}%`, bottom: "auto" }),
      width: "320px",
      maxWidth: "calc(100% - 16px)",
    };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={popoverStyle}
      className={`border rounded-xl shadow-2xl p-4 text-xs transition-all animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl font-sans cursor-default ${isDay
          ? "bg-white border-stone-300 text-stone-900 shadow-[0_20px_60px_rgba(0,0,0,0.16)] selection:bg-stone-200"
          : "bg-[#0a0a0a] border-white/20 text-white shadow-2xl selection:bg-white selection:text-black"
        }`}
    >
      {/* Header */}
      <div className={`flex items-center justify-between border-b pb-2.5 mb-3 ${isDay ? "border-stone-200" : "border-white/[0.08]"}`}>
        <div className="flex items-center gap-2">
          <div className={`w-5 h-5 rounded-full font-mono font-bold text-[10px] flex items-center justify-center ${isDay ? "bg-stone-900 text-white" : "bg-white text-black"
            }`}>
            {isNew ? "+" : `#${pin?.number}`}
          </div>
          <span className={`font-sans text-sm font-semibold tracking-tight ${isDay ? "text-stone-900" : "text-white"}`}>
            {isNew ? "New Feedback Pin" : `Pin #${pin?.number}`}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {!isNew && pin && (
            <button
              onClick={handleCopyIssue}
              className={`p-1 rounded text-xs transition-colors flex items-center gap-1 cursor-pointer ${copiedIssue
                  ? isDay
                    ? "bg-stone-200 text-stone-900"
                    : "bg-white/20 text-white"
                  : isDay
                    ? "text-stone-500 hover:text-stone-900 hover:bg-stone-100"
                    : "text-zinc-500 hover:text-white hover:bg-white/10"
                }`}
              title={copiedIssue ? "Copied Markdown to clipboard!" : "Copy for GitHub / Linear"}
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          )}

          {!isNew && pin && onToggleResolve && (
            <button
              onClick={() => onToggleResolve(pin.id)}
              className={`p-1 rounded text-xs transition-colors flex items-center gap-1 cursor-pointer ${pin.status === "resolved"
                  ? isDay
                    ? "bg-stone-200 text-stone-900 font-bold"
                    : "bg-white/10 text-white"
                  : isDay
                    ? "text-stone-500 hover:text-stone-900 hover:bg-stone-100"
                    : "text-zinc-500 hover:text-white hover:bg-white/10"
                }`}
              title={pin.status === "resolved" ? "Reopen pin" : "Mark as resolved"}
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          )}

          {!isNew && pin && onDeletePin && (
            <button
              onClick={() => {
                if (window.confirm(`Delete Pin #${pin.number}?`)) {
                  onDeletePin(pin.id);
                  onClose();
                }
              }}
              className={`p-1 rounded transition-colors cursor-pointer ${isDay ? "text-stone-400 hover:text-rose-600 hover:bg-rose-50" : "text-zinc-500 hover:text-white hover:bg-white/10"
                }`}
              title="Delete this pin"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={onClose}
            className={`p-1 rounded transition-colors cursor-pointer ${isDay ? "text-stone-400 hover:text-stone-900 hover:bg-stone-100" : "text-zinc-400 hover:text-white hover:bg-white/10"
              }`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Mode 1: New Pin Form */}
      {isNew ? (
        <form onSubmit={handleCreateSubmit} className="space-y-3">
          <div>
            <label className={`block text-[11px] font-medium mb-1 ${isDay ? "text-stone-700" : "text-zinc-300"}`}>
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex (Client)"
              className={`w-full rounded-lg px-2.5 py-1.5 text-xs focus:outline-none font-sans border ${isDay
                  ? "bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-400 focus:border-stone-900"
                  : "bg-white/[0.04] border-white/10 text-white placeholder:text-zinc-600 focus:border-white/50"
                }`}
              required
            />
          </div>

          <div>
            <label className={`block text-[11px] font-medium mb-1 ${isDay ? "text-stone-700" : "text-zinc-300"}`}>
              Feedback / Change Request
            </label>
            <textarea
              autoFocus
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (commentText.trim()) {
                    handleCreateSubmit(e);
                  }
                }
              }}
              rows={3}
              placeholder="What needs to change here?"
              className={`w-full rounded-lg p-2.5 text-xs focus:outline-none resize-none font-sans border ${isDay
                  ? "bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-400 focus:border-stone-900"
                  : "bg-white/[0.04] border-white/10 text-white placeholder:text-zinc-600 focus:border-white/50"
                }`}
              required
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className={`text-[11px] ${isDay ? "text-stone-500" : "text-zinc-500"}`}>Enter ↵ to drop</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className={`px-2.5 py-1 text-xs cursor-pointer ${isDay ? "text-stone-600 hover:text-stone-950" : "text-zinc-400 hover:text-white"}`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-3.5 py-1.5 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1 shadow-sm cursor-pointer ${isDay
                    ? "bg-stone-900 hover:bg-stone-800 text-white"
                    : "bg-white hover:bg-zinc-200 text-black"
                  }`}
              >
                <span>Drop Pin</span>
              </button>
            </div>
          </div>
        </form>
      ) : (
        /* Mode 2: Existing Pin Thread */
        <div className="space-y-3">
          {/* Telemetry Chip */}
          {pin?.telemetry && (
            <div className={`border rounded-md px-2.5 py-1 text-[10px] font-mono flex items-center justify-between ${isDay ? "bg-stone-50 border-stone-200 text-stone-600" : "bg-white/[0.03] border-white/[0.08] text-zinc-400"
              }`}>
              <span>{(pin.deviceMode || "desktop").toUpperCase()} · {pin.telemetry.viewportWidth || "—"}×{pin.telemetry.viewportHeight || "—"}</span>
              <span>{pin.telemetry.browser || "Browser"}</span>
            </div>
          )}

          {/* Comment Thread List */}
          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
            {(Array.isArray(pin?.comments) ? pin.comments : []).map((comment) => (
              <div
                key={comment.id}
                className={`rounded-lg p-2.5 border ${isDay ? "bg-stone-50 border-stone-200 text-stone-900" : "bg-white/[0.03] border-white/[0.06] text-zinc-300"
                  }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-semibold text-xs ${isDay ? "text-stone-950" : "text-white"}`}>{comment.authorName}</span>
                  <span className={`text-[10px] font-mono ${isDay ? "text-stone-500" : "text-zinc-500"}`}>
                    {new Date(comment.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="text-xs leading-relaxed whitespace-pre-wrap">{comment.content}</p>
              </div>
            ))}
          </div>

          {/* Reply Form */}
          <form onSubmit={handleReplySubmit} className={`pt-2 border-t flex items-center gap-2 ${isDay ? "border-stone-200" : "border-white/[0.08]"}`}>
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Reply to thread..."
              className={`flex-1 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none font-sans border ${isDay
                  ? "bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-400 focus:border-stone-900"
                  : "bg-white/[0.04] border-white/10 text-white placeholder:text-zinc-600 focus:border-white/50"
                }`}
            />
            <button
              type="submit"
              disabled={!replyText.trim()}
              className={`p-2 rounded-lg transition-colors cursor-pointer disabled:opacity-30 ${isDay
                  ? "bg-stone-900 hover:bg-stone-800 text-white"
                  : "bg-white hover:bg-zinc-200 text-black"
                }`}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
