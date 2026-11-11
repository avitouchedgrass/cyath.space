"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Check,
  Monitor,
  Smartphone,
  ShieldCheck,
  Globe,
  MessageSquare,
  Copy,
  ChevronRight,
  BookOpen,
  Maximize2,
  Terminal,
} from "lucide-react";
import { TesseractMark } from "@/components/common/Logo";

interface StudioWalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: "night" | "day";
}

interface Scene {
  id: number;
  label: string;
  durationMs: number;
  title: string;
  caption: string;
}

const SCENES: Scene[] = [
  {
    id: 0,
    label: "01 Intake",
    durationMs: 7000,
    title: "Mount Any Staging Deployment",
    caption:
      "Paste any live website URL or drop a design asset. Cyath mounts an isolated review canvas instantly with zero client logins or plugins required.",
  },
  {
    id: 1,
    label: "02 Annotate",
    durationMs: 8000,
    title: "Precision Hardware-Anchored Pins",
    caption:
      "Clients click directly on the live website to leave notes. Screen dimensions, device pixel ratio, browser, and exact coordinates are pinned automatically.",
  },
  {
    id: 2,
    label: "03 Viewports",
    title: "Strict Breakpoint Isolation",
    durationMs: 8000,
    caption:
      "Toggle between desktop and mobile frames. Notes dropped on mobile stay on mobile, so responsive breakpoint fixes never conflict with desktop layouts.",
  },
  {
    id: 3,
    label: "04 Sign-Off",
    durationMs: 7000,
    title: "Milestone Approval & Export",
    caption:
      "When revisions are complete, clients sign off on the milestone with a single click. Export the complete punchlist to Markdown for Linear or GitHub.",
  },
];

