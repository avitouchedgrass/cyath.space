"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  ExternalLink,
  Share2,
  Globe,
  LogOut,
  Sun,
  Moon,
  Check,
  Trash2,
  Search,
  BookOpen,
  UploadCloud,
  FileText,
  LayoutGrid,
  List,
  ChevronDown,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import { useReviewStore } from "@/store/useReviewStore";
import { TesseractMark } from "@/components/common/Logo";
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

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPunchlistProject, setSelectedPunchlistProject] = useState<Project | null>(null);

  const [title, setTitle] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [quickUrl, setQuickUrl] = useState("");
  const [agencyInput, setAgencyInput] = useState("");

  const [viewMode, setViewMode] = useState<"gallery" | "ledger">("gallery");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "signed_off">("all");
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
            id: "guest-user",
            email: "guest@cyath.space",
            user_metadata: { agency_name: "My Studio" },
            app_metadata: {},
            aud: "authenticated",
            created_at: new Date().toISOString(),
          } as User);
          setAgencyInput("My Studio");
          setMounted(true);
        } else {
          router.replace("/login");
        }
      } else {
        setCurrentUser(user);
        const savedAgency = (user.user_metadata?.agency_name as string) || "My Studio";
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

    const agency = agencyInput.trim() || (currentUser?.user_metadata?.agency_name as string) || "My Studio";
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

    const agency = agencyInput.trim() || (currentUser?.user_metadata?.agency_name as string) || "My Studio";
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
      const agency = agencyInput.trim() || (currentUser?.user_metadata?.agency_name as string) || "My Studio";
      const shareId = createProject(title, dataUrl, agency, assetType);
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
    if (window.confirm(`Delete "${projectTitle}" and all its notes?`)) {
      deleteProject(projectId);
      if (selectedPunchlistProject?.id === projectId) {
        setSelectedPunchlistProject(null);
      }
    }
  };

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (statusFilter === "active" && (p.isApproved || p.pins.length === 0)) return false;
      if (statusFilter === "signed_off" && !p.isApproved) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(query);
        const matchesUrl = p.targetUrl.toLowerCase().includes(query);
        const matchesAgency = p.agencyName.toLowerCase().includes(query);
        return matchesTitle || matchesUrl || matchesAgency;
      }
      return true;
    });
  }, [projects, searchQuery, statusFilter]);

  const totalOpenNotes = useMemo(() => {
    return projects.reduce((acc, p) => acc + p.pins.filter((pin) => pin.status !== "resolved").length, 0);
  }, [projects]);

  const isDay = theme === "day";

  if (!mounted) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center font-mono text-xs transition-colors duration-200 ${
          isDay ? "bg-[#F5F3EC] text-zinc-600" : "bg-black text-zinc-400"
        }`}
      >
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-300 relative selection:bg-white selection:text-black ${
        isDay ? "bg-[#F5F3EC] text-[#1C1A18]" : "bg-black text-[#FFFFFF]"
      }`}
    >
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px]" />

      <header
        className={`sticky top-0 z-40 w-full backdrop-blur-2xl transition-all border-b ${
          isDay
            ? "bg-[#F5F3EC]/85 border-black/10"
            : "bg-black/80 border-white/[0.08]"
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-6 sm:px-12 h-20 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40 rounded-lg p-1"
          >
            <TesseractMark size={24} className="text-white shrink-0 group-hover:scale-105 transition-transform" />
            <span className="font-sans font-bold text-xl tracking-tight text-white">cyath</span>
          </Link>

          <div
            className={`inline-flex items-center gap-1 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full border shadow-xl backdrop-blur-2xl ${
              isDay
                ? "bg-white/80 border-black/12 shadow-black/5"
                : "bg-white/[0.05] border-white/15 shadow-black/40"
            }`}
          >
            <button
              onClick={() => setShowAccountModal(true)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-sans transition-all cursor-pointer ${
                isDay ? "text-zinc-800 hover:bg-black/5" : "text-zinc-300 hover:text-white hover:bg-white/[0.06]"
              }`}
              title="Studio Profile"
            >
              <span className="font-medium truncate max-w-[120px]">{agencyInput || "My Studio"}</span>
              <ChevronDown className="w-3 h-3 opacity-60 shrink-0" />
            </button>

            <div className={`w-px h-4 ${isDay ? "bg-black/10" : "bg-white/10"}`} />

            <button
              onClick={() => setShowWalkthrough(true)}
              className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono transition-all cursor-pointer ${
                isDay ? "text-zinc-700 hover:text-black hover:bg-black/5" : "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
              }`}
              title="Guide"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Guide</span>
            </button>

            <button
              onClick={toggleTheme}
              className={`p-1.5 rounded-full transition-all cursor-pointer ${
                isDay ? "text-zinc-700 hover:text-black hover:bg-black/5" : "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
              }`}
              title="Toggle theme"
              aria-label="Toggle theme"
            >
              {isDay ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={handleSignOut}
              className={`p-1.5 rounded-full transition-all cursor-pointer ${
                isDay ? "text-zinc-600 hover:text-black hover:bg-black/5" : "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
              }`}
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                if (projects.length >= 1) {
                  setShowUpgradeModal(true);
                } else {
                  setShowCreateModal(true);
                }
              }}
              className={`ml-1 px-4 py-1.5 rounded-full text-xs font-sans font-semibold tracking-tight transition-all flex items-center gap-1.5 shadow-md cursor-pointer ${
                isDay
                  ? "bg-[#1C1A18] text-white hover:bg-black"
                  : "bg-white text-black hover:bg-zinc-200"
              }`}
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.2]" />
              <span>New Canvas</span>
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-[1400px] mx-auto px-6 sm:px-12 py-10 sm:py-14 space-y-10">
        <section className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/[0.08]">
            <div className="space-y-2 max-w-2xl">
              <h1 className="font-serif text-3xl sm:text-5xl font-normal tracking-tight text-white leading-[1.1]">
                Canvases
              </h1>
              <p className="font-sans text-sm sm:text-base text-zinc-400 font-normal leading-relaxed">
                Review live websites, designs, and prototypes with clients.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0 font-mono text-[11px] text-zinc-400">
              <span className="px-3 py-1 rounded-full border border-white/10 bg-white/[0.03]">
                {projects.length} {projects.length === 1 ? "canvas" : "canvases"}
              </span>
              <span className="px-3 py-1 rounded-full border border-white/10 bg-white/[0.03]">
                {totalOpenNotes} open {totalOpenNotes === 1 ? "note" : "notes"}
              </span>
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="px-3 py-1 rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
              >
                Pro Plan
              </button>
            </div>
          </div>

          <div
            className={`p-3 sm:p-3.5 rounded-2xl border transition-all shadow-xl ${
              isDay
                ? "bg-white border-black/10 shadow-black/5"
                : "bg-[#0a0a0d] border-white/15"
            }`}
          >
            <form onSubmit={handleQuickUrlSubmit} className="flex flex-col md:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Globe className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Enter website URL (e.g. https://yoursite.com)"
                  value={quickUrl}
                  onChange={(e) => setQuickUrl(e.target.value)}
                  className={`w-full pl-11 pr-24 py-3 rounded-xl border text-xs sm:text-sm font-mono transition-all outline-none ${
                    isDay
                      ? "bg-black/[0.02] border-black/15 focus:border-black text-[#1C1A18]"
                      : "bg-black border-white/10 focus:border-white/30 text-white placeholder:text-zinc-600"
                  }`}
                  aria-label="Enter website URL"
                />
                <span className="hidden sm:inline-block absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[10px] text-zinc-500 pointer-events-none">
                  ↵ RETURN
                </span>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <label
                  className={`flex-1 md:flex-initial px-4 py-3 rounded-xl border text-xs font-mono flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isDay
                      ? "border-black/15 bg-black/[0.02] hover:bg-black/5 text-[#1C1A18]"
                      : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-zinc-300 hover:text-white"
                  }`}
                  title="Upload image or PDF"
                >
                  <UploadCloud className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Upload File</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileUpload}
                    className="sr-only"
                  />
                </label>

                <button
                  type="submit"
                  disabled={!quickUrl.trim()}
                  className={`flex-1 md:flex-initial px-5 py-3 rounded-xl text-xs font-mono font-semibold tracking-wider transition-all whitespace-nowrap cursor-pointer disabled:opacity-30 ${
                    isDay
                      ? "bg-black text-white hover:bg-zinc-800"
                      : "bg-white text-black hover:bg-zinc-200"
                  }`}
                >
                  Review URL →
                </button>
              </div>
            </form>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 p-1 rounded-xl border border-white/10 bg-white/[0.02]">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                  statusFilter === "all"
                    ? "bg-white text-black font-semibold"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                All ({projects.length})
              </button>
              <button
                onClick={() => setStatusFilter("active")}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                  statusFilter === "active"
                    ? "bg-white text-black font-semibold"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Needs Review ({projects.filter((p) => !p.isApproved && p.pins.length > 0).length})
              </button>
              <button
                onClick={() => setStatusFilter("signed_off")}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                  statusFilter === "signed_off"
                    ? "bg-white text-black font-semibold"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Approved ({projects.filter((p) => p.isApproved).length})
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filter canvases..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-48 sm:w-60 pl-8 pr-3 py-1.5 rounded-xl border text-xs font-mono transition-all outline-none ${
                    isDay
                      ? "bg-white border-black/15 focus:border-black text-[#1C1A18]"
                      : "bg-white/[0.03] border-white/10 focus:border-white/30 text-white placeholder:text-zinc-600"
                  }`}
                  aria-label="Filter canvases"
                />
              </div>

              <div
                className={`p-0.5 rounded-xl border flex items-center ${
                  isDay ? "bg-white border-black/15" : "bg-white/[0.03] border-white/10"
                }`}
              >
                <button
                  onClick={() => setViewMode("gallery")}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    viewMode === "gallery"
                      ? isDay
                        ? "bg-black/10 text-black font-semibold"
                        : "bg-white/15 text-white"
                      : "text-zinc-500 hover:text-white"
                  }`}
                  title="Gallery view"
                  aria-label="Gallery view"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode("ledger")}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    viewMode === "ledger"
                      ? isDay
                        ? "bg-black/10 text-black font-semibold"
                        : "bg-white/15 text-white"
                      : "text-zinc-500 hover:text-white"
                  }`}
                  title="List view"
                  aria-label="List view"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {viewMode === "gallery" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <ViewfinderCard
                  key={project.id}
                  project={project}
                  isDay={isDay}
                  copiedId={copiedId}
                  onCopyLink={handleCopyLink}
                  onSelectPunchlist={setSelectedPunchlistProject}
                  onDelete={handleDeleteProject}
                  getCanvasHref={getCanvasHref}
                />
              ))}

              <div
                onClick={() => {
                  if (projects.length >= 1) {
                    setShowUpgradeModal(true);
                  } else {
                    setShowCreateModal(true);
                  }
                }}
                className={`group rounded-2xl border border-dashed transition-all duration-300 p-8 flex flex-col items-center justify-center text-center min-h-[350px] cursor-pointer ${
                  isDay
                    ? "border-black/15 hover:border-black/30 bg-black/[0.01] hover:bg-black/[0.03]"
                    : "border-white/10 hover:border-white/25 bg-white/[0.01] hover:bg-white/[0.03]"
                }`}
              >
                <div className="w-12 h-12 rounded-full border border-white/15 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Plus className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-serif text-lg font-normal text-zinc-200 mb-1">
                  New Canvas
                </h3>
                <p className="font-sans text-xs text-zinc-500 max-w-[200px]">
                  Paste a URL or drop a design file to start reviewing.
                </p>
              </div>
            </div>
          ) : (
            <div
              className={`rounded-2xl border overflow-hidden ${
                isDay ? "bg-white border-black/10" : "bg-[#0a0a0d] border-white/10"
              }`}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.08] text-[10px] font-mono tracking-wider text-zinc-500 uppercase">
                      <th className="py-3 px-6">Name</th>
                      <th className="py-3 px-6">URL / Target</th>
                      <th className="py-3 px-6">Notes</th>
                      <th className="py-3 px-6">Status</th>
                      <th className="py-3 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06] text-xs font-mono">
                    {filteredProjects.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-zinc-500 font-mono text-xs">
                          No canvases found.
                        </td>
                      </tr>
                    ) : (
                      filteredProjects.map((project) => {
                        const pinCount = project.pins.length;
                        const resolvedCount = project.pins.filter((p) => p.status === "resolved").length;
                        const openCount = pinCount - resolvedCount;

                        return (
                          <tr
                            key={project.id}
                            className="hover:bg-white/[0.03] transition-colors group"
                          >
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <TesseractMark size={16} className="shrink-0 text-white/70" />
                                <div>
                                  <Link
                                    href={getCanvasHref(project)}
                                    className="font-serif text-sm font-normal text-white hover:underline block leading-snug"
                                  >
                                    {project.title}
                                  </Link>
                                  <span className="text-[10px] text-zinc-500">
                                    {project.agencyName}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-zinc-400 truncate max-w-[260px]">
                              {project.targetUrl}
                            </td>
                            <td className="py-4 px-6">
                              <span className="px-2.5 py-1 rounded-full border border-white/10 bg-white/5 text-zinc-300 text-[10px]">
                                {openCount} open · {resolvedCount} resolved
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              {project.isApproved ? (
                                <span className="px-2.5 py-1 rounded-full border border-white/30 text-white font-medium text-[10px]">
                                  Approved
                                </span>
                              ) : openCount > 0 ? (
                                <span className="px-2.5 py-1 rounded-full border border-white/15 text-zinc-300 text-[10px]">
                                  Needs Review
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full border border-white/10 text-zinc-500 text-[10px]">
                                  Draft
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Link
                                  href={getCanvasHref(project)}
                                  className="px-3 py-1.5 rounded-lg bg-white text-black text-[11px] font-semibold hover:bg-zinc-200 transition-colors"
                                >
                                  Open →
                                </Link>
                                <button
                                  onClick={() => handleCopyLink(project.shareId)}
                                  className="p-1.5 rounded-lg border border-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                                  title="Copy link"
                                  aria-label="Copy link"
                                >
                                  {copiedId === project.shareId ? (
                                    <Check className="w-3.5 h-3.5 text-white" />
                                  ) : (
                                    <Share2 className="w-3.5 h-3.5" />
                                  )}
                                </button>
                                <button
                                  onClick={() => setSelectedPunchlistProject(project)}
                                  className="p-1.5 rounded-lg border border-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                                  title="Notes"
                                  aria-label="Notes"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteProject(project.id, project.title)}
                                  className="p-1.5 rounded-lg border border-white/10 text-zinc-500 hover:text-white transition-colors cursor-pointer"
                                  title="Delete"
                                  aria-label="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </main>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div
            className={`w-full max-w-md rounded-2xl border p-6 sm:p-8 shadow-2xl relative ${
              isDay ? "bg-white border-black/15 text-[#1C1A18]" : "bg-[#09090b] border-white/15 text-white"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <TesseractMark size={18} className="text-white" />
              <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider">
                New Review
              </span>
            </div>
            <h3 className="font-serif text-2xl font-normal text-white mb-2">Create Canvas</h3>
            <p className="text-xs text-zinc-400 font-sans mb-6 leading-relaxed">
              Enter a live URL or staging site to generate a client review link.
            </p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-2">
                  Canvas Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Client Landing Page"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono transition-all outline-none ${
                    isDay
                      ? "bg-black/[0.02] border-black/15 focus:border-black text-[#1C1A18]"
                      : "bg-black border-white/15 focus:border-white text-white"
                  }`}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-2">
                  Website URL
                </label>
                <input
                  type="text"
                  placeholder="e.g. https://staging.client.com"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono transition-all outline-none ${
                    isDay
                      ? "bg-black/[0.02] border-black/15 focus:border-black text-[#1C1A18]"
                      : "bg-black border-white/15 focus:border-white text-white"
                  }`}
                  required
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-mono text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!title.trim() || !targetUrl.trim()}
                  className={`px-5 py-2.5 rounded-xl text-xs font-mono font-semibold tracking-wider transition-all cursor-pointer disabled:opacity-30 ${
                    isDay ? "bg-black text-white hover:bg-zinc-800" : "bg-white text-black hover:bg-zinc-200"
                  }`}
                >
                  Create Canvas →
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

interface ViewfinderCardProps {
  project: Project;
  isDay: boolean;
  copiedId: string | null;
  onCopyLink: (shareId: string) => void;
  onSelectPunchlist: (project: Project) => void;
  onDelete: (id: string, title: string) => void;
  getCanvasHref: (project: Project) => string;
}

function ViewfinderCard({
  project,
  isDay,
  copiedId,
  onCopyLink,
  onSelectPunchlist,
  onDelete,
  getCanvasHref,
}: ViewfinderCardProps) {
  const pinCount = project.pins.length;
  const resolvedCount = project.pins.filter((p) => p.status === "resolved").length;
  const openCount = pinCount - resolvedCount;

  let hostname = "";
  try {
    hostname = new URL(project.targetUrl).hostname.replace(/^www\./, "");
  } catch {
    hostname = project.targetUrl;
  }

  const isWebUrl = project.assetType === "url" || (!project.assetType && project.targetUrl.startsWith("http"));

  return (
    <div
      className={`group rounded-2xl border transition-all duration-300 flex flex-col overflow-hidden relative shadow-xl ${
        isDay
          ? "bg-white border-black/10 hover:border-black/25 shadow-black/5"
          : "bg-[#0a0a0d] border-white/12 hover:border-white/25 shadow-black/40"
      }`}
    >
      <Link
        href={getCanvasHref(project)}
        className="block relative w-full h-48 bg-black overflow-hidden border-b border-white/[0.08] group-hover:border-white/20 transition-colors"
      >
        <div className="h-7 bg-[#0d0d10] border-b border-white/[0.06] px-3 flex items-center justify-between z-20 relative select-none">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
            <span className="text-[10px] font-mono text-zinc-400 truncate max-w-[150px] ml-1.5">
              {hostname}
            </span>
          </div>

          <div>
            {project.isApproved ? (
              <span className="text-[9px] font-mono tracking-wider px-2 py-0.5 rounded-full bg-white text-black font-semibold flex items-center gap-1 shadow-sm">
                <ShieldCheck className="w-2.5 h-2.5" />
                Approved
              </span>
            ) : openCount > 0 ? (
              <span className="text-[9px] font-mono tracking-wider px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-white flex items-center gap-1 backdrop-blur-md">
                <MessageSquare className="w-2.5 h-2.5 text-white/70" />
                {openCount} {openCount === 1 ? "note" : "notes"}
              </span>
            ) : (
              <span className="text-[9px] font-mono tracking-wider px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-400 backdrop-blur-md">
                Draft
              </span>
            )}
          </div>
        </div>

        <div className="relative w-full h-[calc(100%-1.75rem)] overflow-hidden bg-[#050507]">
          {project.assetType === "image" ? (
            <img
              src={project.targetUrl}
              alt={project.title}
              className="w-full h-full object-cover object-top opacity-90 group-hover:opacity-100 group-hover:scale-[1.02] transition-all duration-300"
            />
          ) : project.assetType === "pdf" ? (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-black text-center">
              <FileText className="w-7 h-7 text-zinc-400 mb-1.5 stroke-[1.5]" />
              <span className="text-xs font-serif font-medium text-zinc-200 truncate max-w-[90%]">
                {project.title}.pdf
              </span>
              <span className="text-[9px] font-mono text-zinc-500 uppercase mt-0.5">
                PDF Document
              </span>
            </div>
          ) : isWebUrl ? (
            <div className="relative w-full h-full bg-white overflow-hidden pointer-events-none select-none">
              <div className="absolute inset-0 bg-[#09090b] flex flex-col items-center justify-center p-4 text-center z-0">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mb-1 text-white">
                  <TesseractMark size={16} />
                </div>
                <span className="text-xs font-serif text-white/80 truncate max-w-[80%]">{project.title}</span>
                <span className="text-[10px] font-mono text-zinc-500 truncate max-w-[80%]">{hostname}</span>
              </div>
              <iframe
                src={`/api/proxy?url=${encodeURIComponent(project.targetUrl)}`}
                title={project.title}
                className="absolute top-0 left-0 border-none select-none z-10 opacity-90 group-hover:opacity-100 transition-opacity"
                style={{
                  width: "1280px",
                  height: "800px",
                  transform: "scale(0.32)",
                  transformOrigin: "0 0",
                }}
                tabIndex={-1}
                loading="lazy"
              />
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-[#09090b]">
              <TesseractMark size={20} className="text-white/60 mb-2" />
              <span className="text-xs font-serif text-white/80">{project.title}</span>
            </div>
          )}
        </div>
      </Link>

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[10px] font-mono text-zinc-500 truncate">
              {project.agencyName}
            </span>
            <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-zinc-400">
              {project.assetType || "web"}
            </span>
          </div>

          <h3 className="font-serif text-lg font-normal tracking-wide truncate text-white leading-snug">
            {project.title}
          </h3>

          <p className="text-[11px] font-mono text-zinc-500 truncate mt-1">
            {project.targetUrl}
          </p>
        </div>

        <div className="mt-5 pt-3.5 border-t border-white/[0.08] flex items-center gap-2">
          <Link
            href={getCanvasHref(project)}
            className="flex-1 py-2 px-3 rounded-xl text-xs font-mono font-medium tracking-wide text-center flex items-center justify-center gap-1.5 bg-white text-black hover:bg-zinc-200 transition-all cursor-pointer shadow-sm"
          >
            <span>Open Canvas</span>
            <ExternalLink className="w-3 h-3" />
          </Link>

          <button
            onClick={() => onCopyLink(project.shareId)}
            className="py-2 px-3 rounded-xl border border-white/10 hover:border-white/25 text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer text-xs font-mono"
            title="Copy link"
            aria-label="Copy link"
          >
            {copiedId === project.shareId ? (
              <>
                <Check className="w-3 h-3 text-white" />
                <span className="text-[10px]">Copied</span>
              </>
            ) : (
              <>
                <Share2 className="w-3 h-3 text-zinc-400" />
                <span className="text-[10px]">Share</span>
              </>
            )}
          </button>

          <button
            onClick={() => onSelectPunchlist(project)}
            className="p-2 rounded-xl border border-white/10 hover:border-white/25 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Notes"
            aria-label="Notes"
          >
            <MessageSquare className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onDelete(project.id, project.title)}
            className="p-2 rounded-xl border border-white/10 hover:border-white/30 text-zinc-500 hover:text-white transition-colors cursor-pointer"
            title="Delete"
            aria-label="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
