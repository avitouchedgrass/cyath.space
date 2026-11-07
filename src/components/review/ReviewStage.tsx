"use client";

import React, { useRef, useState } from "react";
import { DeviceMode, InteractionMode, Pin, Project } from "@/types";
import { PinMarker } from "./PinMarker";
import { PinPopover } from "./PinPopover";
import { calculateNormalizedCoords } from "@/lib/coordinates";
import { captureClientTelemetry } from "@/lib/telemetry";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [pendingPinCoords, setPendingPinCoords] = useState<{ xPercent: number; yPercent: number } | null>(null);

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

    const rect = containerRef.current.getBoundingClientRect();
    const coords = calculateNormalizedCoords(e, rect);

    setPendingPinCoords(coords);
    onSelectPin(null);
  };

  const handleSaveNewPin = (comment: string, authorName: string) => {
    if (!pendingPinCoords) return;
    onAddPin(pendingPinCoords.xPercent, pendingPinCoords.yPercent, comment, authorName);
    setPendingPinCoords(null);
  };

  const activePin = project.pins.find((p) => p.id === activePinId);

  return (
    <div className="flex-1 bg-[#09090B] overflow-auto p-4 sm:p-8 flex justify-center items-start min-h-[calc(100vh-3.5rem)]">
      <div
        className={`${getFrameWidthClass()} transition-all duration-300 flex flex-col rounded-xl overflow-hidden border border-[#27272A] bg-[#121215] shadow-2xl relative`}
      >
        {/* Simulated Browser Chrome */}
        <div className="h-10 bg-[#18181B] border-b border-[#27272A] px-4 flex items-center justify-between select-none">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#10B981]/60" />
          </div>

          <div className="flex-1 max-w-sm mx-4">
            <div className="bg-[#121215] border border-[#27272A] rounded-md px-3 py-1 text-center font-mono text-[11px] text-[#A1A1AA] truncate">
              {project.targetUrl}
            </div>
          </div>

          <div className="text-[10px] font-mono text-[#52525B] uppercase">
            {deviceMode}
          </div>
        </div>

        {/* Viewport Frame Container */}
        <div
          ref={containerRef}
          onClick={handleStageClick}
          className={`relative w-full min-h-[750px] bg-white overflow-hidden ${
            interactionMode === "comment" ? "cursor-crosshair" : "cursor-default"
          }`}
        >
          {/* Staging Website Iframe */}
          <iframe
            src={project.targetUrl}
            title={project.title}
            className="w-full h-[750px] border-none select-none"
            sandbox="allow-scripts allow-same-origin allow-forms"
          />

          {/* Transparent Annotation Overlay */}
          <div
            className={`absolute inset-0 z-10 ${
              interactionMode === "comment" ? "pointer-events-auto" : "pointer-events-none"
            }`}
          />

          {/* Render Active Pins */}
          {project.pins.map((pin) => (
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
    </div>
  );
};

