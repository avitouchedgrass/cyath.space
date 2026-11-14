"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, ArrowRight, ArrowLeft, Check, Sliders, ShieldCheck } from "lucide-react";
import { TesseractMark } from "@/components/common/Logo";
import { useTheme } from "@/lib/theme";

export interface TourStep {
  id: string;
  badge: string;
  title: string;
  content: string;
  selector?: string;
  placement: "center" | "bottom" | "right" | "top";
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    badge: "Overview",
    title: "Welcome to Cyath",
    content:
      "Cyath gives you and your clients a frictionless review cockpit. Clients click anywhere on live URLs, PDFs, or images to drop hardware-anchored pins with exact browser and viewport telemetry attached.",
    placement: "center",
  },
  {
    id: "intake",
    badge: "Intake Bar",
    title: "Live Proxy & Asset Upload",
    content:
      "Paste any deployed staging URL (e.g. preview.acmecorp.com) or drop an image or PDF. Cyath provisions a client-ready interactive review canvas in seconds.",
    selector: "#tour-create-card",
    placement: "bottom",
  },
  {
    id: "canvases",
    badge: "Canvases",
    title: "Review Canvases & Milestones",
    content:
      "Inspect all active review sessions. Each card displays real-time open note tallies, live viewfinder previews, and 1-click client share links.",
    selector: "#tour-projects-section",
    placement: "bottom",
  },
  {
    id: "navigation",
    badge: "Navigation",
    title: "Workspace Rail",
    content:
      "Seamlessly switch between project canvases, configure firm details, generate API keys for AI coding agents, and customize your preferences.",
    selector: "#tour-sidebar",
    placement: "right",
  },
  {
    id: "pro",
    badge: "AI Agent Sync",
    title: "Pro Milestones & MCP Server",
    content:
      "Connect Cursor, Claude Code, or Codex directly to your reviews with our MCP server. Autonomous agents read client notes and ship patches in one command.",
    selector: "#tour-sidebar-plans",
    placement: "right",
  },
];

export function openDashboardTour() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("cyath-open-tour"));
  }
}

