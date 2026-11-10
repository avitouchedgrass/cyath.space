"use client";

import React, { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, CheckCircle2, Globe, Share2, Target, ShieldCheck } from "lucide-react";

interface StudioWalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: "night" | "day";
}

interface StepData {
  number: string;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  visualMock: {
    type: "url" | "token" | "telemetry" | "seal";
    label: string;
    detail: string;
  };
}

const STEPS: StepData[] = [
  {
    number: "01",
    badge: "STAGE SETUP",
    title: "Link Any Staging Build",
    subtitle: "Zero SDK installation or repository access required",
    description:
      "Paste your staging or preview deployment URL (Vercel, Netlify, Cloudflare, or local tunneling). Cyath mounts your live DOM within an isolated high-fidelity review viewport without altering your build code.",
    features: [
      "Zero packages added to client repository",
      "Preserves all staging security headers & cookies",
      "Instant setup in under 10 seconds",
    ],
    visualMock: {
      type: "url",
      label: "STAGING INTAKE",
      detail: "https://staging.yourdomain.com",
    },
  },
  {
    number: "02",
    badge: "CLIENT ACCESS",
    title: "One Zero-Login Share Token",
    subtitle: "No client passwords, signups, or extension downloads",
    description:
      "Clients review your work without creating accounts or downloading browser plugins. Each review canvas generates a direct, tamper-proof share token. Clients click the link and immediately see the site live.",
    features: [
      "Zero account creation barrier for clients",
      "Direct link with cryptographic session token",
      "Works on any desktop, tablet, or mobile browser",
    ],
    visualMock: {
      type: "token",
      label: "SHARE TOKEN GENERATED",
      detail: "/r/v1-client-freeze",
    },
  },
  {
    number: "03",
    badge: "CAPTURE ENGINE",
    title: "Click Anywhere to Pin Notes",
    subtitle: "Pixel coordinates & hardware telemetry captured automatically",
    description:
      "When a client clicks anywhere on your site to report a bug or suggest a revision, Cyath drops a persistent pin. The capture engine automatically records their exact viewport dimensions, device pixel ratio, browser version, and OS.",
    features: [
      "Exact x% and y% coordinates relative to DOM",
      "Hardware telemetry: Viewport, DPR, Browser & OS",
      "Scroll depth recorded at moment of note creation",
    ],
    visualMock: {
      type: "telemetry",
      label: "TELEMETRY CAPTURED",
      detail: "1440×900 • DPR 2.0 • Chrome 131 • macOS",
    },
  },
  {
    number: "04",
    badge: "FINAL SIGN-OFF",
    title: "Cryptographic Milestone Approval",
    subtitle: "One-click client sign-off with timestamped verification seal",
    description:
      "Eliminate endless email threads debating what was approved. Once all punchlist items are resolved, your client approves the site in one click. Cyath generates an immutable SHA-256 milestone certificate with exact signatory timestamp.",
    features: [
      "Single-click final design freeze approval",
      "SHA-256 cryptographic milestone fingerprint",
      "Downloadable audit receipt for agency records",
    ],
    visualMock: {
      type: "seal",
      label: "SEAL CERTIFIED",
      detail: "SHA-256: 8f92c10b77e4a11f2389d5bc40986e82",
    },
  },
];

