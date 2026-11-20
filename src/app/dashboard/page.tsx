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
import { DashboardTour } from "@/components/dashboard/DashboardTour";
import { AppSidebar } from "@/components/common/AppSidebar";
import { StarBorder } from "@/components/common/StarBorder";
import { DeleteButton } from "@/components/common/DeleteButton";
import { useTheme } from "@/lib/theme";
import { reviewErrorMessage } from "@/lib/reviews/client";

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { theme, isDay } = useTheme();
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
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [reloadProjects, setReloadProjects] = useState(0);
  const [isCreating, setIsCreating] = useState(false);

  const { projects, createProject, deleteProject, loadProjects, isPro: isUserPro } = useReviewStore();

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

  const userProjects = projects;
  const canCreateNewCanvas = isUserPro || userProjects.length < 1;

  useEffect(() => {
    if (!currentUser || currentUser.id === "guest-user") return;
    const controller = new AbortController();
    const load = () => {
      void loadProjects(controller.signal).then(() => setLoadError("")).catch(error => {
        if (!controller.signal.aborted) setLoadError(reviewErrorMessage(error));
      });
    };
    load();
    window.addEventListener("focus", load);
    return () => {
      controller.abort();
      window.removeEventListener("focus", load);
    };
  }, [currentUser, loadProjects, reloadProjects]);

  function canStartReview() {
    if (!currentUser || currentUser.id === "guest-user") {
      localStorage.removeItem("cyath_guest_session");
      router.push("/login");
      return false;
    }
    if (!canCreateNewCanvas) {
      setShowUpgradeModal(true);
      return false;
    }
    return !isCreating;
  }

  async function openNewReview(title: string, target: string, type: Project["assetType"]) {
    const agency = agencyInput.trim() || (currentUser?.user_metadata?.agency_name as string) || "Studio";
    const id = await createProject(title, target, agency, type);
    setQuickUrl("");
    router.push("/r/" + id);
  }

  const handleQuickUrlSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!quickUrl.trim() || !canStartReview()) return;
    setActionError("");
    setIsCreating(true);
    try {
      const input = quickUrl.trim();
      const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(input) ? input : "https://" + input);
      if (url.protocol !== "https:" || url.username || url.password || url.port) {
        throw new Error("Enter an HTTPS website URL without embedded credentials or a custom port.");
      }
      await openNewReview(url.hostname.replace(/^www\./, ""), url.href, "url");
    } catch (error) {
      setActionError(error instanceof TypeError ? "Enter a valid website URL." : reviewErrorMessage(error));
    } finally {
      setIsCreating(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !canStartReview()) return;
    setActionError("");
    if (file.size > 2 * 1024 * 1024) {
      setActionError("Choose an image or PDF of 2 MB or less.");
      return;
    }
    setIsCreating(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Could not read the file. Try again."));
        reader.readAsDataURL(file);
      });
      await openNewReview(file.name.replace(/\.[^/.]+$/, "").slice(0, 180), dataUrl,
        file.type === "application/pdf" ? "pdf" : "image");
    } catch (error) {
      setActionError(reviewErrorMessage(error));
    } finally {
      setIsCreating(false);
    }
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

  const handleCopyLink = async (shareId: string) => {
    try {
      await navigator.clipboard.writeText(new URL("/r/" + shareId, window.location.origin).href);
      setCopiedId(shareId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setActionError("Could not copy the review link. Open the review and copy its address.");
    }
  };

  const getCanvasHref = (project: Project) => "/r/" + project.shareId;

  // Total active notes across all user projects
  const totalNotesCount = useMemo(() => {
    return userProjects.reduce((acc, p) => {
      if (!p || !Array.isArray(p.pins)) return acc;
      const unres = p.pins.filter(Boolean).filter((pin) => pin.status !== "resolved").length;
      return acc + unres;
    }, 0);
  }, [userProjects]);

  const handleNavigate = (e: React.MouseEvent, path: string) => {
    if (typeof window !== "undefined" && window.location.pathname === path) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    const mainEl = document.querySelector("main");
    if (mainEl) {
      mainEl.classList.remove("page-enter");
      mainEl.classList.add("page-exit");
      setTimeout(() => {
        router.push(path);
      }, 130);
    } else {
      router.push(path);
    }
  };

  return (
    <div
      className={`min-h-screen font-sans flex flex-col md:flex-row transition-colors duration-200 selection:bg-stone-300 selection:text-black ${
        isDay ? "bg-[#FBF9F4] text-[#1C1917]" : "bg-[#000000] text-white"
      }`}
    >
      {/* Shared Persistent Left Sidebar */}
      <AppSidebar
        activeItem="projects"
        onNewReviewClick={() => {
          if (canStartReview()) document.getElementById("tour-create-card")
            ?.querySelector<HTMLInputElement>("input[type=url], input[type=text]")?.focus();
        }}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp,image/avif,application/pdf"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Main Stream Area — Elevated with Harvey AI Inspired Spatial Structure */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto relative page-enter">
        {/* Subtle Depth Background Lighting */}
        <div className="absolute top-0 inset-x-0 h-96 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/[0.04] via-transparent to-transparent pointer-events-none" />

        <div className="max-w-6xl w-full mx-auto px-6 py-8 space-y-8 flex-1 relative z-10">
          {/* Workspace Title & Telemetry Header (Harvey AI Style) */}
          <div className={`flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-3 border-b ${
            isDay ? "border-stone-200" : "border-white/[0.08]"
          }`}>
            <div>
              <h1
                className={`text-3xl sm:text-4xl lg:text-5xl font-serif font-medium tracking-tight ${
                  isDay ? "text-stone-900" : "text-white"
                }`}
                style={{ fontFamily: "var(--font-serif, 'Oranienbaum', Georgia, serif)" }}
              >
                Projects
              </h1>
            </div>

            {/* Quick Monochrome Telemetry Badges & Alluring Upgrade Button */}
            <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs">
              <span
                className={`px-4 py-2 rounded-full border transition-colors ${
                  isDay
                    ? "border-stone-300 bg-stone-200/80 text-stone-900 font-medium"
                    : "border-white/15 bg-white/[0.06] text-zinc-100"
                }`}
              >
                {userProjects.length} Active {userProjects.length === 1 ? "Review" : "Reviews"}
              </span>
              <span
                className={`px-4 py-2 rounded-full border transition-colors ${
                  isDay
                    ? "border-stone-300 bg-stone-200/80 text-stone-900 font-medium"
                    : "border-white/15 bg-white/[0.06] text-zinc-100"
                }`}
              >
                {totalNotesCount} Open {totalNotesCount === 1 ? "Note" : "Notes"}
              </span>
              <span
                className={`px-4 py-2 rounded-full border transition-colors ${
                  isDay
                    ? "border-stone-300 bg-stone-200/80 text-stone-900 font-medium"
                    : "border-white/15 bg-white/[0.06] text-zinc-100"
                }`}
              >
                {isUserPro ? "Pro Plan" : `Free Plan (${userProjects.length}/1)`}
              </span>

              {!isUserPro && (
                <Link
                  href="/pro"
                  prefetch={true}
                  onClick={(e) => handleNavigate(e, "/pro")}
                  className={`px-4 py-2 rounded-full font-mono font-semibold text-xs transition-all duration-150 cursor-pointer active:scale-[0.96] flex items-center gap-1.5 shadow-md ${
                    isDay
                      ? "bg-stone-900 text-white hover:bg-stone-800 shadow-stone-300"
                      : "bg-white text-black hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.25)]"
                  }`}
                  title="Upgrade to Pro"
                >
                  <span>Upgrade to Pro</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>

          {/* Elevated Intake Bar with StarBorder Travelling Starlight Animation */}
          <StarBorder
            id="tour-create-card"
            color={isDay ? "rgba(28, 25, 23, 0.45)" : "rgba(255, 255, 255, 0.85)"}
            speed="6s"
          >
            <div
              className={`border rounded-2xl p-5 transition-all shadow-xl relative overflow-hidden ${
                isDay
                  ? "bg-white border-stone-200 shadow-stone-200/50"
                  : "bg-[#0a0a0d] border-white/[0.12] shadow-[0_10px_35px_rgba(0,0,0,0.6)]"
              }`}
            >
              <form onSubmit={handleQuickUrlSubmit} className="space-y-3.5">
                <div className="flex items-center gap-3">
                  <Globe className={`w-4 h-4 shrink-0 ${isDay ? "text-stone-500" : "text-zinc-400"}`} />
                  <input
                    type="text"
                    value={quickUrl}
                    onChange={(e) => setQuickUrl(e.target.value)}
                    placeholder="Paste any live website URL to start review (e.g. preview.acmecorp.com)..."
                    className={`w-full bg-transparent text-sm outline-none font-sans ${
                      isDay
                        ? "text-stone-900 placeholder:text-stone-400"
                        : "text-white placeholder:text-zinc-400"
                    }`}
                  />
                </div>

                <div
                  className={`flex items-center justify-between pt-3 border-t ${
                    isDay ? "border-stone-200" : "border-white/[0.08]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <label
                      className={`text-[11px] font-mono px-3 py-1.5 rounded-lg border transition-colors cursor-pointer flex items-center gap-2 active:scale-[0.96] ${
                        isDay
                          ? "border-stone-300 text-stone-700 hover:text-stone-950 hover:bg-stone-100"
                          : "border-white/15 hover:border-white/30 text-zinc-300 hover:text-white"
                      }`}
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Upload Image or PDF</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/gif,image/webp,image/avif,application/pdf"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </label>
                    {!isUserPro && userProjects.length >= 1 && (
                      <span className={`text-[10px] font-mono ${isDay ? "text-stone-600 font-medium" : "text-zinc-500"}`}>
                        (Free plan limit reached: 1 active review)
                      </span>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={!quickUrl.trim() || isCreating}
                    className={`px-4 py-2 rounded-xl text-xs font-mono font-medium transition-all duration-150 active:scale-[0.96] flex items-center gap-2 cursor-pointer ${
                      quickUrl.trim()
                        ? isDay
                          ? "bg-stone-900 text-white hover:bg-stone-800 shadow-sm"
                          : "bg-white text-black hover:bg-zinc-200 shadow-sm"
                        : isDay
                        ? "bg-stone-200 text-stone-400 cursor-not-allowed"
                        : "bg-white/5 text-zinc-600 cursor-not-allowed"
                    }`}
                  >
                    <span>{isCreating ? "Creating review…" : "Start Review"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </div>
          </StarBorder>
          {(loadError || actionError) && <div role="alert" className="space-y-2 text-sm text-red-500">
            <p>{actionError || loadError}</p>
            {loadError && <button type="button" className="underline" onClick={() => setReloadProjects(value => value + 1)}>Reload reviews</button>}
          </div>}

          {/* Search & Filter Strip */}
          <div
            id="tour-projects-section"
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2"
          >
            <div className="flex items-center gap-2.5">
              <span className={`font-sans font-semibold text-sm ${isDay ? "text-stone-900" : "text-white"}`}>
                Review Canvases
              </span>
              <span className={`text-xs font-mono px-2 py-0.5 rounded-full border ${
                isDay
                  ? "border-stone-300 bg-stone-200/80 text-stone-800 font-semibold"
                  : "border-white/10 bg-white/5 text-zinc-300"
              }`}>
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
                    statusFilter === "all"
                      ? isDay
                        ? "bg-white text-black font-semibold shadow-xs"
                        : "bg-white text-black font-semibold"
                      : isDay
                      ? "text-stone-600 hover:text-stone-900"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusFilter("active")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all duration-150 cursor-pointer active:scale-[0.96] ${
                    statusFilter === "active"
                      ? isDay
                        ? "bg-white text-black font-semibold shadow-xs"
                        : "bg-white text-black font-semibold"
                      : isDay
                      ? "text-stone-600 hover:text-stone-900"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setStatusFilter("signed_off")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all duration-150 cursor-pointer active:scale-[0.96] ${
                    statusFilter === "signed_off"
                      ? isDay
                        ? "bg-white text-black font-semibold shadow-xs"
                        : "bg-white text-black font-semibold"
                      : isDay
                      ? "text-stone-600 hover:text-stone-900"
                      : "text-zinc-400 hover:text-white"
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
                        isDay ? "bg-white border-stone-200" : "bg-black border-white/[0.08]"
                      }`}
                    >
                      {isImage ? (
                        <img
                          src={project.targetUrl}
                          alt={project.title}
                          className="w-full h-full object-cover object-top opacity-100 group-hover:scale-[1.02] transition-all duration-300 pointer-events-none"
                        />
                      ) : isPdf ? (
                        <div className="relative w-full h-full overflow-hidden select-none pointer-events-none bg-stone-900">
                          <iframe
                            src={`${project.targetUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                            title={project.title}
                            tabIndex={-1}
                            className="w-[355%] h-[355%] origin-top-left scale-[0.2817] border-none pointer-events-none"
                          />
                        </div>
                      ) : (
                        <div className={`grid h-full w-full place-items-center ${isDay ? "bg-stone-100 text-stone-700" : "bg-zinc-950 text-zinc-300"}`}>
                          <Globe aria-hidden="true" className="h-7 w-7" />
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
                        <p className={`text-[11px] font-mono truncate ${isDay ? "text-stone-600 font-medium" : "text-zinc-400"}`}>
                          {project.targetUrl}
                        </p>
                      </div>

                      {/* Card Footer Toolbar */}
                      <div className={`flex items-center justify-between pt-3 border-t text-xs ${isDay ? "border-stone-200" : "border-white/[0.08]"}`}>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedPunchlistProject(project)}
                            className={`px-2 py-1 rounded-lg border text-[11px] font-mono transition-all cursor-pointer flex items-center gap-1.5 active:scale-[0.96] ${
                              isDay
                                ? "border-stone-300 hover:border-stone-400 text-stone-700 hover:text-stone-950 bg-stone-100/70"
                                : "border-white/10 hover:border-white/25 text-zinc-400 hover:text-white"
                            }`}
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
                                ? isDay ? "bg-stone-900 text-white border-stone-900" : "bg-white text-black border-white"
                                : isDay
                                ? "border-stone-300 text-stone-600 hover:text-stone-950 hover:bg-stone-100"
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

                          <DeleteButton
                            onDelete={() => {
                              setActionError("");
                              void deleteProject(project.shareId).catch(error => setActionError(reviewErrorMessage(error)));
                            }}
                            confirmation="Delete this review and revoke its share link?"
                            label="Delete review"
                            className={`p-1.5 rounded-lg border border-transparent transition-all cursor-pointer active:scale-[0.96] ${
                              isDay
                                ? "text-stone-500 hover:text-stone-900 hover:border-stone-300 hover:bg-stone-100"
                                : "text-zinc-400 hover:text-white hover:border-white/20 hover:bg-white/5"
                            }`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </DeleteButton>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Free Tier Balance Placeholder Card: Subtle ghost slots covering 2/3 spots on the right */}
              {!isUserPro && userProjects.length === 1 && (
                <div
                  onClick={() => setShowUpgradeModal(true)}
                  className={`md:col-span-1 lg:col-span-2 group rounded-2xl border border-dashed transition-all duration-300 flex flex-col overflow-hidden relative cursor-pointer active:scale-[0.995] hover:-translate-y-1 ${
                    isDay
                      ? "border-stone-300 bg-stone-50/70 hover:bg-stone-100/90 text-stone-900 shadow-xs hover:border-stone-400"
                      : "border-white/15 bg-white/[0.015] hover:bg-white/[0.035] text-white hover:border-white/30 shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
                  }`}
                >
                  {/* Top Window Bar */}
                  <div
                    className={`h-8 border-b border-dashed px-3.5 flex items-center justify-between select-none ${
                      isDay ? "bg-stone-100/60 border-stone-200" : "bg-white/[0.02] border-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${isDay ? "bg-stone-300" : "bg-white/10"}`} />
                      <span className={`w-2 h-2 rounded-full ${isDay ? "bg-stone-300" : "bg-white/10"}`} />
                      <span className={`w-2 h-2 rounded-full ${isDay ? "bg-stone-300" : "bg-white/10"}`} />
                      <span className={`text-[10px] font-mono truncate max-w-[200px] ml-1.5 opacity-60 ${isDay ? "text-stone-500" : "text-zinc-500"}`}>
                        slots-02-03.pro-cluster.cyath
                      </span>
                    </div>

                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${
                      isDay
                        ? "border-stone-300 bg-white text-stone-700 font-medium"
                        : "border-white/15 bg-white/5 text-zinc-400"
                    }`}>
                      Studio Pro Slots
                    </span>
                  </div>

                  {/* Dual Blueprint Viewport Stages covering the 2 spots */}
                  <div
                    className={`relative w-full overflow-hidden border-b border-dashed p-6 transition-colors ${
                      isDay ? "bg-stone-100/40 border-stone-200" : "bg-black/40 border-white/10"
                    }`}
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none opacity-40" />

                    <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-4 h-full">
                      {/* Slot 02 Ghost Box */}
                      <div className={`p-4 rounded-xl border border-dashed flex flex-col items-center justify-center text-center transition-all ${
                        isDay ? "border-stone-200 bg-white/60 hover:bg-white" : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"
                      }`}>
                        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center mb-2.5 transition-transform duration-300 group-hover:scale-105 ${
                          isDay ? "border-stone-300 bg-white text-stone-800 shadow-xs" : "border-white/20 bg-white/5 text-white"
                        }`}>
                          <Plus className="w-4 h-4 opacity-80" />
                        </div>
                        <div className="text-xs font-sans font-semibold tracking-tight mb-0.5">
                          Add 2nd Canvas
                        </div>
                        <p className={`text-[10px] font-sans max-w-[180px] leading-relaxed ${isDay ? "text-stone-500" : "text-zinc-500"}`}>
                          Concurrent staging link with live client annotations & device viewports.
                        </p>
                      </div>

                      {/* Slot 03 Ghost Box */}
                      <div className={`p-4 rounded-xl border border-dashed flex flex-col items-center justify-center text-center transition-all ${
                        isDay ? "border-stone-200 bg-white/60 hover:bg-white" : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"
                      }`}>
                        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center mb-2.5 transition-transform duration-300 group-hover:scale-105 ${
                          isDay ? "border-stone-300 bg-white text-stone-800 shadow-xs" : "border-white/20 bg-white/5 text-white"
                        }`}>
                          <Plus className="w-4 h-4 opacity-80" />
                        </div>
                        <div className="text-xs font-sans font-semibold tracking-tight mb-0.5">
                          Add 3rd Canvas
                        </div>
                        <p className={`text-[10px] font-sans max-w-[180px] leading-relaxed ${isDay ? "text-stone-500" : "text-zinc-500"}`}>
                          MCP access and client approval receipts for more projects.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Metadata & Controls */}
                  <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between flex-1 gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-xs font-sans font-semibold ${isDay ? "text-stone-800" : "text-zinc-200"}`}>
                          Unlock Unlimited Review Canvases
                        </span>
                      </div>
                      <div className={`text-[11px] font-mono truncate opacity-60 ${isDay ? "text-stone-500" : "text-zinc-500"}`}>
                        upgrade to cyath pro for infinite simultaneous client links
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                      <span className={`text-[10px] font-mono uppercase tracking-wider hidden md:inline ${isDay ? "text-stone-500 font-medium" : "text-zinc-500"}`}>
                        Instant Activation
                      </span>

                      <span className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all duration-150 flex items-center gap-1.5 shadow-sm active:scale-[0.96] ${
                        isDay
                          ? "bg-stone-900 text-white group-hover:bg-stone-800 shadow-stone-300"
                          : "bg-white text-black group-hover:bg-zinc-200 shadow-[0_0_16px_rgba(255,255,255,0.2)]"
                      }`}>
                        <span>Upgrade to Pro</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              )}
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
          project={projects.find(project => project.shareId === selectedPunchlistProject.shareId) ?? null}
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

      {/* Native Interactive Dashboard Walkthrough Guide */}
      <DashboardTour />
    </div>
  );
}