export function DashboardTour() {
  const { theme, isDay } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const currentStep = TOUR_STEPS[stepIndex];

  const updateTargetRect = useCallback(() => {
    if (!currentStep.selector) {
      setTargetRect(null);
      return;
    }
    const el = document.querySelector(currentStep.selector);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
      // Smoothly scroll target element into viewport if outside
      if (rect.top < 40 || rect.bottom > window.innerHeight - 40) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    } else {
      setTargetRect(null);
    }
  }, [currentStep]);

  useEffect(() => {
    const handleOpen = () => {
      setStepIndex(0);
      setIsOpen(true);
    };

    window.addEventListener("cyath-open-tour", handleOpen);

    // Auto-check for startTour query param
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("startTour") === "1") {
        setStepIndex(0);
        setIsOpen(true);
        const url = new URL(window.location.href);
        url.searchParams.delete("startTour");
        window.history.replaceState({}, "", url.pathname + (url.search ? url.search : ""));
      }
    }

    return () => {
      window.removeEventListener("cyath-open-tour", handleOpen);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    updateTargetRect();

    const handleResize = () => updateTargetRect();
    const handleScroll = () => updateTargetRect();
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen, stepIndex, updateTargetRect]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeTour();
      } else if (e.key === "ArrowRight" || (e.key === "Enter" && !e.shiftKey)) {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleBack();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, stepIndex]);

  const closeTour = () => {
    setIsOpen(false);
    try {
      localStorage.setItem("cyath_guide_seen", "true");
      window.dispatchEvent(new CustomEvent("cyath-tour-complete"));
    } catch {}
  };

  const handleNext = () => {
    if (stepIndex < TOUR_STEPS.length - 1) {
      setStepIndex((prev) => prev + 1);
    } else {
      closeTour();
    }
  };

  const handleBack = () => {
    if (stepIndex > 0) {
      setStepIndex((prev) => prev - 1);
    }
  };

  if (!isOpen) return null;

  // Compute Card Positioning
  const cardWidth = 400;
  const cardHeight = 250;
  let cardStyle: React.CSSProperties = {};

  if (currentStep.placement === "center" || !targetRect) {
    cardStyle = {
      position: "fixed",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
      width: `min(${cardWidth}px, calc(100vw - 32px))`,
      zIndex: 100000,
    };
  } else if (currentStep.placement === "bottom") {
    const left = Math.max(16, Math.min(window.innerWidth - cardWidth - 16, targetRect.left + (targetRect.width - cardWidth) / 2));
    const top = Math.min(window.innerHeight - cardHeight - 20, targetRect.bottom + 16);
    cardStyle = {
      position: "fixed",
      left: `${left}px`,
      top: `${top}px`,
      width: `min(${cardWidth}px, calc(100vw - 32px))`,
      zIndex: 100000,
    };
  } else if (currentStep.placement === "right") {
    const left = Math.min(window.innerWidth - cardWidth - 20, targetRect.right + 20);
    const top = Math.max(20, Math.min(window.innerHeight - cardHeight - 20, targetRect.top + (targetRect.height - cardHeight) / 2));
    cardStyle = {
      position: "fixed",
      left: `${left}px`,
      top: `${top}px`,
      width: `min(${cardWidth}px, calc(100vw - 32px))`,
      zIndex: 100000,
    };
  }

  return (
    <div className="fixed inset-0 z-[99990] overflow-hidden select-none animate-in fade-in duration-200">
      {/* Dark Ambient Spotlight Mask Overlay */}
      <svg className="fixed inset-0 w-full h-full pointer-events-none z-[99991]">
        <defs>
          <mask id="cyath-tour-mask">
            <rect width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left - 6}
                y={targetRect.top - 6}
                width={targetRect.width + 12}
                height={targetRect.height + 12}
                rx="16"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill={isDay ? "rgba(28, 25, 23, 0.45)" : "rgba(0, 0, 0, 0.78)"}
          mask="url(#cyath-tour-mask)"
          className="backdrop-blur-[2px] transition-all duration-300 pointer-events-auto cursor-pointer"
          onClick={closeTour}
        />
      </svg>

      {/* Target Element High-Contrast Spotlight Ring */}
      {targetRect && (
        <div
          style={{
            position: "fixed",
            left: `${targetRect.left - 6}px`,
            top: `${targetRect.top - 6}px`,
            width: `${targetRect.width + 12}px`,
            height: `${targetRect.height + 12}px`,
          }}
          className={`pointer-events-none z-[99995] rounded-2xl transition-all duration-300 ring-2 ${
            isDay
              ? "ring-stone-900 shadow-[0_0_35px_rgba(0,0,0,0.25)]"
              : "ring-white shadow-[0_0_40px_rgba(255,255,255,0.35)]"
          }`}
        />
      )}

      {/* Interactive Floating Tour Card */}
      <div
        ref={cardRef}
        style={cardStyle}
        onClick={(e) => e.stopPropagation()}
        className={`p-6 rounded-2xl border shadow-2xl backdrop-blur-2xl transition-all duration-300 animate-in zoom-in-95 font-sans ${
          isDay
            ? "bg-white/98 border-stone-300 text-stone-900 shadow-[0_25px_60px_rgba(0,0,0,0.18)]"
            : "bg-[#0c0c0e]/98 border-white/20 text-white shadow-[0_25px_60px_rgba(0,0,0,0.9)]"
        }`}
      >
        {/* Top Header Row */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <TesseractMark size={18} className={isDay ? "text-stone-900" : "text-white"} />
            <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full border ${
              isDay
                ? "bg-stone-100 border-stone-200 text-stone-700"
                : "bg-white/5 border-white/10 text-zinc-300"
            }`}>
              {currentStep.badge}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <span className={`text-[11px] font-mono ${isDay ? "text-stone-500" : "text-zinc-500"}`}>
              {stepIndex + 1} of {TOUR_STEPS.length}
            </span>
            <button
              onClick={closeTour}
              className={`p-1 rounded-lg transition-colors cursor-pointer ${
                isDay ? "text-stone-400 hover:text-stone-900 hover:bg-stone-100" : "text-zinc-500 hover:text-white hover:bg-white/10"
              }`}
              title="Close Guide"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="space-y-2 mb-6">
          <h3 className="font-sans font-bold text-base tracking-tight">
            {currentStep.title}
          </h3>
          <p className={`text-xs leading-relaxed ${isDay ? "text-stone-600 font-medium" : "text-zinc-400 font-normal"}`}>
            {currentStep.content}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={closeTour}
            className={`text-xs font-mono transition-colors cursor-pointer ${
              isDay ? "text-stone-400 hover:text-stone-800" : "text-zinc-500 hover:text-white"
            }`}
          >
            Skip Tour
          </button>

          <div className="flex items-center gap-2">
            {stepIndex > 0 && (
              <button
                onClick={handleBack}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium border transition-all duration-150 active:scale-[0.96] cursor-pointer ${
                  isDay
                    ? "border-stone-300 text-stone-700 hover:bg-stone-100"
                    : "border-white/15 text-zinc-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                Back
              </button>
            )}

            <button
              onClick={handleNext}
              className={`px-4 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all duration-150 active:scale-[0.96] flex items-center gap-1.5 shadow-md cursor-pointer ${
                isDay
                  ? "bg-stone-900 text-white hover:bg-stone-800 shadow-stone-300"
                  : "bg-white text-black hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
              }`}
            >
              <span>{stepIndex === TOUR_STEPS.length - 1 ? "Got It" : "Next"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
