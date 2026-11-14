"use client";

import React, { useRef, useState, useEffect } from "react";
import { ExternalLink, ChevronLeft, ChevronRight, RotateCw } from "lucide-react";
import { DeviceMode, InteractionMode, Pin, Project, DomAnchor } from "@/types";
import { PinMarker } from "./PinMarker";
import { PinPopover } from "./PinPopover";
import { calculateNormalizedCoords } from "@/lib/coordinates";
import { formatPageLabel } from "@/lib/colors";

interface ReviewStageProps {
  project: Project;
  deviceMode: DeviceMode;
  interactionMode: InteractionMode;
  activePinId: string | null;
  clientAuthorName: string;
  currentPageUrl?: string;
  isAudioMuted?: boolean;
  theme?: "day" | "night";
  onPageNavigated?: (url: string) => void;
  onSelectPin: (pinId: string | null) => void;
  onAddPin: (
    xPercent: number,
    yPercent: number,
    comment: string,
    authorName: string,
    pageUrl?: string,
    widthPercent?: number,
    heightPercent?: number,
    annotationType?: "point" | "box",
    domAnchor?: DomAnchor
  ) => void;
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
  currentPageUrl: externalPageUrl,
  isAudioMuted = true,
  theme = "night",
  onPageNavigated,
  onSelectPin,
  onAddPin,
  onAddComment,
  onToggleResolve,
  onDeletePin,
}) => {
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [pendingPinCoords, setPendingPinCoords] = useState<{
    xPercent: number;
    yPercent: number;
    widthPercent?: number;
    heightPercent?: number;
    annotationType?: "point" | "box";
    domAnchor?: DomAnchor;
  } | null>(null);
  const [drawingBox, setDrawingBox] = useState<{
    xPercent: number;
    yPercent: number;
    widthPercent: number;
    heightPercent: number;
  } | null>(null);
  const dragStartRef = useRef<{ clientX: number; clientY: number } | null>(null);
  const [frameHeight, setFrameHeight] = useState<number>(1000);
  const [localPageUrl, setLocalPageUrl] = useState<string>(project.targetUrl || "");
  const currentPageUrl = externalPageUrl || localPageUrl;

  const allPins = Array.isArray(project?.pins) ? project.pins.filter(Boolean) : [];

  // Auto-scroll viewport to pin when activePinId changes
  useEffect(() => {
    if (!activePinId || !scrollViewportRef.current || !containerRef.current) return;
    const pin = allPins.find((p) => p && p.id === activePinId);
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
  }, [activePinId, allPins]);

  // Synchronize audio mute state with child proxy iframe
  useEffect(() => {
    if (iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage(
          { type: "CYATH_SET_AUDIO_MUTED", muted: isAudioMuted },
          "*"
        );
      } catch { }
    }
  }, [isAudioMuted]);

  // Synchronize interaction mode with child proxy iframe
  useEffect(() => {
    if (iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage(
          { type: "CYATH_SET_MODE", mode: interactionMode },
          "*"
        );
      } catch { }
    }
  }, [interactionMode]);

  // Navigation handlers for proxy iframe staging site
  const handleNavBack = () => {
    if (iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage({ type: "CYATH_NAV_BACK" }, "*");
      } catch { }
    }
  };

  const handleNavForward = () => {
    if (iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage({ type: "CYATH_NAV_FORWARD" }, "*");
      } catch { }
    }
  };

  const handleNavReload = () => {
    if (iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage({ type: "CYATH_NAV_RELOAD" }, "*");
      } catch { }
    }
  };

  // Listen to height, wheel, element pin, and navigation messages from proxy iframe bridge
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "CYATH_STAGE_RESIZE" && typeof event.data.height === "number") {
        const clamped = Math.min(16000, Math.max(800, Math.round(event.data.height)));
        setFrameHeight(clamped);
      }
      if (event.data?.type === "CYATH_WHEEL" && typeof event.data.deltaY === "number" && scrollViewportRef.current) {
        scrollViewportRef.current.scrollTop += event.data.deltaY;
      }
      if (event.data?.type === "CYATH_PAGE_NAVIGATED" && typeof event.data.url === "string") {
        setLocalPageUrl(event.data.url);
        setFrameHeight(900);
        onPageNavigated?.(event.data.url);
      }
      if (event.data?.type === "CYATH_PIN_SELECTED" && typeof event.data.pinId === "string") {
        setPendingPinCoords(null);
        onSelectPin(event.data.pinId);
      }
      if (event.data?.type === "CYATH_ELEMENT_PIN_DROPPED") {
        setPendingPinCoords({
          xPercent: event.data.xPercent,
          yPercent: event.data.yPercent,
          widthPercent: event.data.widthPercent,
          heightPercent: event.data.heightPercent,
          annotationType: event.data.annotationType || "point",
          domAnchor: event.data.domAnchor,
        });
        onSelectPin(null);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onPageNavigated, onSelectPin]);

  // Compute frame container sizing based on deviceMode
  const getFrameWidthClass = () => {
    switch (deviceMode) {
      case "full":
        return "w-full max-w-none";
      case "mobile":
        return "w-[375px]";
      case "tablet":
        return "w-[768px]";
      case "desktop":
      default:
        return "w-full max-w-[1440px]";
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (interactionMode !== "comment") return;
    if (!containerRef.current) return;
    dragStartRef.current = { clientX: e.clientX, clientY: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (interactionMode !== "comment") return;
    if (!dragStartRef.current || !containerRef.current) return;
    const dx = Math.abs(e.clientX - dragStartRef.current.clientX);
    const dy = Math.abs(e.clientY - dragStartRef.current.clientY);
    if (dx > 4 || dy > 4) {
      const start = calculateNormalizedCoords(
        { clientX: dragStartRef.current.clientX, clientY: dragStartRef.current.clientY } as unknown as React.MouseEvent<HTMLElement>,
        containerRef.current
      );
      const current = calculateNormalizedCoords(e, containerRef.current);
      setDrawingBox({
        xPercent: Math.min(start.xPercent, current.xPercent),
        yPercent: Math.min(start.yPercent, current.yPercent),
        widthPercent: Math.max(1.5, Math.abs(current.xPercent - start.xPercent)),
        heightPercent: Math.max(1.5, Math.abs(current.yPercent - start.yPercent)),
      });
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (interactionMode !== "comment") return;
    if (!containerRef.current) return;

    if (drawingBox && drawingBox.widthPercent > 2 && drawingBox.heightPercent > 2) {
      setPendingPinCoords({
        xPercent: drawingBox.xPercent,
        yPercent: drawingBox.yPercent,
        widthPercent: drawingBox.widthPercent,
        heightPercent: drawingBox.heightPercent,
        annotationType: "box",
      });
      onSelectPin(null);
    } else if (dragStartRef.current) {
      const coords = calculateNormalizedCoords(e, containerRef.current);
      setPendingPinCoords({
        ...coords,
        annotationType: "point",
      });
      onSelectPin(null);
    }
    setDrawingBox(null);
    dragStartRef.current = null;
  };

  const handleSaveNewPin = (comment: string, authorName: string) => {
    if (!pendingPinCoords) return;
    onAddPin(
      pendingPinCoords.xPercent,
      pendingPinCoords.yPercent,
      comment,
      authorName,
      currentPageUrl,
      pendingPinCoords.widthPercent,
      pendingPinCoords.heightPercent,
      pendingPinCoords.annotationType,
      pendingPinCoords.domAnchor
    );
    setPendingPinCoords(null);
  };

  // Strictly filter pins for the active device viewport AND current subpage
  const currentStagePageLabel = formatPageLabel(currentPageUrl);
  const activeDevicePins = allPins.filter((p) => {
    if (!p) return false;
    const deviceMatch =
      p.deviceMode === deviceMode ||
      (deviceMode === "full" && p.deviceMode === "desktop") ||
      (deviceMode === "desktop" && p.deviceMode === "full");
    if (!deviceMatch) return false;

    const pinPageLabel = formatPageLabel(p.pageUrl);
    return pinPageLabel === currentStagePageLabel;
  });
  const activePin = activeDevicePins.find((p) => p && p.id === activePinId);

  // Synchronize active pins and activePinId with child proxy iframe
  useEffect(() => {
    if (iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage(
          {
            type: "CYATH_SYNC_PINS",
            pins: activeDevicePins,
            activePinId: activePinId,
          },
          "*"
        );
      } catch { }
    }
  }, [activeDevicePins, activePinId]);

  // Estimate PDF height so multi-page documents render continuously in stage scroll
  const pdfPageCount = React.useMemo(() => {
    if (project.assetType !== "pdf" || !project.targetUrl) return 1;
    try {
      if (project.targetUrl.startsWith("data:application/pdf;base64,")) {
        const raw = atob(project.targetUrl.slice(28, 120000));
        const countMatch = raw.match(/\/Count\s+(\d+)/);
        if (countMatch && countMatch[1]) {
          const parsed = parseInt(countMatch[1], 10);
          if (parsed > 0 && parsed < 200) return parsed;
        }
        const pages = (raw.match(/\/Type\s*\/Page\b/g) || []).length;
        if (pages > 0) return pages;
      }
    } catch {}
    return 1;
  }, [project.assetType, project.targetUrl]);

  const pdfHeight = Math.max(900, pdfPageCount * 1150);

  const isWebUrl = project.assetType === "url" || (!project.assetType && project.targetUrl?.startsWith("http"));
  const isFullMode = deviceMode === "full";
  const stageMinHeight = isWebUrl
    ? `${frameHeight}px`
    : project.assetType === "pdf"
      ? `${pdfHeight}px`
      : isFullMode
        ? "calc(100vh - 3.5rem)"
        : "auto";

  const isDay = theme === "day";

  return (
    <div
      className={`flex-1 overflow-hidden flex justify-center items-start min-h-[calc(100vh-3.5rem)] selection:bg-stone-300 selection:text-black transition-all duration-300 ${isDay ? "bg-[#ECE8DE]" : "bg-[#000000]"
        } ${isFullMode ? "p-0" : "p-3 sm:p-6"}`}
    >
      <div
        className={`${getFrameWidthClass()} transition-all duration-300 flex flex-col ${isFullMode
            ? "rounded-none border-transparent shadow-none"
            : isDay
              ? "rounded-2xl border border-stone-300/80 shadow-[0_15px_45px_rgba(0,0,0,0.08)] bg-white"
              : "rounded-xl border border-white/[0.08] shadow-2xl bg-[#0a0a0a]"
          } relative`}
      >
        {/* Architectural Browser Chrome (Smooth animated collapse when entering Full Mode) */}
        <div
          className={`transition-all duration-300 overflow-hidden ${isFullMode ? "max-h-0 opacity-0 pointer-events-none" : "max-h-10 opacity-100"
            }`}
        >
          <div
            className={`h-10 border-b px-4 flex items-center justify-between select-none shrink-0 ${isDay ? "bg-[#F5F2EA] border-stone-200" : "bg-[#050505] border-white/[0.08]"
              }`}
          >
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${isDay ? "bg-stone-400" : "bg-white/20"}`} />
                <div className={`w-2 h-2 rounded-full ${isDay ? "bg-stone-300" : "bg-white/10"}`} />
                <div className={`w-2 h-2 rounded-full ${isDay ? "bg-stone-300" : "bg-white/10"}`} />
              </div>

              {isWebUrl && (
                <div className={`flex items-center gap-0.5 ml-2 pl-2 border-l ${isDay ? "border-stone-300" : "border-white/10"}`}>
                  <button
                    onClick={handleNavBack}
                    className={`p-1 rounded transition-colors cursor-pointer ${
                      isDay ? "hover:bg-stone-200 text-stone-600" : "hover:bg-white/10 text-zinc-400 hover:text-white"
                    }`}
                    title="Back in history"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleNavForward}
                    className={`p-1 rounded transition-colors cursor-pointer ${
                      isDay ? "hover:bg-stone-200 text-stone-600" : "hover:bg-white/10 text-zinc-400 hover:text-white"
                    }`}
                    title="Forward in history"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleNavReload}
                    className={`p-1 rounded transition-colors cursor-pointer ${
                      isDay ? "hover:bg-stone-200 text-stone-600" : "hover:bg-white/10 text-zinc-400 hover:text-white"
                    }`}
                    title="Reload page"
                  >
                    <RotateCw className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 max-w-sm mx-4 flex items-center justify-center gap-1.5">
              <div
                className={`border rounded-md px-3 py-1 text-center font-mono text-[11px] truncate flex-1 ${isDay
                    ? "bg-white border-stone-200 text-stone-700 shadow-xs"
                    : "bg-[#000000] border-white/[0.08] text-zinc-400"
                  }`}
              >
                {currentPageUrl?.startsWith("data:")
                  ? "Uploaded Document (" + (project.assetType || "asset").toUpperCase() + ")"
                  : formatPageLabel(currentPageUrl)}
              </div>
              {currentPageUrl?.startsWith("http") && (
                <a
                  href={currentPageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-1 rounded transition-colors ${isDay ? "text-stone-500 hover:text-stone-900 hover:bg-stone-100" : "text-zinc-500 hover:text-white hover:bg-white/10"
                    }`}
                  title="Open live site directly in new tab"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <div
              className={`text-[10px] font-mono uppercase tracking-widest flex items-center gap-1.5 ${isDay ? "text-stone-500" : "text-zinc-500"
                }`}
            >
              <span>{deviceMode}</span>
              <span className={isDay ? "text-stone-300" : "text-zinc-700"}>·</span>
              <span>{activeDevicePins.length} pins</span>
            </div>
          </div>
        </div>

        {/* Viewport Frame Container with Scroll Anchoring & Animated Height Scaling */}
        <div
          ref={scrollViewportRef}
          className={`w-full overflow-y-auto overflow-x-hidden bg-white relative transition-all duration-300 ease-in-out ${isFullMode ? "h-[calc(100vh-3.5rem)]" : "max-h-[calc(100vh-9.5rem)]"
            } ${interactionMode === "comment" ? "cursor-crosshair" : "cursor-default"
            }`}
        >
          {/* Content Stage (Expands to full asset height, coordinate reference for sticky pins) */}
          <div
            ref={containerRef}
            className="relative w-full max-w-full overflow-x-hidden"
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
                src={
                  project.targetUrl?.includes("#")
                    ? project.targetUrl
                    : `${project.targetUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`
                }
                title={project.title}
                className="w-full border-none select-none block"
                style={{
                  height: `${pdfHeight}px`,
                  minHeight: `${pdfHeight}px`,
                }}
              />
            ) : (
              <iframe
                ref={iframeRef}
                src={
                  project.targetUrl?.startsWith("http://") || project.targetUrl?.startsWith("https://")
                    ? `/api/proxy?url=${encodeURIComponent(project.targetUrl)}${isAudioMuted ? "&mute=1" : ""}`
                    : project.targetUrl
                }
                title={project.title}
                className="w-full border-none select-none block max-w-full"
                style={{
                  height: isFullMode ? `${Math.max(frameHeight, 800)}px` : `${frameHeight}px`,
                  minHeight: isFullMode ? "calc(100vh - 3.5rem)" : "800px",
                }}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads allow-presentation"
                allow="camera 'none'; microphone 'none'"
              />
            )}

            {/* Annotation Overlay Layer (Active on images & PDFs, web URLs use native DOM inspector) */}
            {!isWebUrl && (
              <div
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                className={`absolute inset-0 z-10 ${
                  interactionMode === "comment" ? "pointer-events-auto cursor-crosshair select-none" : "pointer-events-none"
                }`}
              />
            )}

            {/* Live Dragging Box Preview (Images & PDFs) */}
            {!isWebUrl && drawingBox && (
              <div
                style={{
                  left: `${drawingBox.xPercent}%`,
                  top: `${drawingBox.yPercent}%`,
                  width: `${drawingBox.widthPercent}%`,
                  height: `${drawingBox.heightPercent}%`,
                }}
                className="absolute border-2 border-dashed border-white bg-white/10 z-30 pointer-events-none rounded transition-none shadow-[0_0_24px_rgba(255,255,255,0.35)]"
              />
            )}

            {/* Active Pins & Boxes for static assets (web URLs render them inside the iframe DOM) */}
            {!isWebUrl && activeDevicePins.map((pin) => (
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

            {/* Pending Draft Marker: Area Box */}
            {pendingPinCoords && pendingPinCoords.annotationType === "box" && (
              <div
                style={{
                  left: `${pendingPinCoords.xPercent}%`,
                  top: `${pendingPinCoords.yPercent}%`,
                  width: `${pendingPinCoords.widthPercent}%`,
                  height: `${pendingPinCoords.heightPercent}%`,
                }}
                className="absolute border-2 border-solid border-white bg-white/15 z-30 pointer-events-none rounded shadow-[0_0_24px_rgba(255,255,255,0.4)] animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="absolute -top-3 -left-3 w-6 h-6 rounded-full bg-white text-black font-mono font-bold text-xs flex items-center justify-center shadow-lg ring-2 ring-white/60">
                  +
                </div>
              </div>
            )}

            {/* Pending Draft Marker: Point Pin */}
            {pendingPinCoords && pendingPinCoords.annotationType !== "box" && (
              <div
                style={{
                  left: `${pendingPinCoords.xPercent}%`,
                  top: `${pendingPinCoords.yPercent}%`,
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full z-30 flex items-center justify-center font-mono font-bold text-xs bg-white text-black shadow-[0_0_24px_rgba(255,255,255,0.8)] ring-2 ring-white/60 animate-pulse pointer-events-none select-none"
              >
                +
              </div>
            )}

            {/* Pending New Pin Popover */}
            {pendingPinCoords && (
              <PinPopover
                xPercent={pendingPinCoords.xPercent}
                yPercent={pendingPinCoords.yPercent}
                isNew={true}
                theme={theme}
                authorName={clientAuthorName}
                deviceMode={deviceMode}
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
                isNew={false}
                theme={theme}
                authorName={clientAuthorName}
                deviceMode={deviceMode}
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
