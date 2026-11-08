"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Monitor, Tablet, Smartphone, MessageSquare, MousePointer, CheckCircle, Share2, ArrowLeft } from "lucide-react";
import { DeviceMode, InteractionMode, Project } from "@/types";
import { MilestoneDial } from "@/components/common/Logo";
interface ReviewHeaderProps {
  project: Project;
  deviceMode: DeviceMode;
  interactionMode: InteractionMode;
  onDeviceChange: (mode: DeviceMode) => void;
  onInteractionModeChange: (mode: InteractionMode) => void;
  onOpenApproval: () => void;
}

export const ReviewHeader: React.FC<ReviewHeaderProps> = ({
  project,
  deviceMode,
  interactionMode,
  onDeviceChange,
  onInteractionModeChange,
  onOpenApproval,
}) => {
  const [copied, setCopied] = useState(false);

  const openCount = project.pins.filter((p) => p.status !== "resolved").length;
  const resolvedCount = project.pins.filter((p) => p.status === "resolved").length;

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <header className="h-14 border-b border-[#27272A] bg-[#121215]/90 backdrop-blur-md px-4 flex items-center justify-between z-30 sticky top-0">
      {/* Left: Brand + Project Title */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="p-1.5 rounded-md hover:bg-[#18181B] text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors"
          title="Back to Dashboard"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-2">
          <MilestoneDial locked={project.isApproved} />
          <span className="font-semibold text-sm tracking-tight text-[#FAFAFA] max-w-[200px] sm:max-w-xs truncate">
            {project.title}
          </span>
        </div>
      </div>

      {/* Center: Device Switcher & Interaction Mode */}
      <div className="hidden md:flex items-center gap-4">
        {/* Viewport Toggles */}
        <div className="flex items-center bg-[#18181B] p-0.5 rounded-lg border border-[#27272A]">
          <button
            onClick={() => onDeviceChange("desktop")}
            className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
              deviceMode === "desktop"
                ? "bg-[#27272A] text-[#FAFAFA] shadow-sm"
                : "text-[#A1A1AA] hover:text-[#FAFAFA]"
            }`}
            title="Desktop (1440px)"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop</span>
          </button>

          <button
            onClick={() => onDeviceChange("tablet")}
            className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
              deviceMode === "tablet"
                ? "bg-[#27272A] text-[#FAFAFA] shadow-sm"
                : "text-[#A1A1AA] hover:text-[#FAFAFA]"
            }`}
            title="Tablet (768px)"
          >
            <Tablet className="w-3.5 h-3.5" />
            <span>Tablet</span>
          </button>

          <button
            onClick={() => onDeviceChange("mobile")}
            className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
              deviceMode === "mobile"
                ? "bg-[#27272A] text-[#FAFAFA] shadow-sm"
                : "text-[#A1A1AA] hover:text-[#FAFAFA]"
            }`}
            title="Mobile (375px)"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile</span>
          </button>
        </div>

        {/* Comment vs Browse Mode */}
        <div className="flex items-center bg-[#18181B] p-0.5 rounded-lg border border-[#27272A]">
          <button
            onClick={() => onInteractionModeChange("comment")}
            className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
              interactionMode === "comment"
                ? "bg-[#F59E0B] text-[#09090B] font-semibold"
                : "text-[#A1A1AA] hover:text-[#FAFAFA]"
            }`}
            title="Click anywhere to drop pins (Hotkey: C)"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Comment</span>
          </button>

          <button
            onClick={() => onInteractionModeChange("browse")}
            className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
              interactionMode === "browse"
                ? "bg-[#27272A] text-[#FAFAFA]"
                : "text-[#A1A1AA] hover:text-[#FAFAFA]"
            }`}
            title="Navigate links inside the frame"
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span>Browse</span>
          </button>
        </div>
      </div>

      {/* Right: Status Counts & Action Buttons */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-[#A1A1AA]">
          <span className="text-[#F59E0B] font-medium">{openCount} Open</span>
          <span>·</span>
          <span className="text-[#10B981] font-medium">{resolvedCount} Resolved</span>
        </div>

        <button
          onClick={handleCopyLink}
          className="p-1.5 sm:px-3 sm:py-1.5 rounded-md border border-[#27272A] bg-[#18181B] hover:border-[#3F3F46] text-[#FAFAFA] text-xs font-medium flex items-center gap-1.5 transition-colors"
          title="Copy client review link"
        >
          <Share2 className="w-3.5 h-3.5 text-[#F59E0B]" />
          <span className="hidden sm:inline">{copied ? "Copied!" : "Share Link"}</span>
        </button>

        {project.isApproved ? (
          <div className="px-3 py-1.5 rounded-md bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] text-xs font-medium flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Approved</span>
          </div>
        ) : (
          <button
            onClick={onOpenApproval}
            className="px-3 py-1.5 rounded-md bg-[#F59E0B] hover:bg-[#D97706] text-[#09090B] font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Approve</span>
          </button>
        )}
      </div>
    </header>
  );
};

