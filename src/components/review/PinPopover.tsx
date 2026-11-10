"use client";

import React, { useState, useEffect } from "react";
import { X, Check, Send } from "lucide-react";
import { Pin } from "@/types";

interface PinPopoverProps {
  pin?: Pin;
  xPercent: number;
  yPercent: number;
  isNew?: boolean;
  authorName: string;
  onSaveNewPin?: (comment: string, authorName: string) => void;
  onAddComment?: (pinId: string, content: string, authorName: string) => void;
  onToggleResolve?: (pinId: string) => void;
  onClose: () => void;
}

export const PinPopover: React.FC<PinPopoverProps> = ({
  pin,
  xPercent,
  yPercent,
  isNew = false,
  authorName: initialAuthorName,
  onSaveNewPin,
  onAddComment,
  onToggleResolve,
  onClose,
}) => {
  const [commentText, setCommentText] = useState("");
  const [name, setName] = useState(initialAuthorName || "Guest Reviewer");
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    setName(initialAuthorName);
  }, [initialAuthorName]);

  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isSmallScreen = windowWidth < 640;
  const isNearRightEdge = xPercent > 62;
  const isNearBottomEdge = yPercent > 70;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    if (onSaveNewPin) {
      onSaveNewPin(commentText.trim(), name.trim() || "Reviewer");
      setCommentText("");
    }
  };

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !pin) return;
    if (onAddComment) {
      onAddComment(pin.id, replyText.trim(), name.trim() || "Reviewer");
      setReplyText("");
    }
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={
        isSmallScreen
          ? { left: "16px", right: "16px", bottom: "16px", maxWidth: "calc(100vw - 32px)", zIndex: 50 }
          : {
              ...(xPercent > 50
                ? { right: `${Math.max(2, 100 - xPercent + 2)}%`, left: "auto" }
                : { left: `${Math.max(2, xPercent + 2)}%`, right: "auto" }),
              ...(yPercent > 50
                ? { bottom: `${Math.max(2, 100 - yPercent + 2)}%`, top: "auto" }
                : { top: `${Math.max(2, yPercent + 2)}%`, bottom: "auto" }),
              maxWidth: "min(320px, calc(100% - 16px))",
            }
      }
      className="fixed sm:absolute z-40 w-full sm:w-80 bg-[#0a0a0a] border border-white/20 rounded-xl shadow-2xl p-4 text-white text-xs transition-all animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl selection:bg-white selection:text-black"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-white text-black font-mono font-bold text-[10px] flex items-center justify-center">
            {isNew ? "+" : `#${pin?.number}`}
          </div>
          <span className="font-serif text-sm font-medium text-white tracking-wide">
            {isNew ? "New Feedback Pin" : `Pin #${pin?.number}`}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {!isNew && pin && onToggleResolve && (
            <button
              onClick={() => onToggleResolve(pin.id)}
              className={`p-1 rounded text-xs transition-colors flex items-center gap-1 ${
                pin.status === "resolved"
                  ? "bg-white/10 text-white hover:bg-white/20"
                  : "text-zinc-500 hover:text-white hover:bg-white/10"
              }`}
              title={pin.status === "resolved" ? "Reopen pin" : "Mark as resolved"}
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Mode 1: New Pin Form */}
      {isNew ? (
        <form onSubmit={handleCreateSubmit} className="space-y-3">
          <div>
            <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-400 mb-1">
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex (Client)"
              className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/20"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-400 mb-1">
              Feedback / Change Request
            </label>
            <textarea
              autoFocus
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={3}
              placeholder="What needs to change here?"
              className="w-full bg-white/[0.04] border border-white/10 rounded-lg p-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/20 resize-none"
              required
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] font-mono text-zinc-600">Enter ↵ to drop</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-2.5 py-1 text-xs text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-white hover:bg-zinc-200 text-black font-semibold text-xs rounded-lg transition-colors flex items-center gap-1 shadow-sm"
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
              className="flex-1 bg-white/[0.04] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/20"
            />
            <button
              type="submit"
              disabled={!replyText.trim()}
              className="p-2 bg-white hover:bg-zinc-200 disabled:opacity-30 text-black rounded-lg transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
