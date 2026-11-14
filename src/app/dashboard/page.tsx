"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
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
  Lock,
  ShieldCheck,
  Copy,
  Layers,
  ArrowRight,
  ArrowUpRight,
  Sliders,
  FolderGit2,
  CreditCard,
  MessageSquare,
  Zap,
} from "lucide-react";
import { useReviewStore } from "@/store/useReviewStore";
import { TesseractMark } from "@/components/common/Logo";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Project } from "@/types";
import { ProjectPunchlistDrawer } from "@/components/dashboard/ProjectPunchlistDrawer";
import { StudioUpgradeModal } from "@/components/dashboard/StudioUpgradeModal";
import { startDashboardTour } from "@/lib/dashboardTour";

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [theme, setTheme] = useState<"night" | "day">("night");
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
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
    let isCancelled = false;

    const verifyAuth = async () => {
      // 1. Check guest bypass
      const isGuest =
        typeof window !== "undefined" &&
        (localStorage.getItem("cyath_guest_session") === "true" ||
          new URLSearchParams(window.location.search).get("demo") === "true");

      if (isGuest) {
        if (!isCancelled) {
          setCurrentUser({
            id: "guest-user",
            email: "guest@cyath.space",
            user_metadata: { agency_name: "Studio" },
            app_metadata: {},
            aud: "authenticated",
            created_at: new Date().toISOString(),
          } as User);
          setAgencyInput("Studio");
        }
        return;
      }

      // 2. Check cached session first for instant response
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && !isCancelled) {
        setCurrentUser(session.user);
        const userFirm = session.user.user_metadata?.agency_name;
        if (!userFirm) {
          setShowOnboardingModal(true);
          setAgencyInput("Studio");
        } else {
          setAgencyInput(userFirm);
        }
        return;
      }

      // 3. Fallback to getUser() verification
      const { data: { user } } = await supabase.auth.getUser();
      if (user && !isCancelled) {
        setCurrentUser(user);
        const userFirm = user.user_metadata?.agency_name;
        if (!userFirm) {
          setShowOnboardingModal(true);
          setAgencyInput("Studio");
        } else {
          setAgencyInput(userFirm);
        }
        return;
      }

      // 4. Truly not authenticated: clear stale auth flags to prevent infinite redirect loops
      if (!isCancelled) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("cyath_auth_active");
          localStorage.removeItem("cyath_guest_session");
        }
        router.replace("/login");
      }
    };

    verifyAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (isCancelled) return;
      if (event === "SIGNED_OUT") {
        if (typeof window !== "undefined") {
          localStorage.removeItem("cyath_auth_active");
          localStorage.removeItem("cyath_guest_session");
        }
        router.replace("/login");
      } else if (session?.user) {
        setCurrentUser(session.user);
      }
    });

    return () => {
      isCancelled = true;
      subscription.unsubscribe();
    };
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

  // Strict 1 Canvas limit for Free tier
  const canCreateNewCanvas = isUserPro || userProjects.length < 1;

  const handleQuickUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickUrl.trim()) return;

    if (!canCreateNewCanvas) {
      setShowUpgradeModal(true);
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

    if (!canCreateNewCanvas) {
      setShowUpgradeModal(true);
      e.target.value = "";
      return;
    }

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
  };

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

  // Total active notes across all user projects
  const totalNotesCount = useMemo(() => {
    return userProjects.reduce((acc, p) => {
      if (!p || !Array.isArray(p.pins)) return acc;
      const unres = p.pins.filter(Boolean).filter((pin) => pin.status !== "resolved").length;
      return acc + unres;
    }, 0);
  }, [userProjects]);

  return (
    <div
      className={`min-h-screen font-sans flex flex-col md:flex-row transition-colors duration-200 selection:bg-stone-300 selection:text-black ${
        isDay ? "bg-[#FBF9F4] text-[#1C1917]" : "bg-[#000000] text-white"
      }`}
    >
      {/* Left Rail Sidebar */}
      <aside
        id="tour-sidebar"
        className={`w-full md:w-64 shrink-0 border-b md:border-b-0 md:border-r flex flex-col justify-between p-4 transition-colors z-20 ${
          isDay ? "bg-[#F5F2EA] border-stone-200" : "bg-[#08080a] border-white/[0.08]"
        }`}
      >
        <div className="space-y-6">
          {/* Logo & Brand Lockup */}
          <div className="flex items-center justify-between px-2 pt-1">
            <Link
              href="/"
              prefetch={true}
              className="flex items-center gap-2.5 group active:scale-[0.96] transition-transform"
            >
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
            <button
              id="tour-new-review-btn"
              onClick={() => {
                if (!canCreateNewCanvas) {
                  setShowUpgradeModal(true);
                } else {
                  fileInputRef.current?.click();
                }
              }}
              className="w-full py-2.5 px-3.5 rounded-xl border font-mono text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all duration-150 active:scale-[0.96] shadow-sm bg-white text-black hover:bg-zinc-200 border-white/20"
            >
              <Plus className="w-4 h-4" />
              <span>New Review</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 px-3 py-1">
              Workspace
            </div>
            <Link
              href="/dashboard"
              prefetch={true}
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
              onClick={() => startDashboardTour()}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer active:scale-[0.96] ${
                isDay ? "text-stone-600 hover:text-stone-900 hover:bg-stone-200/60" : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Guide (Tour)</span>
            </button>

            <Link
              id="tour-settings-link"
              href="/settings"
              prefetch={true}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 active:scale-[0.96] ${
                isDay ? "text-stone-600 hover:text-stone-900 hover:bg-stone-200/60" : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Settings</span>
            </Link>

            <Link
              id="tour-plans-link"
              href="/pro"
              prefetch={true}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 active:scale-[0.96] ${
                isDay ? "text-stone-600 hover:text-stone-900 hover:bg-stone-200/60" : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-4 h-4" />
                <span>Plans</span>
              </div>
              {isUserPro ? (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white text-black font-bold">
                  PRO
                </span>
              ) : (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-white/20 text-zinc-400">
                  FREE
                </span>
              )}
            </Link>
          </nav>
        </div>

        {/* Plan Quota Indicator in Sidebar */}
        <div className="space-y-4">
          <div
            className={`p-3 rounded-xl border text-xs font-mono transition-colors ${
              isDay ? "bg-stone-100 border-stone-200" : "bg-white/[0.03] border-white/[0.06]"
            }`}
          >
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="text-zinc-400">Canvas Quota</span>
              <span className="font-semibold text-white">
                {isUserPro ? "Unlimited" : `${userProjects.length} / 1`}
              </span>
            </div>
            {!isUserPro && (
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-300"
                  style={{ width: `${Math.min(100, userProjects.length * 100)}%` }}
                />
              </div>
            )}
            {!isUserPro && userProjects.length >= 1 && (
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="mt-2 text-[10px] text-zinc-400 hover:text-white underline cursor-pointer block text-left"
              >
                Upgrade to Pro for more
              </button>
            )}
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
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer active:scale-[0.96]"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Stream Area — Elevated with Harvey AI Inspired Spatial Structure */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto relative">
        {/* Subtle Depth Background Lighting */}
        <div className="absolute top-0 inset-x-0 h-96 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/[0.04] via-transparent to-transparent pointer-events-none" />

        <div className="max-w-6xl w-full mx-auto px-6 py-8 space-y-8 flex-1 relative z-10">
          {/* Workspace Title & Telemetry Header (Harvey AI Style) */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-3 border-b border-white/[0.08]">
            <div>
              <h1
                className="text-3xl sm:text-4xl lg:text-5xl font-serif font-medium tracking-tight"
                style={{ fontFamily: "var(--font-serif, 'Oranienbaum', Georgia, serif)" }}
              >
                Projects
              </h1>
            </div>

            {/* Quick Monochrome Telemetry Badges & Alluring Upgrade Button */}
            <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs">
              <span className="px-3 py-1 rounded-full border border-white/10 bg-white/[0.04] text-zinc-200">
                {userProjects.length} Active {userProjects.length === 1 ? "Review" : "Reviews"}
              </span>
              <span className="px-3 py-1 rounded-full border border-white/10 bg-white/[0.04] text-zinc-200">
                {totalNotesCount} Open {totalNotesCount === 1 ? "Note" : "Notes"}
              </span>
              <span className="px-3 py-1 rounded-full border border-white/10 bg-white/[0.04] text-zinc-200">
                {isUserPro ? "Pro Plan" : "Free Plan (1/1)"}
              </span>

              {!isUserPro && (
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="relative group p-[1px] rounded-full overflow-hidden cursor-pointer active:scale-[0.96] transition-transform shadow-[0_0_20px_rgba(255,255,255,0.18)] hover:shadow-[0_0_28px_rgba(255,255,255,0.35)]"
                  title="Unlock Unlimited Staging Canvases"
                >
                  <span className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0_340deg,#ffffff_360deg)] animate-[spin_3s_linear_infinite]" />
                  <span className={`relative flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-mono font-medium border transition-colors ${
                    isDay ? "bg-white text-stone-900 border-stone-200" : "bg-black text-white border-white/20"
                  }`}>
                    <Zap className="w-3.5 h-3.5 text-white fill-white" />
                    <span>Upgrade to Pro</span>
                    <ArrowUpRight className="w-3 h-3 text-zinc-400 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Elevated Intake Bar */}
          <div
            id="tour-create-card"
            className={`border rounded-2xl p-5 transition-all shadow-xl relative overflow-hidden ${
              isDay
                ? "bg-white border-stone-200 shadow-stone-200/50"
                : "bg-[#0a0a0d] border-white/[0.12] shadow-[0_10px_35px_rgba(0,0,0,0.6)]"
            }`}
          >
            <form onSubmit={handleQuickUrlSubmit} className="space-y-3.5">
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-zinc-400 shrink-0" />
                <input
                  type="text"
                  value={quickUrl}
                  onChange={(e) => setQuickUrl(e.target.value)}
                  placeholder="Paste any live website URL to start review (e.g. preview.acmecorp.com)..."
                  className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400 font-sans text-white"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <label className="text-[11px] font-mono px-3 py-1.5 rounded-lg border border-white/15 hover:border-white/30 text-zinc-300 hover:text-white transition-colors cursor-pointer flex items-center gap-2 active:scale-[0.96]">
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload Image or PDF</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                  {!isUserPro && userProjects.length >= 1 && (
                    <span className="text-[10px] font-mono text-zinc-500">
                      (Free plan limit reached: 1 active review)
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!quickUrl.trim()}
                  className={`px-4 py-2 rounded-xl text-xs font-mono font-medium transition-all duration-150 active:scale-[0.96] flex items-center gap-2 cursor-pointer ${
                    quickUrl.trim()
                      ? "bg-white text-black hover:bg-zinc-200 shadow-sm"
                      : "bg-white/5 text-zinc-600 cursor-not-allowed"
                  }`}
                >
                  <span>Start Review</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>

          {/* Search & Filter Strip */}
          <div
            id="tour-projects-section"
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2"
          >
            <div className="flex items-center gap-2.5">
              <span className="font-sans font-semibold text-sm">Review Canvases</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-zinc-300">
                {filteredProjects.length}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs ${
                  isDay ? "bg-white border-stone-200 text-stone-900" : "bg-white/[0.04] border-white/10 text-zinc-200"
                }`}
              >
                <Search className="w-3.5 h-3.5 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by title or url..."
                  className="bg-transparent outline-none text-xs w-40 placeholder:text-zinc-400 font-sans"
                />
              </div>

              <div className={`flex items-center p-0.5 rounded-xl border ${isDay ? "border-stone-200 bg-stone-100" : "border-white/10 bg-white/[0.04]"}`}>
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all duration-150 cursor-pointer active:scale-[0.96] ${
                    statusFilter === "all" ? (isDay ? "bg-white text-black font-semibold shadow-xs" : "bg-white text-black font-semibold") : "text-zinc-400 hover:text-white"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusFilter("active")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all duration-150 cursor-pointer active:scale-[0.96] ${
                    statusFilter === "active" ? (isDay ? "bg-white text-black font-semibold shadow-xs" : "bg-white text-black font-semibold") : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setStatusFilter("signed_off")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all duration-150 cursor-pointer active:scale-[0.96] ${
                    statusFilter === "signed_off" ? (isDay ? "bg-white text-black font-semibold shadow-xs" : "bg-white text-black font-semibold") : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Approved
                </button>
              </div>
            </div>
          </div>

          {/* Card Format with Previews (Harvey AI Inspired) */}
          {filteredProjects.length === 0 ? (
            <div
              className={`border rounded-2xl p-14 text-center transition-colors ${
                isDay ? "border-stone-200 bg-white" : "border-white/[0.08] bg-[#0a0a0c]"
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 mx-auto flex items-center justify-center text-zinc-400 mb-3">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="font-sans font-semibold text-base mb-1">No reviews found</h3>
              <p className={`text-xs max-w-sm mx-auto mb-5 ${isDay ? "text-stone-500" : "text-zinc-500"}`}>
                Paste a website URL above or drop an image or PDF to start your first review.
              </p>
              <button
                onClick={() => {
                  if (!canCreateNewCanvas) {
                    setShowUpgradeModal(true);
                  } else {
                    fileInputRef.current?.click();
                  }
                }}
                className="px-4 py-2 bg-white text-black text-xs font-mono font-medium rounded-xl hover:bg-zinc-200 transition-all active:scale-[0.96] cursor-pointer"
              >
                + New Review
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => {
                const unresolvedPins = Array.isArray(project.pins)
                  ? project.pins.filter(Boolean).filter((p) => p.status !== "resolved").length
                  : 0;
                const totalPins = Array.isArray(project.pins) ? project.pins.filter(Boolean).length : 0;
                const isPdf = project.assetType === "pdf";
                const isImage = project.assetType === "image";

                let hostname = "";
                try {
                  hostname = new URL(project.targetUrl).hostname.replace(/^www\./, "");
                } catch {
                  hostname = project.targetUrl;
                }

                return (
                  <div
                    key={project.id}
                    className={`group rounded-2xl border transition-all duration-300 flex flex-col overflow-hidden relative shadow-xl hover:-translate-y-1 hover:shadow-2xl active:scale-[0.995] ${
                      isDay
                        ? "bg-white border-stone-200 hover:border-stone-400 text-stone-900"
                        : "bg-[#0a0a0d] border-white/[0.12] hover:border-white/30 text-white shadow-black/60"
                    }`}
                  >
                    {/* Top Window Bar */}
                    <div
                      className={`h-8 border-b px-3.5 flex items-center justify-between select-none ${
                        isDay ? "bg-stone-100/90 border-stone-200" : "bg-[#0d0d10] border-white/[0.08]"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${isDay ? "bg-stone-400" : "bg-white/20"}`} />
                        <span className={`w-2 h-2 rounded-full ${isDay ? "bg-stone-300" : "bg-white/10"}`} />
                        <span className={`w-2 h-2 rounded-full ${isDay ? "bg-stone-300" : "bg-white/10"}`} />
                        <span className={`text-[10px] font-mono truncate max-w-[130px] ml-1.5 ${isDay ? "text-stone-600" : "text-zinc-400"}`}>
                          {hostname}
                        </span>
                      </div>

                      {/* Pure Monochrome Status Pills */}
                      <div>
                        {project.isApproved ? (
                          <span className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full bg-white text-black flex items-center gap-1 shadow-sm">
                            <ShieldCheck className="w-2.5 h-2.5" />
                            Approved
                          </span>
                        ) : unresolvedPins > 0 ? (
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full border border-white/20 bg-white/10 text-white flex items-center gap-1 shadow-sm">
                            <MessageSquare className="w-2.5 h-2.5" />
                            {unresolvedPins} open notes
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono text-zinc-500">
                            Clean
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Viewport Preview Stage (16:10 Aspect Ratio) */}
                    <Link
                      href={getCanvasHref(project)}
                      prefetch={true}
                      className={`block relative w-full aspect-[16/10] overflow-hidden border-b transition-colors group-hover:opacity-100 ${
                        isDay ? "bg-stone-100 border-stone-200" : "bg-black border-white/[0.08]"
                      }`}
                    >
                      {isImage ? (
                        <img
                          src={project.targetUrl}
                          alt={project.title}
                          className="w-full h-full object-cover object-top opacity-85 group-hover:opacity-100 group-hover:scale-[1.02] transition-all duration-300 pointer-events-none"
                        />
                      ) : isPdf ? (
                        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-white/[0.02]">
                          <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 mb-2 group-hover:scale-105 transition-transform">
                            <FileText className="w-6 h-6" />
                          </div>
                          <span className="text-xs font-mono font-semibold text-zinc-300">
                            PDF Document
                          </span>
                          <span className="text-[10px] font-mono text-zinc-500 mt-0.5">
                            Multi-Page Proofing Stage
                          </span>
                        </div>
                      ) : (
                        /* Web Preview Iframe Frame */
                        <div className="relative w-full h-full overflow-hidden select-none pointer-events-none">
                          <iframe
                            src={`/api/proxy?url=${encodeURIComponent(project.targetUrl)}&mute=1`}
                            title={project.title}
                            tabIndex={-1}
                            className="w-[300%] h-[300%] origin-top-left scale-[0.333333] border-none pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                            sandbox="allow-scripts allow-same-origin"
                          />
                        </div>
                      )}

                      {/* Hover Overlay with Action Button */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center backdrop-blur-xs">
                        <span className="px-3.5 py-1.5 rounded-full bg-white text-black font-mono text-xs font-semibold shadow-lg flex items-center gap-1.5 active:scale-[0.96] transition-transform">
                          <span>Open Review</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </Link>

                    {/* Bottom Metadata & Controls */}
                    <div className="p-4 flex flex-col justify-between flex-1 gap-3">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h4 className="font-sans font-semibold text-sm truncate">
                            {project.title}
                          </h4>
                        </div>
                        <p className="text-[11px] font-mono text-zinc-400 truncate">
                          {project.targetUrl}
                        </p>
                      </div>

                      {/* Card Footer Toolbar */}
                      <div className="flex items-center justify-between pt-3 border-t border-white/[0.08] text-xs">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedPunchlistProject(project)}
                            className="px-2 py-1 rounded-lg border border-white/10 hover:border-white/25 text-[11px] font-mono text-zinc-400 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 active:scale-[0.96]"
                            title="Open Notes Punchlist"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>Notes ({totalPins})</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleCopyLink(project.shareId)}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer active:scale-[0.96] ${
                              copiedId === project.shareId
                                ? "bg-white text-black border-white"
                                : "border-white/10 text-zinc-400 hover:text-white hover:bg-white/5"
                            }`}
                            title="Copy Client Share Link"
                          >
                            {copiedId === project.shareId ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              <Share2 className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            onClick={() => deleteProject(project.id)}
                            className="p-1.5 rounded-lg border border-transparent text-zinc-400 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all cursor-pointer active:scale-[0.96]"
                            title="Delete Project"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Upgrade Modal for 1-Canvas Limit Enforcement */}
      {showUpgradeModal && (
        <StudioUpgradeModal
          theme={theme}
          onClose={() => setShowUpgradeModal(false)}
        />
      )}

      {/* Project Punchlist Drawer */}
      {selectedPunchlistProject && (
        <ProjectPunchlistDrawer
          project={selectedPunchlistProject}
          theme={theme}
          onClose={() => setSelectedPunchlistProject(null)}
        />
      )}

      {/* Firm Monogram Onboarding Modal */}
      {showOnboardingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-[#0a0a0c] border border-white/15 p-6 shadow-2xl text-white">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center mb-4">
              <TesseractMark size={22} className="text-white" />
            </div>
            <h3 className="font-serif text-lg font-medium mb-1">Name Your Studio</h3>
            <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
              Your studio or agency name appears on client review links and sign-off seals.
            </p>
            <form onSubmit={handleOnboardingSubmit} className="space-y-4">
              <input
                type="text"
                autoFocus
                placeholder="e.g. Atelier Noir, Studio Form..."
                value={onboardingFirmInput}
                onChange={(e) => setOnboardingFirmInput(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/40"
              />
              <button
                type="submit"
                className="w-full py-2.5 bg-white text-black text-xs font-mono font-semibold rounded-xl hover:bg-zinc-200 transition-all cursor-pointer active:scale-[0.96]"
              >
                Save & Continue
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
