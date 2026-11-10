"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Check,
  Smartphone,
  Tablet,
  Monitor,
  ShieldCheck,
  MessageSquare,
  Copy,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  MousePointer,
} from "lucide-react";
import { TesseractMark } from "@/components/common/Logo";

interface StudioWalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: "night" | "day";
}

interface InteractivePin {
  id: number;
  x: number;
  y: number;
  device: "desktop" | "tablet" | "mobile";
  author: string;
  comment: string;
  resolved: boolean;
}

export function StudioWalkthroughModal({ isOpen, onClose, theme = "night" }: StudioWalkthroughModalProps) {
  const [deviceMode, setDeviceMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [interactionMode, setInteractionMode] = useState<"comment" | "browse">("comment");
  const [pins, setPins] = useState<InteractivePin[]>([
    {
      id: 1,
      x: 34,
      y: 42,
      device: "desktop",
      author: "Client (Maison Élara)",
      comment: "Refine typography scale on the primary headline.",
      resolved: false,
    },
  ]);
  const [activePinId, setActivePinId] = useState<number | null>(1);
  const [draftPinCoords, setDraftPinCoords] = useState<{ x: number; y: number } | null>(null);
  const [draftText, setDraftText] = useState("");
  const [isApproved, setIsApproved] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);

  // Gamified interactive checklist tasks
  const [tasksCompleted, setTasksCompleted] = useState({
    droppedPin: false,
    switchedDevice: false,
    resolvedNote: false,
    approvedMilestone: false,
  });

  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "c" || e.key === "C") setInteractionMode("comment");
      if (e.key === "b" || e.key === "B") setInteractionMode("browse");
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (interactionMode !== "comment") return;
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    setDraftPinCoords({ x, y });
    setDraftText("");
    setActivePinId(null);
  };

  const handleCreatePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftPinCoords) return;

    const newPin: InteractivePin = {
      id: pins.length + 1,
      x: draftPinCoords.x,
      y: draftPinCoords.y,
      device: deviceMode,
      author: "You",
      comment: draftText.trim() || "Review element alignment and margin",
      resolved: false,
    };

    setPins([...pins, newPin]);
    setActivePinId(newPin.id);
    setDraftPinCoords(null);
    setDraftText("");
    setTasksCompleted((prev) => ({ ...prev, droppedPin: true }));
  };

  const handleToggleResolve = (pinId: number) => {
    setPins(
      pins.map((p) => {
        if (p.id === pinId) {
          return { ...p, resolved: !p.resolved };
        }
        return p;
      })
    );
    setTasksCompleted((prev) => ({ ...prev, resolvedNote: true }));
  };

  const handleDeviceChange = (mode: "desktop" | "tablet" | "mobile") => {
    setDeviceMode(mode);
    setTasksCompleted((prev) => ({ ...prev, switchedDevice: true }));
  };

  const handleApprove = () => {
    setIsApproved(!isApproved);
    setTasksCompleted((prev) => ({ ...prev, approvedMilestone: true }));
  };

  const handleCopyDemoLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText("https://cyath-space.vercel.app/r/demo-atelier-review");
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCopyMarkdownExport = () => {
    if (typeof window !== "undefined") {
      const summary = `# Cyath Review Export: Maison Élara\n- Notes: ${pins.length}\n- Status: ${isApproved ? "Approved" : "Needs Review"}`;
      navigator.clipboard.writeText(summary);
      setCopiedMarkdown(true);
      setTimeout(() => setCopiedMarkdown(false), 2000);
    }
  };

  const handleResetSimulator = () => {
    setDeviceMode("desktop");
    setInteractionMode("comment");
    setPins([
      {
        id: 1,
        x: 34,
        y: 42,
        device: "desktop",
        author: "Client (Maison Élara)",
        comment: "Refine typography scale on the primary headline.",
        resolved: false,
      },
    ]);
    setActivePinId(1);
    setDraftPinCoords(null);
    setIsApproved(false);
    setTasksCompleted({
      droppedPin: false,
      switchedDevice: false,
      resolvedNote: false,
      approvedMilestone: false,
    });
  };

  const activeDevicePins = pins.filter((p) => p.device === deviceMode);
  const openCount = activeDevicePins.filter((p) => !p.resolved).length;
  const completedTaskCount = Object.values(tasksCompleted).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-150 selection:bg-white selection:text-black">
      <div className="w-full max-w-5xl h-[92vh] max-h-[860px] bg-[#09090b] border border-white/15 rounded-2xl shadow-2xl flex flex-col relative text-white overflow-hidden">
        {/* Top Operational Bar */}
        <div className="h-14 border-b border-white/[0.08] px-5 flex items-center justify-between select-none bg-black shrink-0">
          <div className="flex items-center gap-3">
            <TesseractMark size={20} className="text-white shrink-0" />
            <div className="flex items-center gap-2">
              <span className="font-serif text-sm font-medium tracking-wide text-white">
                Interactive Atelier Simulator
              </span>
              <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase hidden sm:inline-block">
                [ LIVE REVIEW LAB ]
              </span>
            </div>
          </div>

          {/* Interactive Missions Checklist */}
          <div className="hidden lg:flex items-center gap-3 text-xs font-mono">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.03]">
              <span className="text-zinc-400">Objectives:</span>
              <span className={tasksCompleted.droppedPin ? "text-white font-semibold" : "text-zinc-500"}>
                {tasksCompleted.droppedPin ? "[✓ 1. Drop Pin]" : "1. Drop Pin"}
              </span>
              <span className="text-zinc-700">·</span>
              <span className={tasksCompleted.switchedDevice ? "text-white font-semibold" : "text-zinc-500"}>
                {tasksCompleted.switchedDevice ? "[✓ 2. Switch Viewport]" : "2. Switch Viewport"}
              </span>
              <span className="text-zinc-700">·</span>
              <span className={tasksCompleted.resolvedNote ? "text-white font-semibold" : "text-zinc-500"}>
                {tasksCompleted.resolvedNote ? "[✓ 3. Resolve Note]" : "3. Resolve"}
              </span>
              <span className="text-zinc-700">·</span>
              <span className={tasksCompleted.approvedMilestone ? "text-white font-semibold" : "text-zinc-500"}>
                {tasksCompleted.approvedMilestone ? "[✓ 4. Approve]" : "4. Approve"}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Simulator Review Header */}
        <div className="h-13 border-b border-white/[0.08] px-5 flex items-center justify-between select-none bg-[#0c0c0f] shrink-0">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-zinc-400">Target:</span>
            <span className="text-white font-medium">staging.maison-elara.com</span>
            <button
              onClick={handleCopyDemoLink}
              className="ml-2 px-2.5 py-0.5 rounded-full border border-white/10 hover:border-white/20 text-[10px] text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              {copiedLink ? "Copied Link" : "Copy Client Link"}
            </button>
          </div>

          {/* Viewport Switcher */}
          <div className="flex items-center gap-1.5 p-1 rounded-full border border-white/10 bg-white/[0.03]">
            <button
              onClick={() => handleDeviceChange("desktop")}
              className={`px-3 py-1 rounded-full text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                deviceMode === "desktop"
                  ? "bg-white text-black font-semibold shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
              title="Desktop 1440px"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Desktop</span>
            </button>
            <button
              onClick={() => handleDeviceChange("tablet")}
              className={`px-3 py-1 rounded-full text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                deviceMode === "tablet"
                  ? "bg-white text-black font-semibold shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
              title="Tablet 768px"
            >
              <Tablet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tablet</span>
            </button>
            <button
              onClick={() => handleDeviceChange("mobile")}
              className={`px-3 py-1 rounded-full text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                deviceMode === "mobile"
                  ? "bg-white text-black font-semibold shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
              title="Mobile 375px"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mobile</span>
            </button>
          </div>

          {/* Tools & Status */}
          <div className="flex items-center gap-2">
            <div className="flex items-center p-0.5 rounded-lg border border-white/10 bg-white/[0.03]">
              <button
                onClick={() => setInteractionMode("comment")}
                className={`p-1.5 rounded-md transition-all cursor-pointer ${
                  interactionMode === "comment" ? "bg-white text-black" : "text-zinc-400 hover:text-white"
                }`}
                title="Drop notes"
              >
                <MessageSquare className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setInteractionMode("browse")}
                className={`p-1.5 rounded-md transition-all cursor-pointer ${
                  interactionMode === "browse" ? "bg-white text-black" : "text-zinc-400 hover:text-white"
                }`}
                title="Browse mode"
              >
                <MousePointer className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={handleApprove}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                isApproved
                  ? "bg-white text-black"
                  : "border border-white/15 bg-white/5 hover:bg-white/10 text-white"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isApproved ? "Approved" : "Sign Off"}</span>
            </button>
          </div>
        </div>

        {/* Main Interactive Stage Body */}
        <div className="flex-1 flex overflow-hidden bg-black relative">
          {/* Viewport Frame Container */}
          <div className="flex-1 overflow-auto p-4 sm:p-8 flex justify-center items-start">
            <div
              className={`transition-all duration-300 rounded-xl border border-white/15 bg-[#0a0a0d] shadow-2xl flex flex-col relative overflow-hidden select-none ${
                deviceMode === "desktop"
                  ? "w-full max-w-[860px]"
                  : deviceMode === "tablet"
                  ? "w-[620px]"
                  : "w-[340px]"
              }`}
            >
              {/* Browser Header Ticks */}
              <div className="h-8 bg-[#070709] border-b border-white/[0.08] px-3 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
                  <span className="ml-2 text-zinc-400">staging.maison-elara.com</span>
                </div>
                <span>
                  {deviceMode === "desktop" ? "1440×900" : deviceMode === "tablet" ? "768×1024" : "375×812"}
                </span>
              </div>

              {/* Live Clickable Content Canvas */}
              <div
                ref={canvasRef}
                onClick={handleCanvasClick}
                className={`relative min-h-[460px] p-6 sm:p-8 flex flex-col justify-between overflow-hidden bg-[#0a0a0d] ${
                  interactionMode === "comment" ? "cursor-crosshair" : "cursor-default"
                }`}
              >
                {/* Background Drafting Grid */}
                <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

                {/* Simulated Web Page Content */}
                <div className="relative z-10 space-y-6 pointer-events-none">
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                    <span className="font-serif text-lg font-normal tracking-wide text-white">
                      Maison Élara
                    </span>
                    <div className="flex items-center gap-4 text-xs font-sans text-zinc-400">
                      <span>Work</span>
                      <span>Archive</span>
                      <span>Atelier</span>
                    </div>
                  </div>

                  <div className="space-y-3 max-w-lg pt-4">
                    <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
                      Architecture & Design
                    </span>
                    <h2 className="font-serif text-3xl sm:text-4xl font-normal text-white leading-tight">
                      Monolithic spaces crafted with natural basalt and cedar.
                    </h2>
                    <p className="text-xs sm:text-sm text-zinc-400 font-sans leading-relaxed">
                      Click anywhere across this layout to experience instant pin placement, coordinate telemetry, and client discussions.
                    </p>
                  </div>

                  <div className="pt-2 flex items-center gap-3">
                    <button className="px-4 py-2 rounded-lg bg-white text-black font-semibold text-xs shadow-md">
                      Explore Portfolio
                    </button>
                    <button className="px-4 py-2 rounded-lg border border-white/15 text-zinc-300 text-xs">
                      View Case Study
                    </button>
                  </div>
                </div>

                {/* Footer specs */}
                <div className="relative z-10 pt-8 border-t border-white/[0.08] flex items-center justify-between text-[10px] font-mono text-zinc-500 pointer-events-none">
                  <span>© 2026 Maison Élara Atelier</span>
                  <span>Click stage to place notes</span>
                </div>

                {/* Placed Interactive Pins */}
                {activeDevicePins.map((pin) => {
                  const isActive = pin.id === activePinId;
                  return (
                    <div
                      key={pin.id}
                      style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePinId(pin.id);
                        setDraftPinCoords(null);
                      }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer"
                    >
                      <button
                        className={`rounded-full flex items-center justify-center font-mono font-bold transition-all ${
                          pin.resolved
                            ? "w-5 h-5 bg-black border border-white/20 text-zinc-500"
                            : isActive
                            ? "w-7 h-7 bg-white text-black shadow-xl ring-2 ring-white/40 text-xs scale-110"
                            : "w-6 h-6 bg-black border border-white/60 text-white text-[11px] hover:scale-105"
                        }`}
                      >
                        {pin.resolved ? <Check className="w-3 h-3 stroke-[2.5]" /> : pin.id}
                      </button>

                      {/* Expanded Popover on active pin */}
                      {isActive && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute left-8 top-0 z-30 w-64 bg-[#09090c] border border-white/20 rounded-xl p-3 shadow-2xl space-y-2 cursor-default animate-in fade-in duration-150"
                        >
                          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                            <span className="font-semibold text-white">{pin.author}</span>
                            <span>Pin #{pin.id}</span>
                          </div>

                          <p className="text-xs text-zinc-200 font-sans leading-relaxed">{pin.comment}</p>

                          <div className="pt-1.5 border-t border-white/[0.08] flex items-center justify-between">
                            <button
                              onClick={() => handleToggleResolve(pin.id)}
                              className={`px-2 py-1 rounded text-[10px] font-mono border transition-all flex items-center gap-1 cursor-pointer ${
                                pin.resolved
                                  ? "border-white/30 text-white bg-white/10"
                                  : "border-white/20 text-zinc-400 hover:text-white"
                              }`}
                            >
                              <Check className="w-2.5 h-2.5" />
                              <span>{pin.resolved ? "Resolved" : "Mark Resolved"}</span>
                            </button>

                            <span className="text-[9px] font-mono text-zinc-500">
                              ({pin.x}%, {pin.y}%)
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Draft Pin Form Prompt */}
                {draftPinCoords && (
                  <form
                    onSubmit={handleCreatePin}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      left: `${Math.min(65, draftPinCoords.x)}%`,
                      top: `${Math.min(60, draftPinCoords.y)}%`,
                    }}
                    className="absolute z-30 bg-[#09090c] border border-white/25 rounded-xl p-3.5 shadow-2xl space-y-2.5 w-68 animate-in fade-in duration-100"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                      <span>Placing Note #{pins.length + 1}</span>
                      <span>({draftPinCoords.x}%, {draftPinCoords.y}%)</span>
                    </div>

                    <input
                      type="text"
                      autoFocus
                      placeholder="Type note and press Enter..."
                      value={draftText}
                      onChange={(e) => setDraftText(e.target.value)}
                      className="w-full bg-black border border-white/15 rounded-lg px-2.5 py-2 text-xs text-white outline-none focus:border-white/40 font-sans"
                    />

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setDraftPinCoords(null)}
                        className="px-2.5 py-1 text-[11px] font-mono text-zinc-400 hover:text-white cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1 bg-white text-black text-[11px] font-mono font-semibold rounded-lg hover:bg-zinc-200 transition-colors cursor-pointer"
                      >
                        Post Note
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* Right Ledger / Punchlist Panel */}
          <div className="w-72 border-l border-white/[0.08] bg-[#09090c] flex flex-col justify-between shrink-0 hidden md:flex">
            <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
              <div>
                <h4 className="font-serif text-sm font-normal text-white">Punchlist Ledger</h4>
                <p className="text-[10px] font-mono text-zinc-500">
                  {openCount} Open · {activeDevicePins.length - openCount} Resolved
                </p>
              </div>

              {isApproved && (
                <span className="text-[9px] font-mono border border-white/30 bg-white/10 px-2 py-0.5 rounded-full text-white">
                  Approved
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {activeDevicePins.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 font-mono text-xs">
                  No notes on this viewport. Click the canvas to add one.
                </div>
              ) : (
                activeDevicePins.map((pin) => (
                  <div
                    key={pin.id}
                    onClick={() => setActivePinId(pin.id)}
                    className={`p-3 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
                      activePinId === pin.id
                        ? "bg-white/10 border-white/30 text-white"
                        : "bg-white/[0.02] border-white/10 text-zinc-400 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-white">#{pin.id} {pin.author}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleResolve(pin.id);
                        }}
                        className="p-1 hover:text-white text-zinc-500"
                        title="Toggle resolved"
                      >
                        <Check className={`w-3 h-3 ${pin.resolved ? "text-white" : ""}`} />
                      </button>
                    </div>
                    <p className="text-[11px] font-sans truncate">{pin.comment}</p>
                  </div>
                ))
              )}
            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-white/[0.08] space-y-2">
              <button
                onClick={handleCopyMarkdownExport}
                className="w-full py-2 px-3 rounded-lg border border-white/10 hover:border-white/20 text-xs font-mono text-zinc-300 hover:text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedMarkdown ? "Copied Markdown" : "Export Markdown"}</span>
              </button>

              <button
                onClick={handleResetSimulator}
                className="w-full py-1 text-[10px] font-mono text-zinc-500 hover:text-zinc-300 flex items-center justify-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Reset Simulation</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Help / Completion Bar */}
        <div className="h-14 border-t border-white/[0.08] px-5 flex items-center justify-between select-none bg-black shrink-0">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <span>Progress: {completedTaskCount}/4 actions completed</span>
            {completedTaskCount === 4 && (
              <span className="text-white font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Ready to Review</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-white text-black font-sans font-semibold text-xs hover:bg-zinc-200 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <span>Done with Tour</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
