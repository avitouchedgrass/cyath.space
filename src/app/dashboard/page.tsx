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
  Target,
  ShieldCheck,
  Check,
  Trash2,
  Search,
  BookOpen,
  ArrowUpRight,
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

  // Day / Night Theme State synced with localStorage
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
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { projects, createProject, deleteProject } = useReviewStore();

  // Initialize theme from localStorage or document attribute
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

  // Theme toggle
  const toggleTheme = () => {
    const next = theme === "night" ? "day" : "night";
    setTheme(next);
    localStorage.setItem("cyath_theme", next);
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", next);
    }
  };

  // Auth listener
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace("/login");
      } else {
        setCurrentUser(user);
        const savedAgency = (user.user_metadata?.agency_name as string) || "Cyath Drafting Atelier";
        setAgencyInput(savedAgency);
        setMounted(true);
      }
    });
  }, [router, supabase]);

  const handleSignOut = async () => {
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

    const agency = agencyInput.trim() || (currentUser?.user_metadata?.agency_name as string) || "Cyath Drafting Atelier";
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
    if (window.confirm(`Permanently remove staging canvas "${projectTitle}" and all associated pins?`)) {
      deleteProject(projectId);
      if (selectedPunchlistProject?.id === projectId) {
        setSelectedPunchlistProject(null);
      }
    }
  };

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // Status filter
      if (filterMode === "active" && p.isApproved) return false;
      if (filterMode === "approved" && !p.isApproved) return false;

      // Text query
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

  // Aggregate Telemetry
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
          isDay ? "bg-[#F5F3EC] text-[#736F66]" : "bg-[#141312] text-[#8E8A82]"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          <span>Synchronizing studio workbench...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-200 ${
        isDay ? "bg-[#F5F3EC] text-[#1C1A18]" : "bg-[#141312] text-[#F3F1EC]"
      }`}
      style={{
        backgroundImage: `radial-gradient(circle at center, ${
          isDay ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)"
        } 1px, transparent 1px)`,
        backgroundSize: "24px 24px",
      }}
    >
      {/* ── Top Drafting Header ── */}
      <header
        className={`h-14 border-b px-5 sm:px-8 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md transition-colors ${
          isDay ? "bg-[#FAF8F2]/90 border-black/10" : "bg-[#181716]/90 border-white/10"
        }`}
      >
        {/* Left: Cyath Logo & Studio Breadcrumb */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/" className="flex items-center">
            <CyathLogo theme={theme} />
          </Link>

          <span className={`text-xs ${isDay ? "text-black/30" : "text-white/30"}`}>/</span>

          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-mono uppercase tracking-[0.16em] px-2 py-0.5 rounded border ${
                isDay
                  ? "bg-black/5 text-[#736F66] border-black/10"
                  : "bg-white/5 text-[#8E8A82] border-white/10"
              }`}
            >
              STUDIO
            </span>
            <span
              className={`text-xs font-mono font-medium truncate max-w-[140px] sm:max-w-[220px] ${
                isDay ? "text-[#1C1A18]" : "text-[#F3F1EC]"
              }`}
            >
              {(currentUser?.user_metadata?.agency_name as string) || "Cyath Drafting Atelier"}
            </span>
          </div>
        </div>

        {/* Right: Studio Walkthrough, New Canvas, Day/Night Toggle, Account, Sign Out */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Studio Walkthrough Manual Button */}
          <button
            onClick={() => setShowWalkthrough(true)}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 border cursor-pointer ${
              isDay
                ? "bg-[#FAF8F2] text-[#1C1A18] border-black/15 hover:border-black/30 hover:bg-black/5 shadow-xs"
                : "bg-[#1E1D1B] text-[#F3F1EC] border-white/15 hover:border-white/30 hover:bg-white/5 shadow-xs"
            }`}
            title="Open Cyath Studio Walkthrough"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <span className="hidden sm:inline">Studio Walkthrough</span>
            <span className="sm:hidden">Guide</span>
          </button>

          {/* New Review Canvas Primary Action */}
          <button
            onClick={() => setShowCreateModal(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
              isDay
                ? "bg-[#1C1A18] text-[#FAF8F2] hover:bg-black"
                : "bg-[#F3F1EC] text-[#141312] hover:bg-white font-semibold"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Review Canvas</span>
            <span className="sm:hidden">New Canvas</span>
          </button>

          {/* Day / Night Mode Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle visual theme"
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              isDay
                ? "border-black/15 bg-black/5 text-[#1C1A18] hover:bg-black/10"
                : "border-white/15 bg-white/5 text-[#F3F1EC] hover:bg-white/10"
            }`}
            title={`Switch to ${isDay ? "Night" : "Day"} mode`}
          >
            {isDay ? <Moon className="w-3.5 h-3.5 text-[#1C1A18]" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
          </button>

          {/* User Email Pill */}
          {currentUser && (
            <div
              className={`hidden md:flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs font-mono ${
                isDay
                  ? "bg-black/5 border-black/10 text-[#736F66]"
                  : "bg-white/5 border-white/10 text-[#8E8A82]"
              }`}
            >
              <UserIcon className="w-3 h-3 text-amber-500" />
              <span className="truncate max-w-[150px]">{currentUser.email}</span>
            </div>
          )}

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            title="Sign out of studio session"
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              isDay
                ? "border-black/15 text-[#736F66] hover:text-red-600 hover:border-red-400/40 hover:bg-red-500/5"
                : "border-white/15 text-[#8E8A82] hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/10"
            }`}
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* ── Main Atelier Body ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-5 sm:p-8 lg:p-10 space-y-8">
        {/* Workspace Title & Intro */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6 border-black/10 dark:border-white/10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400 font-semibold">
                CYATH ARCHITECTURAL STAGING // WORKBENCH
              </span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                isDay ? "border-black/15 text-black/60 bg-black/5" : "border-white/15 text-white/60 bg-white/5"
              }`}>
                V1.0
              </span>
            </div>

            <h1
              className="text-2xl sm:text-3xl lg:text-4xl font-normal tracking-tight"
              style={{ fontFamily: "var(--font-serif, 'Oranienbaum', Georgia, serif)" }}
            >
              Active Review Canvases
            </h1>

            <p className={`text-xs sm:text-sm max-w-2xl ${isDay ? "text-[#736F66]" : "text-[#8E8A82]"}`}>
              Direct zero-login staging viewports. Pin DOM feedback with automatic hardware telemetry,
              track open punchlist items, and issue cryptographic milestone approval seals.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowWalkthrough(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all flex items-center gap-2 cursor-pointer ${
                isDay
                  ? "bg-[#FAF8F2] border-black/15 hover:border-black/30 text-[#1C1A18]"
                  : "bg-[#181716] border-white/15 hover:border-white/30 text-[#F3F1EC]"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-500" />
              <span>How Cyath Works (4-Step Guide)</span>
            </button>
          </div>
        </div>

        {/* ── 4 Telemetry Metrics Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Active Canvases */}
          <div
            className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
              isDay
                ? "bg-[#FAF8F2] border-black/10 shadow-xs"
                : "bg-[#181716] border-white/10 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.15em] mb-2">
              <span className={isDay ? "text-[#736F66]" : "text-[#8E8A82]"}>STG_CANVASES</span>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-mono font-semibold">{totalCanvases}</span>
              <span className={`text-[11px] ${isDay ? "text-[#736F66]" : "text-[#8E8A82]"}`}>mounted</span>
            </div>
          </div>

          {/* Card 2: Open Visual Pins */}
          <div
            className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
              isDay
                ? "bg-[#FAF8F2] border-black/10 shadow-xs"
                : "bg-[#181716] border-white/10 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.15em] mb-2">
              <span className={isDay ? "text-[#736F66]" : "text-[#8E8A82]"}>OPEN_PINS</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-mono font-semibold text-amber-600 dark:text-amber-400">
                {totalOpen}
              </span>
              <span className={`text-[11px] ${isDay ? "text-[#736F66]" : "text-[#8E8A82]"}`}>pending review</span>
            </div>
          </div>

          {/* Card 3: Resolved Fixes */}
          <div
            className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
              isDay
                ? "bg-[#FAF8F2] border-black/10 shadow-xs"
                : "bg-[#181716] border-white/10 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.15em] mb-2">
              <span className={isDay ? "text-[#736F66]" : "text-[#8E8A82]"}>RESOLVED_FIXES</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                {totalResolved}
              </span>
              <span className={`text-[11px] ${isDay ? "text-[#736F66]" : "text-[#8E8A82]"}`}>closed</span>
            </div>
          </div>

          {/* Card 4: Milestone Sign-Offs */}
          <div
            className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
              isDay
                ? "bg-[#FAF8F2] border-black/10 shadow-xs"
                : "bg-[#181716] border-white/10 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.15em] mb-2">
              <span className={isDay ? "text-[#736F66]" : "text-[#8E8A82]"}>MILESTONE_SEALS</span>
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-mono font-semibold">{totalApproved}</span>
              <span className={`text-[11px] ${isDay ? "text-[#736F66]" : "text-[#8E8A82]"}`}>client signed</span>
            </div>
          </div>
        </div>

        {/* ── Filter Bar & Search ── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          {/* Status Filter Buttons */}
          <div
            className={`inline-flex items-center p-1 rounded-xl border text-xs font-mono self-start ${
              isDay ? "bg-[#FAF8F2] border-black/10" : "bg-[#181716] border-white/10"
            }`}
          >
            <button
              onClick={() => setFilterMode("all")}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                filterMode === "all"
                  ? isDay
                    ? "bg-[#1C1A18] text-[#FAF8F2] shadow-xs"
                    : "bg-[#F3F1EC] text-[#141312] shadow-xs font-semibold"
                  : isDay
                  ? "text-[#736F66] hover:text-[#1C1A18]"
                  : "text-[#8E8A82] hover:text-[#F3F1EC]"
              }`}
            >
              All Canvases ({projects.length})
            </button>

            <button
              onClick={() => setFilterMode("active")}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                filterMode === "active"
                  ? isDay
                    ? "bg-[#1C1A18] text-[#FAF8F2] shadow-xs"
                    : "bg-[#F3F1EC] text-[#141312] shadow-xs font-semibold"
                  : isDay
                  ? "text-[#736F66] hover:text-[#1C1A18]"
                  : "text-[#8E8A82] hover:text-[#F3F1EC]"
              }`}
            >
              Active Revisions ({projects.filter((p) => !p.isApproved).length})
            </button>

            <button
              onClick={() => setFilterMode("approved")}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                filterMode === "approved"
                  ? isDay
                    ? "bg-[#1C1A18] text-[#FAF8F2] shadow-xs"
                    : "bg-[#F3F1EC] text-[#141312] shadow-xs font-semibold"
                  : isDay
                  ? "text-[#736F66] hover:text-[#1C1A18]"
                  : "text-[#8E8A82] hover:text-[#F3F1EC]"
              }`}
            >
              Milestone Sealed ({totalApproved})
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
              placeholder="Filter by title, URL or studio..."
              className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border transition-all focus:outline-none ${
                isDay
                  ? "bg-[#FAF8F2] border-black/10 text-[#1C1A18] focus:border-black/30 placeholder-black/40"
                  : "bg-[#181716] border-white/10 text-[#F3F1EC] focus:border-white/30 placeholder-white/40"
              }`}
            />
          </div>
        </div>

        {/* ── Canvases Grid ── */}
        {filteredProjects.length === 0 ? (
          <div
            className={`rounded-2xl border-2 border-dashed p-10 sm:p-14 text-center space-y-4 ${
              isDay ? "border-black/15 bg-[#FAF8F2]/50" : "border-white/15 bg-[#181716]/50"
            }`}
          >
            <div className="w-10 h-10 mx-auto rounded-full border flex items-center justify-center border-amber-500/30 bg-amber-500/10 text-amber-500">
              <Target className="w-5 h-5" />
            </div>

            <div className="space-y-1">
              <h3
                className="text-lg font-medium"
                style={{ fontFamily: "var(--font-serif, 'Oranienbaum', Georgia, serif)" }}
              >
                No Staging Canvases Found
              </h3>
              <p className={`text-xs max-w-md mx-auto ${isDay ? "text-[#736F66]" : "text-[#8E8A82]"}`}>
                {searchQuery
                  ? "No review canvases match your search criteria. Clear filter to see all projects."
                  : "Initialize a review canvas with your staging URL to invite clients to pin feedback directly on the DOM."}
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowCreateModal(true)}
                className={`px-4 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all inline-flex items-center gap-1.5 ${
                  isDay ? "bg-[#1C1A18] text-[#FAF8F2] hover:bg-black" : "bg-[#F3F1EC] text-[#141312] hover:bg-white"
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Initialize First Staging Canvas</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProjects.map((project) => {
              const openPins = project.pins.filter((p) => p.status !== "resolved").length;
              const resolvedPins = project.pins.filter((p) => p.status === "resolved").length;
              const pinCount = project.pins.length;
              const percentResolved = pinCount > 0 ? Math.round((resolvedPins / pinCount) * 100) : 0;
              const batteryActiveSegments = pinCount > 0 ? Math.round((resolvedPins / pinCount) * 10) : 0;

              return (
                <div
                  key={project.id}
                  className={`rounded-2xl border transition-all duration-200 p-5 flex flex-col justify-between group hover:shadow-md ${
                    isDay
                      ? "bg-[#FAF8F2] border-black/10 hover:border-black/25"
                      : "bg-[#181716] border-white/10 hover:border-white/25"
                  }`}
                >
                  <div className="space-y-3.5">
                    {/* Badge Row: Agency Studio & Milestone Seal */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[10px] font-mono uppercase tracking-[0.15em] px-2 py-0.5 rounded border truncate max-w-[170px] ${
                          isDay
                            ? "bg-black/5 text-[#736F66] border-black/10"
                            : "bg-white/5 text-[#8E8A82] border-white/10"
                        }`}
                      >
                        {project.agencyName}
                      </span>

                      {project.isApproved ? (
                        <span className="text-[10px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded flex items-center gap-1 flex-shrink-0">
                          <ShieldCheck className="w-3 h-3" />
                          MILESTONE SEALED
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded flex items-center gap-1 flex-shrink-0">
                          <Clock className="w-3 h-3" />
                          REVISIONS ACTIVE
                        </span>
                      )}
                    </div>

                    {/* Canvas Title */}
                    <div>
                      <h3
                        className="text-lg font-normal tracking-tight line-clamp-1"
                        style={{ fontFamily: "var(--font-serif, 'Oranienbaum', Georgia, serif)" }}
                        title={project.title}
                      >
                        {project.title}
                      </h3>

                      {/* Staging Target URL */}
                      <a
                        href={project.targetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={`mt-1 inline-flex items-center gap-1.5 text-xs font-mono truncate max-w-full transition-colors ${
                          isDay
                            ? "text-[#736F66] hover:text-[#1C1A18]"
                            : "text-[#8E8A82] hover:text-[#F3F1EC]"
                        }`}
                        title={project.targetUrl}
                      >
                        <Globe className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{project.targetUrl.replace(/^https?:\/\//, "")}</span>
                        <ArrowUpRight className="w-3 h-3 flex-shrink-0 opacity-60" />
                      </a>
                    </div>

                    {/* 10-Segment Battery Punchlist Gauge */}
                    <div
                      className={`p-3 rounded-xl border space-y-2 ${
                        isDay ? "bg-[#FFFFFF] border-black/10" : "bg-[#1E1D1B] border-white/10"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className={isDay ? "text-[#736F66]" : "text-[#8E8A82]"}>Punchlist Health</span>
                        <span className="font-semibold">{pinCount === 0 ? "No Pins" : `${percentResolved}% Resolved`}</span>
                      </div>

                      {/* 10 Battery Segments */}
                      <div className="grid grid-cols-10 gap-1 h-2">
                        {Array.from({ length: 10 }).map((_, i) => {
                          const isActive = i < batteryActiveSegments;
                          return (
                            <div
                              key={i}
                              className={`rounded-xs transition-colors ${
                                isActive
                                  ? "bg-emerald-500"
                                  : pinCount > 0
                                  ? isDay
                                    ? "bg-black/10"
                                    : "bg-white/10"
                                  : isDay
                                  ? "bg-black/5"
                                  : "bg-white/5"
                              }`}
                            />
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-mono pt-0.5">
                        <span className="text-amber-600 dark:text-amber-400">{openPins} open feedback</span>
                        <span className="text-emerald-600 dark:text-emerald-400">{resolvedPins} resolved fixes</span>
                      </div>
                    </div>

                    {/* Share Token Row */}
                    <div
                      className={`px-2.5 py-1.5 rounded-lg border flex items-center justify-between text-xs font-mono ${
                        isDay ? "bg-black/5 border-black/10 text-[#736F66]" : "bg-white/5 border-white/10 text-[#8E8A82]"
                      }`}
                    >
                      <span className="truncate text-[11px]">/r/{project.shareId}</span>
                      <button
                        onClick={() => handleCopyLink(project.shareId)}
                        className={`ml-2 px-2 py-0.5 rounded text-[10px] font-medium transition-all flex items-center gap-1 cursor-pointer border ${
                          copiedId === project.shareId
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                            : isDay
                            ? "bg-black/5 text-[#1C1A18] border-black/15 hover:bg-black/10"
                            : "bg-white/5 text-[#F3F1EC] border-white/15 hover:bg-white/10"
                        }`}
                        title="Copy direct share link for clients"
                      >
                        {copiedId === project.shareId ? (
                          <>
                            <Check className="w-2.5 h-2.5" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Share2 className="w-2.5 h-2.5" />
                            <span>Share</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div
                    className={`mt-4 pt-3.5 border-t flex items-center gap-2 ${
                      isDay ? "border-black/10" : "border-white/10"
                    }`}
                  >
                    {/* Open Canvas Link */}
                    <Link
                      href={`/r/${project.shareId}`}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium text-center flex items-center justify-center gap-1.5 transition-all ${
                        isDay
                          ? "bg-[#1C1A18] text-[#FAF8F2] hover:bg-black"
                          : "bg-[#F3F1EC] text-[#141312] hover:bg-white font-semibold"
                      }`}
                    >
                      <span>Open Canvas</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>

                    {/* Inspect Punchlist Drawer Trigger */}
                    <button
                      onClick={() => setSelectedPunchlistProject(project)}
                      className={`py-1.5 px-3 rounded-lg border text-xs font-mono transition-colors flex items-center gap-1.5 cursor-pointer ${
                        isDay
                          ? "border-black/15 bg-black/5 hover:bg-black/10 text-[#1C1A18]"
                          : "border-white/15 bg-white/5 hover:bg-white/10 text-[#F3F1EC]"
                      }`}
                      title="Inspect pin telemetry and export punchlist markdown"
                    >
                      <Target className="w-3.5 h-3.5 text-amber-500" />
                      <span>Inspect</span>
                    </button>

                    {/* Delete Project */}
                    <button
                      onClick={() => handleDeleteProject(project.id, project.title)}
                      className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                        isDay
                          ? "border-black/10 hover:border-red-400/40 text-black/40 hover:text-red-600 hover:bg-red-500/5"
                          : "border-white/10 hover:border-red-500/40 text-white/40 hover:text-red-400 hover:bg-red-500/10"
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

      {/* ── Modal: Initialize New Review Canvas ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className={`w-full max-w-md rounded-2xl border shadow-2xl p-6 sm:p-7 space-y-5 transition-all ${
              isDay
                ? "bg-[#FAF8F2] border-black/15 text-[#1C1A18]"
                : "bg-[#181716] border-white/15 text-[#F3F1EC]"
            }`}
          >
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400 font-semibold">
                CANVAS INITIALIZATION
              </span>
              <h3
                className="text-xl font-normal tracking-tight"
                style={{ fontFamily: "var(--font-serif, 'Oranienbaum', Georgia, serif)" }}
              >
                Create Staging Review Canvas
              </h3>
              <p className={`text-xs ${isDay ? "text-[#736F66]" : "text-[#8E8A82]"}`}>
                Mount any live staging or preview URL for direct client pinning without SDK code changes.
              </p>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className={`block text-xs font-mono uppercase tracking-wider mb-1.5 ${isDay ? "text-[#736F66]" : "text-[#8E8A82]"}`}>
                  Project Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Apex Global Brand Redesign"
                  className={`w-full rounded-xl border px-3.5 py-2 text-xs transition-colors focus:outline-none ${
                    isDay
                      ? "bg-[#FFFFFF] border-black/15 text-[#1C1A18] focus:border-black/40 placeholder-black/30"
                      : "bg-[#1E1D1B] border-white/15 text-[#F3F1EC] focus:border-white/40 placeholder-white/30"
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-mono uppercase tracking-wider mb-1.5 ${isDay ? "text-[#736F66]" : "text-[#8E8A82]"}`}>
                  Staging / Preview Target URL
                </label>
                <input
                  type="text"
                  required
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="staging.yourdomain.com or https://..."
                  className={`w-full rounded-xl border px-3.5 py-2 text-xs font-mono transition-colors focus:outline-none ${
                    isDay
                      ? "bg-[#FFFFFF] border-black/15 text-[#1C1A18] focus:border-black/40 placeholder-black/30"
                      : "bg-[#1E1D1B] border-white/15 text-[#F3F1EC] focus:border-white/40 placeholder-white/30"
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-mono uppercase tracking-wider mb-1.5 ${isDay ? "text-[#736F66]" : "text-[#8E8A82]"}`}>
                  Studio / Agency Attribution
                </label>
                <input
                  type="text"
                  value={agencyInput}
                  onChange={(e) => setAgencyInput(e.target.value)}
                  placeholder="e.g. North Creative Studio"
                  className={`w-full rounded-xl border px-3.5 py-2 text-xs transition-colors focus:outline-none ${
                    isDay
                      ? "bg-[#FFFFFF] border-black/15 text-[#1C1A18] focus:border-black/40 placeholder-black/30"
                      : "bg-[#1E1D1B] border-white/15 text-[#F3F1EC] focus:border-white/40 placeholder-white/30"
                  }`}
                />
              </div>

              {/* Informational drafting notice */}
              <div
                className={`p-3 rounded-xl border text-[11px] space-y-1 ${
                  isDay ? "bg-black/5 border-black/10 text-[#736F66]" : "bg-white/5 border-white/10 text-[#8E8A82]"
                }`}
              >
                <div className="font-mono font-medium flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Zero Client Account Barrier</span>
                </div>
                <p>
                  A tamper-resistant share token will be generated immediately. Clients can open the canvas on any
                  browser to drop visual notes without signing in.
                </p>
              </div>

              {/* Modal Buttons */}
              <div
                className={`flex items-center justify-end gap-2.5 pt-3 border-t ${
                  isDay ? "border-black/10" : "border-white/10"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className={`px-4 py-2 text-xs rounded-lg transition-colors cursor-pointer ${
                    isDay ? "text-[#736F66] hover:text-[#1C1A18]" : "text-[#8E8A82] hover:text-[#F3F1EC]"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!title.trim() || !targetUrl.trim()}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-40 ${
                    isDay
                      ? "bg-[#1C1A18] text-[#FAF8F2] hover:bg-black"
                      : "bg-[#F3F1EC] text-[#141312] hover:bg-white"
                  }`}
                >
                  Mount Review Canvas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
