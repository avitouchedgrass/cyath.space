"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Globe, MessageSquare, X, Maximize2, Minimize2, MousePointer2, MessageSquarePlus, Square, Volume2, VolumeX, CheckCircle2, Monitor, Tablet, Smartphone, ChevronRight, PanelLeftClose, Share2, SunMedium, Moon, Sliders, Check } from "lucide-react";
import { formatPageLabel } from "@/lib/colors";
import { useReviewStore } from "@/store/useReviewStore";
import { ReviewStage } from "@/components/review/ReviewStage";
import { FeedbackSidebar } from "@/components/review/FeedbackSidebar";
import { ApprovalModal } from "@/components/review/ApprovalModal";
import { captureClientTelemetry } from "@/lib/telemetry";
import { createClient } from "@/lib/supabase/client";
import { TesseractMark } from "@/components/common/Logo";
import { WarmTooltip } from "@/components/common/WarmTooltip";
import { Project } from "@/types";
import { useTheme } from "@/lib/theme";

interface ReviewCanvasProps {
  shareId: string;
}

export function ReviewCanvas({ shareId }: ReviewCanvasProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [manualUrl, setManualUrl] = useState("");
  const [manualTitle, setManualTitle] = useState("");
  const [isAuthor, setIsAuthor] = useState(false);
  const [fullSidebarOpen, setFullSidebarOpen] = useState(false);
  const [projectSidebarOpen, setProjectSidebarOpen] = useState(false);
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const [guestNameInput, setGuestNameInput] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [currentPageUrl, setCurrentPageUrl] = useState<string>("");
  const [isAudioMuted, setIsAudioMuted] = useState(true);
  const [isNativeFullscreen, setIsNativeFullscreen] = useState(false);
  const { theme, isDay, toggle: toggleTheme } = useTheme();
  const hydratedShareIdRef = useRef<string | null>(null);

  const toggleNativeFullscreen = () => {
    if (typeof document === "undefined") return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => { });
      setIsNativeFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => { });
      setIsNativeFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsNativeFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const {
    projects,
    activePinId,
    activeDeviceMode,
    interactionMode,
    clientAuthorName,
    setActivePinId,
    setActiveDeviceMode,
    setInteractionMode,
    setClientAuthorName,
    addPin,
    addComment,
    deletePin,
    toggleResolvePin,
    approveProject,
    revokeApproval,
    hydrateProject,
  } = useReviewStore();

  useEffect(() => {
    setMounted(true);

    // 0. Detect user session identity (Creator "You" vs Guest with custom name)
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setIsAuthor(true);
        setClientAuthorName("You");
      } else {
        setIsAuthor(false);
        const savedGuestName = typeof window !== "undefined" ? sessionStorage.getItem("cyath_reviewer_name") : null;
        if (savedGuestName && savedGuestName.trim()) {
          setClientAuthorName(savedGuestName.trim());
        } else {
          setShowGuestPrompt(true);
        }
      }
    });

    if (!shareId || hydratedShareIdRef.current === shareId) {
      return;
    }
    hydratedShareIdRef.current = shareId;

    const currentProjects = Array.isArray(useReviewStore.getState().projects)
      ? useReviewStore.getState().projects.filter(Boolean)
      : [];
    const existing = currentProjects.find((p) => p && p.shareId === shareId);

    // 1. Hydrate from URL search parameters if available (instant zero-network mount)
    const urlParam = searchParams?.get("u");
    const titleParam = searchParams?.get("t");
    const agencyParam = searchParams?.get("a");

    if (urlParam && !urlParam.startsWith("data:")) {
      let decodedUrl = urlParam;
      try {
        decodedUrl = decodeURIComponent(urlParam);
      } catch {
        decodedUrl = urlParam;
      }

      let decodedTitle = titleParam || "Staging Review";
      try {
        if (titleParam) decodedTitle = decodeURIComponent(titleParam);
      } catch { }

      let decodedAgency = agencyParam || "Independent Firm";
      try {
        if (agencyParam) decodedAgency = decodeURIComponent(agencyParam);
      } catch { }

      hydrateProject({
        id: existing?.id || shareId,
        shareId,
        title: decodedTitle,
        targetUrl: decodedUrl,
        agencyName: decodedAgency,
        assetType: "url",
        isApproved: false,
        createdAt: existing?.createdAt || new Date().toISOString(),
        pins: Array.isArray(existing?.pins) ? existing.pins.filter(Boolean) : [],
      });
    }

    // 2. Fetch from server canvas API (pulls full project, pins, and approvals from cloud)
    async function fetchServerCanvas() {
      try {
        const res = await fetch(`/api/canvases/${shareId}`);
        if (res.ok) {
          const serverProject = await res.json();
          if (serverProject && serverProject.shareId) {
            useReviewStore.getState().syncFromServer(serverProject);
            return;
          }
        }
      } catch (e) {
        // Fallback to supabase
      }
    }

    fetchServerCanvas();

    // 3. Attempt async query from Supabase in background
    async function fetchFromSupabase() {
      try {
        const { data, error } = await supabase
          .from("projects")
          .select("*, pins(*, comments(*))")
          .eq("share_id", shareId)
          .maybeSingle();

        if (data && !error) {
          const remoteProject: Project = {
            id: data.id,
            shareId: data.share_id,
            title: data.title,
            targetUrl: data.target_url,
            agencyName: data.agency_name || "Independent Firm",
            isApproved: data.is_approved,
            approvedAt: data.approved_at,
            approvedBy: data.approved_by,
            approvalSignature: data.approval_signature,
            createdAt: data.created_at,
            pins: (Array.isArray(data.pins) ? data.pins : []).filter(Boolean).map((pin: any) => ({
              id: pin.id,
              projectId: pin.project_id,
              number: pin.number || 1,
              xPercent: typeof pin.x_percent === "number" ? pin.x_percent : 50,
              yPercent: typeof pin.y_percent === "number" ? pin.y_percent : 50,
              status: pin.status || "open",
              deviceMode: pin.device_mode || "desktop",
              pageUrl: pin.page_url || data.target_url,
              telemetry: pin.telemetry || {},
              createdAt: pin.created_at || new Date().toISOString(),
              resolvedAt: pin.resolved_at,
              resolvedBy: pin.resolved_by,
              comments: (Array.isArray(pin.comments) ? pin.comments : []).filter(Boolean).map((c: any) => ({
                id: c.id,
                pinId: c.pin_id,
                authorName: c.author_name || "Reviewer",
                authorRole: c.author_role || "client",
                content: c.content || "",
                createdAt: c.created_at || new Date().toISOString(),
              })),
            })),
          };
          hydrateProject(remoteProject);
        }
      } catch {
        // Silent fallback
      }
    }

    fetchFromSupabase();

    const interval = setInterval(fetchServerCanvas, 3500);
    const handleFocus = () => fetchServerCanvas();
    window.addEventListener("focus", handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [shareId, searchParams, hydrateProject, setClientAuthorName]);

  // Keyboard hotkeys: C (Comment), V (Browse), 1/2/3/4 (Devices), Esc (Deselect)
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === "c" || e.key === "C") {
        setInteractionMode("comment");
      } else if (e.key === "v" || e.key === "V") {
        setInteractionMode("browse");
      } else if (e.key === "1") {
        setActiveDeviceMode("desktop");
      } else if (e.key === "2") {
        setActiveDeviceMode("tablet");
      } else if (e.key === "3") {
        setActiveDeviceMode("mobile");
      } else if (e.key === "4" || e.key === "f" || e.key === "F") {
        const currentMode = useReviewStore.getState().activeDeviceMode;
        setActiveDeviceMode(currentMode === "full" ? "desktop" : "full");
      } else if (e.key === "Escape") {
        const currentMode = useReviewStore.getState().activeDeviceMode;
        if (activePinId) {
          setActivePinId(null);
        } else if (fullSidebarOpen) {
          setFullSidebarOpen(false);
        } else if (currentMode === "full") {
          setActiveDeviceMode("desktop");
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeys);
    return () => window.removeEventListener("keydown", handleGlobalKeys);
  }, [setInteractionMode, setActiveDeviceMode, setActivePinId, activePinId, fullSidebarOpen]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center text-xs text-zinc-500 font-mono">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span>Mounting staging session...</span>
        </div>
      </div>
    );
  }

  const safeProjects = Array.isArray(projects) ? projects.filter(Boolean) : [];
  const project = safeProjects.find((p) => p && p.shareId === shareId);

  // If session is unmapped (e.g. visited naked /r/[shareId] with no local cache and no search params)
  if (!project) {
    const handleManualMount = (e: React.FormEvent) => {
      e.preventDefault();
      if (!manualUrl.trim()) return;

      let formatted = manualUrl.trim();
      if (!formatted.startsWith("http://") && !formatted.startsWith("https://")) {
        formatted = "https://" + formatted;
      }

      const title = manualTitle.trim() || "Staging Review";
      const newProj: Project = {
        id: shareId,
        shareId,
        title,
        targetUrl: formatted,
        agencyName: "Independent Firm",
        isApproved: false,
        createdAt: new Date().toISOString(),
        pins: [],
      };

      hydrateProject(newProj);

      // Persist to cloud API
      fetch(`/api/canvases/${shareId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProj),
      }).catch(() => { });

      // Keep address bar in sync
      const params = new URLSearchParams();
      params.set("u", formatted);
      params.set("t", title);
      router.replace(`/r/${shareId}?${params.toString()}`);
    };

    return (
      <div className="min-h-screen bg-[#000000] flex flex-col items-center justify-center p-6 text-center text-white selection:bg-white selection:text-black">
        <div className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 shadow-2xl relative">
          <div className="flex justify-center mb-6">
            <TesseractMark size={36} />
          </div>

          <h1 className="text-xl font-serif font-medium text-white mb-2">
            Connect Project URL
          </h1>
          <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
            This review link does not have a cached target URL. Enter the project or preview URL to load this session.
          </p>

          <form onSubmit={handleManualMount} className="space-y-4 text-left">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                Preview or Production URL
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="https://preview.domain.com"
                  value={manualUrl}
                  onChange={(e) => setManualUrl(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 font-mono"
                />
                <Globe className="w-3.5 h-3.5 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                Project Title (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Client Web Redesign"
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-white hover:bg-zinc-200 text-black font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer active:scale-[0.96]"
            >
              <span>Open Project Review</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/[0.08] flex items-center justify-center">
            <Link
              href="/dashboard"
              className="text-xs text-zinc-500 hover:text-zinc-300 font-mono flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleAddPin = (
    xPercent: number,
    yPercent: number,
    comment: string,
    authorName: string,
    pageUrl?: string,
    widthPercent?: number,
    heightPercent?: number,
    annotationType?: "point" | "box",
    domAnchor?: import("@/types").DomAnchor,
    audioUrl?: string,
    audioDurationSeconds?: number
  ) => {
    const telemetry = captureClientTelemetry(activeDeviceMode);
    addPin(project.id, xPercent, yPercent, telemetry, comment, authorName, pageUrl, widthPercent, heightPercent, annotationType, domAnchor, audioUrl, audioDurationSeconds);
  };

  const handleAddComment = (pinId: string, content: string, authorName: string) => {
    addComment(project.id, pinId, content, authorName, "client");
  };

  const handleToggleResolve = (pinId: string) => {
    toggleResolvePin(project.id, pinId);
  };

  const handleSaveGuestName = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = guestNameInput.trim() || "Guest Reviewer";
    if (typeof window !== "undefined") {
      sessionStorage.setItem("cyath_reviewer_name", finalName);
    }
    setClientAuthorName(finalName);
    setShowGuestPrompt(false);
  };

  const handleCopyProjectLink = () => {
    if (typeof window !== "undefined" && project) {
      let fullUrl = `${window.location.origin}/r/${project.shareId}`;
      if (project.targetUrl && !project.targetUrl.startsWith("data:")) {
        const params = new URLSearchParams();
        params.set("u", project.targetUrl);
        if (project.title) params.set("t", project.title);
        if (project.agencyName) params.set("a", project.agencyName);
        fullUrl = `${window.location.origin}/r/${project.shareId}?${params.toString()}`;
      }
      navigator.clipboard.writeText(fullUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleApprove = (approverName: string, organization?: string) => {
    approveProject(project.id, approverName, organization);
    setShowApprovalModal(false);
  };

  const isFullMode = activeDeviceMode === "full";

  return (
    <div
      className={`h-screen flex flex-col transition-colors duration-200 selection:bg-stone-300 selection:text-black relative overflow-hidden no-scrollbar ${isDay ? "bg-[#FBF9F4] text-[#1C1917]" : "bg-[#000000] text-white"
        }`}
    >
      {/* Vertical Floating Icon Rail with Warm Tooltips (Hidden in Fullscreen) */}
      {!isFullMode && !isNativeFullscreen && (
        <aside
          className={`fixed left-3 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-1.5 p-1.5 rounded-2xl border shadow-2xl backdrop-blur-2xl transition-all duration-200 select-none ${
            isDay
              ? "bg-white/95 border-stone-300 text-stone-900 shadow-stone-300/50"
              : "bg-[#0a0a0d]/90 border-white/15 text-white shadow-black/80"
          }`}
        >
          {/* Logo & Return to Dashboard */}
          <WarmTooltip content="Return to Dashboard" theme={theme} position="right">
            <Link
              href="/dashboard"
              prefetch={true}
              className={`p-2 rounded-xl transition-all duration-150 active:scale-[0.92] ${
                isDay ? "hover:bg-stone-200 text-stone-900" : "hover:bg-white/10 text-white"
              }`}
            >
              <TesseractMark size={20} className={isDay ? "text-stone-900" : "text-white"} />
            </Link>
          </WarmTooltip>

          <div className={`w-5 h-px ${isDay ? "bg-stone-300" : "bg-white/15"} my-0.5`} />

          {/* Expand Drawer Button */}
          <WarmTooltip content="Project Details & Controls" theme={theme} position="right">
            <button
              onClick={() => setProjectSidebarOpen(true)}
              className={`p-2 rounded-xl transition-all duration-150 cursor-pointer active:scale-[0.92] ${
                isDay ? "hover:bg-stone-200 text-stone-700 hover:text-stone-950" : "hover:bg-white/10 text-zinc-300 hover:text-white"
              }`}
              title="Expand Details"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </WarmTooltip>

          {/* Share Link */}
          <WarmTooltip content={copiedLink ? "Link Copied!" : "Copy Share Link"} theme={theme} position="right">
            <button
              onClick={handleCopyProjectLink}
              className={`p-2 rounded-xl transition-all duration-150 cursor-pointer active:scale-[0.92] ${
                isDay ? "hover:bg-stone-200 text-stone-700 hover:text-stone-950" : "hover:bg-white/10 text-zinc-300 hover:text-white"
              }`}
              title="Copy Share Link"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>
          </WarmTooltip>

          {/* Audio Toggle (if web URL) */}
          {project.assetType === "url" && (
            <WarmTooltip content={isAudioMuted ? "Unmute Preview Audio" : "Mute Preview Audio"} theme={theme} position="right">
              <button
                onClick={() => setIsAudioMuted((m) => !m)}
                className={`p-2 rounded-xl transition-all duration-150 cursor-pointer active:scale-[0.92] ${
                  isDay ? "hover:bg-stone-200 text-stone-700 hover:text-stone-950" : "hover:bg-white/10 text-zinc-300 hover:text-white"
                }`}
                title="Toggle Audio"
              >
                {isAudioMuted ? <VolumeX className="w-4 h-4 text-zinc-500" /> : <Volume2 className="w-4 h-4 text-white font-semibold" />}
              </button>
            </WarmTooltip>
          )}

          {/* Theme Switcher */}
          <WarmTooltip content={isDay ? "Switch to Night Mode" : "Switch to Day Mode"} theme={theme} position="right">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl transition-all duration-150 cursor-pointer active:scale-[0.92] ${
                isDay ? "hover:bg-stone-200 text-stone-700 hover:text-stone-950" : "hover:bg-white/10 text-zinc-300 hover:text-white"
              }`}
              title="Toggle Theme"
            >
              {isDay ? <Moon className="w-4 h-4" /> : <SunMedium className="w-4 h-4" />}
            </button>
          </WarmTooltip>

          {/* Fullscreen Toggle */}
          <WarmTooltip content={isNativeFullscreen ? "Exit Fullscreen" : "Fullscreen Stage"} theme={theme} position="right">
            <button
              onClick={toggleNativeFullscreen}
              className={`p-2 rounded-xl transition-all duration-150 cursor-pointer active:scale-[0.92] ${
                isDay ? "hover:bg-stone-200 text-stone-700 hover:text-stone-950" : "hover:bg-white/10 text-zinc-300 hover:text-white"
              }`}
              title="Toggle Fullscreen"
            >
              {isNativeFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </WarmTooltip>

          <div className={`w-5 h-px ${isDay ? "bg-stone-300" : "bg-white/15"} my-0.5`} />

          {/* Sign Off Quick Action */}
          <WarmTooltip content={project.isApproved ? "Approved Milestone" : "Sign Off Project"} theme={theme} position="right">
            <button
              onClick={() => setShowApprovalModal(true)}
              className={`p-2 rounded-xl transition-all duration-150 cursor-pointer active:scale-[0.92] ${
                project.isApproved
                  ? "bg-white text-black shadow-md"
                  : isDay
                  ? "hover:bg-stone-200 text-stone-700 hover:text-stone-950"
                  : "hover:bg-white/10 text-zinc-300 hover:text-white"
              }`}
              title="Client Sign-Off"
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </WarmTooltip>
        </aside>
      )}

      {/* Floating Collapsible Project Sidebar Drawer (Hidden in Fullscreen) */}
      {!isFullMode && !isNativeFullscreen && projectSidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs -z-10 animate-in fade-in duration-200"
            onClick={() => setProjectSidebarOpen(false)}
          />
          <div
            className={`w-80 h-full border-r flex flex-col justify-between p-5 shadow-2xl backdrop-blur-2xl animate-in slide-in-from-left duration-200 z-10 ${
              isDay
                ? "bg-[#FBF9F4]/98 border-stone-200 text-stone-900"
                : "bg-[#09090b]/98 border-white/10 text-white"
            }`}
          >
            <div className="space-y-6">
              {/* Header with Brand & Close Button */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TesseractMark size={20} className={isDay ? "text-stone-900" : "text-white"} />
                  <span className="font-sans font-bold text-sm tracking-tight">cyath</span>
                </div>
                <button
                  onClick={() => setProjectSidebarOpen(false)}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    isDay ? "hover:bg-stone-200 text-stone-600" : "hover:bg-white/10 text-zinc-400 hover:text-white"
                  }`}
                  title="Collapse Sidebar"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              </div>

              {/* Return to Dashboard */}
              <Link
                href="/dashboard"
                className={`flex items-center gap-2 text-xs font-mono py-2 px-2.5 rounded-lg border transition-colors ${
                  isDay
                    ? "border-stone-200 hover:bg-stone-100 text-stone-700 hover:text-stone-950"
                    : "border-white/10 hover:bg-white/[0.06] text-zinc-300 hover:text-white"
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Dashboard</span>
              </Link>

              {/* Project Info Section */}
              <div className="space-y-2 pt-2">
                <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                  {project.agencyName || "Independent Studio"}
                </div>
                <h2 className="font-serif text-lg font-medium tracking-tight break-words">
                  {project.title}
                </h2>

                {project.targetUrl && (
                  <div
                    className={`flex items-center justify-between text-xs font-mono p-2.5 rounded-lg border mt-2 ${
                      isDay ? "bg-stone-100/70 border-stone-200 text-stone-700" : "bg-white/[0.03] border-white/10 text-zinc-300"
                    }`}
                  >
                    <span className="truncate max-w-[190px]">{project.targetUrl}</span>
                    <a
                      href={project.targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-400 hover:text-white p-0.5"
                      title="Open in new window"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}

                <button
                  onClick={handleCopyProjectLink}
                  className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg border text-xs font-mono transition-colors cursor-pointer active:scale-[0.98] ${
                    isDay
                      ? "border-stone-200 hover:bg-stone-100 text-stone-700"
                      : "border-white/10 hover:bg-white/[0.06] text-zinc-200"
                  }`}
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{copiedLink ? "Link Copied!" : "Copy Share Link"}</span>
                </button>
              </div>

              {/* Controls Section */}
              <div className="space-y-1.5 pt-4 border-t border-white/[0.08]">
                {project.assetType === "url" && (
                  <button
                    onClick={() => setIsAudioMuted((m) => !m)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                      isDay ? "hover:bg-stone-100 text-stone-700" : "hover:bg-white/[0.06] text-zinc-300"
                    }`}
                  >
                    <span>Preview Audio</span>
                    <span className="flex items-center gap-1.5 text-[11px]">
                      {isAudioMuted ? (
                        <><VolumeX className="w-3.5 h-3.5 text-zinc-500" /> Muted</>
                      ) : (
                        <><Volume2 className="w-3.5 h-3.5 text-white font-semibold" /> Active</>
                      )}
                    </span>
                  </button>
                )}

                <button
                  onClick={toggleTheme}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                    isDay ? "hover:bg-stone-100 text-stone-700" : "hover:bg-white/[0.06] text-zinc-300"
                  }`}
                >
                  <span>Appearance</span>
                  <span className="flex items-center gap-1.5 text-[11px]">
                    {isDay ? <><SunMedium className="w-3.5 h-3.5" /> Day</> : <><Moon className="w-3.5 h-3.5" /> Night</>}
                  </span>
                </button>

                <button
                  onClick={toggleNativeFullscreen}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                    isDay ? "hover:bg-stone-100 text-stone-700" : "hover:bg-white/[0.06] text-zinc-300"
                  }`}
                >
                  <span>Fullscreen</span>
                  <span className="flex items-center gap-1.5 text-[11px]">
                    {isNativeFullscreen ? <><Minimize2 className="w-3.5 h-3.5" /> Windowed</> : <><Maximize2 className="w-3.5 h-3.5" /> Expand</>}
                  </span>
                </button>
              </div>
            </div>

            {/* Bottom Sign-off Trigger */}
            <div className="pt-4 border-t border-white/[0.08]">
              <button
                onClick={() => {
                  setProjectSidebarOpen(false);
                  setShowApprovalModal(true);
                }}
                className="w-full py-2.5 rounded-xl font-mono text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all bg-white text-black hover:bg-zinc-200 active:scale-[0.96] shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{project.isApproved ? "Approved Sign-off" : "Sign Off Project"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Interactive Stage + Sidebar */}
      <div className="flex-1 flex overflow-hidden relative">
        <ReviewStage
          project={project}
          deviceMode={activeDeviceMode}
          interactionMode={interactionMode}
          activePinId={activePinId}
          clientAuthorName={clientAuthorName}
          currentPageUrl={currentPageUrl || project.targetUrl}
          isAudioMuted={isAudioMuted}
          theme={theme}
          onPageNavigated={setCurrentPageUrl}
          onSelectPin={setActivePinId}
          onAddPin={handleAddPin}
          onAddComment={handleAddComment}
          onToggleResolve={handleToggleResolve}
          onDeletePin={(pinId) => deletePin(project.id, pinId)}
        />

        {/* In Full mode, sidebar is hidden by default for complete 100% immersive screen coverage */}
        {!isFullMode && (
          <FeedbackSidebar
            project={project}
            activePinId={activePinId}
            activeDeviceMode={activeDeviceMode}
            currentPageUrl={currentPageUrl || project.targetUrl}
            theme={theme}
            onSelectPin={setActivePinId}
            onToggleResolve={handleToggleResolve}
            onDeviceChange={setActiveDeviceMode}
          />
        )}

        {/* Enlarged Floating Bottom Dock with High Contrast & Micro-Animations */}
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2.5 py-2.5 px-4 rounded-2xl border shadow-2xl backdrop-blur-2xl transition-all duration-200 select-none ${
            isDay
              ? "bg-white/95 border-stone-300 text-stone-900 shadow-stone-300/40"
              : "bg-[#0a0a0d]/95 border-white/[0.14] text-white shadow-black/80"
          }`}
        >
          {/* Interaction Mode Switchers */}
          <div className={`flex items-center gap-1 p-1 rounded-xl border ${
            isDay ? "bg-stone-100 border-stone-200" : "bg-white/[0.05] border-white/[0.06]"
          }`}>
            <button
              onClick={() => setInteractionMode("browse")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all duration-150 cursor-pointer active:scale-[0.96] ${
                interactionMode === "browse"
                  ? isDay
                    ? "bg-stone-900 text-white font-semibold shadow-sm"
                    : "bg-white text-black font-semibold shadow-md"
                  : isDay
                  ? "text-stone-600 hover:text-stone-900 hover:bg-stone-200/60"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.08]"
              }`}
              title="Browse Mode (Interact with website buttons and links)"
            >
              <MousePointer2 className="w-4 h-4" />
              <span className="hidden sm:inline">Browse</span>
            </button>
            <button
              onClick={() => setInteractionMode("comment")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all duration-150 cursor-pointer active:scale-[0.96] ${
                interactionMode === "comment"
                  ? isDay
                    ? "bg-stone-900 text-white font-semibold shadow-sm"
                    : "bg-white text-black font-semibold shadow-md"
                  : isDay
                  ? "text-stone-600 hover:text-stone-900 hover:bg-stone-200/60"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.08]"
              }`}
              title="Comment Mode (Click to pin notes or drag boxes)"
            >
              <MessageSquarePlus className="w-4 h-4" />
              <span className="hidden sm:inline">Comment</span>
            </button>
          </div>

          <div className={`w-px h-5 mx-0.5 ${isDay ? "bg-stone-300" : "bg-white/20"}`} />

          {/* Viewport Selectors */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveDeviceMode("desktop")}
              className={`p-2 rounded-xl transition-all duration-150 cursor-pointer active:scale-[0.96] ${
                activeDeviceMode === "desktop"
                  ? isDay ? "bg-stone-900 text-white shadow-sm" : "bg-white text-black shadow-md"
                  : isDay ? "text-stone-600 hover:text-stone-900 hover:bg-stone-100" : "text-zinc-400 hover:text-white hover:bg-white/[0.08]"
              }`}
              title="Desktop (1440px)"
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveDeviceMode("tablet")}
              className={`p-2 rounded-xl transition-all duration-150 cursor-pointer active:scale-[0.96] ${
                activeDeviceMode === "tablet"
                  ? isDay ? "bg-stone-900 text-white shadow-sm" : "bg-white text-black shadow-md"
                  : isDay ? "text-stone-600 hover:text-stone-900 hover:bg-stone-100" : "text-zinc-400 hover:text-white hover:bg-white/[0.08]"
              }`}
              title="Tablet (768px)"
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveDeviceMode("mobile")}
              className={`p-2 rounded-xl transition-all duration-150 cursor-pointer active:scale-[0.96] ${
                activeDeviceMode === "mobile"
                  ? isDay ? "bg-stone-900 text-white shadow-sm" : "bg-white text-black shadow-md"
                  : isDay ? "text-stone-600 hover:text-stone-900 hover:bg-stone-100" : "text-zinc-400 hover:text-white hover:bg-white/[0.08]"
              }`}
              title="Mobile (375px)"
            >
              <Smartphone className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveDeviceMode(isFullMode ? "desktop" : "full")}
              className={`p-2 rounded-xl transition-all duration-150 cursor-pointer active:scale-[0.96] ${
                isFullMode
                  ? isDay ? "bg-stone-900 text-white shadow-sm" : "bg-white text-black shadow-md"
                  : isDay ? "text-stone-600 hover:text-stone-900 hover:bg-stone-100" : "text-zinc-400 hover:text-white hover:bg-white/[0.08]"
              }`}
              title={isFullMode ? "Exit Full View" : "Full Stage Mode"}
            >
              {isFullMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>

          <div className={`w-px h-5 mx-0.5 ${isDay ? "bg-stone-300" : "bg-white/20"}`} />

          {/* Audio Mute Indicator */}
          {project.assetType === "url" && (
            <button
              onClick={() => setIsAudioMuted((m) => !m)}
              className={`p-2 rounded-xl transition-all duration-150 cursor-pointer active:scale-[0.96] ${
                isDay ? "text-stone-600 hover:text-stone-900 hover:bg-stone-100" : "text-zinc-400 hover:text-white hover:bg-white/[0.08]"
              }`}
              title={isAudioMuted ? "Unmute preview audio" : "Mute preview audio"}
            >
              {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          )}

          {/* Notes Counter Pill */}
          <button
            onClick={() => {
              if (isFullMode) {
                setFullSidebarOpen(true);
              }
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono transition-all duration-150 cursor-pointer active:scale-[0.96] ${
              isDay
                ? "bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200"
                : "bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 hover:text-white"
            }`}
            title="Feedback threads"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{Array.isArray(project.pins) ? project.pins.filter(Boolean).filter((p) => p.status !== "resolved").length : 0}</span>
          </button>

          {/* Sign-off Approval Trigger */}
          <button
            onClick={() => setShowApprovalModal(true)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-mono font-medium transition-all duration-150 cursor-pointer active:scale-[0.96] ${
              project.isApproved
                ? isDay
                  ? "bg-stone-900 text-white font-semibold shadow-md"
                  : "bg-white text-black font-semibold shadow-md border border-white"
                : isDay
                ? "bg-stone-900 text-white hover:bg-stone-800 shadow-sm"
                : "bg-white text-black hover:bg-zinc-200 shadow-sm"
            }`}
            title="Client Sign-Off"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{project.isApproved ? "Approved" : "Sign Off"}</span>
          </button>
        </div>

        {/* Slide-out Sidebar Drawer when triggered from Full Mode HUD */}
        {isFullMode && fullSidebarOpen && (
          <div className="fixed inset-y-0 right-0 z-50 flex shadow-2xl animate-in slide-in-from-right duration-300">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm -z-10"
              onClick={() => setFullSidebarOpen(false)}
            />
            <div className="relative flex">
              <button
                onClick={() => setFullSidebarOpen(false)}
                className="absolute top-4 left-4 z-50 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Close Notes"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <FeedbackSidebar
                project={project}
                activePinId={activePinId}
                activeDeviceMode={activeDeviceMode}
                currentPageUrl={currentPageUrl || project.targetUrl}
                theme={theme}
                onSelectPin={setActivePinId}
                onToggleResolve={handleToggleResolve}
                onDeviceChange={setActiveDeviceMode}
              />
            </div>
          </div>
        )}
      </div>

      {/* Approval Ceremony Modal */}
      {showApprovalModal && (
        <ApprovalModal
          project={project}
          theme={theme}
          onApprove={handleApprove}
          onRevoke={() => {
            revokeApproval(project.id);
            setShowApprovalModal(false);
          }}
          onClose={() => setShowApprovalModal(false)}
        />
      )}

      {/* Guest Reviewer Identity Prompt Modal */}
      {showGuestPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[#0a0a0c] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5">
              <TesseractMark size={20} className="text-white" />
              <span className="font-sans font-bold text-sm tracking-tight text-white">cyath review</span>
            </div>
            <div>
              <h3 className="font-serif text-lg font-medium text-white mb-1">
                Enter your name to leave notes
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Your name will be attached to any pins, comments, and sign-offs you leave on this review.
              </p>
            </div>
            <form onSubmit={handleSaveGuestName} className="space-y-3">
              <input
                type="text"
                autoFocus
                required
                placeholder="e.g. Alex (Client) or Sarah"
                value={guestNameInput}
                onChange={(e) => setGuestNameInput(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/15 focus:border-white/40 focus:ring-1 focus:ring-white/20 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none font-sans"
              />
              <button
                type="submit"
                className="w-full py-2.5 bg-white text-black font-medium text-xs font-mono rounded-xl hover:bg-zinc-200 transition-all cursor-pointer shadow-sm active:scale-[0.96]"
              >
                Continue to Review
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

