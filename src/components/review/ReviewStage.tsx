"use client";

import React, { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { ExternalLink, ChevronLeft, ChevronRight, RotateCw } from "lucide-react";
import type { ClientTelemetry, DeviceMode, InteractionMode, Project, DomAnchor } from "@/types";
import { PinMarker } from "./PinMarker";
import { PinPopover } from "./PinPopover";
import { calculateNormalizedCoords } from "@/lib/coordinates";
import { formatPageLabel } from "@/lib/colors";
import { useLiveCursors } from "@/hooks/useLiveCursors";
import { captureClientTelemetry } from "@/lib/telemetry";
import { configuredPreviewOrigin, previewFrameSource } from "@/lib/preview-origin";

interface ReviewStageProps {
  project: Project;
  deviceMode: DeviceMode;
  interactionMode: InteractionMode;
  activePinId: string | null;
  clientAuthorName: string;
  currentPageUrl?: string;
  isAudioMuted?: boolean;
  theme?: "day" | "night";
  canComment: boolean;
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
    domAnchor?: DomAnchor,
    audioUrl?: string,
    audioDurationSeconds?: number,
    telemetry?: ClientTelemetry,
    requestId?: string,
  ) => Promise<void>;
  onAddComment?: (pinId: string, content: string, authorName: string, requestId?: string) => Promise<void>;
  onToggleResolve?: (pinId: string) => void;
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
  canComment,
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
  const addNoteRef = useRef<HTMLButtonElement>(null);
  const previewOrigin = configuredPreviewOrigin();
  const previewSource = previewFrameSource(project.targetUrl);
  const post = useCallback((message: object) => {
    iframeRef.current?.contentWindow?.postMessage(message, previewOrigin ?? "*");
  }, [previewOrigin]);

  const [pendingPinCoords, setPendingPinCoords] = useState<{
    xPercent: number;
    yPercent: number;
    widthPercent?: number;
    heightPercent?: number;
    annotationType?: "point" | "box";
    domAnchor?: DomAnchor;
    telemetry?: ClientTelemetry;
  } | null>(null);
  const [drawingBox, setDrawingBox] = useState<{
    xPercent: number;
    yPercent: number;
    widthPercent: number;
    heightPercent: number;
  } | null>(null);
  const dragStartRef = useRef<{ clientX: number; clientY: number } | null>(null);
  const [frameHeight, setFrameHeight] = useState<number>(1000);
  const [visibleWidth, setVisibleWidth] = useState(0);
  const [previewReady, setPreviewReady] = useState(false);
  const [localPageUrl, setLocalPageUrl] = useState<string>(project.targetUrl || "");
  const currentPageUrl = externalPageUrl || localPageUrl;

  const allPins = project.pins;
  const { cursors, sendCursorPosition } = useLiveCursors(project.shareId, clientAuthorName);

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
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }, [activePinId, allPins]);

  function syncMode() {
    post({ type: "CYATH_SET_AUDIO_MUTED", muted: isAudioMuted });
    post({ type: "CYATH_SET_MODE", mode: interactionMode });
  }

  // Navigation handlers for proxy iframe staging site
  const handleNavBack = () => {
    if (iframeRef.current?.contentWindow) {
      try {
        post({ type: "CYATH_NAV_BACK" });
      } catch { }
    }
  };

  const handleNavForward = () => {
    if (iframeRef.current?.contentWindow) {
      try {
        post({ type: "CYATH_NAV_FORWARD" });
      } catch { }
    }
  };

  const handleNavReload = () => {
    if (iframeRef.current?.contentWindow) {
      try {
        post({ type: "CYATH_NAV_RELOAD" });
      } catch { }
    }
  };

  // Listen to height, wheel, element pin, and navigation messages from proxy iframe bridge
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow || event.origin !== (previewOrigin ?? "null")) return;
      if (event.data?.type === "CYATH_STAGE_READY") {
        setPreviewReady(true);
        post({ type: "CYATH_SET_AUDIO_MUTED", muted: isAudioMuted });
        post({ type: "CYATH_SET_MODE", mode: interactionMode });
      }
      if (event.data?.type === "CYATH_STAGE_RESIZE" && typeof event.data.height === "number") {
        const clamped = Math.min(16000, Math.max(800, Math.round(event.data.height)));
        setFrameHeight(clamped);
      }
      if (event.data?.type === "CYATH_PAGE_NAVIGATED" && typeof event.data.url === "string") {
        try {
          const url = new URL(event.data.url);
          if (url.protocol !== "https:" || url.username || url.password || url.href.length > 4096) return;
          setLocalPageUrl(url.href);
          onPageNavigated?.(url.href);
        } catch { return; }
      }
      if (event.data?.type === "CYATH_PIN_SELECTED" && typeof event.data.pinId === "string") {
        setPendingPinCoords(null);
        onSelectPin(event.data.pinId);
      }
      if (event.data?.type === "CYATH_CURSOR_MOVE" && typeof event.data.xPercent === "number") {
        sendCursorPosition(event.data.xPercent, event.data.yPercent);
      }
      if (event.data?.type === "CYATH_ELEMENT_PIN_DROPPED" && canComment && interactionMode === "comment" &&
          [event.data.xPercent, event.data.yPercent].every(value => Number.isFinite(value) && value >= 0 && value <= 100)) {
        setPendingPinCoords({
          xPercent: event.data.xPercent,
          yPercent: event.data.yPercent,
          widthPercent: event.data.widthPercent,
          heightPercent: event.data.heightPercent,
          annotationType: event.data.annotationType || "point",
          domAnchor: event.data.domAnchor,
          telemetry: captureClientTelemetry(
            deviceMode,
            iframeRef.current?.clientWidth ?? 0,
            iframeRef.current?.clientHeight ?? 0,
            Number.isFinite(event.data.scrollDepth) ? Math.min(100, Math.max(0, event.data.scrollDepth)) : 0,
          ),
        });
        onSelectPin(null);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [canComment, deviceMode, interactionMode, isAudioMuted, onPageNavigated, onSelectPin, post, previewOrigin, sendCursorPosition]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setVisibleWidth(Math.round(entry.contentRect.width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    post({ type: "CYATH_SET_AUDIO_MUTED", muted: isAudioMuted });
    post({ type: "CYATH_SET_MODE", mode: interactionMode });
  }, [interactionMode, isAudioMuted, post]);

  // Compute frame container sizing based on deviceMode
  const getFrameWidthClass = () => {
    switch (deviceMode) {
      case "full":
        return "w-full max-w-none";
      case "mobile":
        return "w-full max-w-[375px]";
      case "tablet":
        return "w-full max-w-[768px]";
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
    if (containerRef.current) {
      const coords = calculateNormalizedCoords(e, containerRef.current);
      sendCursorPosition(coords.xPercent, coords.yPercent);
    }
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

  const handleSaveNewPin = async (comment: string, authorName: string, audioUrl?: string, audioDurationSeconds?: number, requestId?: string) => {
    if (!pendingPinCoords) return;
    const scroll = scrollViewportRef.current;
    const total = scroll ? scroll.scrollHeight - scroll.clientHeight : 0;
    const telemetry = pendingPinCoords.telemetry ?? captureClientTelemetry(deviceMode,
      iframeRef.current?.clientWidth ?? containerRef.current?.clientWidth ?? 0,
      iframeRef.current?.clientHeight ?? scroll?.clientHeight ?? 0,
      total > 0 && scroll ? Math.min(100, Math.max(0, Math.round(scroll.scrollTop / total * 100))) : 0);
    await onAddPin(
      pendingPinCoords.xPercent,
      pendingPinCoords.yPercent,
      comment,
      authorName,
      currentPageUrl,
      pendingPinCoords.widthPercent,
      pendingPinCoords.heightPercent,
      pendingPinCoords.annotationType,
      pendingPinCoords.domAnchor,
      audioUrl,
      audioDurationSeconds,
      telemetry,
      requestId,
    );
    setPendingPinCoords(null);
  };

  // Strictly filter pins for the active device viewport AND current subpage
  const currentStagePageLabel = formatPageLabel(currentPageUrl);
  const activeDevicePins = useMemo(() => allPins.filter((p) => {
    if (!p) return false;
    const deviceMatch =
      p.deviceMode === deviceMode ||
      (deviceMode === "full" && p.deviceMode === "desktop") ||
      (deviceMode === "desktop" && p.deviceMode === "full");
    if (!deviceMatch) return false;

    const pinPageLabel = formatPageLabel(p.pageUrl);
    return pinPageLabel === currentStagePageLabel;
  }), [allPins, currentStagePageLabel, deviceMode]);
  const activePin = activeDevicePins.find((p) => p && p.id === activePinId);

  const syncPins = useCallback(() => {
    // The reviewed site needs pin geometry, never reviewer names, notes, or recordings.
    post({
      type: "CYATH_SYNC_PINS",
      pins: activeDevicePins.map(({ id, number, xPercent, yPercent, widthPercent, heightPercent, annotationType, status, domAnchor }) => ({
        id, number, xPercent, yPercent, widthPercent, heightPercent, annotationType, status,
        domAnchor: domAnchor && {
          selector: domAnchor.selector, elementOffsetXPercent: domAnchor.elementOffsetXPercent,
          elementOffsetYPercent: domAnchor.elementOffsetYPercent,
        },
      })),
      activePinId,
    });
  }, [activeDevicePins, activePinId, post]);
  useEffect(() => { syncPins(); }, [previewReady, syncPins]);

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
      className={`flex min-h-0 min-w-0 flex-1 justify-center items-start selection:bg-stone-300 selection:text-black ${
        isDay ? "bg-[#ECE8DE]" : "bg-[#000000]"
      } ${isFullMode ? "p-0" : "p-2 sm:p-4"} overflow-hidden`}
    >
      <div
        className={`${getFrameWidthClass()} flex h-full min-h-0 min-w-0 flex-col ${
          isFullMode
            ? "rounded-none border-0 shadow-none overflow-hidden"
            : isDay
              ? "rounded-2xl border border-stone-300/80 shadow-[0_15px_45px_rgba(0,0,0,0.08)] bg-white overflow-hidden"
              : "rounded-2xl border border-white/[0.08] shadow-2xl bg-[#0a0a0a] overflow-hidden"
        } relative`}
      >
        <div
          className="shrink-0"
        >
          <div
            className={`flex flex-wrap items-center justify-between gap-1.5 border-b p-2 sm:px-4 ${isDay ? "bg-[#F5F2EA] border-stone-200" : "bg-[#050505] border-white/[0.08]"
              }`}
          >
            <div className="flex items-center gap-2">
              <div aria-hidden="true" className="hidden items-center gap-1.5 lg:flex">
                <div className={`w-2 h-2 rounded-full ${isDay ? "bg-stone-400" : "bg-white/20"}`} />
                <div className={`w-2 h-2 rounded-full ${isDay ? "bg-stone-300" : "bg-white/10"}`} />
                <div className={`w-2 h-2 rounded-full ${isDay ? "bg-stone-300" : "bg-white/10"}`} />
              </div>

              {isWebUrl && previewSource && (
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

            <div className="flex min-w-0 flex-1 items-center justify-center gap-1.5">
              <div
                className={`hidden border rounded-md px-3 py-1 text-center font-mono text-xs truncate flex-1 sm:block ${isDay
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

            <span className={`shrink-0 text-xs ${isDay ? "text-stone-700" : "text-zinc-300"}`}>{visibleWidth ? `${visibleWidth} px` : ""}</span>
            {canComment && <button ref={addNoteRef} type="button"
              className={`rounded-md px-2.5 py-2 text-sm font-medium ${isDay ? "bg-stone-900 text-white" : "bg-white text-black"}`}
              onClick={() => {
                const scroll = scrollViewportRef.current;
                const height = containerRef.current?.clientHeight || 1;
                const y = scroll ? (scroll.scrollTop + scroll.clientHeight / 3) / height * 100 : 20;
                onSelectPin(null);
                setPendingPinCoords({ xPercent: 50, yPercent: Math.min(95, y), annotationType: "point" });
              }}>Add note</button>}
          </div>
        </div>

        {/* Viewport Frame Container with Scroll Anchoring & Animated Height Scaling */}
        <div
          ref={scrollViewportRef}
          onScroll={e => post({ type: "CYATH_PARENT_SCROLL", scrollTop: e.currentTarget.scrollTop })}
          className={`relative min-h-0 w-full flex-1 overflow-y-auto overflow-x-hidden bg-white ${interactionMode === "comment" ? "cursor-crosshair" : "cursor-default"}`}
        >
          {/* Content Stage (Expands to full asset height, coordinate reference for sticky pins) */}
          <div
            ref={containerRef}
            className="relative w-full max-w-full overflow-x-hidden"
            style={{ minHeight: isFullMode ? "100vh" : stageMinHeight }}
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
                scrolling="no"
                className="w-full border-none select-none block pointer-events-none"
                style={{
                  height: `${pdfHeight}px`,
                  minHeight: `${pdfHeight}px`,
                }}
              />
            ) : previewSource ? (
              <iframe
                ref={iframeRef}
                src={previewSource}
                title={project.title}
                referrerPolicy="no-referrer"
                onLoad={() => {
                  setPreviewReady(false);
                  syncMode();
                  syncPins();
                  post({ type: "CYATH_PING" });
                }}
                scrolling="no"
                className="w-full border-none select-none block max-w-full"
                style={{
                  height: isFullMode ? "100vh" : `${frameHeight}px`,
                  minHeight: isFullMode ? "100vh" : "800px",
                }}
                sandbox={previewOrigin ? "allow-scripts allow-same-origin" : "allow-scripts"}
                allow="camera 'none'; microphone 'none'"
              />
            ) : (
              <div className="space-y-2 bg-[#0a0a0c] p-5 text-white">
                <h2 className="font-semibold">Live preview unavailable</h2>
                <p className="text-sm">Open the original site using the link above. You can still add a note here.</p>
              </div>
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

            {/* Live Collaborative Peer Cursors */}
            {Object.values(cursors).map((cursor) => (
              <div
                key={cursor.id}
                style={{
                  left: `${cursor.xPercent}%`,
                  top: `${cursor.yPercent}%`,
                  transition: "left 60ms linear, top 60ms linear",
                }}
                className="absolute pointer-events-none z-50 -translate-x-1 -translate-y-1 select-none"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="drop-shadow-md">
                  <path
                    d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
                    fill={cursor.color}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                </svg>
                <div
                  style={{ backgroundColor: cursor.color }}
                  className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium text-white shadow-lg whitespace-nowrap ml-3 -mt-2 inline-block border border-white/20"
                >
                  {cursor.name}
                </div>
              </div>
            ))}

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

            {/* Pending Draft Marker: Point Pin with Ultra High Contrast Dual Rings & Radar Ping */}
            {pendingPinCoords && pendingPinCoords.annotationType !== "box" && (
              <div
                style={{
                  left: `${pendingPinCoords.xPercent}%`,
                  top: `${pendingPinCoords.yPercent}%`,
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none z-30"
              >
                {/* Outer high-contrast radar ping */}
                <div className="absolute inset-0 -m-1 rounded-full border border-black/80 ring-2 ring-white animate-ping opacity-60" />
                {/* Solid Dual-Ring High-Contrast Pin Marker */}
                <div className="relative w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-xs bg-black text-white border-2 border-white shadow-[0_4px_14px_rgba(0,0,0,0.6)] ring-1 ring-black">
                  +
                </div>
              </div>
            )}

            {/* Pending New Pin Popover */}
            {pendingPinCoords && (
              <PinPopover
                xPercent={pendingPinCoords.xPercent}
                yPercent={pendingPinCoords.yPercent}
                isNew={true}
                transcriptionReview={project.access?.canManage ? project.shareId : undefined}
                theme={theme}
                authorName={clientAuthorName}
                deviceMode={deviceMode}
                onSaveNewPin={handleSaveNewPin}
                onClose={() => {
                  setPendingPinCoords(null);
                  addNoteRef.current?.focus();
                }}
              />
            )}

            {/* Active Existing Pin Thread Popover */}
            {activePin && (
              <PinPopover
                key={activePin.id}
                pin={activePin}
                xPercent={activePin.xPercent}
                yPercent={activePin.yPercent}
                isNew={false}
                canExport={project.access?.canManage}
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
