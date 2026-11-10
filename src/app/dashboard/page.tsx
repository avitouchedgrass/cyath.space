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
  UploadCloud,
  FileText,
  Image as ImageIcon,
  LayoutGrid,
  Columns3,
  SlidersHorizontal,
  ChevronDown,
  Layers,
  MessageSquare,
} from "lucide-react";
import { useReviewStore } from "@/store/useReviewStore";
import { CyathLogo, TesseractMark } from "@/components/common/Logo";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Project } from "@/types";
import { StudioWalkthroughModal } from "@/components/dashboard/StudioWalkthroughModal";
import { ProjectPunchlistDrawer } from "@/components/dashboard/ProjectPunchlistDrawer";
import { AccountSettingsModal } from "@/components/dashboard/AccountSettingsModal";
import { StudioUpgradeModal } from "@/components/dashboard/StudioUpgradeModal";

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [theme, setTheme] = useState<"night" | "day">("night");
  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPunchlistProject, setSelectedPunchlistProject] = useState<Project | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [quickUrl, setQuickUrl] = useState("");
  const [agencyInput, setAgencyInput] = useState("");

  // Views & Filtering
  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const [activeNav, setActiveNav] = useState<"overview" | "canvases">("overview");
  const [searchQuery, setSearchQuery] = useState("");
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

    if (projects.length >= 1) {
      setShowCreateModal(false);
      setShowUpgradeModal(true);
      return;
    }

    let formattedUrl = targetUrl.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = "https://" + formattedUrl;
    }

    const agency = agencyInput.trim() || (currentUser?.user_metadata?.agency_name as string) || "Cyath Atelier";
    createProject(title.trim(), formattedUrl, agency, "url");
    setTitle("");
    setTargetUrl("");
    setShowCreateModal(false);
  };

  const handleQuickUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickUrl.trim()) return;

    if (projects.length >= 1) {
      setShowUpgradeModal(true);
      return;
    }

    let formattedUrl = quickUrl.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = "https://" + formattedUrl;
    }

    let parsedTitle = "Staging Review";
    try {
      const hostname = new URL(formattedUrl).hostname.replace(/^www\./, "");
      parsedTitle = hostname.charAt(0).toUpperCase() + hostname.slice(1);
    } catch {
      parsedTitle = "Web Review";
    }

    const agency = agencyInput.trim() || (currentUser?.user_metadata?.agency_name as string) || "Cyath Atelier";
    const shareId = createProject(parsedTitle, formattedUrl, agency, "url");
    setQuickUrl("");
    router.push(`/r/${shareId}`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (projects.length >= 1) {
      setShowUpgradeModal(true);
      return;
    }

    const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
    const assetType = isPdf ? "pdf" : "image";
    const reader = new FileReader();

    reader.onload = () => {
      const dataUrl = reader.result as string;
      const title = file.name.replace(/\.[^/.]+$/, "");
      const agency = agencyInput.trim() || (currentUser?.user_metadata?.agency_name as string) || "Cyath Atelier";
      const shareId = createProject(title, dataUrl, agency, assetType);
      // For uploaded images/PDFs: NEVER pass massive base64 in query string!
      router.push(`/r/${shareId}`);
    };

    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleUpdateAgencyName = async (newName: string) => {
    setAgencyInput(newName);
    if (currentUser) {
      setCurrentUser({
        ...currentUser,
        user_metadata: {
          ...currentUser.user_metadata,
          agency_name: newName,
        },
      });
      try {
        await supabase.auth.updateUser({
          data: { agency_name: newName },
        });
      } catch {
        // Fallback
      }
    }
  };

  const handleCopyLink = (shareId: string) => {
    if (typeof window !== "undefined") {
      const fullUrl = `${window.location.origin}/r/${shareId}`;
      navigator.clipboard.writeText(fullUrl);
      setCopiedId(shareId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const getCanvasHref = (project: Project) => {
    return `/r/${project.shareId}`;
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
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(query);
        const matchesUrl = p.targetUrl.toLowerCase().includes(query);
        const matchesAgency = p.agencyName.toLowerCase().includes(query);
        return matchesTitle || matchesUrl || matchesAgency;
      }
      return true;
    });
  }, [projects, searchQuery]);

  // Kanban Columns matching Workflow.design
  const inProgressProjects = useMemo(
    () => filteredProjects.filter((p) => !p.isApproved && p.pins.length === 0),
    [filteredProjects]
  );
  const readyForReviewProjects = useMemo(
    () => filteredProjects.filter((p) => !p.isApproved && p.pins.length > 0),
    [filteredProjects]
  );
  const approvedProjects = useMemo(
    () => filteredProjects.filter((p) => p.isApproved),
    [filteredProjects]
  );

  const isDay = theme === "day";

  if (!mounted) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center font-mono text-xs transition-colors duration-200 ${
          isDay ? "bg-[#F5F3EC] text-zinc-500" : "bg-black text-zinc-400"
        }`}
      >
        <span>Loading workspace...</span>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex transition-colors duration-200 relative ${
        isDay ? "bg-[#F5F3EC] text-[#1C1A18]" : "bg-black text-[#FAFAFA]"
      }`}
    >
      {/* ══════════════════════════════════════════════════════════════════
           LEFT SIDEBAR (Atelier Navigation)
           ══════════════════════════════════════════════════════════════════ */}
      <aside
        className={`w-64 border-r flex flex-col justify-between shrink-0 select-none z-30 transition-colors ${
          isDay ? "bg-[#ECE8DD] border-black/10" : "bg-[#09090b] border-white/[0.08]"
        }`}
      >
        {/* Top: Studio Switcher & Navigation */}
        <div className="p-4 space-y-6">
          {/* Workspace / Studio Header */}
          <div
            onClick={() => setShowAccountModal(true)}
            className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
              isDay
                ? "bg-white/80 border-black/10 hover:border-black/20"
                : "bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.05]"
            }`}
            title="Studio Account & Profile"
          >
            <div className="flex items-center gap-2.5 truncate">
              <TesseractMark size={26} className="shrink-0" />
              <div className="truncate">
                <div className="text-xs font-serif font-medium tracking-wide truncate leading-tight text-white">
                  {agencyInput || "Cyath Atelier"}
                </div>
                <div className="text-[9px] font-mono tracking-widest text-zinc-400 flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>ATELIER · ACTIVE</span>
                </div>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-500 shrink-0 ml-1" />
          </div>

          {/* Primary Nav Links */}
          <nav className="space-y-1.5 text-xs font-medium">
            <button
              onClick={() => setActiveNav("overview")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all cursor-pointer text-left ${
                activeNav === "overview"
                  ? isDay
                    ? "bg-black/10 text-black border border-black/20 font-medium"
                    : "bg-white/[0.08] text-white border border-white/15 backdrop-blur-md shadow-xs font-medium"
                  : isDay
                  ? "text-zinc-600 hover:bg-black/5"
                  : "text-zinc-400 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <Columns3 className="w-4 h-4 text-zinc-300" />
              <span className="font-sans">Overview</span>
              <span className="ml-auto font-mono text-[9px] text-zinc-500">01</span>
            </button>

            <button
              onClick={() => setActiveNav("canvases")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all cursor-pointer text-left ${
                activeNav === "canvases"
                  ? isDay
                    ? "bg-black/10 text-black border border-black/20 font-medium"
                    : "bg-white/[0.08] text-white border border-white/15 backdrop-blur-md shadow-xs font-medium"
                  : isDay
                  ? "text-zinc-600 hover:bg-black/5"
                  : "text-zinc-400 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <LayoutGrid className="w-4 h-4 text-zinc-300" />
              <span className="font-sans">All Canvases</span>
              <span className="ml-auto font-mono text-[10px] text-zinc-400 px-1.5 py-0.5 rounded border border-white/10 bg-white/5">
                {projects.length}
              </span>
            </button>
          </nav>

          {/* Projects / Canvases Quick Section */}
          <div className="pt-2">
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">
                PROJECTS
              </span>
              <button
                onClick={() => {
                  if (projects.length >= 1) {
                    setShowUpgradeModal(true);
                  } else {
                    setShowCreateModal(true);
                  }
                }}
                className={`p-1 rounded hover:bg-white/10 transition-colors text-zinc-400 hover:text-white cursor-pointer`}
                title="Create new canvas"
                aria-label="Create new canvas"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-0.5">
              {projects.length === 0 ? (
                <div className="px-3 py-2 text-[11px] font-mono text-zinc-500 italic">
                  No projects yet
                </div>
              ) : (
                projects.map((p) => (
                  <Link
                    key={p.id}
                    href={getCanvasHref(p)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs truncate transition-colors ${
                      isDay
                        ? "text-zinc-700 hover:bg-black/5"
                        : "text-zinc-400 hover:bg-white/[0.04] hover:text-white"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        p.isApproved
                          ? "bg-emerald-400"
                          : p.pins.length > 0
                          ? "bg-zinc-200"
                          : "bg-zinc-600"
                      }`}
                    />
                    <span className="truncate font-sans">{p.title}</span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Bottom: Plan Meter, Settings, Sign Out */}
        <div className="p-4 space-y-3 border-t border-white/[0.08]">
          {/* Plan Meter */}
          <div
            className={`p-3.5 rounded-xl border ${
              isDay ? "bg-white/60 border-black/10" : "bg-white/[0.02] border-white/10"
            }`}
          >
            <div className="flex items-center justify-between text-[10px] font-mono tracking-wider mb-2">
              <span className="text-zinc-400 uppercase">Studio Capacity</span>
              <span className="text-zinc-300 font-semibold">
                {projects.length} / 1
              </span>
            </div>
            <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden mb-3">
              <div
                className={`h-full transition-all duration-300 ${
                  projects.length >= 1 ? "bg-white w-full" : "bg-white/40 w-0"
                }`}
              />
            </div>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="w-full py-1.5 px-3 rounded-lg text-[10px] font-mono tracking-wider uppercase bg-white hover:bg-zinc-200 text-black font-semibold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>Studio Pro Access</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
            <button
              onClick={() => setShowWalkthrough(true)}
              className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer py-1 px-1.5 rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40"
              title="Studio Guide"
              aria-label="Studio Guide"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="font-mono text-[11px]">Guide</span>
            </button>

            <button
              onClick={toggleTheme}
              className="hover:text-white transition-colors p-1.5 rounded cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40"
              title="Toggle theme"
              aria-label="Toggle theme"
            >
              {isDay ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={handleSignOut}
              className="hover:text-red-400 transition-colors p-1.5 rounded cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-400/40"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════════════════════
           MAIN CONTENT AREA (Workflow.design Board & Grid)
           ══════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto relative bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px]">
        {/* Top Header */}
        <header
          className={`h-16 border-b px-8 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md transition-colors ${
            isDay ? "bg-[#F5F3EC]/90 border-black/10" : "bg-black/90 border-white/[0.08]"
          }`}
        >
          {/* Title */}
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-2xl font-normal tracking-tight text-white">
              {activeNav === "overview" ? "Overview" : "All Canvases"}
            </h1>
            <span
              className={`text-[10px] font-mono tracking-widest px-2.5 py-0.5 rounded-full border ${
                isDay
                  ? "bg-black/5 border-black/10 text-zinc-600"
                  : "bg-white/5 border-white/10 text-zinc-400"
              }`}
            >
              [ 0{projects.length} {projects.length === 1 ? "CANVAS ACTIVE" : "CANVASES ACTIVE"} ]
            </span>
          </div>

          {/* Controls: Search, View Mode, New Canvas */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Filter staging canvases..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-48 sm:w-64 pl-8 pr-3 py-1.5 rounded-xl border text-xs font-mono transition-all outline-none ${
                  isDay
                    ? "bg-white border-black/15 focus:border-black text-[#1C1A18]"
                    : "bg-white/[0.03] border-white/10 focus:border-white/30 text-white placeholder-zinc-500"
                }`}
              />
            </div>

            {/* View Toggle */}
            <div
              className={`p-0.5 rounded-xl border flex items-center ${
                isDay ? "bg-white border-black/15" : "bg-white/[0.03] border-white/10"
              }`}
            >
              <button
                onClick={() => setViewMode("board")}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === "board"
                    ? isDay
                      ? "bg-black/10 text-black font-semibold"
                      : "bg-white/15 text-white shadow-xs"
                    : "text-zinc-500 hover:text-white"
                }`}
                title="Kanban Board view"
                aria-label="Kanban Board view"
              >
                <Columns3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === "list"
                    ? isDay
                      ? "bg-black/10 text-black font-semibold"
                      : "bg-white/15 text-white shadow-xs"
                    : "text-zinc-500 hover:text-white"
                }`}
                title="Grid / List view"
                aria-label="Grid / List view"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* New Canvas Action */}
            <button
              onClick={() => {
                if (projects.length >= 1) {
                  setShowUpgradeModal(true);
                } else {
                  setShowCreateModal(true);
                }
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono tracking-wide font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                isDay
                  ? "bg-[#1C1A18] text-white hover:bg-black"
                  : "bg-white text-black hover:bg-zinc-200"
              }`}
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.2]" />
              <span>NEW CANVAS</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="p-8 space-y-8 flex-1">
          {/* ── Staging Intake Console (Architectural Terminal) ── */}
          <div
            className={`p-5 rounded-2xl border transition-all relative overflow-hidden ${
              isDay
                ? "bg-white/80 border-black/10 shadow-xs"
                : "bg-[#09090c] border-white/[0.1] shadow-lg"
            }`}
          >
            {/* Terminal Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">
                  // STAGING INTAKE TERMINAL
                </span>
              </div>
              <span className="font-mono text-[10px] text-zinc-500 tracking-wider">
                DEPLOYMENT MATRIX · V2.4
              </span>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-3">
              {/* Quick URL Input */}
              <form onSubmit={handleQuickUrlSubmit} className="flex-1 flex items-center gap-2 w-full">
                <div className="relative flex-1">
                  <Globe className="w-3.5 h-3.5 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Enter staging site URL (e.g. https://staging.client.com)"
                    value={quickUrl}
                    onChange={(e) => setQuickUrl(e.target.value)}
                    className={`w-full pl-10 pr-28 py-2.5 rounded-xl border text-xs font-mono transition-all outline-none ${
                      isDay
                        ? "bg-black/[0.02] border-black/15 focus:border-black text-[#1C1A18]"
                        : "bg-black/60 border-white/10 focus:border-white/30 text-white placeholder-zinc-500 shadow-inner"
                    }`}
                  />
                  <span className="hidden sm:inline-block absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[9px] text-zinc-500 pointer-events-none">
                    ↵ RETURN
                  </span>
                </div>
                <button
                  type="submit"
                  disabled={!quickUrl.trim()}
                  className={`px-4 py-2.5 rounded-xl text-xs font-mono font-semibold tracking-wide transition-all whitespace-nowrap cursor-pointer disabled:opacity-30 ${
                    isDay
                      ? "bg-black text-white hover:bg-zinc-800"
                      : "bg-white text-black hover:bg-zinc-200"
                  }`}
                >
                  INITIALIZE CANVAS
                </button>
              </form>

              <div className="hidden md:block w-px h-7 bg-white/10" />

              {/* Upload Image/PDF File */}
              <label
                className={`w-full md:w-auto px-4 py-2.5 rounded-xl border text-xs font-mono flex items-center justify-center gap-2 transition-all cursor-pointer focus-within:ring-2 focus-within:ring-white/40 focus-within:border-white/40 ${
                  isDay
                    ? "border-black/15 bg-black/[0.02] hover:bg-black/5 text-[#1C1A18]"
                    : "border-white/10 bg-black/60 hover:bg-white/5 text-zinc-300 hover:text-white"
                }`}
                title="Drop image or PDF to review"
              >
                <UploadCloud className="w-3.5 h-3.5 text-zinc-400" />
                <span>UPLOAD ASSET</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  className="sr-only"
                />
              </label>
            </div>
          </div>

          {/* ── View: Kanban Columns (Workflow.design Mode) ── */}
          {viewMode === "board" ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              {/* Column 1: In Progress */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-zinc-500" />
                    <span className="text-xs font-medium text-zinc-400">In Progress</span>
                    <span className="font-mono text-[10px] text-zinc-600">
                      ({inProgressProjects.length})
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {inProgressProjects.length === 0 ? (
                    <div
                      className={`p-6 rounded-xl border border-dashed text-center text-xs text-zinc-500 font-mono ${
                        isDay ? "border-black/10" : "border-white/10"
                      }`}
                    >
                      No draft canvases
                    </div>
                  ) : (
                    inProgressProjects.map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        isDay={isDay}
                        copiedId={copiedId}
                        onCopyLink={handleCopyLink}
                        onSelectPunchlist={setSelectedPunchlistProject}
                        onDelete={handleDeleteProject}
                        getCanvasHref={getCanvasHref}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Column 2: Ready for Review */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="text-xs font-medium text-zinc-300">Ready for Review</span>
                    <span className="font-mono text-[10px] text-zinc-500">
                      ({readyForReviewProjects.length})
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {readyForReviewProjects.length === 0 ? (
                    <div
                      className={`p-6 rounded-xl border border-dashed text-center text-xs text-zinc-500 font-mono ${
                        isDay ? "border-black/10" : "border-white/10"
                      }`}
                    >
                      No active review canvases
                    </div>
                  ) : (
                    readyForReviewProjects.map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        isDay={isDay}
                        copiedId={copiedId}
                        onCopyLink={handleCopyLink}
                        onSelectPunchlist={setSelectedPunchlistProject}
                        onDelete={handleDeleteProject}
                        getCanvasHref={getCanvasHref}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Column 3: Approved */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-xs font-medium text-zinc-400">Approved</span>
                    <span className="font-mono text-[10px] text-zinc-600">
                      ({approvedProjects.length})
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {approvedProjects.length === 0 ? (
                    <div
                      className={`p-6 rounded-xl border border-dashed text-center text-xs text-zinc-500 font-mono ${
                        isDay ? "border-black/10" : "border-white/10"
                      }`}
                    >
                      No approved canvases yet
                    </div>
                  ) : (
                    approvedProjects.map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        isDay={isDay}
                        copiedId={copiedId}
                        onCopyLink={handleCopyLink}
                        onSelectPunchlist={setSelectedPunchlistProject}
                        onDelete={handleDeleteProject}
                        getCanvasHref={getCanvasHref}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* ── View: Grid Mode ── */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.length === 0 ? (
                <div
                  className={`col-span-full p-12 rounded-2xl border border-dashed text-center font-mono text-xs text-zinc-500 ${
                    isDay ? "border-black/15" : "border-white/10"
                  }`}
                >
                  No review canvases found matching your search.
                </div>
              ) : (
                filteredProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    isDay={isDay}
                    copiedId={copiedId}
                    onCopyLink={handleCopyLink}
                    onSelectPunchlist={setSelectedPunchlistProject}
                    onDelete={handleDeleteProject}
                    getCanvasHref={getCanvasHref}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </main>

      {/* ── Modals & Drawers ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div
            className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl relative ${
              isDay ? "bg-white border-black/15 text-[#1C1A18]" : "bg-[#09090b] border-white/15 text-white"
            }`}
          >
            <h3 className="font-serif text-xl font-normal text-white mb-1">New Review Canvas</h3>
            <p className="text-xs text-zinc-400 font-mono tracking-wider mb-5">
              Mount any live site URL or upload an asset to generate an instant zero-login client review link.
            </p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">Canvas Title</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Studio Landing Page"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-xl border text-xs font-mono transition-all outline-none ${
                    isDay
                      ? "bg-black/[0.02] border-black/15 focus:border-black text-[#1C1A18]"
                      : "bg-black border-white/15 focus:border-white text-white"
                  }`}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">Staging URL</label>
                <input
                  type="text"
                  placeholder="e.g. https://staging.acmestudio.com"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-xl border text-xs font-mono transition-all outline-none ${
                    isDay
                      ? "bg-black/[0.02] border-black/15 focus:border-black text-[#1C1A18]"
                      : "bg-black border-white/15 focus:border-white text-white"
                  }`}
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-mono text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={!title.trim() || !targetUrl.trim()}
                  className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold tracking-wider transition-all cursor-pointer disabled:opacity-30 ${
                    isDay ? "bg-black text-white hover:bg-zinc-800" : "bg-white text-black hover:bg-zinc-200"
                  }`}
                >
                  CREATE CANVAS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showWalkthrough && (
        <StudioWalkthroughModal
          isOpen={showWalkthrough}
          onClose={() => setShowWalkthrough(false)}
          theme={theme}
        />
      )}

      {showAccountModal && (
        <AccountSettingsModal
          user={currentUser}
          agencyName={agencyInput}
          onUpdateAgencyName={handleUpdateAgencyName}
          onSignOut={handleSignOut}
          onOpenUpgrade={() => {
            setShowAccountModal(false);
            setShowUpgradeModal(true);
          }}
          onClose={() => setShowAccountModal(false)}
        />
      )}

      {showUpgradeModal && <StudioUpgradeModal onClose={() => setShowUpgradeModal(false)} />}

      {selectedPunchlistProject && (
        <ProjectPunchlistDrawer
          project={selectedPunchlistProject}
          theme={theme}
          onClose={() => setSelectedPunchlistProject(null)}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// PROJECT CARD COMPONENT (Workflow.design Aesthetic)
// ══════════════════════════════════════════════════════════════════
interface ProjectCardProps {
  project: Project;
  isDay: boolean;
  copiedId: string | null;
  onCopyLink: (shareId: string) => void;
  onSelectPunchlist: (project: Project) => void;
  onDelete: (id: string, title: string) => void;
  getCanvasHref: (project: Project) => string;
}

function ProjectCard({
  project,
  isDay,
  copiedId,
  onCopyLink,
  onSelectPunchlist,
  onDelete,
  getCanvasHref,
}: ProjectCardProps) {
  const pinCount = project.pins.length;
  const resolvedCount = project.pins.filter((p) => p.status === "resolved").length;
  const openCount = pinCount - resolvedCount;

  return (
    <div
      className={`group rounded-2xl border transition-all duration-200 flex flex-col overflow-hidden relative ${
        isDay
          ? "bg-white border-black/10 hover:border-black/25 shadow-xs"
          : "bg-[#0a0a0d] border-white/[0.08] hover:border-white/25 shadow-md"
      }`}
    >
      {/* ── Visual Blueprint Thumbnail Preview ── */}
      <Link href={getCanvasHref(project)} className="block relative w-full h-36 bg-[#000000] overflow-hidden border-b border-white/[0.08] group-hover:border-white/20 transition-colors">
        {project.assetType === "image" ? (
          <img
            src={project.targetUrl}
            alt={project.title}
            className="w-full h-full object-cover object-top opacity-85 group-hover:opacity-100 group-hover:scale-[1.02] transition-all duration-300"
          />
        ) : project.assetType === "pdf" ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-b from-zinc-950 to-black text-center relative">
            <FileText className="w-7 h-7 text-zinc-400 mb-2 stroke-[1.5]" />
            <span className="text-xs font-serif font-medium text-zinc-200 truncate max-w-[90%]">
              {project.title}.pdf
            </span>
            <span className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase mt-1">
              ARCHIVAL PDF CANVAS
            </span>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col bg-[#050507] relative">
            {/* Blueprint grid lines */}
            <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
            
            {/* Mock drafting top bar */}
            <div className="h-6 bg-[#08080a] border-b border-white/[0.06] px-3 flex items-center justify-between z-10">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80" />
                <span className="text-[9px] font-mono tracking-wider text-zinc-500 uppercase">
                  VIEWPORT 1440×900
                </span>
              </div>
              <span className="text-[9px] font-mono text-zinc-500 truncate max-w-[140px]">
                {project.targetUrl.replace(/^https?:\/\//, "")}
              </span>
            </div>

            {/* Viewport content */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 text-center z-10 group-hover:bg-white/[0.02] transition-colors">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                <TesseractMark size={16} />
              </div>
              <span className="text-xs font-serif font-medium text-zinc-200 tracking-wide truncate max-w-[90%]">
                {project.title}
              </span>
              <span className="text-[9px] font-mono text-zinc-500 tracking-wider truncate max-w-[180px] mt-0.5">
                {project.targetUrl}
              </span>
            </div>
          </div>
        )}

        {/* Status Pill Badge floating in thumbnail */}
        <div className="absolute top-2.5 right-2.5 z-10">
          {project.isApproved ? (
            <span className="text-[10px] font-mono tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center gap-1.5 backdrop-blur-md">
              <CheckCircle2 className="w-3 h-3" />
              APPROVED
            </span>
          ) : pinCount > 0 ? (
            <span className="text-[10px] font-mono tracking-wider px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-zinc-200 flex items-center gap-1.5 backdrop-blur-md">
              <MessageSquare className="w-3 h-3 text-zinc-400" />
              {openCount} {openCount === 1 ? "NOTE" : "NOTES"}
            </span>
          ) : (
            <span className="text-[10px] font-mono tracking-wider px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-400 backdrop-blur-md">
              IN PROGRESS
            </span>
          )}
        </div>
      </Link>

      {/* ── Card Body ── */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Studio Tag & Asset Type */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-zinc-300">
              {project.assetType ? project.assetType.toUpperCase() : "WEB"}
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 truncate max-w-[140px]">
              {project.agencyName}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-serif text-base font-normal tracking-wide truncate text-white leading-snug" title={project.title}>
            {project.title}
          </h3>

          {/* URL or Asset Subtext */}
          <p className="text-[11px] font-mono text-zinc-500 truncate mt-0.5" title={project.targetUrl}>
            {project.assetType === "image" || project.assetType === "pdf"
              ? `Uploaded ${project.assetType.toUpperCase()} Canvas`
              : project.targetUrl}
          </p>
        </div>

        {/* ── Actions Row ── */}
        <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center gap-2">
          {/* Direct Open Canvas Link */}
          <Link
            href={getCanvasHref(project)}
            className="flex-1 py-1.5 px-3 rounded-xl text-xs font-mono font-medium tracking-wide text-center flex items-center justify-center gap-1.5 bg-white text-black hover:bg-zinc-200 transition-all cursor-pointer shadow-xs"
          >
            <span>OPEN CANVAS</span>
            <ExternalLink className="w-3 h-3" />
          </Link>

          {/* Copy Share Link */}
          <button
            onClick={() => onCopyLink(project.shareId)}
            className={`py-1.5 px-2.5 rounded-xl border text-xs font-mono transition-colors flex items-center gap-1 cursor-pointer ${
              copiedId === project.shareId
                ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/10"
                : "border-white/10 hover:border-white/20 text-zinc-300 hover:text-white bg-white/[0.02]"
            }`}
            title="Copy client share link"
            aria-label="Copy client share link"
          >
            {copiedId === project.shareId ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px]">COPIED</span>
              </>
            ) : (
              <>
                <Share2 className="w-3 h-3 text-zinc-400" />
                <span className="text-[10px]">SHARE</span>
              </>
            )}
          </button>

          {/* Notes Drawer */}
          <button
            onClick={() => onSelectPunchlist(project)}
            className="p-2 rounded-xl border border-white/10 hover:border-white/20 text-zinc-400 hover:text-white transition-colors cursor-pointer bg-white/[0.02]"
            title="Inspect feedback notes"
            aria-label="Inspect feedback notes"
          >
            <MessageSquare className="w-3.5 h-3.5" />
          </button>

          {/* Delete */}
          <button
            onClick={() => onDelete(project.id, project.title)}
            className="p-2 rounded-xl border border-white/10 hover:border-red-500/40 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer bg-white/[0.02]"
            title="Delete canvas"
            aria-label="Delete canvas"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
