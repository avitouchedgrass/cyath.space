"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, ExternalLink, Share2, CheckCircle2, Globe, Clock } from "lucide-react";
import { useReviewStore } from "@/store/useReviewStore";
import { CyathLogo } from "@/components/common/Logo";

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { projects, createProject } = useReviewStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !targetUrl.trim()) return;

    let formattedUrl = targetUrl.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = "https://" + formattedUrl;
    }

    createProject(title.trim(), formattedUrl);
    setTitle("");
    setTargetUrl("");
    setShowModal(false);
  };

  const handleCopyLink = (shareId: string) => {
    if (typeof window !== "undefined") {
      const fullUrl = `${window.location.origin}/r/${shareId}`;
      navigator.clipboard.writeText(fullUrl);
      setCopiedId(shareId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center text-xs text-[#A1A1AA] font-mono">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col">
      {/* Topbar */}
      <header className="h-14 border-b border-[#27272A] bg-[#121215] px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/">
            <CyathLogo size={24} showWordmark={true} />
          </Link>
          <span className="text-xs text-[#52525B]">/</span>
          <span className="text-xs text-[#A1A1AA]">Agency Staging Hub</span>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-3.5 py-1.5 rounded-lg bg-[#F59E0B] hover:bg-[#D97706] text-[#09090B] font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Review Canvas</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 sm:p-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#FAFAFA] mb-1">
              Active Staging Canvases
            </h1>
            <p className="text-xs text-[#A1A1AA]">
              Send one link to clients. Pin feedback directly on your builds without accounts.
            </p>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project) => {
            const openPins = project.pins.filter((p) => p.status !== "resolved").length;
            const resolvedPins = project.pins.filter((p) => p.status === "resolved").length;

            return (
              <div
                key={project.id}
                className="bg-[#121215] border border-[#27272A] hover:border-[#3F3F46] rounded-2xl p-5 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#A1A1AA] bg-[#18181B] px-2 py-0.5 rounded border border-[#27272A]">
                      {project.agencyName}
                    </span>
                    {project.isApproved ? (
                      <span className="text-[10px] font-semibold text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded border border-[#10B981]/20 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Approved
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-[#F59E0B] bg-[#F59E0B]/10 px-2 py-0.5 rounded border border-[#F59E0B]/20 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        In Review
                      </span>
                    )}
                  </div>

                  <h3 className="font-semibold text-base text-[#FAFAFA] mb-1.5 truncate">
                    {project.title}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs text-[#A1A1AA] mb-4 truncate font-mono">
                    <Globe className="w-3 h-3 text-[#52525B]" />
                    <span className="truncate">{project.targetUrl}</span>
                  </div>

                  {/* Pin Stats */}
                  <div className="bg-[#18181B] border border-[#27272A] rounded-xl p-3 mb-5 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[#A1A1AA] block text-[10px]">Open Feedback</span>
                      <span className="font-bold text-sm text-[#F59E0B]">{openPins} pins</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[#A1A1AA] block text-[10px]">Resolved</span>
                      <span className="font-bold text-sm text-[#10B981]">{resolvedPins} done</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-[#27272A]">
                  <Link
                    href={`/r/${project.shareId}`}
                    className="flex-1 py-2 px-3 rounded-lg bg-[#18181B] hover:bg-[#27272A] text-xs font-semibold text-center text-[#FAFAFA] flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Open Canvas</span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#A1A1AA]" />
                  </Link>

                  <button
                    onClick={() => handleCopyLink(project.shareId)}
                    className="py-2 px-3 rounded-lg border border-[#27272A] hover:border-[#3F3F46] bg-[#121215] text-xs text-[#A1A1AA] hover:text-[#FAFAFA] flex items-center gap-1 transition-colors"
                    title="Copy client share link"
                  >
                    <Share2 className="w-3.5 h-3.5 text-[#F59E0B]" />
                    <span>{copiedId === project.shareId ? "Copied!" : "Link"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Modal: New Project */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#09090B]/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#121215] border border-[#27272A] rounded-2xl shadow-2xl p-6 text-[#FAFAFA] relative">
            <h3 className="font-semibold text-base text-[#FAFAFA] mb-1">
              Create New Staging Review
            </h3>
            <p className="text-xs text-[#A1A1AA] mb-4">
              Enter your project name and the staging URL to review.
            </p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                  Project Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Urban Roast Cafe - Redesign V2"
                  className="w-full bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-xs text-[#FAFAFA] focus:outline-none focus:border-[#F59E0B]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#A1A1AA] mb-1">
                  Staging / Preview Website URL
                </label>
                <input
                  type="text"
                  required
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="https://staging.yourclient.com"
                  className="w-full bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-xs text-[#FAFAFA] focus:outline-none focus:border-[#F59E0B]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#27272A]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs text-[#A1A1AA] hover:text-[#FAFAFA]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!title.trim() || !targetUrl.trim()}
                  className="px-4 py-2 rounded-lg bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-50 text-[#09090B] font-semibold text-xs transition-colors"
                >
                  Create Canvas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

