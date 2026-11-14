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
  ChevronDown,
  MessageSquare,
  Key,
  CreditCard,
  X,
  ArrowRight,
  ArrowUpRight,
  Sliders,
  FolderGit2,
} from "lucide-react";
import { useReviewStore } from "@/store/useReviewStore";
import { TesseractMark } from "@/components/common/Logo";
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

  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [onboardingFirmInput, setOnboardingFirmInput] = useState("");
  const [selectedPunchlistProject, setSelectedPunchlistProject] = useState<Project | null>(null);

  const [quickUrl, setQuickUrl] = useState("");
  const [agencyInput, setAgencyInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "signed_off">("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { projects, createProject, deleteProject, isPro, proCancelled } = useReviewStore();
  const isUserPro = !proCancelled && (isPro || (typeof window !== "undefined" && localStorage.getItem("cyath_pro_member") === "true"));

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("cyath_theme");
      if (savedTheme === "day" || savedTheme === "night") {
        setTheme(savedTheme);
        document.documentElement.setAttribute("data-theme", savedTheme);
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

  const isDay = theme === "day";

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
            user_metadata: { agency_name: "Studio" },
            app_metadata: {},
            aud: "authenticated",
            created_at: new Date().toISOString(),
          } as User);
          setAgencyInput("Studio");
          setMounted(true);
        } else {
          router.replace("/login");
        }
      } else {
        setCurrentUser(user);
        const userFirm = user.user_metadata?.agency_name;
        if (!userFirm) {
          setShowOnboardingModal(true);
          setAgencyInput("Studio");
        } else {
          setAgencyInput(userFirm);
        }
        setMounted(true);
      }
    });
  }, [router, supabase]);

  const handleSignOut = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("cyath_guest_session");
      localStorage.removeItem("cyath_pro_member");
      localStorage.removeItem("cyath_pro_api_key");
      localStorage.removeItem("cyath_auth_active");
    }
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const handleQuickUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickUrl.trim()) return;

    const userWebCanvases = userProjects.filter((p) => p.assetType === "url" || (!p.assetType && p.targetUrl?.startsWith("http")));
    if (!isUserPro && userWebCanvases.length >= 5) {
      router.push("/pro");
      return;
    }

    let formattedUrl = quickUrl.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = "https://" + formattedUrl;
    }

    let parsedTitle = "Review";
    try {
      const hostname = new URL(formattedUrl).hostname.replace(/^www\./, "");
      parsedTitle = hostname.charAt(0).toUpperCase() + hostname.slice(1);
    } catch {
      parsedTitle = "Review";
    }

    const agency = agencyInput.trim() || (currentUser?.user_metadata?.agency_name as string) || "Studio";
    const shareId = createProject(parsedTitle, formattedUrl, agency, "url", currentUser?.id, currentUser?.email);
    setQuickUrl("");
    const params = new URLSearchParams();
    params.set("u", formattedUrl);
    params.set("t", parsedTitle);
    params.set("a", agency);
    router.push(`/r/${shareId}?${params.toString()}`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
    const assetType = isPdf ? "pdf" : "image";
    const reader = new FileReader();

    reader.onload = () => {
      const dataUrl = reader.result as string;
      const title = file.name.replace(/\.[^/.]+$/, "");
      const agency = agencyInput.trim() || (currentUser?.user_metadata?.agency_name as string) || "Studio";
      const shareId = createProject(title, dataUrl, agency, assetType, currentUser?.id, currentUser?.email);
      router.push(`/r/${shareId}`);
    };

    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const chosenName = onboardingFirmInput.trim() || "Studio";
    setAgencyInput(chosenName);
    if (currentUser) {
      setCurrentUser({
        ...currentUser,
        user_metadata: {
          ...currentUser.user_metadata,
          agency_name: chosenName,
        },
      });
      try {
        await supabase.auth.updateUser({
          data: { agency_name: chosenName },
        });
      } catch { }
    }
    localStorage.setItem("cyath_agency_name", chosenName);
    setShowOnboardingModal(false);
    setShowWalkthrough(true);
  };

  const userProjects = useMemo(() => {
    if (!projects) return [];
    return projects.filter((p) => {
      if (!p) return false;
      if (p.ownerId && currentUser?.id) return p.ownerId === currentUser.id;
      if (p.ownerEmail && currentUser?.email) return p.ownerEmail.toLowerCase() === currentUser.email.toLowerCase();
      if (p.agencyName && currentUser?.email && p.agencyName.includes("@")) {
        return p.agencyName.toLowerCase() === currentUser.email.toLowerCase();
      }
      return true;
    });
  }, [projects, currentUser]);

  const filteredProjects = useMemo(() => {
    return userProjects.filter((p) => {
      if (!p) return false;
      const titleMatch = (p.title || "").toLowerCase().includes(searchQuery.toLowerCase());
      const urlMatch = (p.targetUrl || "").toLowerCase().includes(searchQuery.toLowerCase());
      const statusMatch =
        statusFilter === "all"
          ? true
          : statusFilter === "signed_off"
          ? p.isApproved
          : !p.isApproved;
      return (titleMatch || urlMatch) && statusMatch;
    });
  }, [userProjects, searchQuery, statusFilter]);

  const handleCopyLink = (shareId: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://cyath-space.vercel.app";
    const proj = userProjects.find((p) => p.shareId === shareId);
    let fullUrl = `${origin}/r/${shareId}`;
    if (proj?.targetUrl?.startsWith("http")) {
      const params = new URLSearchParams();
      params.set("u", proj.targetUrl);
      params.set("t", proj.title);
      params.set("a", proj.agencyName || agencyInput || "Studio");
      fullUrl += `?${params.toString()}`;
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(fullUrl);
      setCopiedId(shareId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const getCanvasHref = (p: Project) => {
    let href = `/r/${p.shareId}`;
    if (p.targetUrl?.startsWith("http")) {
      const params = new URLSearchParams();
      params.set("u", p.targetUrl);
      params.set("t", p.title);
      params.set("a", p.agencyName || agencyInput || "Studio");
      href += `?${params.toString()}`;
    }
    return href;
  };

  if (!mounted) {
    return <div className="min-h-screen bg-black" />;
  }

  return (
    <div
      className={`min-h-screen font-sans flex flex-col md:flex-row transition-colors duration-200 selection:bg-stone-300 selection:text-black ${
        isDay ? "bg-[#FBF9F4] text-[#1C1917]" : "bg-[#000000] text-white"
      }`}
    >
      {/* Cursor-style Left Rail Sidebar */}
      <aside
        className={`w-full md:w-64 shrink-0 border-b md:border-b-0 md:border-r flex flex-col justify-between p-4 transition-colors z-20 ${
          isDay ? "bg-[#F5F2EA] border-stone-200" : "bg-[#08080a] border-white/[0.08]"
        }`}
      >
        <div className="space-y-6">
          {/* Logo & Brand Lockup */}
          <div className="flex items-center justify-between px-2 pt-1">
            <Link href="/" className="flex items-center gap-2.5 group active:scale-[0.96] transition-transform">
              <TesseractMark
                size={22}
                className={`transition-transform duration-200 group-hover:scale-105 ${
                  isDay ? "text-stone-900" : "text-white"
                }`}
              />
              <span className={`font-sans font-bold text-lg tracking-[-0.04em] ${isDay ? "text-stone-900" : "text-white"}`}>
                cyath
              </span>
            </Link>

            <button
              onClick={toggleTheme}
              className={`p-1.5 rounded-full transition-all duration-150 cursor-pointer active:scale-[0.96] ${
                isDay ? "text-stone-700 hover:text-stone-950 hover:bg-stone-200/60" : "text-zinc-400 hover:text-white hover:bg-white/10"
              }`}
              title="Toggle theme"
            >
              {isDay ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
          </div>

          {/* New Review Upload Trigger Button */}
          <div>
            <label className="w-full py-2.5 px-3.5 rounded-xl border font-mono text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all duration-150 active:scale-[0.96] shadow-sm bg-white text-black hover:bg-zinc-200 border-white/20">
              <Plus className="w-4 h-4" />
              <span>New Review</span>
              <input
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 px-3 py-1">
              Workspace
            </div>
            <Link
              href="/dashboard"
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 active:scale-[0.96] ${
                isDay ? "bg-stone-200/80 text-stone-950 font-semibold" : "bg-white/10 text-white font-semibold"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FolderGit2 className="w-4 h-4" />
                <span>Projects</span>
              </div>
              <span className="text-[11px] font-mono text-zinc-400">{userProjects.length}</span>
            </Link>

            <button
              onClick={() => setShowWalkthrough(true)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer active:scale-[0.96] ${
                isDay ? "text-stone-600 hover:text-stone-900 hover:bg-stone-200/60" : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Guide</span>
            </button>

            <Link
              href="/settings"
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 active:scale-[0.96] ${
                isDay ? "text-stone-600 hover:text-stone-900 hover:bg-stone-200/60" : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Settings</span>
            </Link>

            <Link
              href="/pro"
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 active:scale-[0.96] ${
                isDay ? "text-stone-600 hover:text-stone-900 hover:bg-stone-200/60" : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-4 h-4" />
                <span>Plans</span>
              </div>
              {isUserPro && (
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white text-black font-bold">
                  PRO
                </span>
              )}
            </Link>
          </nav>
        </div>

        {/* Bottom User Pill */}
        <div className={`pt-4 border-t ${isDay ? "border-stone-200" : "border-white/[0.08]"}`}>
          <div className="flex items-center justify-between px-2 py-1.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-mono font-bold text-xs uppercase shrink-0">
                {(currentUser?.email || "U")[0]}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium truncate">{agencyInput || "Studio"}</div>
                <div className="text-[10px] text-zinc-500 font-mono truncate">{currentUser?.email || "guest"}</div>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer active:scale-[0.96]"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Stream Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="max-w-4xl w-full mx-auto px-6 py-8 space-y-8 flex-1">
          {/* Cursor-style Creation Bar */}
          <div
            className={`border rounded-2xl p-4 transition-all shadow-sm ${
              isDay ? "bg-white border-stone-200 shadow-stone-200/50" : "bg-[#0a0a0c] border-white/[0.12]"
            }`}
          >
            <form onSubmit={handleQuickUrlSubmit} className="space-y-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-zinc-500 shrink-0" />
                <input
                  type="text"
                  value={quickUrl}
                  onChange={(e) => setQuickUrl(e.target.value)}
                  placeholder="Paste any website URL to review..."
                  className={`w-full bg-transparent text-sm outline-none placeholder:text-zinc-500 font-sans`}
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <label className="text-[11px] font-mono px-2.5 py-1 rounded-lg border border-white/10 hover:border-white/20 text-zinc-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 active:scale-[0.96]">
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload Image or PDF</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={!quickUrl.trim()}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all duration-150 active:scale-[0.96] flex items-center gap-1.5 cursor-pointer ${
                    quickUrl.trim()
                      ? "bg-white text-black hover:bg-zinc-200 shadow-sm"
                      : "bg-white/5 text-zinc-500 cursor-not-allowed"
                  }`}
                >
                  <span>Start Review</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>

          {/* Search & Filter Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-sans font-semibold text-base">Projects</span>
              <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${isDay ? "bg-stone-200 text-stone-700" : "bg-white/10 text-zinc-400"}`}>
                {filteredProjects.length}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs ${
                  isDay ? "bg-white border-stone-200 text-stone-900" : "bg-white/[0.04] border-white/10 text-zinc-300"
                }`}
              >
                <Search className="w-3.5 h-3.5 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter projects..."
                  className="bg-transparent outline-none text-xs w-36 placeholder:text-zinc-500 font-sans"
                />
              </div>

              <div className={`flex items-center p-0.5 rounded-xl border ${isDay ? "border-stone-200 bg-stone-100" : "border-white/10 bg-white/[0.04]"}`}>
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all duration-150 cursor-pointer active:scale-[0.96] ${
                    statusFilter === "all" ? (isDay ? "bg-white text-black font-semibold shadow-xs" : "bg-white text-black font-semibold") : "text-zinc-500 hover:text-white"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusFilter("active")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all duration-150 cursor-pointer active:scale-[0.96] ${
                    statusFilter === "active" ? (isDay ? "bg-white text-black font-semibold shadow-xs" : "bg-white text-black font-semibold") : "text-zinc-500 hover:text-white"
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setStatusFilter("signed_off")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all duration-150 cursor-pointer active:scale-[0.96] ${
                    statusFilter === "signed_off" ? (isDay ? "bg-white text-black font-semibold shadow-xs" : "bg-white text-black font-semibold") : "text-zinc-500 hover:text-white"
                  }`}
                >
                  Approved
                </button>
              </div>
            </div>
          </div>

          {/* Chronological Projects List (Cursor Model) */}
          {filteredProjects.length === 0 ? (
            <div
              className={`border rounded-2xl p-12 text-center transition-colors ${
                isDay ? "border-stone-200 bg-white" : "border-white/[0.08] bg-[#0a0a0c]"
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 mx-auto flex items-center justify-center text-zinc-400 mb-3">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="font-sans font-semibold text-sm mb-1">No reviews found</h3>
              <p className={`text-xs max-w-sm mx-auto mb-4 ${isDay ? "text-stone-500" : "text-zinc-500"}`}>
                Paste a website URL above or drop an image or PDF to start your first review.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProjects.map((project) => {
                const unresolvedPins = Array.isArray(project.pins)
                  ? project.pins.filter(Boolean).filter((p) => p.status !== "resolved").length
                  : 0;
                const totalPins = Array.isArray(project.pins) ? project.pins.filter(Boolean).length : 0;
                const isPdf = project.assetType === "pdf";
                const isImage = project.assetType === "image";

                return (
                  <div
                    key={project.id}
                    className={`border rounded-xl p-4 transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group ${
                      isDay
                        ? "bg-white border-stone-200 hover:border-stone-400 shadow-xs"
                        : "bg-[#0a0a0c] border-white/[0.08] hover:border-white/25 hover:bg-[#0f0f12]"
                    }`}
                  >
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <div
                        className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                          isDay ? "bg-stone-100 border-stone-200 text-stone-700" : "bg-white/5 border-white/10 text-zinc-300"
                        }`}
                      >
                        {isPdf ? (
                          <FileText className="w-4 h-4" />
                        ) : isImage ? (
                          <UploadCloud className="w-4 h-4" />
                        ) : (
                          <Globe className="w-4 h-4" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Link
                            href={getCanvasHref(project)}
                            className="font-sans font-semibold text-sm truncate hover:underline"
                          >
                            {project.title || "Untitled Review"}
                          </Link>
                          {project.isApproved && (
                            <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                              Approved
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-zinc-500 font-mono">
                          <span className="truncate max-w-[200px] sm:max-w-xs">
                            {project.targetUrl?.startsWith("data:")
                              ? (project.assetType || "file").toUpperCase()
                              : project.targetUrl?.replace(/^https?:\/\//, "")}
                          </span>
                          <span>·</span>
                          <span className={unresolvedPins > 0 ? "text-amber-400 font-medium" : "text-zinc-500"}>
                            {unresolvedPins} open {unresolvedPins === 1 ? "note" : "notes"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => handleCopyLink(project.shareId)}
                        className={`p-2 rounded-lg border text-xs font-mono transition-all duration-150 active:scale-[0.96] cursor-pointer flex items-center gap-1 ${
                          isDay
                            ? "border-stone-200 text-stone-700 hover:bg-stone-100"
                            : "border-white/10 text-zinc-400 hover:text-white hover:bg-white/5"
                        }`}
                        title="Copy share link"
                      >
                        {copiedId === project.shareId ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-[10px] text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Share2 className="w-3.5 h-3.5" />
                            <span className="text-[10px]">Share</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => setSelectedPunchlistProject(project)}
                        className={`p-2 rounded-lg border text-xs font-mono transition-all duration-150 active:scale-[0.96] cursor-pointer ${
                          isDay
                            ? "border-stone-200 text-stone-700 hover:bg-stone-100"
                            : "border-white/10 text-zinc-400 hover:text-white hover:bg-white/5"
                        }`}
                        title="View notes stream"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>

                      <Link
                        href={getCanvasHref(project)}
                        className="py-1.5 px-3 rounded-lg bg-white text-black text-xs font-mono font-medium hover:bg-zinc-200 transition-all duration-150 active:scale-[0.96] flex items-center gap-1.5"
                      >
                        <span>Open</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>

                      <button
                        onClick={() => {
                          if (window.confirm(`Delete "${project.title}"?`)) {
                            deleteProject(project.id);
                          }
                        }}
                        className={`p-2 rounded-lg border text-xs font-mono transition-all duration-150 active:scale-[0.96] cursor-pointer ${
                          isDay
                            ? "border-stone-200 text-stone-400 hover:text-rose-600 hover:border-rose-300"
                            : "border-white/10 text-zinc-600 hover:text-rose-400 hover:border-rose-500/30"
                        }`}
                        title="Delete project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Side Punchlist Drawer */}
      {selectedPunchlistProject && (
        <ProjectPunchlistDrawer
          project={selectedPunchlistProject}
          theme={theme}
          onClose={() => setSelectedPunchlistProject(null)}
        />
      )}

      {/* Walkthrough Guide Modal */}
      {showWalkthrough && (
        <StudioWalkthroughModal
          isOpen={showWalkthrough}
          onClose={() => setShowWalkthrough(false)}
        />
      )}

      {/* Onboarding Firm Name Modal */}
      {showOnboardingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className={`w-full max-w-md border rounded-2xl p-6 shadow-2xl ${
              isDay ? "bg-white border-stone-300 text-stone-900" : "bg-[#0d0d0f] border-white/20 text-white"
            }`}
          >
            <h3 className="text-lg font-sans font-semibold mb-2">Welcome to Cyath</h3>
            <p className={`text-xs mb-6 ${isDay ? "text-stone-600" : "text-zinc-400"}`}>
              What is your studio or company name? This will appear on all review links.
            </p>
            <form onSubmit={handleOnboardingSubmit} className="space-y-4">
              <input
                type="text"
                autoFocus
                value={onboardingFirmInput}
                onChange={(e) => setOnboardingFirmInput(e.target.value)}
                placeholder="e.g. Acme Studio"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-sans outline-none ${
                  isDay ? "bg-stone-50 border-stone-300 text-stone-900" : "bg-white/5 border-white/20 text-white"
                }`}
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-white text-black font-mono text-xs font-bold hover:bg-zinc-200 transition-all duration-150 active:scale-[0.96] cursor-pointer"
              >
                Continue
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
