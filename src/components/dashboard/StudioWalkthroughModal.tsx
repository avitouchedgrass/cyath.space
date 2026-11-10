"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Check,
  Smartphone,
  Monitor,
  ShieldCheck,
  Globe,
  Send,
  CheckCircle2,
} from "lucide-react";

interface StudioWalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: "night" | "day";
}

interface Chapter {
  id: number;
  timeRange: string;
  badge: string;
  title: string;
  summary: string;
}

const CHAPTERS: Chapter[] = [
  {
    id: 0,
    timeRange: "0:00 - 0:25",
    badge: "01 · STAGING INTAKE",
    title: "Mount Any Staging Deployment",
    summary: "Zero SDK installation or repo access required. Paste any live URL to create an isolated staging viewport.",
  },
  {
    id: 1,
    timeRange: "0:25 - 0:50",
    badge: "02 · 01/CAPTURE PINS",
    title: "Precision Hardware-Anchored Pins",
    summary: "Clients click anywhere to leave notes. Exact DOM coordinates, screen resolution, DPR, and browser are captured automatically.",
  },
  {
    id: 2,
    timeRange: "0:50 - 1:15",
    badge: "03 · VIEWPORT ISOLATION",
    title: "Separate Mobile, Tablet & Desktop Threads",
    summary: "Notes dropped on mobile stay on mobile. Viewports remain strictly isolated to eliminate cross-device confusion.",
  },
  {
    id: 3,
    timeRange: "1:15 - 1:35",
    badge: "04 · MILESTONE SIGN-OFF",
    title: "Cryptographic Milestone Approval",
    summary: "One-click client sign-off creates an immutable SHA-256 milestone certificate with exact signatory timestamp.",
  },
];

