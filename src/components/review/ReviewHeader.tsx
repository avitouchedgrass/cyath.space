"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Monitor,
  Tablet,
  Smartphone,
  Maximize2,
  Minimize2,
  MessageSquare,
  MousePointer,
  CheckCircle,
  Share2,
  ArrowLeft,
  Volume2,
  VolumeX,
  Sun,
  Moon,
} from "lucide-react";
import { DeviceMode, InteractionMode, Project } from "@/types";
import { CyathLogo } from "@/components/common/Logo";

interface ReviewHeaderProps {
  project: Project;
  deviceMode: DeviceMode;
  interactionMode: InteractionMode;
  isAudioMuted?: boolean;
  isNativeFullscreen?: boolean;
  theme?: "day" | "night";
  onToggleTheme?: () => void;
  onDeviceChange: (mode: DeviceMode) => void;
  onInteractionModeChange: (mode: InteractionMode) => void;
  onOpenApproval: () => void;
  onToggleAudioMute?: () => void;
  onToggleNativeFullscreen?: () => void;
}

export const ReviewHeader: React.FC<ReviewHeaderProps> = ({
  project,
  deviceMode,
  interactionMode,
  isAudioMuted = true,
  isNativeFullscreen = false,
  theme = "night",
  onToggleTheme,
  onDeviceChange,
  onInteractionModeChange,
  onOpenApproval,
  onToggleAudioMute,
  onToggleNativeFullscreen,
}) => {
  const [copied, setCopied] = useState(false);
  const isDay = theme === "day";

  const pins = Array.isArray(project?.pins) ? project.pins.filter(Boolean) : [];
  const openCount = pins.filter((p) => p && p.status !== "resolved").length;
  const resolvedCount = pins.filter((p) => p && p.status === "resolved").length;

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      let fullUrl = `${window.location.origin}/r/${project.shareId}`;
      if (project.targetUrl && !project.targetUrl.startsWith("data:")) {
        const params = new URLSearchParams();
        params.set("u", project.targetUrl);
        if (project.title) params.set("t", project.title);
        if (project.agencyName) params.set("a", project.agencyName);
        fullUrl = `${window.location.origin}/r/${project.shareId}?${params.toString()}`;
      }
      navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <header
      className={`h-14 border-b px-4 sm:px-6 flex items-center justify-between z-30 sticky top-0 select-none transition-colors duration-200 ${isDay
          ? "bg-[#FBF9F4]/95 border-stone-200/80 text-stone-900 shadow-sm"
          : "bg-[#000000]/90 border-white/[0.08] text-white backdrop-blur-md"
        }`}
    >
      {/* Left: Brand + Project Title */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className={`p-1.5 rounded-md transition-colors ${isDay ? "hover:bg-stone-100 text-stone-600 hover:text-stone-900" : "hover:bg-white/10 text-zinc-400 hover:text-white"
            }`}
          title="Back to Studio Dashboard"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>

        <div className="flex items-center gap-2.5">
          <CyathLogo size={22} locked={project.isApproved} />
          <div className={`h-4 w-[1px] ${isDay ? "bg-stone-200" : "bg-white/15"}`} />
          <span
            className={`font-serif text-sm font-medium tracking-wide max-w-[150px] sm:max-w-xs truncate ${isDay ? "text-stone-900" : "text-zinc-100"
              }`}
          >
            {project.title}
          </span>
        </div>
      </div>

      {/* Center: Device Switcher & Interaction Mode */}
      <div className="hidden md:flex items-center gap-3">
        {/* Viewport Toggles with Animated Transitions */}
        <div
          className={`flex items-center p-1 rounded-lg border ${isDay ? "bg-stone-100 border-stone-200" : "bg-white/[0.04] border-white/[0.08]"
            }`}
        >
          <button
            onClick={() => onDeviceChange(deviceMode === "full" ? "desktop" : "full")}
            className={`px-2.5 py-1 rounded-md text-xs font-mono flex items-center gap-1.5 transition-all duration-300 cursor-pointer ${deviceMode === "full"
                ? isDay
                  ? "bg-stone-900 text-white font-semibold shadow-sm scale-105"
                  : "bg-white text-black font-semibold shadow-[0_0_16px_rgba(255,255,255,0.4)] scale-105"
                : isDay
                  ? "text-stone-600 hover:text-stone-900"
                  : "text-zinc-400 hover:text-white"
              }`}
            title="Full Viewport (Fluid Edge-to-Edge, Hotkey: F)"
          >
            {deviceMode === "full" ? (
              <Minimize2 className="w-3.5 h-3.5 animate-in zoom-in-75 duration-200" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
            <span>Full</span>
          </button>

          <button
            onClick={() => onDeviceChange("desktop")}
            className={`px-2.5 py-1 rounded-md text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${deviceMode === "desktop"
                ? isDay
                  ? "bg-stone-900 text-white font-semibold shadow-sm"
                  : "bg-white text-black font-semibold shadow-sm"
                : isDay
                  ? "text-stone-600 hover:text-stone-900"
                  : "text-zinc-400 hover:text-white"
              }`}
            title="Desktop Frame (1440px, Hotkey: 1)"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop</span>
          </button>

          <button
            onClick={() => onDeviceChange("tablet")}
            className={`px-2.5 py-1 rounded-md text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${deviceMode === "tablet"
                ? isDay
                  ? "bg-stone-900 text-white font-semibold shadow-sm"
                  : "bg-white text-black font-semibold shadow-sm"
                : isDay
                  ? "text-stone-600 hover:text-stone-900"
                  : "text-zinc-400 hover:text-white"
              }`}
            title="Tablet Frame (768px, Hotkey: 2)"
          >
            <Tablet className="w-3.5 h-3.5" />
            <span>Tablet</span>
          </button>

          <button
            onClick={() => onDeviceChange("mobile")}
            className={`px-2.5 py-1 rounded-md text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${deviceMode === "mobile"
                ? isDay
                  ? "bg-stone-900 text-white font-semibold shadow-sm"
                  : "bg-white text-black font-semibold shadow-sm"
                : isDay
                  ? "text-stone-600 hover:text-stone-900"
                  : "text-zinc-400 hover:text-white"
              }`}
            title="Mobile Frame (375px, Hotkey: 3)"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile</span>
          </button>

          {onToggleNativeFullscreen && (
            <div className={`pl-1 border-l ml-0.5 ${isDay ? "border-stone-200" : "border-white/10"}`}>
              <button
                onClick={onToggleNativeFullscreen}
                className={`p-1 rounded transition-colors cursor-pointer ${isDay ? "text-stone-600 hover:text-stone-900 hover:bg-stone-200" : "text-zinc-400 hover:text-white hover:bg-white/10"
                  }`}
                title={isNativeFullscreen ? "Exit Monitor Fullscreen" : "Expand Monitor Fullscreen"}
              >
                {isNativeFullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
              </button>
            </div>
          )}
        </div>

        {/* Comment vs Browse Mode */}
        <div
          className={`flex items-center p-1 rounded-lg border ${isDay ? "bg-stone-100 border-stone-200" : "bg-white/[0.04] border-white/[0.08]"
            }`}
        >
          <button
            onClick={() => onInteractionModeChange("comment")}
            className={`px-3 py-1 rounded-md text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${interactionMode === "comment"
                ? isDay
                  ? "bg-stone-900 text-white font-semibold shadow-sm"
                  : "bg-white text-black font-semibold shadow-sm"
                : isDay
                  ? "text-stone-600 hover:text-stone-900"
                  : "text-zinc-400 hover:text-white"
              }`}
            title="Click anywhere to drop pins (Hotkey: C)"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Comment</span>
          </button>

          <button
            onClick={() => onInteractionModeChange("browse")}
            className={`px-3 py-1 rounded-md text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${interactionMode === "browse"
                ? isDay
                  ? "bg-stone-900 text-white font-semibold shadow-sm"
                  : "bg-white text-black font-semibold shadow-sm"
                : isDay
                  ? "text-stone-600 hover:text-stone-900"
                  : "text-zinc-400 hover:text-white"
              }`}
            title="Navigate links inside the frame"
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span>Browse</span>
          </button>
        </div>
      </div>

      {/* Right: Audio Control, Theme Toggle, Status Counts & Action Buttons */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {onToggleAudioMute && (
          <button
            onClick={onToggleAudioMute}
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${isAudioMuted
                ? isDay
                  ? "border-stone-200 bg-white text-stone-500 hover:text-stone-900 hover:bg-stone-100"
                  : "border-white/[0.08] bg-white/[0.03] text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.06]"
                : isDay
                  ? "border-stone-400 bg-stone-100 text-stone-950 shadow-sm"
                  : "border-white/30 bg-white/10 text-white shadow-[0_0_12px_rgba(255,255,255,0.2)]"
              }`}
            title={isAudioMuted ? "Audio is Muted (Click to enable sound)" : "Audio is Live (Click to mute)"}
          >
            {isAudioMuted ? (
              <VolumeX className="w-3.5 h-3.5" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-emerald-500" />
            )}
            <span className="hidden lg:inline text-[11px]">{isAudioMuted ? "Muted" : "Audio On"}</span>
          </button>
        )}

        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${isDay
                ? "border-stone-200 bg-white text-stone-700 hover:text-stone-950 hover:bg-stone-100"
                : "border-white/[0.08] bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08]"
              }`}
            title={isDay ? "Switch to Night Mode" : "Switch to Day Mode"}
          >
            {isDay ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
          </button>
        )}

        <div
          className={`hidden sm:flex items-center gap-2 text-xs font-mono px-3 py-1 rounded-lg border ${isDay ? "bg-white border-stone-200 text-stone-700 shadow-sm" : "bg-white/[0.03] border-white/[0.08] text-zinc-400"
            }`}
        >
          <span className={`font-medium ${isDay ? "text-stone-900" : "text-zinc-200"}`}>{openCount} Open</span>
          <span className={isDay ? "text-stone-300" : "text-zinc-600"}>·</span>
          <span>{resolvedCount} Resolved</span>
        </div>

        <button
          onClick={handleCopyLink}
          className={`p-1.5 sm:px-3 sm:py-1.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${isDay
              ? "border-stone-200 bg-white text-stone-700 hover:text-stone-950 hover:bg-stone-50 shadow-sm"
              : "border-white/[0.08] bg-white/[0.05] hover:bg-white/[0.1] hover:border-white/20 text-zinc-200 hover:text-white"
            }`}
          title="Copy universal client review link"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{copied ? "Copied Link!" : "Share Link"}</span>
        </button>

        {project.isApproved ? (
          <div
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 ${isDay
                ? "bg-stone-100 border-stone-300 text-stone-900 font-medium"
                : "bg-white/10 border-white/20 text-white"
              }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Milestone Approved</span>
          </div>
        ) : (
          <button
            onClick={onOpenApproval}
            className={`px-3.5 py-1.5 rounded-lg font-semibold text-xs transition-all flex items-center gap-1.5 shadow-sm cursor-pointer ${isDay
                ? "bg-stone-900 hover:bg-stone-800 text-white"
                : "bg-white hover:bg-zinc-200 text-black"
              }`}
          >
            <CheckCircle className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Approve</span>
          </button>
        )}
      </div>
    </header>
  );
  );
};
