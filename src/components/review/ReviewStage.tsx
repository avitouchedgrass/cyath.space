"use client";

import React, { useRef, useState } from "react";
import { DeviceMode, InteractionMode, Pin, Project } from "@/types";
import { PinMarker } from "./PinMarker";
import { PinPopover } from "./PinPopover";
import { calculateNormalizedCoords } from "@/lib/coordinates";

interface ReviewStageProps {
  project: Project;
  deviceMode: DeviceMode;
  interactionMode: InteractionMode;
  activePinId: string | null;
  clientAuthorName: string;
  onSelectPin: (pinId: string | null) => void;
  onAddPin: (xPercent: number, yPercent: number, comment: string, authorName: string) => void;
  onAddComment: (pinId: string, content: string, authorName: string) => void;
  onToggleResolve: (pinId: string) => void;
}

export const ReviewStage: React.FC<ReviewStageProps> = ({
  project,
  deviceMode,
  interactionMode,
  activePinId,
  clientAuthorName,
  onSelectPin,
  onAddPin,
  onAddComment,
  onToggleResolve,
}) => {
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pendingPinCoords, setPendingPinCoords] = useState<{ xPercent: number; yPercent: number } | null>(null);
  const [stageCursor, setStageCursor] = useState<{ x: number; y: number } | null>(null);

  // Compute frame container sizing based on deviceMode
  const getFrameWidthClass = () => {
    switch (deviceMode) {
      case "mobile":
        return "w-[375px]";
      case "tablet":
        return "w-[768px]";
      case "desktop":
      default:
        return "w-full max-w-[1440px]";
    }
  };

  const handleStageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (interactionMode !== "comment") return;
    if (!containerRef.current) return;

    const coords = calculateNormalizedCoords(e, containerRef.current);

    setPendingPinCoords(coords);
    onSelectPin(null);
  };

  const handleSaveNewPin = (comment: string, authorName: string) => {
    if (!pendingPinCoords) return;
    onAddPin(pendingPinCoords.xPercent, pendingPinCoords.yPercent, comment, authorName);
    setPendingPinCoords(null);
  };

  // Strictly filter pins for the active device viewport
  const activeDevicePins = project.pins.filter((p) => p.deviceMode === deviceMode);
  const activePin = activeDevicePins.find((p) => p.id === activePinId);

  return (
    <div className="flex-1 bg-[#000000] overflow-auto p-4 sm:p-8 flex justify-center items-start min-h-[calc(100vh-3.5rem)] selection:bg-white selection:text-black">
      <div
        className={`${getFrameWidthClass()} transition-all duration-300 flex flex-col rounded-xl overflow-hidden border border-white/[0.08] bg-[#0a0a0a] shadow-2xl relative`}
      >
        {/* Architectural Browser Chrome */}
        <div className="h-10 bg-[#050505] border-b border-white/[0.08] px-4 flex items-center justify-between select-none">
          {/* Subtle Window Notch Dots */}
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-white/20" />
            <div className="w-2 h-2 rounded-full bg-white/10" />
            <div className="w-2 h-2 rounded-full bg-white/10" />
          </div>

          {/* Staging URL Capsule */}
          <div className="flex-1 max-w-sm mx-4">
            <div className="bg-[#000000] border border-white/[0.08] rounded-md px-3 py-1 text-center font-mono text-[11px] text-zinc-400 truncate">
              {project.targetUrl.startsWith("data:") ? "Uploaded Document (" + (project.assetType || "asset").toUpperCase() + ")" : project.targetUrl}
            </div>
          </div>

          {/* Viewport Meta Indicator */}
          <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
            <span>{deviceMode}</span>
            <span className="text-zinc-700">·</span>
            <span>{activeDevicePins.length} pins</span>
          </div>
        </div>

        {/* Viewport Frame Container with Scroll Anchoring */}
        <div
          ref={scrollViewportRef}
          onMouseMove={(e) => {
            if (interactionMode === "comment") {
              setStageCursor({ x: e.clientX, y: e.clientY });
            }
          }}
          onMouseLeave={() => setStageCursor(null)}
          className={`w-full overflow-y-auto max-h-[calc(100vh-9.5rem)] min-h-[750px] bg-white ${
            interactionMode === "comment" ? "!cursor-none" : "cursor-default"
          }`}
        >
          {/* Content Stage (Expands to full asset height, coordinate reference for sticky pins) */}
          <div
            ref={containerRef}
            onClick={handleStageClick}
            className="relative w-full min-h-[750px]"
          >
            {/* Content renderer based on assetType */}
            {project.assetType === "image" ? (
              <img
                src={project.targetUrl}
                alt={project.title}
                className="w-full h-auto block select-none pointer-events-none"
              />
            ) : project.assetType === "pdf" ? (
              <iframe
                src={project.targetUrl}
                title={project.title}
                className="w-full min-h-[850px] border-none select-none"
              />
            ) : (
              <iframe
                src={
                  project.targetUrl.startsWith("http://") || project.targetUrl.startsWith("https://")
                    ? `/api/proxy?url=${encodeURIComponent(project.targetUrl)}`
                    : project.targetUrl
                }
                title={project.title}
                className="w-full h-[750px] border-none select-none"
                sandbox="allow-scripts allow-same-origin allow-forms"
              />
            )}

            {/* Annotation Overlay Layer */}
            <div
              className={`absolute inset-0 z-10 ${
                interactionMode === "comment" ? "pointer-events-auto" : "pointer-events-none"
              }`}
            />

            {/* Active Pins (Strictly scoped to current device viewport and sticky to content pixels) */}
            {activeDevicePins.map((pin) => (
              <PinMarker
                key={pin.id}
                pin={pin}
                isActive={pin.id === activePinId}
                onClick={(pinId) => {
                  setPendingPinCoords(null);
                  onSelectPin(pinId);
                }}
              />
            ))}

            {/* Pending New Pin Popover */}
            {pendingPinCoords && (
              <PinPopover
                isNew
                deviceMode={deviceMode}
                xPercent={pendingPinCoords.xPercent}
                yPercent={pendingPinCoords.yPercent}
                authorName={clientAuthorName}
                onSaveNewPin={handleSaveNewPin}
                onClose={() => setPendingPinCoords(null)}
              />
            )}

            {/* Active Existing Pin Thread Popover */}
            {activePin && (
              <PinPopover
                pin={activePin}
                deviceMode={deviceMode}
                xPercent={activePin.xPercent}
                yPercent={activePin.yPercent}
                authorName={clientAuthorName}
                onAddComment={onAddComment}
                onToggleResolve={onToggleResolve}
                onClose={() => onSelectPin(null)}
              />
            )}
          </div>
        </div>

          {/* 01/Capture Precision Drafting Pointer (Active exclusively inside canvas in Comment mode) */}
          {interactionMode === "comment" && stageCursor && (
            <div
              className="fixed pointer-events-none z-[999999] will-change-transform flex items-start"
              style={{
                left: `${stageCursor.x}px`,
                top: `${stageCursor.y}px`,
                transform: "translate(-1px, -1px)",
              }}
              aria-hidden="true"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
                <path
                  d="M4 3L11 20L14 13L21 10L4 3Z"
                  fill="#FFFFFF"
                  stroke="#000000"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="absolute left-[13px] top-[9px] bg-white text-black font-mono font-bold text-[9px] px-1.5 py-0.5 rounded shadow-[0_2px_8px_rgba(0,0,0,0.5)] whitespace-nowrap select-none">
                {clientAuthorName || "Guest Reviewer"}
              </div>
            </div>
          )}
        </div>
      </div>
  );
};