export function StudioWalkthroughModal({ isOpen, onClose }: StudioWalkthroughModalProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(12);
  const [activeChapter, setActiveChapter] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Playback timer loop
  useEffect(() => {
    if (!isOpen) return;

    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 100;
          }
          const next = prev + 0.5;
          // Determine active chapter based on progress percent
          if (next < 25) setActiveChapter(0);
          else if (next < 50) setActiveChapter(1);
          else if (next < 75) setActiveChapter(2);
          else setActiveChapter(3);
          return next;
        });
      }, 200);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, isPlaying]);

  // Keyboard controls
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === " ") {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentChapter = CHAPTERS[activeChapter];

  const handleSelectChapter = (idx: number) => {
    setActiveChapter(idx);
    setProgress(idx * 25 + 2);
    setIsPlaying(true);
  };

  const handleRestart = () => {
    setProgress(0);
    setActiveChapter(0);
    setIsPlaying(true);
  };

  // Format timestamp (Total duration: 1:35 = 95s)
  const currentSeconds = Math.floor((progress / 100) * 95);
  const minutes = Math.floor(currentSeconds / 60);
  const seconds = currentSeconds % 60;
  const timeFormatted = `${minutes}:${seconds < 10 ? "0" : ""}${seconds} / 1:35`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-150 selection:bg-white selection:text-black font-sans">
      <div className="w-full max-w-4xl bg-[#09090b] border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Top Header Bar */}
        <div className="h-12 border-b border-white/[0.08] px-4 flex items-center justify-between bg-black select-none">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
            </div>
            <span className="text-xs font-semibold text-white tracking-wide">
              Cyath Studio Walkthrough
            </span>
            <span className="text-zinc-600">·</span>
            <span className="text-[11px] font-mono text-zinc-400">
              Interactive Video Guide
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video Canvas Stage (16:9 Viewport) */}
        <div className="relative aspect-video w-full bg-[#050505] overflow-hidden flex items-center justify-center border-b border-white/[0.08]">
          {/* Subtle Grid Backdrop */}
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

          {/* Dynamic Scene Content per Chapter */}
          {activeChapter === 0 && (
            <div className="w-full max-w-lg p-6 flex flex-col items-center text-center space-y-4 animate-in fade-in duration-300">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
                <Globe className="w-6 h-6 stroke-[1.8]" />
              </div>
              <div className="w-full bg-[#000000] border border-white/15 rounded-xl px-4 py-2.5 flex items-center gap-2 shadow-2xl">
                <span className="text-[11px] text-zinc-500 font-mono">https://</span>
                <span className="text-xs text-white font-mono flex-1 text-left">
                  interior-sample.deploy.vercel.app
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white text-black">
                  Mounted
                </span>
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-white">Zero Proxy Lag · Live DOM Render</h4>
                <p className="text-xs text-zinc-400 max-w-sm">
                  CORS and frame-ancestors headers are automatically stripped on our edge proxy so your client sees their real site immediately.
                </p>
              </div>
            </div>
          )}

          {activeChapter === 1 && (
            <div className="w-full max-w-md p-6 relative animate-in fade-in duration-300">
              {/* Mock Web Interface */}
              <div className="w-full h-56 rounded-xl border border-white/10 bg-[#0d0d0f] p-4 relative shadow-2xl overflow-hidden">
                <div className="text-xs font-semibold text-zinc-300 mb-2">Maison Élara Atelier</div>
                <div className="text-[11px] text-zinc-500 mb-6">Contemporary interior design for residential homes.</div>

                {/* Simulated Pin #1 */}
                <div className="absolute left-1/3 top-1/2 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-white text-black font-bold text-xs flex items-center justify-center shadow-lg animate-bounce">
                    1
                  </div>
                  <div className="bg-[#18181b] border border-white/20 rounded-lg p-2.5 text-xs text-white shadow-xl max-w-[200px]">
                    <div className="text-[10px] text-zinc-400 font-mono mb-1">Guest Reviewer · 1440×900</div>
                    <div>Increase contrast on the secondary heading.</div>
                  </div>
                </div>

                {/* Simulated Cursor */}
                <div className="absolute left-[38%] top-[58%] pointer-events-none flex items-start">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M4 3L11 20L14 13L21 10L4 3Z" fill="#FFF" stroke="#000" strokeWidth="1.8" />
                  </svg>
                  <span className="ml-1 px-1.5 py-0.5 rounded bg-white text-black font-mono font-bold text-[8px]">
                    You
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeChapter === 2 && (
            <div className="flex items-center gap-6 p-6 animate-in fade-in duration-300">
              {/* Desktop Mockup */}
              <div className="flex flex-col items-center">
                <div className="w-48 h-32 rounded-lg border border-white/20 bg-[#0c0c0e] p-2 flex flex-col justify-between shadow-xl">
                  <div className="flex items-center justify-between text-[9px] text-zinc-400">
                    <span className="font-semibold text-white">Desktop</span>
                    <span>1440px</span>
                  </div>
                  <div className="w-4 h-4 rounded-full bg-white text-black font-bold text-[9px] flex items-center justify-center self-center">
                    #1
                  </div>
                  <div className="text-[9px] text-zinc-500 text-center">1 Note Desktop</div>
                </div>
                <div className="flex items-center gap-1 mt-2 text-[11px] text-zinc-400">
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Desktop Viewport</span>
                </div>
              </div>

              {/* Mobile Mockup */}
              <div className="flex flex-col items-center">
                <div className="w-24 h-40 rounded-xl border border-white/30 bg-[#0c0c0e] p-2 flex flex-col justify-between shadow-2xl">
                  <div className="text-[8px] font-semibold text-white text-center">Mobile 375px</div>
                  <div className="w-4 h-4 rounded-full bg-amber-400 text-black font-bold text-[9px] flex items-center justify-center self-center">
                    #1
                  </div>
                  <div className="text-[8px] text-zinc-500 text-center">Mobile Note</div>
                </div>
                <div className="flex items-center gap-1 mt-2 text-[11px] text-zinc-400">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Mobile Viewport</span>
                </div>
              </div>
            </div>
          )}

          {activeChapter === 3 && (
            <div className="w-full max-w-md p-6 flex flex-col items-center text-center space-y-4 animate-in fade-in duration-300">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-xl">
                <ShieldCheck className="w-7 h-7 stroke-[1.8]" />
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Client Milestone Approved</span>
                </div>
                <h4 className="text-sm font-semibold text-white mt-2">Tamper-Proof SHA-256 Sign-off</h4>
                <p className="text-xs text-zinc-400 max-w-sm">
                  Generates an immutable signature audit receipt with client name and exact timestamp. Zero disputes on scope freeze.
                </p>
              </div>
            </div>
          )}

          {/* Chapter Badge Overlay (Top Left of Video) */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded bg-black/80 border border-white/15 text-white backdrop-blur-md">
              {currentChapter.badge}
            </span>
          </div>
        </div>

        {/* Video Scrubber & Playback Bar */}
        <div className="p-4 bg-black space-y-3">
          {/* Progress Slider Track */}
          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const newProgress = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
              setProgress(newProgress);
              if (newProgress < 25) setActiveChapter(0);
              else if (newProgress < 50) setActiveChapter(1);
              else if (newProgress < 75) setActiveChapter(2);
              else setActiveChapter(3);
            }}
            className="w-full h-2 rounded-full bg-white/10 hover:h-2.5 transition-all cursor-pointer relative overflow-hidden"
          >
            <div
              className="h-full bg-white transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Control Buttons & Timestamps */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPlaying((p) => !p)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white text-white hover:text-black transition-colors cursor-pointer"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              </button>

              <button
                onClick={handleRestart}
                className="p-2 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title="Restart Walkthrough"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <span className="font-mono text-xs text-zinc-400">{timeFormatted}</span>
            </div>

            {/* Current Chapter Name */}
            <div className="text-right">
              <div className="text-xs font-semibold text-white">{currentChapter.title}</div>
              <div className="text-[11px] text-zinc-500 truncate max-w-sm">{currentChapter.summary}</div>
            </div>
          </div>

          {/* Interactive Chapter Quick Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/[0.08]">
            {CHAPTERS.map((ch, idx) => (
              <button
                key={ch.id}
                onClick={() => handleSelectChapter(idx)}
                className={`p-2 rounded-lg text-left transition-all border cursor-pointer ${
                  activeChapter === idx
                    ? "bg-white text-black border-white font-semibold"
                    : "bg-white/[0.03] border-white/10 text-zinc-400 hover:text-white hover:border-white/20"
                }`}
              >
                <div className="text-[10px] font-mono mb-0.5">{ch.timeRange}</div>
                <div className="text-xs truncate">{ch.title}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}