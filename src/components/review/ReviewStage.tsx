"use client";

import React, { useRef, useState, useEffect } from "react";
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
  onDeletePin?: (pinId: string) => void;
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
  onDeletePin,
}) => {
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [pendingPinCoords, setPendingPinCoords] = useState<{ xPercent: number; yPercent: number } | null>(null);
  const [frameHeight, setFrameHeight] = useState<number>(1000);

  // Auto-scroll viewport to pin when activePinId changes
  useEffect(() => {
    if (!activePinId || !scrollViewportRef.current || !containerRef.current) return;
    const pin = project.pins.find((p) => p.id === activePinId);
    if (!pin) return;

    const containerHeight = containerRef.current.scrollHeight || containerRef.current.clientHeight;
    if (containerHeight <= 0) return;

    const pinPixelY = (pin.yPercent / 100) * containerHeight;
    const viewportHeight = scrollViewportRef.current.clientHeight;
    const targetScrollY = Math.max(0, pinPixelY - viewportHeight / 2);

    scrollViewportRef.current.scrollTo({
      top: targetScrollY,
      behavior: "smooth",
    });
  }, [activePinId, project.pins]);

  // Listen to height and scroll messages from proxy iframe bridge
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "CYATH_STAGE_RESIZE" && typeof event.data.height === "number") {
        setFrameHeight(Math.max(800, event.data.height));
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

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

  const isWebUrl = project.assetType === "url" || (!project.assetType && project.targetUrl.startsWith("http"));
  const stageMinHeight = isWebUrl ? `${frameHeight}px` : project.assetType === "pdf" ? "850px" : "auto";

  return (
    <div className="flex-1 bg-[#000000] overflow-auto p-4 sm:p-8 flex justify-center items-start min-h-[calc(100vh-3.5rem)] selection:bg-white selection:text-black">
      <div
        className={`${getFrameWidthClass()} transition-all duration-300 flex flex-col rounded-xl overflow-hidden border border-white/[0.08] bg-[#0a0a0a] shadow-2xl relative`}
      >
        {/* Architectural Browser Chrome */}
        <div className="h-10 bg-[#050505] border-b border-white/[0.08] px-4 flex items-center justify-between select-none shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-white/20" />
            <div className="w-2 h-2 rounded-full bg-white/10" />
            <div className="w-2 h-2 rounded-full bg-white/10" />
          </div>

          <div className="flex-1 max-w-sm mx-4">
            <div className="bg-[#000000] border border-white/[0.08] rounded-md px-3 py-1 text-center font-mono text-[11px] text-zinc-400 truncate">
              {project.targetUrl.startsWith("data:") ? "Uploaded Document (" + (project.assetType || "asset").toUpperCase() + ")" : project.targetUrl}
            </div>
          </div>

          <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
            <span>{deviceMode}</span>
            <span className="text-zinc-700">·</span>
            <span>{activeDevicePins.length} pins</span>
          </div>
        </div>

        {/* Viewport Frame Container with Scroll Anchoring */}
        <div
          ref={scrollViewportRef}
          className={`w-full overflow-y-auto max-h-[calc(100vh-9.5rem)] bg-white relative ${
            interactionMode === "comment" ? "cursor-crosshair" : "cursor-default"
          }`}
        >
          {/* Content Stage (Expands to full asset height, coordinate reference for sticky pins) */}
          <div
            ref={containerRef}
            onClick={handleStageClick}
            className="relative w-full"
            style={{ minHeight: stageMinHeight }}
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
                ref={iframeRef}
                src={
                  project.targetUrl.startsWith("http://") || project.targetUrl.startsWith("https://")
                    ? `/api/proxy?url=${encodeURIComponent(project.targetUrl)}`
                    : project.targetUrl
                }
                title={project.title}
                className="w-full border-none select-none block"
                style={{ height: `${frameHeight}px`, minHeight: "800px" }}
                sandbox="allow-scripts allow-same-origin allow-forms"
              />
            )}

            {/* Annotation Overlay Layer */}
            <div
              className={`absolute inset-0 z-10 ${
                interactionMode === "comment" ? "pointer-events-auto cursor-crosshair" : "pointer-events-none"
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

            {/* Active Pin Popover Thread */}
            {activePin && (
              <PinPopover
                pin={activePin}
                deviceMode={deviceMode}
                xPercent={activePin.xPercent}
                yPercent={activePin.yPercent}
                authorName={clientAuthorName}
                onAddComment={onAddComment}
                onToggleResolve={onToggleResolve}
                onDeletePin={onDeletePin}
                onClose={() => onSelectPin(null)}
              />
            )}


          </div>
        </div>
      </div>
    </div>
  );
};
