"use client";

import React, { useState, useEffect } from "react";
import { X, Check, Copy, ExternalLink, Cpu, RefreshCw, FileText } from "lucide-react";
import { Project } from "@/types";
import { getLinearExportUrl, getGitHubExportUrl } from "@/lib/export";
import { GitHubExportModal } from "./GitHubExportModal";

interface SprintDigestModalProps {
  project: Project;
  isOpen: boolean;
  theme?: "day" | "night";
  onClose: () => void;
}

export const SprintDigestModal: React.FC<SprintDigestModalProps> = ({
  project,
  isOpen,
  theme = "night",
  onClose,
}) => {
  const isDay = theme === "day";
  const [digest, setDigest] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showGitHubModal, setShowGitHubModal] = useState(false);

  const fetchDigest = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/ai/digest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareId: project.shareId }),
      });
      if (res.ok) {
        const data = await res.json();
        setDigest(data.digest || "No digest available.");
      } else {
        setDigest("Failed to generate sprint digest. Check network or API key.");
      }
    } catch {
      setDigest("Error connecting to Gemini AI service.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !digest) {
      fetchDigest();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(digest);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div
        className={`relative w-full max-w-2xl max-h-[85vh] rounded-2xl border shadow-2xl flex flex-col z-10 animate-in fade-in zoom-in-95 duration-200 ${
          isDay
            ? "bg-[#FBF9F4] border-stone-200 text-stone-900 shadow-stone-200/50"
            : "bg-[#0c0c0e] border-white/15 text-white shadow-black/80"
        }`}
      >
        <div className={`p-4 border-b flex items-center justify-between shrink-0 ${
          isDay ? "border-stone-200 bg-white" : "border-white/10 bg-[#070709]"
        }`}>
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-500" />
            <h2 className="font-sans font-semibold text-sm">AI Sprint Digest</h2>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              Gemini 3.8
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={fetchDigest}
              disabled={isLoading}
              title="Regenerate Digest"
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                isDay
                  ? "border-stone-200 hover:bg-stone-100 text-stone-600"
                  : "border-white/10 hover:bg-white/10 text-zinc-400 hover:text-white"
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </button>

            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                isDay
                  ? "border-stone-200 hover:bg-stone-100 text-stone-600"
                  : "border-white/10 hover:bg-white/10 text-zinc-400 hover:text-white"
              }`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 font-mono text-xs leading-relaxed space-y-4 no-scrollbar">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 text-zinc-500">
              <Cpu className="w-8 h-8 text-emerald-500 animate-pulse" />
              <p className="text-xs">Analyzing pins, DOM coordinates & device telemetry...</p>
            </div>
          ) : (
            <pre className="whitespace-pre-wrap font-mono text-xs break-words">
              {digest}
            </pre>
          )}
        </div>

        <div className={`p-4 border-t flex flex-wrap items-center justify-between gap-2 shrink-0 ${
          isDay ? "border-stone-200 bg-stone-50" : "border-white/10 bg-[#08080a]"
        }`}>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              disabled={isLoading}
              className={`px-3 py-1.5 rounded-lg border text-xs font-sans font-medium flex items-center gap-1.5 transition-colors cursor-pointer active:scale-[0.96] ${
                isDay
                  ? "border-stone-300 bg-white hover:bg-stone-100 text-stone-800"
                  : "border-white/15 bg-white/5 hover:bg-white/10 text-zinc-200"
              }`}
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? "Copied!" : "Copy Digest"}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={getLinearExportUrl(project)}
              target="_blank"
              rel="noopener noreferrer"
              className={`px-3 py-1.5 rounded-lg border text-xs font-sans font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                isDay
                  ? "border-stone-300 bg-white hover:bg-stone-100 text-stone-800"
                  : "border-white/15 bg-white/5 hover:bg-white/10 text-zinc-200"
              }`}
            >
              <span>Push to Linear</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>

            <button
              type="button"
              onClick={() => setShowGitHubModal(true)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-sans font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                isDay
                  ? "border-stone-300 bg-white hover:bg-stone-100 text-stone-800"
                  : "border-white/15 bg-white/5 hover:bg-white/10 text-zinc-200"
              }`}
            >
              <span>Push to GitHub</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </button>
          </div>
        </div>
      </div>

      <GitHubExportModal
        project={project}
        isOpen={showGitHubModal}
        isDay={isDay}
        onClose={() => setShowGitHubModal(false)}
      />
    </div>
  );
};
