"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Monitor, Tablet, Smartphone, MessageSquare, MousePointer, CheckCircle, Share2, ArrowLeft } from "lucide-react";
import { DeviceMode, InteractionMode, Project } from "@/types";
import { CyathLogo } from "@/components/common/Logo";

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
      const queryParams = `?u=${encodeURIComponent(project.targetUrl)}&t=${encodeURIComponent(project.title)}&a=${encodeURIComponent(project.agencyName || "")}`;
      const fullUrl = `${window.location.origin}/r/${project.shareId}${queryParams}`;
      navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <header className="h-14 border-b border-white/[0.08] bg-[#000000]/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-30 sticky top-0 text-white select-none">
      {/* Left: Brand + Project Title */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="p-1.5 rounded-md hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          title="Back to Studio Dashboard"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>

        <div className="flex items-center gap-2.5">
          <CyathLogo size={22} locked={project.isApproved} />
          <div className="h-4 w-[1px] bg-white/15" />
          <span className="font-serif text-sm font-medium tracking-wide text-zinc-100 max-w-[180px] sm:max-w-xs truncate">
            {project.title}
          </span>
        </div>
      </div>

      {/* Center: Device Switcher & Interaction Mode */}
      <div className="hidden md:flex items-center gap-3">
        {/* Viewport Toggles */}
        <div className="flex items-center bg-white/[0.04] p-1 rounded-lg border border-white/[0.08]">
          <button
            onClick={() => onDeviceChange("desktop")}
            className={`px-2.5 py-1 rounded-md text-xs font-mono flex items-center gap-1.5 transition-all ${
              deviceMode === "desktop"
                ? "bg-white text-black font-semibold shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
            title="Desktop (1440px)"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop</span>
          </button>

          <button
            onClick={() => onDeviceChange("tablet")}
            className={`px-2.5 py-1 rounded-md text-xs font-mono flex items-center gap-1.5 transition-all ${
              deviceMode === "tablet"
                ? "bg-white text-black font-semibold shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
            title="Tablet (768px)"
          >
            <Tablet className="w-3.5 h-3.5" />
            <span>Tablet</span>
          </button>

          <button
            onClick={() => onDeviceChange("mobile")}
            className={`px-2.5 py-1 rounded-md text-xs font-mono flex items-center gap-1.5 transition-all ${
              deviceMode === "mobile"
                ? "bg-white text-black font-semibold shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
            title="Mobile (375px)"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile</span>
          </button>
        </div>

        {/* Comment vs Browse Mode */}
        <div className="flex items-center bg-white/[0.04] p-1 rounded-lg border border-white/[0.08]">
          <button
            onClick={() => onInteractionModeChange("comment")}
            className={`px-3 py-1 rounded-md text-xs font-mono flex items-center gap-1.5 transition-all ${
              interactionMode === "comment"
                ? "bg-white text-black font-semibold shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
            title="Click anywhere to drop pins (Hotkey: C)"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Comment</span>
          </button>

          <button
            onClick={() => onInteractionModeChange("browse")}
            className={`px-3 py-1 rounded-md text-xs font-mono flex items-center gap-1.5 transition-all ${
              interactionMode === "browse"
                ? "bg-white text-black font-semibold shadow-sm"
                : "text-zinc-400 hover:text-white"
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
        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-zinc-400 bg-white/[0.03] border border-white/[0.08] px-3 py-1 rounded-lg">
          <span className="text-zinc-200 font-medium">{openCount} Open</span>
          <span className="text-zinc-600">·</span>
          <span className="text-zinc-400">{resolvedCount} Resolved</span>
        </div>

        <button
          onClick={handleCopyLink}
          className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.05] hover:bg-white/[0.1] hover:border-white/20 text-zinc-200 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-all"
          title="Copy universal client review link"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{copied ? "Copied Link!" : "Share Link"}</span>
        </button>

        {project.isApproved ? (
          <div className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white text-xs font-mono flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Milestone Approved</span>
          </div>
        ) : (
          <button
            onClick={onOpenApproval}
            className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-all flex items-center gap-1.5 shadow-sm"
          >
            <CheckCircle className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Approve</span>
          </button>
        )}
      </div>
    </header>
  );
};