export function StudioWalkthroughModal({ isOpen, onClose }: StudioWalkthroughModalProps) {
  const [viewMode, setViewMode] = useState<"walkthrough" | "guide">("walkthrough");
  const [activeScene, setActiveScene] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [elapsedSceneTime, setElapsedSceneTime] = useState(0);

  // Scene 0: Typing simulation
  const [typedUrl, setTypedUrl] = useState("");
  const [isUrlSubmitted, setIsUrlSubmitted] = useState(false);

  // Scene 1: Pin drop simulation
  const [pinDropped, setPinDropped] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Scene 2: Responsive toggle simulation
  const [simulatedDevice, setSimulatedDevice] = useState<"desktop" | "mobile">("desktop");
  const [mobilePinDropped, setMobilePinDropped] = useState(false);

  // Scene 3: Resolution & Approval simulation
  const [noteResolved, setNoteResolved] = useState(false);
  const [milestoneApproved, setMilestoneApproved] = useState(false);
  const [exportedMarkdown, setExportedMarkdown] = useState(false);

  const fullUrlTarget = "https://staging.interior-atelier.com";

  // Main playback loop
  useEffect(() => {
    if (!isOpen || !isPlaying) return;

    const currentDuration = SCENES[activeScene].durationMs;
    const intervalTime = 50;

    const timer = setInterval(() => {
      setElapsedSceneTime((prev) => {
        const next = prev + intervalTime;
        if (next >= currentDuration) {
          // Transition to next scene or loop
          setActiveScene((s) => (s + 1) % SCENES.length);
          return 0;
        }
        return next;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isOpen, isPlaying, activeScene]);

  // Choreographed autonomous animations based on scene and elapsed time
  useEffect(() => {
    if (!isOpen) return;

    if (activeScene === 0) {
      // Scene 0 choreography
      setSimulatedDevice("desktop");
      const progress = Math.min(1, elapsedSceneTime / 3500);
      const charsToShow = Math.floor(progress * fullUrlTarget.length);
      setTypedUrl(fullUrlTarget.slice(0, charsToShow));
      setIsUrlSubmitted(elapsedSceneTime > 4000);
    } else if (activeScene === 1) {
      // Scene 1 choreography
      setPinDropped(elapsedSceneTime > 1500);
      setPopoverOpen(elapsedSceneTime > 2500);
    } else if (activeScene === 2) {
      // Scene 2 choreography
      if (elapsedSceneTime < 2500) {
        setSimulatedDevice("desktop");
        setMobilePinDropped(false);
      } else {
        setSimulatedDevice("mobile");
        setMobilePinDropped(elapsedSceneTime > 4500);
      }
    } else if (activeScene === 3) {
      // Scene 3 choreography
      setSimulatedDevice("desktop");
      setNoteResolved(elapsedSceneTime > 2000);
      setMilestoneApproved(elapsedSceneTime > 4000);
      setExportedMarkdown(elapsedSceneTime > 5500);
    }
  }, [activeScene, elapsedSceneTime, isOpen]);

  // Keyboard controls
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === " ") {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
      if (e.key === "ArrowRight") {
        setActiveScene((s) => (s + 1) % SCENES.length);
        setElapsedSceneTime(0);
      }
      if (e.key === "ArrowLeft") {
        setActiveScene((s) => (s - 1 + SCENES.length) % SCENES.length);
        setElapsedSceneTime(0);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelectScene = (idx: number) => {
    setActiveScene(idx);
    setElapsedSceneTime(0);
    setIsPlaying(true);
  };

  const handleRestart = () => {
    setActiveScene(0);
    setElapsedSceneTime(0);
    setIsPlaying(true);
  };

  const currentScene = SCENES[activeScene];
  const sceneProgressPercent = Math.min(100, (elapsedSceneTime / currentScene.durationMs) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-150 selection:bg-white selection:text-black">
      <div className="w-full max-w-4xl bg-[#09090c] border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col relative text-white">
        {/* Top Floating Control Bar */}
        <div className="h-14 border-b border-white/[0.08] px-5 flex items-center justify-between select-none bg-black">
          <div className="flex items-center gap-3">
            <TesseractMark size={20} className="text-white shrink-0" />
            <div className="flex items-center p-0.5 rounded-lg border border-white/10 bg-white/[0.04] text-xs font-mono">
              <button
                onClick={() => setViewMode("walkthrough")}
                className={`px-3 py-1 rounded-md transition-all ${
                  viewMode === "walkthrough"
                    ? "bg-white text-black font-semibold shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Walkthrough Cinema
              </button>
              <button
                onClick={() => setViewMode("guide")}
                className={`px-3 py-1 rounded-md transition-all ${
                  viewMode === "guide"
                    ? "bg-white text-black font-semibold shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Field Guide & Hotkeys
              </button>
            </div>
          </div>

          {/* Autonomous Scene Chapters (only in walkthrough mode) */}
          {viewMode === "walkthrough" && (
            <div className="hidden sm:flex items-center gap-1.5 p-1 rounded-full border border-white/10 bg-white/[0.03]">
              {SCENES.map((scene, idx) => (
                <button
                  key={scene.id}
                  onClick={() => handleSelectScene(idx)}
                  className={`px-3 py-1 rounded-full text-xs font-mono transition-all cursor-pointer relative overflow-hidden ${
                    activeScene === idx
                      ? "text-black bg-white font-semibold shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <span>{scene.label}</span>
                </button>
              ))}
            </div>
          )}

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {viewMode === "guide" ? (
          <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto bg-[#070709] font-sans">
            <div className="space-y-1">
              <span className="text-[10px] font-mono tracking-widest uppercase text-zinc-400">
                ATELIER SPECIFICATION // REFERENCE LEDGER
              </span>
              <h3 className="font-serif text-2xl font-normal text-white">
                Studio Field Guide & Keyboard Hotkeys
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
                Cyath is designed for rapid client review and autonomous AI agent workflows. Keep this ledger handy during active reviews.
              </p>
            </div>

            {/* Keyboard Hotkeys Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-xl border border-white/15 bg-black/60 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">Comment Mode</div>
                  <div className="text-[11px] text-zinc-400 font-sans">Click anywhere on live canvas to drop feedback pins</div>
                </div>
                <kbd className="px-2.5 py-1 rounded bg-white/10 border border-white/20 font-mono text-xs text-white">C</kbd>
              </div>

              <div className="p-3.5 rounded-xl border border-white/15 bg-black/60 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">Browse / Navigate Mode</div>
                  <div className="text-[11px] text-zinc-400 font-sans">Interact with forms, buttons, and links inside frame</div>
                </div>
                <kbd className="px-2.5 py-1 rounded bg-white/10 border border-white/20 font-mono text-xs text-white">V</kbd>
              </div>

              <div className="p-3.5 rounded-xl border border-white/15 bg-black/60 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">Full Page Viewport</div>
                  <div className="text-[11px] text-zinc-400 font-sans">Switch to 100% fluid edge-to-edge canvas width</div>
                </div>
                <kbd className="px-2.5 py-1 rounded bg-white/10 border border-white/20 font-mono text-xs text-white">4 / F</kbd>
              </div>

              <div className="p-3.5 rounded-xl border border-white/15 bg-black/60 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">Desktop Viewport</div>
                  <div className="text-[11px] text-zinc-400 font-sans">Switch to isolated 1440px desktop frame</div>
                </div>
                <kbd className="px-2.5 py-1 rounded bg-white/10 border border-white/20 font-mono text-xs text-white">1</kbd>
              </div>

              <div className="p-3.5 rounded-xl border border-white/15 bg-black/60 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">Tablet & Mobile Viewports</div>
                  <div className="text-[11px] text-zinc-400 font-sans">Switch to 768px tablet or 375px mobile frames</div>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 rounded bg-white/10 border border-white/20 font-mono text-xs text-white">2</kbd>
                  <kbd className="px-2 py-1 rounded bg-white/10 border border-white/20 font-mono text-xs text-white">3</kbd>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-white/15 bg-black/60 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">Deselect / Dismiss</div>
                  <div className="text-[11px] text-zinc-400 font-sans">Close active pin popover and clear selection</div>
                </div>
                <kbd className="px-2.5 py-1 rounded bg-white/10 border border-white/20 font-mono text-xs text-white">Esc</kbd>
              </div>
            </div>

            {/* Autonomous MCP Agent Integration Guide */}
            <div className="p-4 rounded-xl border border-white/15 bg-[#0a0a0e] space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold text-white uppercase tracking-wider">
                <Terminal className="w-3.5 h-3.5 text-white" />
                <span>Autonomous MCP Agent Prompts</span>
              </div>
              <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                When using Cursor or Claude Code with your Studio Pro key, copy and paste these prompt templates directly into your AI assistant:
              </p>
              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="p-2 rounded-lg bg-black border border-white/10 text-zinc-300">
                  &gt; &quot;@cyath inspect open pins on canvas &lt;shareId&gt; and fix responsive issues.&quot;
                </div>
                <div className="p-2 rounded-lg bg-black border border-white/10 text-zinc-300">
                  &gt; &quot;@cyath fetch all resolved pins and export an audit log to Linear.&quot;
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
        <div className="relative aspect-[16/10] sm:aspect-video w-full bg-[#050507] overflow-hidden flex items-center justify-center border-b border-white/[0.08]">
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

          {/* ── SCENE 0: Autonomous Intake & Mounting ── */}
          {activeScene === 0 && (
            <div className="w-full max-w-lg p-6 space-y-5 flex flex-col items-center animate-in fade-in duration-300">
              <div className="w-12 h-12 rounded-2xl border border-white/15 bg-white/[0.04] flex items-center justify-center text-white">
                <Globe className="w-6 h-6 stroke-[1.8]" />
              </div>

              {/* Simulated Auto-typing Input */}
              <div className="w-full bg-[#0a0a0d] border border-white/20 rounded-xl p-3 flex items-center gap-3 shadow-2xl relative">
                <Globe className="w-4 h-4 text-zinc-500 shrink-0" />
                <span className="text-xs font-mono text-white flex-1 text-left truncate">
                  {typedUrl || <span className="text-zinc-600">Enter staging site URL...</span>}
                  <span className="animate-pulse">|</span>
                </span>
                <span
                  className={`px-3 py-1 rounded-lg text-xs font-mono transition-all font-semibold ${
                    isUrlSubmitted
                      ? "bg-white text-black scale-95"
                      : "bg-white/10 text-white"
                  }`}
                >
                  {isUrlSubmitted ? "Mounted ✓" : "Review URL →"}
                </span>
              </div>

              {/* Unfolded Canvas Indicator */}
              <div
                className={`transition-all duration-500 rounded-xl border border-white/10 bg-[#0d0d10] p-4 w-full flex items-center justify-between text-xs font-mono ${
                  isUrlSubmitted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  <span className="text-white">Canvas Ready for Client Feedback</span>
                </div>
                <span className="text-zinc-500">Zero SDK Needed</span>
              </div>
            </div>
          )}

          {/* ── SCENE 1: Autonomous Pin Dropping & Telemetry ── */}
          {activeScene === 1 && (
            <div className="w-full max-w-xl p-4 sm:p-6 animate-in fade-in duration-300">
              <div className="w-full rounded-xl border border-white/15 bg-[#0a0a0d] p-6 relative shadow-2xl overflow-hidden min-h-[300px]">
                {/* Browser bar */}
                <div className="border-b border-white/[0.08] pb-3 mb-6 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                  <span className="font-serif text-sm font-normal text-white">Maison Élara Architecture</span>
                  <span>staging.maison-elara.com</span>
                </div>

                <div className="space-y-3 pointer-events-none">
                  <h3 className="font-serif text-2xl font-normal text-white max-w-sm leading-snug">
                    Pure geometric forms in honed volcanic stone.
                  </h3>
                  <p className="text-xs text-zinc-400 font-sans max-w-xs">
                    Client clicks directly on this section to request design revisions.
                  </p>
                </div>

                {/* Animated Drop Pin */}
                {pinDropped && (
                  <div className="absolute left-[38%] top-[45%] animate-in zoom-in-75 duration-200">
                    <div className="w-7 h-7 rounded-full bg-white text-black font-mono font-bold text-xs flex items-center justify-center shadow-2xl ring-2 ring-white/40">
                      1
                    </div>
                  </div>
                )}

                {/* Animated Popover */}
                {popoverOpen && (
                  <div className="absolute left-[44%] top-[38%] bg-[#08080a] border border-white/25 rounded-xl p-3.5 shadow-2xl w-68 space-y-2 animate-in fade-in slide-in-from-left-2 duration-300">
                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                      <span className="font-semibold text-white">Client (Sarah)</span>
                      <span>1440×900 · Chrome</span>
                    </div>
                    <p className="text-xs text-zinc-200 font-sans leading-relaxed">
                      Increase font contrast and line spacing on this headline.
                    </p>
                    <div className="text-[9px] font-mono text-zinc-500 pt-1 border-t border-white/[0.08] flex items-center justify-between">
                      <span>Telemetry Captured</span>
                      <span className="text-white">Active</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── SCENE 2: Responsive Viewport Isolation ── */}
          {activeScene === 2 && (
            <div className="w-full flex flex-col items-center justify-center p-6 space-y-4 animate-in fade-in duration-300">
              {/* Header viewport pill */}
              <div className="flex items-center gap-1.5 p-1 rounded-full border border-white/10 bg-white/[0.04] text-xs font-mono">
                <span
                  className={`px-3 py-1 rounded-full transition-all flex items-center gap-1.5 ${
                    simulatedDevice === "desktop" ? "bg-white text-black font-semibold" : "text-zinc-400"
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Desktop (1440px)</span>
                </span>
                <span
                  className={`px-3 py-1 rounded-full transition-all flex items-center gap-1.5 ${
                    simulatedDevice === "mobile" ? "bg-white text-black font-semibold" : "text-zinc-400"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Mobile (375px)</span>
                </span>
              </div>

              {/* Morphing Device Frame */}
              <div
                className={`transition-all duration-500 border border-white/15 bg-[#0a0a0d] rounded-xl p-4 shadow-2xl flex flex-col justify-between relative overflow-hidden min-h-[260px] ${
                  simulatedDevice === "desktop" ? "w-full max-w-lg" : "w-64"
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 border-b border-white/[0.06] pb-2">
                  <span>{simulatedDevice === "desktop" ? "Desktop Canvas" : "Mobile Viewport"}</span>
                  <span className="text-white">{simulatedDevice === "desktop" ? "1440×900" : "375×812"}</span>
                </div>

                <div className="my-auto text-center space-y-1">
                  <span className="font-serif text-sm font-normal text-white">
                    {simulatedDevice === "desktop" ? "Desktop Multi-Column Hero" : "Mobile Vertical Layout"}
                  </span>
                  <p className="text-[11px] font-sans text-zinc-400">
                    {simulatedDevice === "desktop"
                      ? "Desktop notes stay visible."
                      : "Mobile notes stay isolated."}
                  </p>
                </div>

                {mobilePinDropped && simulatedDevice === "mobile" && (
                  <div className="absolute left-[50%] top-[40%] -translate-x-1/2 animate-in zoom-in duration-200">
                    <div className="w-6 h-6 rounded-full bg-white text-black font-mono font-bold text-xs flex items-center justify-center shadow-xl">
                      #1
                    </div>
                  </div>
                )}

                <div className="text-[9px] font-mono text-zinc-500 flex items-center justify-between pt-2 border-t border-white/[0.06]">
                  <span>Isolated Viewport</span>
                  <span className="text-white">Strict Seam</span>
                </div>
              </div>
            </div>
          )}

          {/* ── SCENE 3: Resolution & Milestone Sign-Off ── */}
          {activeScene === 3 && (
            <div className="w-full max-w-md p-6 flex flex-col items-center text-center space-y-4 animate-in fade-in duration-300">
              <div className="w-14 h-14 rounded-full border border-white/20 bg-white/[0.03] flex items-center justify-center text-white">
                <ShieldCheck className="w-7 h-7 stroke-[1.8]" />
              </div>

              <div className="space-y-1">
                <h4 className="font-serif text-xl font-normal text-white">
                  {milestoneApproved ? "Milestone Approved" : "Sign Off Milestone"}
                </h4>
                <p className="text-xs text-zinc-400 max-w-sm font-sans">
                  {milestoneApproved
                    ? "Signed by Client (Jane Cooper) on 2026.11.11. Scope locked."
                    : "Clients review open notes and certify project completion."}
                </p>
              </div>

              {/* Status Certificate Pill */}
              <div className="flex items-center gap-2 pt-2">
                <span
                  className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold transition-all ${
                    milestoneApproved
                      ? "bg-white text-black shadow-lg"
                      : "border border-white/20 text-zinc-400 bg-white/5"
                  }`}
                >
                  {milestoneApproved ? "MILESTONE SIGNED ✓" : "Reviewing Notes..."}
                </span>

                {exportedMarkdown && (
                  <span className="px-3 py-1.5 rounded-full border border-white/20 text-xs font-mono text-white bg-white/10 flex items-center gap-1.5 animate-in fade-in">
                    <Check className="w-3.5 h-3.5" />
                    <span>Exported to Markdown</span>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Micro Watermark */}
          <div className="absolute bottom-3 left-4 text-[10px] font-mono text-zinc-600 pointer-events-none">
            CYATH ARCHITECTURAL ENGINE · SIMULATED PLAYBACK
          </div>
        </div>

        {/* Bottom Playback Scrubber & Scene Explanation */}
        <div className="p-5 sm:p-6 bg-black space-y-4">
          {/* Progress Bar (Scrubber) */}
          <div className="w-full h-1.5 rounded-full bg-white/10 relative overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-75"
              style={{ width: `${sceneProgressPercent}%` }}
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 max-w-xl">
              <h3 className="font-serif text-lg font-normal text-white">
                {currentScene.title}
              </h3>
              <p className="font-sans text-xs text-zinc-400 leading-relaxed">
                {currentScene.caption}
              </p>
            </div>

            {/* Play / Pause / Next Controls */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-white transition-colors cursor-pointer"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>

              <button
                onClick={handleRestart}
                className="p-2 rounded-lg border border-white/10 hover:border-white/20 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title="Replay from beginning"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setActiveScene((s) => (s + 1) % SCENES.length);
                  setElapsedSceneTime(0);
                }}
                className="px-3.5 py-2 rounded-lg bg-white text-black font-sans font-semibold text-xs hover:bg-zinc-200 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
}