export function StudioWalkthroughModal({ isOpen, onClose, theme }: StudioWalkthroughModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowRight") {
        setCurrentStep((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
      } else if (e.key === "ArrowLeft") {
        setCurrentStep((prev) => (prev > 0 ? prev - 1 : prev));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isDay = theme === "day";
  const step = STEPS[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-3xl rounded-2xl border shadow-2xl overflow-hidden transition-all flex flex-col max-h-[90vh] ${
          isDay
            ? "bg-[#FAF8F2] border-black/15 text-[#1C1A18] shadow-black/10"
            : "bg-[#0a0a0a] border-white/10 text-white shadow-black/80"
        }`}
      >
        {/* Header Bar */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between ${
            isDay ? "border-black/10 bg-[#F5F3EC]" : "border-white/10 bg-black"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] px-2 py-0.5 rounded border border-white/20 text-white bg-white/5">
              STUDIO WALKTHROUGH
            </span>
            <span className={`text-xs font-mono ${isDay ? "text-black/40" : "text-white/40"}`}>/</span>
            <span className={`text-xs font-mono font-medium ${isDay ? "text-black/70" : "text-white/70"}`}>
              Plate {step.number} of 04
            </span>
          </div>

          <button
            onClick={onClose}
            title="Close Walkthrough"
            className={`p-1.5 rounded-full border transition-colors cursor-pointer ${
              isDay
                ? "border-black/15 bg-white/70 hover:bg-white text-black"
                : "border-white/15 bg-white/5 hover:bg-white/10 text-white"
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Navigation Pill Strip */}
        <div
          className={`px-6 py-3 border-b grid grid-cols-4 gap-2 text-xs font-mono ${
            isDay ? "border-black/10 bg-[#FAF8F2]" : "border-white/10 bg-[#0a0a0a]"
          }`}
        >
          {STEPS.map((s, idx) => {
            const isActive = idx === currentStep;
            const isCompleted = idx < currentStep;

            return (
              <button
                key={s.number}
                onClick={() => setCurrentStep(idx)}
                className={`py-2 px-2.5 rounded-lg border text-left transition-all cursor-pointer truncate flex items-center justify-between ${
                  isActive
                    ? isDay
                      ? "bg-black text-white border-black font-semibold shadow-sm"
                      : "bg-white text-black border-white font-semibold shadow-sm"
                    : isCompleted
                    ? isDay
                      ? "bg-black/5 text-black border-black/20"
                      : "bg-white/5 text-white/80 border-white/20"
                    : isDay
                    ? "text-black/40 border-transparent hover:border-black/10"
                    : "text-white/40 border-transparent hover:border-white/10"
                }`}
              >
                <span className="truncate">
                  {s.number} {s.badge}
                </span>
                {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-1" />}
              </button>
            );
          })}
        </div>

        {/* Main Step Body */}
        <div className="p-6 sm:p-8 flex-1 overflow-y-auto space-y-6">
          <div className="space-y-1.5">
            <h2
              className="text-2xl sm:text-3xl font-normal tracking-[-0.02em]"
              style={{ fontFamily: "var(--font-serif, 'Oranienbaum', Georgia, serif)" }}
            >
              {step.title}
            </h2>
            <p className={`text-xs sm:text-sm font-medium ${isDay ? "text-black/60" : "text-white/60"}`}>
              {step.subtitle}
            </p>
          </div>

          <p className={`text-xs sm:text-sm leading-relaxed ${isDay ? "text-black/75" : "text-white/75"}`}>
            {step.description}
          </p>

          {/* Interactive Simulation Card */}
          <div
            className={`p-5 rounded-xl border space-y-3 ${
              isDay ? "bg-white border-black/15 shadow-sm" : "bg-[#141312] border-white/10 shadow-inner"
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-[#38BDF8] uppercase tracking-wider font-semibold">
                {step.visualMock.label}
              </span>
              <span className={`text-[10px] ${isDay ? "text-black/40" : "text-white/40"}`}>
                SIMULATION VIEWPORT
              </span>
            </div>

            <div
              className={`p-3.5 rounded-lg border font-mono text-xs flex items-center justify-between ${
                isDay ? "bg-[#FAF8F2] border-black/10 text-black" : "bg-black/40 border-white/10 text-white"
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                {step.visualMock.type === "url" && <Globe className="w-4 h-4 text-[#38BDF8] shrink-0" />}
                {step.visualMock.type === "token" && <Share2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                {step.visualMock.type === "telemetry" && <Target className="w-4 h-4 text-amber-400 shrink-0" />}
                {step.visualMock.type === "seal" && <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />}
                <span className="truncate">{step.visualMock.detail}</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0 ml-2">
                VERIFIED
              </span>
            </div>

            {/* Architectural Bullet Points */}
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
              {step.features.map((feature, i) => (
                <div
                  key={i}
                  className={`p-2.5 rounded-lg border text-[11px] flex items-start gap-2 ${
                    isDay ? "bg-[#F5F3EC]/70 border-black/10" : "bg-white/5 border-white/5"
                  }`}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] mt-1 shrink-0" />
                  <span className={`leading-tight ${isDay ? "text-black/75" : "text-white/75"}`}>
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Navigation Bar */}
        <div
          className={`px-6 py-4 border-t flex items-center justify-between ${
            isDay ? "border-black/10 bg-[#F5F3EC]" : "border-white/10 bg-[#141312]"
          }`}
        >
          <button
            onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
            disabled={currentStep === 0}
            className={`py-2 px-3.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
              isDay
                ? "border-black/15 bg-white hover:bg-black/5 text-black"
                : "border-white/15 bg-white/5 hover:bg-white/10 text-white"
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentStep
                    ? "w-6 bg-[#38BDF8]"
                    : isDay
                    ? "w-1.5 bg-black/20"
                    : "w-1.5 bg-white/20"
                }`}
              />
            ))}
          </div>

          {currentStep < STEPS.length - 1 ? (
            <button
              onClick={() => setCurrentStep((prev) => Math.min(STEPS.length - 1, prev + 1))}
              className={`py-2 px-4 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                isDay
                  ? "bg-black hover:bg-black/85 text-white"
                  : "bg-white hover:bg-white/90 text-black"
              }`}
            >
              <span>Next Plate</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="py-2 px-4 rounded-lg text-xs font-mono font-medium bg-emerald-500 hover:bg-emerald-600 text-black flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <span>Ready to Create</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

