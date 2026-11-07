"use client";

import React, { useState, useEffect } from "react";
import { X, Check, Send, CornerDownRight } from "lucide-react";
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

  // Adjust placement so it doesn't clip outside edges
  const positionClass =
    xPercent > 65
      ? "right-4 sm:-translate-x-full sm:left-auto"
      : "left-4 sm:left-auto";

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
      style={{
        left: `${Math.min(85, Math.max(15, xPercent))}%`,
        top: `${Math.min(80, Math.max(10, yPercent))}%`,
      }}
      className={`absolute z-30 w-80 bg-[#121215] border border-[#27272A] rounded-xl shadow-2xl p-4 text-[#FAFAFA] text-xs transition-all animate-in fade-in zoom-in-95 duration-150 ${positionClass}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#27272A] pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-[#F59E0B] text-[#09090B] font-bold text-[10px] flex items-center justify-center">
            {isNew ? "+" : `#${pin?.number}`}
          </div>
          <span className="font-semibold text-xs text-[#FAFAFA]">
            {isNew ? "New Feedback Pin" : `Pin #${pin?.number}`}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {!isNew && pin && onToggleResolve && (
            <button
              onClick={() => onToggleResolve(pin.id)}
              className={`p-1 rounded text-xs transition-colors flex items-center gap-1 ${
                pin.status === "resolved"
                  ? "bg-[#10B981]/20 text-[#10B981] hover:bg-[#10B981]/30"
                  : "text-[#A1A1AA] hover:text-[#10B981] hover:bg-[#18181B]"
              }`}
              title={pin.status === "resolved" ? "Reopen pin" : "Mark as resolved"}
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={onClose}
            className="p-1 rounded text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#18181B] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Mode 1: New Pin Form */}
      {isNew ? (
        <form onSubmit={handleCreateSubmit} className="space-y-3">
          <div>
            <label className="block text-[10px] uppercase font-mono tracking-wider text-[#A1A1AA] mb-1">
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex (Client)"
              className="w-full bg-[#18181B] border border-[#27272A] rounded-lg px-2.5 py-1.5 text-xs text-[#FAFAFA] focus:outline-none focus:border-[#F59E0B]"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-mono tracking-wider text-[#A1A1AA] mb-1">
              Feedback / Change Request
            </label>
            <textarea
              autoFocus
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={3}
              placeholder="What needs to change here?"
              className="w-full bg-[#18181B] border border-[#27272A] rounded-lg p-2.5 text-xs text-[#FAFAFA] focus:outline-none focus:border-[#F59E0B] resize-none"
              required
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] font-mono text-[#52525B]">Press Enter ↵ to drop</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-2.5 py-1 text-xs text-[#A1A1AA] hover:text-[#FAFAFA]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 bg-[#F59E0B] hover:bg-[#D97706] text-[#09090B] font-semibold text-xs rounded-lg transition-colors flex items-center gap-1"
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
            <div className="bg-[#18181B] border border-[#27272A] rounded-md px-2 py-1 text-[10px] font-mono text-[#A1A1AA] flex items-center justify-between">
              <span>{pin.deviceMode.toUpperCase()} · {pin.telemetry.viewportWidth}×{pin.telemetry.viewportHeight}</span>
              <span>{pin.telemetry.browser}</span>
            </div>
          )}

          {/* Comment Thread List */}
          <div className="max-h-48 overflow-y-auto space-y-2.5 pr-1">
            {pin?.comments.map((comment) => (
              <div key={comment.id} className="bg-[#18181B] rounded-lg p-2.5 border border-[#27272A]">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-xs text-[#FAFAFA]">{comment.authorName}</span>
                  <span className="text-[10px] text-[#A1A1AA]">
                    {new Date(comment.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="text-xs text-[#A1A1AA] leading-relaxed whitespace-pre-wrap">{comment.content}</p>
              </div>
            ))}
          </div>

          {/* Reply Form */}
          <form onSubmit={handleReplySubmit} className="pt-2 border-t border-[#27272A] flex items-center gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Reply to this thread..."
              className="flex-1 bg-[#18181B] border border-[#27272A] rounded-lg px-2.5 py-1.5 text-xs text-[#FAFAFA] focus:outline-none focus:border-[#F59E0B]"
            />
            <button
              type="submit"
              disabled={!replyText.trim()}
              className="p-2 bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-40 text-[#09090B] rounded-lg transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

