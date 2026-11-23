"use client";

import React, { useState, useEffect } from "react";
import { X, ExternalLink, Check, Copy, AlertCircle, Loader2 } from "lucide-react";
import { Project, Pin } from "@/types";
import { exportProjectAsMarkdown, exportPinAsMarkdown, getGitHubExportUrl } from "@/lib/export";

interface GitHubExportModalProps {
  project: Project;
  pin?: Pin | null;
  isOpen: boolean;
  onClose: () => void;
  isDay?: boolean;
}

export const GitHubExportModal: React.FC<GitHubExportModalProps> = ({
  project,
  pin,
  isOpen,
  onClose,
  isDay = false,
}) => {
  const [repo, setRepo] = useState("");
  const [pat, setPat] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdIssueUrl, setCreatedIssueUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [showTokenInput, setShowTokenInput] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved =
        localStorage.getItem(`cyath_github_repo_${project.shareId || project.id}`) ||
        localStorage.getItem("cyath_github_repo") ||
        "";
      if (saved) setRepo(saved);
      const savedPat = localStorage.getItem("cyath_github_pat") || "";
      if (savedPat) setPat(savedPat);
    }
  }, [project.shareId, project.id]);

  if (!isOpen) return null;

  const cleanRepo = repo
    .trim()
    .replace(/^https?:\/\/github\.com\//, "")
    .replace(/\.git$/, "")
    .replace(/\/$/, "");

  const title = pin
    ? `[Pin #${pin.number}] ${pin.comments?.[0]?.content?.slice(0, 60) || "Feedback item"}`
    : `Staging Feedback: ${project.title || "Review Session"}`;

  const bodyMarkdown = pin
    ? exportPinAsMarkdown(pin, project)
    : exportProjectAsMarkdown(project);

  const saveRepoToStorage = (val: string) => {
    if (typeof window !== "undefined" && val.trim()) {
      localStorage.setItem("cyath_github_repo", val.trim());
      if (project.shareId) {
        localStorage.setItem(`cyath_github_repo_${project.shareId}`, val.trim());
      }
    }
  };

  const handleOpenPreFilled = () => {
    if (!cleanRepo || !cleanRepo.includes("/")) {
      setErrorMessage("Please enter a valid repository in 'owner/repo' format (e.g. vercel/next.js).");
      return;
    }
    setErrorMessage(null);
    saveRepoToStorage(cleanRepo);

    const issueUrl = `https://github.com/${cleanRepo}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(bodyMarkdown)}&labels=feedback,staging`;
    window.open(issueUrl, "_blank", "noopener,noreferrer");
    onClose();
  };

  const handleCreateDirectly = async () => {
    if (!cleanRepo || !cleanRepo.includes("/")) {
      setErrorMessage("Please enter a valid repository in 'owner/repo' format.");
      return;
    }
    if (!pat.trim()) {
      setErrorMessage("Personal Access Token (PAT) is required for 1-click API creation.");
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);
    saveRepoToStorage(cleanRepo);
    localStorage.setItem("cyath_github_pat", pat.trim());

    try {
      const res = await fetch(`https://api.github.com/repos/${cleanRepo}/issues`, {
        method: "POST",
        headers: {
          Authorization: `token ${pat.trim()}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          body: bodyMarkdown,
          labels: ["feedback", "staging"],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || `GitHub returned HTTP ${res.status}`);
      }

      setCreatedIssueUrl(data.html_url);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to create issue. Check token permissions (needs 'repo' scope).");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(bodyMarkdown);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl relative transition-all ${
          isDay
            ? "bg-white border-stone-200 text-stone-900 shadow-stone-300/40"
            : "bg-[#0b0c10] border-white/15 text-white shadow-black/90"
        }`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-inherit">
          <div className="flex items-center gap-2.5">
            <svg
              className="w-5 h-5 fill-current"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              />
            </svg>
            <div>
              <h2 className="text-base font-semibold font-sans tracking-tight">
                {pin ? `Push Pin #${pin.number} to GitHub` : "Push Feedback to GitHub"}
              </h2>
              <p className={`text-xs ${isDay ? "text-stone-500" : "text-zinc-400"}`}>
                Auto-formats DOM selectors, screen telemetry, and resolution hooks
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDay ? "hover:bg-stone-100 text-stone-500" : "hover:bg-white/10 text-zinc-400"
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {createdIssueUrl ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">GitHub Issue Created Successfully</h3>
              <p className={`text-xs mt-1 ${isDay ? "text-stone-600" : "text-zinc-400"}`}>
                Closing this issue on GitHub will automatically resolve the pin on this canvas.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <a
                href={createdIssueUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <span>View Issue on GitHub</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={onClose}
                className={`px-4 py-2 rounded-lg border text-xs font-medium transition-colors ${
                  isDay ? "border-stone-200 hover:bg-stone-100" : "border-white/10 hover:bg-white/5"
                }`}
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Form View */
          <div className="py-4 space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium mb-1.5">
                Target GitHub Repository <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="owner/repo (e.g. acme/storefront)"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                className={`w-full px-3.5 py-2 rounded-lg text-xs font-mono border outline-none transition-colors ${
                  isDay
                    ? "bg-stone-50 border-stone-300 text-stone-900 focus:border-stone-500"
                    : "bg-white/[0.04] border-white/15 text-white focus:border-white/40"
                }`}
              />
              <p className={`text-[11px] mt-1 font-sans ${isDay ? "text-stone-500" : "text-zinc-400"}`}>
                Enter the repository where your engineering team tracks tickets.
              </p>
            </div>

            <div>
              <button
                type="button"
                onClick={() => setShowTokenInput((v) => !v)}
                className={`text-xs font-sans underline cursor-pointer ${
                  isDay ? "text-stone-600 hover:text-stone-900" : "text-zinc-400 hover:text-white"
                }`}
              >
                {showTokenInput ? "Hide 1-Click API Token" : "Use GitHub Token (1-click create without opening tabs)"}
              </button>

              {showTokenInput && (
                <div className="mt-2.5 p-3 rounded-xl border border-dashed border-inherit space-y-2 bg-inherit">
                  <label className="block text-[11px] font-medium">
                    Personal Access Token (with `repo` scope)
                  </label>
                  <input
                    type="password"
                    placeholder="ghp_xxxxxxxxxxxx"
                    value={pat}
                    onChange={(e) => setPat(e.target.value)}
                    className={`w-full px-3 py-1.5 rounded-lg text-xs font-mono border outline-none ${
                      isDay
                        ? "bg-white border-stone-300 text-stone-900"
                        : "bg-black border-white/15 text-white"
                    }`}
                  />
                  <p className={`text-[10px] ${isDay ? "text-stone-400" : "text-zinc-500"}`}>
                    Token is kept locally in your browser session for direct API calls.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 border-t border-inherit">
              <button
                type="button"
                onClick={handleCopy}
                className={`px-3 py-2 rounded-lg border text-xs font-sans flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  isDay
                    ? "border-stone-200 hover:bg-stone-100 text-stone-700"
                    : "border-white/10 hover:bg-white/5 text-zinc-300"
                }`}
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? "Copied Markdown" : "Copy Markdown"}</span>
              </button>

              <div className="flex items-center gap-2">
                {showTokenInput && pat.trim() ? (
                  <button
                    type="button"
                    onClick={handleCreateDirectly}
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-initial px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <span>Create Issue via API</span>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleOpenPreFilled}
                    className="flex-1 sm:flex-initial px-4 py-2 rounded-lg bg-white text-black hover:bg-zinc-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Open in GitHub</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
