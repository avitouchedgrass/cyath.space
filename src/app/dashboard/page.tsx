"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  ExternalLink,
  Share2,
  CheckCircle2,
  Globe,
  Clock,
  LogOut,
  User as UserIcon,
  Sun,
  Moon,
  Check,
  Trash2,
  Search,
  BookOpen,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import { useReviewStore } from "@/store/useReviewStore";
import { CyathLogo } from "@/components/common/Logo";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Project } from "@/types";
import { StudioWalkthroughModal } from "@/components/dashboard/StudioWalkthroughModal";
import { ProjectPunchlistDrawer } from "@/components/dashboard/ProjectPunchlistDrawer";

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [theme, setTheme] = useState<"night" | "day">("night");
  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [selectedPunchlistProject, setSelectedPunchlistProject] = useState<Project | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [agencyInput, setAgencyInput] = useState("");

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "active" | "approved">("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { projects, createProject, deleteProject } = useReviewStore();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("cyath_theme");
      if (savedTheme === "day" || savedTheme === "night") {
        setTheme(savedTheme);
        document.documentElement.setAttribute("data-theme", savedTheme);
      } else {
        const docTheme = document.documentElement.getAttribute("data-theme");
        if (docTheme === "day" || docTheme === "night") {
          setTheme(docTheme);
        }
      }
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "night" ? "day" : "night";
    setTheme(next);
    localStorage.setItem("cyath_theme", next);
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", next);
    }
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        const isGuest =
          typeof window !== "undefined" &&
          (localStorage.getItem("cyath_guest_session") === "true" ||
            new URLSearchParams(window.location.search).get("demo") === "true");

        if (isGuest) {
          setCurrentUser({
            id: "guest-atelier",
            email: "guest@atelier.cyath.space",
            user_metadata: { agency_name: "Cyath Atelier" },
            app_metadata: {},
            aud: "authenticated",
            created_at: new Date().toISOString(),
          } as User);
          setAgencyInput("Cyath Atelier");
          setMounted(true);
        } else {
          router.replace("/login");
        }
      } else {
        setCurrentUser(user);
        const savedAgency = (user.user_metadata?.agency_name as string) || "Cyath Atelier";
        setAgencyInput(savedAgency);
        setMounted(true);
      }
    });
  }, [router, supabase]);

  const handleSignOut = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("cyath_guest_session");
    }
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !targetUrl.trim()) return;

    let formattedUrl = targetUrl.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = "https://" + formattedUrl;
    }

    const agency = agencyInput.trim() || (currentUser?.user_metadata?.agency_name as string) || "Cyath Atelier";
    createProject(title.trim(), formattedUrl, agency);
    setTitle("");
    setTargetUrl("");
    setShowCreateModal(false);
  };

  const handleCopyLink = (shareId: string) => {
    if (typeof window !== "undefined") {
      const fullUrl = `${window.location.origin}/r/${shareId}`;
      navigator.clipboard.writeText(fullUrl);
      setCopiedId(shareId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleDeleteProject = (projectId: string, projectTitle: string) => {
    if (window.confirm(`Delete review canvas "${projectTitle}" and all its notes?`)) {
      deleteProject(projectId);
      if (selectedPunchlistProject?.id === projectId) {
        setSelectedPunchlistProject(null);
      }
    }
  };

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (filterMode === "active" && p.isApproved) return false;
      if (filterMode === "approved" && !p.isApproved) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(query);
        const matchesUrl = p.targetUrl.toLowerCase().includes(query);
        const matchesAgency = p.agencyName.toLowerCase().includes(query);
        return matchesTitle || matchesUrl || matchesAgency;
      }
      return true;
    });
  }, [projects, filterMode, searchQuery]);

  const totalCanvases = projects.length;
  const totalPins = projects.reduce((acc, p) => acc + p.pins.length, 0);
  const totalResolved = projects.reduce(
    (acc, p) => acc + p.pins.filter((pin) => pin.status === "resolved").length,
    0
  );
  const totalOpen = totalPins - totalResolved;
  const totalApproved = projects.filter((p) => p.isApproved).length;

  const isDay = theme === "day";

  if (!mounted) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center font-mono text-xs transition-colors duration-200 ${
          isDay ? "bg-[#F5F3EC] text-zinc-500" : "bg-black text-zinc-400"
        }`}
      >
        <span>Loading studio...</span>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-200 ${
        isDay ? "bg-[#F5F3EC] text-[#1C1A18]" : "bg-black text-[#FAFAFA]"
      }`}
      style={{
        fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* ── Top Header Bar ── */}
      <header
        className={`h-16 border-b px-6 sm:px-10 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md transition-colors ${
          isDay ? "bg-[#F5F3EC]/90 border-black/10" : "bg-black/90 border-white/[0.08]"
        }`}
      >
        {/* Left: Clean Brand Logo & Studio Name */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center">
            <CyathLogo theme={theme} />
          </Link>
          <span className={`text-xs ${isDay ? "text-black/30" : "text-white/20"}`}>/</span>
          <span
            className={`text-xs font-mono font-medium truncate max-w-[160px] sm:max-w-[240px] ${
              isDay ? "text-zinc-600" : "text-zinc-400"
            }`}
          >
            {(currentUser?.user_metadata?.agency_name as string) || "Studio"}
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Studio Walkthrough */}
          <button
            onClick={() => setShowWalkthrough(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors flex items-center gap-1.5 border cursor-pointer ${
              isDay
                ? "bg-white text-zinc-700 border-black/10 hover:border-black/25"
                : "bg-white/[0.03] text-zinc-300 border-white/10 hover:border-white/25 hover:text-white"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Guide</span>
          </button>

          {/* New Review Canvas Button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
              isDay
                ? "bg-[#1C1A18] text-white hover:bg-black"
                : "bg-white text-black hover:bg-zinc-200"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Canvas</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle visual theme"
            className={`p-2 rounded-full border transition-colors cursor-pointer ${
              isDay
                ? "border-black/15 bg-white/70 hover:bg-white text-[#1C1A18] shadow-sm"
                : "border-white/15 bg-black/40 hover:bg-black/70 text-zinc-300 hover:text-white shadow-sm"
            }`}
            title={`Switch to ${isDay ? "Night" : "Day"} mode`}
          >
            {isDay ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User Email */}
          {currentUser && (
            <span
              className={`hidden lg:inline-block text-xs font-mono truncate max-w-[180px] ${
                isDay ? "text-zinc-500" : "text-zinc-400"
              }`}
            >
              {currentUser.email}
            </span>
          )}

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            title="Sign out"
            className={`p-2 rounded-full border transition-colors cursor-pointer ${
              isDay
                ? "border-black/15 text-zinc-500 hover:text-red-600 hover:border-red-400/40"
                : "border-white/15 text-zinc-400 hover:text-red-400 hover:border-red-500/40"
            }`}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── Main Workspace Body ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-10 space-y-8">
        {/* Workspace Title & Intro */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b pb-6 border-black/10 dark:border-white/[0.08]">
          <div className="space-y-1.5">
            <h1
              className="text-3xl sm:text-4xl font-normal tracking-tight"
              style={{ fontFamily: "var(--font-serif, 'Oranienbaum', Georgia, serif)" }}
            >
              Review Canvases
            </h1>
            <p className={`text-xs sm:text-sm max-w-xl ${isDay ? "text-zinc-600" : "text-zinc-400"}`}>
              Send live staging links to clients. They click anywhere to pin notes with zero login required.
            </p>
          </div>
        </div>

        {/* ── Metric Strip ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div
            className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
              isDay ? "bg-white border-black/10 shadow-xs" : "bg-[#0a0a0a] border-white/[0.08]"
            }`}
          >
            <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">Total Canvases</span>
            <div className="text-2xl sm:text-3xl font-mono font-medium mt-1.5">{totalCanvases}</div>
          </div>

          <div
            className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
              isDay ? "bg-white border-black/10 shadow-xs" : "bg-[#0a0a0a] border-white/[0.08]"
            }`}
          >
            <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">Open Notes</span>
            <div className="text-2xl sm:text-3xl font-mono font-medium text-amber-500 mt-1.5">{totalOpen}</div>
          </div>

          <div
            className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
              isDay ? "bg-white border-black/10 shadow-xs" : "bg-[#0a0a0a] border-white/[0.08]"
            }`}
          >
            <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">Resolved</span>
            <div className="text-2xl sm:text-3xl font-mono font-medium text-zinc-300 mt-1.5">{totalResolved}</div>
          </div>

          <div
            className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
              isDay ? "bg-white border-black/10 shadow-xs" : "bg-[#0a0a0a] border-white/[0.08]"
            }`}
          >
            <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">Client Sign-Offs</span>
            <div className="text-2xl sm:text-3xl font-mono font-medium text-emerald-500 mt-1.5">{totalApproved}</div>
          </div>
        </div>

        {/* ── Filter Tabs & Search Bar ── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          {/* Status Tabs */}
          <div
            className={`inline-flex items-center p-1 rounded-xl border text-xs font-mono self-start ${
              isDay ? "bg-white border-black/10" : "bg-[#0a0a0a] border-white/[0.08]"
            }`}
          >
            <button
              onClick={() => setFilterMode("all")}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                filterMode === "all"
                  ? isDay
                    ? "bg-[#1C1A18] text-white"
                    : "bg-white/10 text-white font-medium"
                  : isDay
                  ? "text-zinc-600 hover:text-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              All ({projects.length})
            </button>

            <button
              onClick={() => setFilterMode("active")}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                filterMode === "active"
                  ? isDay
                    ? "bg-[#1C1A18] text-white"
                    : "bg-white/10 text-white font-medium"
                  : isDay
                  ? "text-zinc-600 hover:text-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              In Review ({projects.filter((p) => !p.isApproved).length})
            </button>

            <button
              onClick={() => setFilterMode("approved")}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                filterMode === "approved"
                  ? isDay
                    ? "bg-[#1C1A18] text-white"
                    : "bg-white/10 text-white font-medium"
                  : isDay
                  ? "text-zinc-600 hover:text-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Approved ({totalApproved})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search
              className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${
                isDay ? "text-black/40" : "text-white/40"
              }`}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects or URL..."
              className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border transition-all focus:outline-none ${
                isDay
                  ? "bg-white border-black/10 text-[#1C1A18] focus:border-black/30 placeholder-black/40"
                  : "bg-[#0a0a0a] border-white/10 text-[#F3F1EC] focus:border-white/30 placeholder-white/40"
              }`}
            />
          </div>
        </div>

        {/* ── Canvases Grid ── */}
        {filteredProjects.length === 0 ? (
          <div
            className={`rounded-2xl border border-dashed p-12 text-center space-y-4 ${
              isDay ? "border-black/15 bg-white/40" : "border-white/10 bg-[#0a0a0a]/40"
            }`}
          >
            <div className="space-y-1">
              <h3
                className="text-xl font-normal"
                style={{ fontFamily: "var(--font-serif, 'Oranienbaum', Georgia, serif)" }}
              >
                No Review Canvases
              </h3>
              <p className={`text-xs max-w-sm mx-auto ${isDay ? "text-zinc-500" : "text-zinc-400"}`}>
                {searchQuery
                  ? "No canvases match your search term. Clear the filter to show all."
                  : "Create your first canvas with any staging URL to start collecting client feedback."}
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowCreateModal(true)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all inline-flex items-center gap-1.5 ${
                  isDay ? "bg-[#1C1A18] text-white hover:bg-black" : "bg-white text-black hover:bg-zinc-200"
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Review Canvas</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => {
              const openPins = project.pins.filter((p) => p.status !== "resolved").length;
              const resolvedPins = project.pins.filter((p) => p.status === "resolved").length;
              const pinCount = project.pins.length;
              const percentResolved = pinCount > 0 ? Math.round((resolvedPins / pinCount) * 100) : 0;

              return (
                <div
                  key={project.id}
                  className={`rounded-2xl border transition-all duration-200 p-6 flex flex-col justify-between group ${
                    isDay
                      ? "bg-white border-black/10 hover:border-black/25 shadow-xs"
                      : "bg-[#0a0a0a] border-white/[0.08] hover:border-white/20 shadow-sm"
                  }`}
                >
                  <div className="space-y-4">
                    {/* Badge Row */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 truncate max-w-[180px]">
                        {project.agencyName}
                      </span>

                      {project.isApproved ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Approved
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-300 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          In Review
                        </span>
                      )}
                    </div>

                    {/* Canvas Title & Link */}
                    <div>
                      <h3
                        className={`text-base sm:text-lg font-medium tracking-tight line-clamp-1 ${
                          isDay ? "text-[#1C1A18]" : "text-white"
                        }`}
                        title={project.title}
                      >
                        {project.title}
                      </h3>

                      <a
                        href={project.targetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={`mt-1 inline-flex items-center gap-1.5 text-xs font-mono truncate max-w-full transition-colors ${
                          isDay ? "text-zinc-500 hover:text-black" : "text-zinc-400 hover:text-white"
                        }`}
                        title={project.targetUrl}
                      >
                        <Globe className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{project.targetUrl.replace(/^https?:\/\//, "")}</span>
                        <ArrowUpRight className="w-3 h-3 flex-shrink-0 opacity-60" />
                      </a>
                    </div>

                    {/* Minimal Progress Bar */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className={isDay ? "text-zinc-500" : "text-zinc-400"}>
                          {pinCount === 0 ? "No notes yet" : `${openPins} open · ${resolvedPins} resolved`}
                        </span>
                        <span className="font-medium text-xs font-mono">
                          {pinCount === 0 ? "—" : `${percentResolved}%`}
                        </span>
                      </div>
                      <div className={`h-1.5 w-full rounded-full overflow-hidden ${isDay ? "bg-black/5" : "bg-white/10"}`}>
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isDay ? "bg-black" : "bg-white"
                          }`}
                          style={{ width: `${percentResolved}%` }}
                        />
                      </div>
                    </div>

                    {/* Share Link Row */}
                    <div
                      className={`px-3 py-1.5 rounded-lg border flex items-center justify-between text-xs font-mono ${
                        isDay ? "bg-black/5 border-black/10 text-zinc-600" : "bg-white/[0.03] border-white/10 text-zinc-400"
                      }`}
                    >
                      <span className="truncate text-[11px]">/r/{project.shareId}</span>
                      <button
                        onClick={() => handleCopyLink(project.shareId)}
                        className="ml-2 hover:text-white transition-colors flex items-center gap-1 cursor-pointer text-xs"
                        title="Copy direct review link"
                      >
                        {copiedId === project.shareId ? (
                          <span className="text-emerald-500 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>Copied</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-zinc-400 hover:text-white">
                            <Share2 className="w-3 h-3" />
                            <span>Share</span>
                          </span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div
                    className={`mt-5 pt-4 border-t flex items-center gap-2 ${
                      isDay ? "border-black/10" : "border-white/[0.08]"
                    }`}
                  >
                    <Link
                      href={`/r/${project.shareId}`}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold text-center flex items-center justify-center gap-1.5 transition-all ${
                        isDay ? "bg-[#1C1A18] text-white hover:bg-black" : "bg-white text-black hover:bg-zinc-200"
                      }`}
                    >
                      <span>Open Canvas</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>

                    <button
                      onClick={() => setSelectedPunchlistProject(project)}
                      className={`py-2 px-3 rounded-lg border text-xs font-mono transition-colors cursor-pointer ${
                        isDay
                          ? "border-black/15 bg-white hover:bg-black/5 text-[#1C1A18]"
                          : "border-white/10 bg-white/[0.03] hover:bg-white/10 text-[#FAFAFA]"
                      }`}
                      title="Inspect notes and export audit"
                    >
                      <span>Notes ({pinCount})</span>
                    </button>

                    <button
                      onClick={() => handleDeleteProject(project.id, project.title)}
                      className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                        isDay
                          ? "border-black/10 hover:border-red-400/40 text-black/40 hover:text-red-600"
                          : "border-white/10 hover:border-red-500/40 text-white/40 hover:text-red-400"
                      }`}
                      title="Delete review canvas"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── Studio Walkthrough Modal ── */}
      <StudioWalkthroughModal
        isOpen={showWalkthrough}
        onClose={() => setShowWalkthrough(false)}
        theme={theme}
      />

      {/* ── Project Punchlist Drawer ── */}
      <ProjectPunchlistDrawer
        project={selectedPunchlistProject}
        onClose={() => setSelectedPunchlistProject(null)}
        theme={theme}
      />

      {/* ── Modal: Create Review Canvas ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className={`w-full max-w-md rounded-2xl border shadow-2xl p-6 sm:p-7 space-y-5 transition-all ${
              isDay ? "bg-white border-black/15 text-[#1C1A18]" : "bg-[#0a0a0a] border-white/10 text-white"
            }`}
          >
            <div className="space-y-1">
              <h3
                className="text-xl font-normal tracking-tight"
                style={{ fontFamily: "var(--font-serif, 'Oranienbaum', Georgia, serif)" }}
              >
                Create Review Canvas
              </h3>
              <p className={`text-xs ${isDay ? "text-zinc-500" : "text-zinc-400"}`}>
                Enter any staging or preview URL to start collecting client feedback.
              </p>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className={`block text-xs font-mono uppercase tracking-wider mb-1.5 ${isDay ? "text-zinc-600" : "text-zinc-400"}`}>
                  Project Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Acme Website Redesign"
                  className={`w-full rounded-xl border px-3.5 py-2 text-xs transition-colors focus:outline-none ${
                    isDay
                      ? "bg-black/5 border-black/15 text-[#1C1A18] focus:border-black/40 placeholder-black/30"
                      : "bg-white/5 border-white/10 text-white focus:border-white/30 placeholder-white/30"
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-mono uppercase tracking-wider mb-1.5 ${isDay ? "text-zinc-600" : "text-zinc-400"}`}>
                  Staging URL
                </label>
                <input
                  type="text"
                  required
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="staging.yourdomain.com or https://..."
                  className={`w-full rounded-xl border px-3.5 py-2 text-xs font-mono transition-colors focus:outline-none ${
                    isDay
                      ? "bg-black/5 border-black/15 text-[#1C1A18] focus:border-black/40 placeholder-black/30"
                      : "bg-white/5 border-white/10 text-white focus:border-white/30 placeholder-white/30"
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-mono uppercase tracking-wider mb-1.5 ${isDay ? "text-zinc-600" : "text-zinc-400"}`}>
                  Studio Name
                </label>
                <input
                  type="text"
                  value={agencyInput}
                  onChange={(e) => setAgencyInput(e.target.value)}
                  placeholder="e.g. North Studio"
                  className={`w-full rounded-xl border px-3.5 py-2 text-xs transition-colors focus:outline-none ${
                    isDay
                      ? "bg-black/5 border-black/15 text-[#1C1A18] focus:border-black/40 placeholder-black/30"
                      : "bg-white/5 border-white/10 text-white focus:border-white/30 placeholder-white/30"
                  }`}
                />
              </div>

              <div
                className={`flex items-center justify-end gap-2.5 pt-3 border-t ${
                  isDay ? "border-black/10" : "border-white/10"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className={`px-4 py-2 text-xs rounded-lg transition-colors cursor-pointer ${
                    isDay ? "text-zinc-500 hover:text-black" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!title.trim() || !targetUrl.trim()}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-40 ${
                    isDay ? "bg-[#1C1A18] text-white hover:bg-black" : "bg-white text-black hover:bg-zinc-200"
                  }`}
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
