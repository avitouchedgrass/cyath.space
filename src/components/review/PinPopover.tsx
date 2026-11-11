"use client";

import React, { useState, useEffect } from "react";
import { X, Check, Send, Trash2 } from "lucide-react";
import { Pin } from "@/types";

interface PinPopoverProps {
  pin?: Pin;
  deviceMode?: string;
  xPercent: number;
  yPercent: number;
  isNew?: boolean;
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
  authorName: initialAuthorName,
  onSaveNewPin,
  onAddComment,
  onToggleResolve,
  onDeletePin,
  onClose,
}) => {
  const [commentText, setCommentText] = useState("");
  const [name, setName] = useState(initialAuthorName || "Guest Reviewer");
  const [replyText, setReplyText] = useState("");

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
      className="bg-[#0a0a0a] border border-white/20 rounded-xl shadow-2xl p-4 text-white text-xs transition-all animate-in fade-in duration-150 backdrop-blur-xl selection:bg-white selection:text-black font-sans cursor-default"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-white text-black font-mono font-bold text-[10px] flex items-center justify-center">
            {isNew ? "+" : `#${pin?.number}`}
          </div>
          <span className="font-sans text-sm font-semibold text-white tracking-tight">
            {isNew ? "New Feedback Pin" : `Pin #${pin?.number}`}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {!isNew && pin && onToggleResolve && (
            <button
              onClick={() => onToggleResolve(pin.id)}
              className={`p-1 rounded text-xs transition-colors flex items-center gap-1 cursor-pointer ${
                pin.status === "resolved"
                  ? "bg-white/10 text-white hover:bg-white/20"
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
              className="p-1 rounded text-zinc-500 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Delete this pin"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Mode 1: New Pin Form */}
      {isNew ? (
        <form onSubmit={handleCreateSubmit} className="space-y-3">
          <div>
            <label className="block text-[11px] font-medium text-zinc-300 mb-1">
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex (Client)"
              className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/20 font-sans"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-zinc-300 mb-1">
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
              className="w-full bg-white/[0.04] border border-white/10 rounded-lg p-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/20 resize-none font-sans"
              required
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-zinc-500">Enter ↵ to drop</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-2.5 py-1 text-xs text-zinc-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-white hover:bg-zinc-200 text-black font-semibold text-xs rounded-lg transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
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
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-md px-2.5 py-1 text-[10px] font-mono text-zinc-400 flex items-center justify-between">
              <span>{pin.deviceMode.toUpperCase()} · {pin.telemetry.viewportWidth}×{pin.telemetry.viewportHeight}</span>
              <span>{pin.telemetry.browser}</span>
            </div>
          )}

          {/* Comment Thread List */}
          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
            {pin?.comments.map((comment) => (
              <div key={comment.id} className="bg-white/[0.03] rounded-lg p-2.5 border border-white/[0.06]">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-xs text-white">{comment.authorName}</span>
                  <span className="text-[10px] font-mono text-zinc-500">
                    {new Date(comment.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
              </div>
            ))}
          </div>

          {/* Reply Form */}
          <form onSubmit={handleReplySubmit} className="pt-2 border-t border-white/[0.08] flex items-center gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Reply to thread..."
              className="flex-1 bg-white/[0.04] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/20 font-sans"
            />
            <button
              type="submit"
              disabled={!replyText.trim()}
              className="p-2 bg-white hover:bg-zinc-200 disabled:opacity-30 text-black rounded-lg transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
