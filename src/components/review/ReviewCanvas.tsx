"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Globe, MessageSquare, X, Maximize2, Minimize2, MousePointer2, MessageSquarePlus, Square, Volume2, VolumeX, CheckCircle2, Monitor, Tablet, Smartphone } from "lucide-react";
import { formatPageLabel } from "@/lib/colors";
import { useReviewStore } from "@/store/useReviewStore";
import { ReviewHeader } from "@/components/review/ReviewHeader";
import { ReviewStage } from "@/components/review/ReviewStage";
import { FeedbackSidebar } from "@/components/review/FeedbackSidebar";
import { ApprovalModal } from "@/components/review/ApprovalModal";
import { captureClientTelemetry } from "@/lib/telemetry";
import { createClient } from "@/lib/supabase/client";
import { TesseractMark } from "@/components/common/Logo";
import { Project } from "@/types";

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
  const [currentPageUrl, setCurrentPageUrl] = useState<string>("");
  const [isAudioMuted, setIsAudioMuted] = useState(true);
  const [isNativeFullscreen, setIsNativeFullscreen] = useState(false);
  const [theme, setTheme] = useState<"night" | "day">("night");
  const hydratedShareIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("cyath_theme") as "night" | "day";
      if (saved === "day" || saved === "night") {
        setTheme(saved);
        document.documentElement.setAttribute("data-theme", saved);
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
    hydrateProject,
  } = useReviewStore();

  useEffect(() => {
    setMounted(true);

    // 0. Detect user session identity (Creator "You" vs Guest "Guest Reviewer")
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setIsAuthor(true);
        setClientAuthorName("You");
      } else {
        setIsAuthor(false);
        setClientAuthorName("Guest Reviewer");
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
            hydrateProject(serverProject);
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
    annotationType?: "point" | "box"
  ) => {
    const telemetry = captureClientTelemetry(activeDeviceMode);
    addPin(project.id, xPercent, yPercent, telemetry, comment, authorName, pageUrl, widthPercent, heightPercent, annotationType);
  };

  const handleAddComment = (pinId: string, content: string, authorName: string) => {
    addComment(project.id, pinId, content, authorName, "client");
  };

  const handleToggleResolve = (pinId: string) => {
    toggleResolvePin(project.id, pinId);
  };

  const handleApprove = (approverName: string, organization?: string) => {
    approveProject(project.id, approverName, organization);
    setShowApprovalModal(false);
  };

  const isFullMode = activeDeviceMode === "full";

  return (
    <div
      className={`h-screen flex flex-col transition-colors duration-200 selection:bg-stone-300 selection:text-black relative overflow-hidden ${isDay ? "bg-[#FBF9F4] text-[#1C1917]" : "bg-[#000000] text-white"
        }`}
    >
      {/* Top Controls */}
      <ReviewHeader
        project={project}
        deviceMode={activeDeviceMode}
        interactionMode={interactionMode}
        isAudioMuted={isAudioMuted}
        isNativeFullscreen={isNativeFullscreen}
        theme={theme}
        onToggleTheme={toggleTheme}
        onDeviceChange={setActiveDeviceMode}
        onInteractionModeChange={setInteractionMode}
        onOpenApproval={() => setShowApprovalModal(true)}
        onToggleAudioMute={() => setIsAudioMuted((m) => !m)}
        onToggleNativeFullscreen={toggleNativeFullscreen}
      />

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

        {/* Figma-style Floating Bottom Dock with Micro-Animations */}
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 p-1.5 rounded-full bg-[#0a0a0a]/90 border border-white/[0.12] shadow-[0_20px_50px_rgba(0,0,0,0.85)] backdrop-blur-2xl transition-all duration-200 select-none">
          {/* Interaction Mode Switchers */}
          <div className="flex items-center gap-1 bg-white/[0.05] p-0.5 rounded-full border border-white/[0.06]">
            <button
              onClick={() => setInteractionMode("browse")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono transition-all duration-150 cursor-pointer active:scale-[0.96] ${
                interactionMode === "browse"
                  ? "bg-white text-black font-semibold shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.08]"
              }`}
              title="Browse Mode (Interact with page)"
            >
              <MousePointer2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Browse</span>
            </button>
            <button
              onClick={() => setInteractionMode("comment")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono transition-all duration-150 cursor-pointer active:scale-[0.96] ${
                interactionMode === "comment"
                  ? "bg-white text-black font-semibold shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.08]"
              }`}
              title="Comment Mode (Click to pin, or drag to draw box)"
            >
              <MessageSquarePlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Comment</span>
            </button>
          </div>

          <div className="w-px h-4 bg-white/15 mx-0.5" />

          {/* Viewport Selectors */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setActiveDeviceMode("desktop")}
              className={`p-1.5 rounded-full transition-all duration-150 cursor-pointer active:scale-[0.96] ${
                activeDeviceMode === "desktop"
                  ? "bg-white text-black shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.08]"
              }`}
              title="Desktop (1440px)"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setActiveDeviceMode("tablet")}
              className={`p-1.5 rounded-full transition-all duration-150 cursor-pointer active:scale-[0.96] ${
                activeDeviceMode === "tablet"
                  ? "bg-white text-black shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.08]"
              }`}
              title="Tablet (768px)"
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setActiveDeviceMode("mobile")}
              className={`p-1.5 rounded-full transition-all duration-150 cursor-pointer active:scale-[0.96] ${
                activeDeviceMode === "mobile"
                  ? "bg-white text-black shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.08]"
              }`}
              title="Mobile (375px)"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setActiveDeviceMode(isFullMode ? "desktop" : "full")}
              className={`p-1.5 rounded-full transition-all duration-150 cursor-pointer active:scale-[0.96] ${
                isFullMode
                  ? "bg-white text-black shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.08]"
              }`}
              title={isFullMode ? "Exit Full View" : "Full Stage Mode"}
            >
              {isFullMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="w-px h-4 bg-white/15 mx-0.5" />

          {/* Audio Mute Indicator */}
          {project.assetType === "url" && (
            <button
              onClick={() => setIsAudioMuted((m) => !m)}
              className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-all duration-150 cursor-pointer active:scale-[0.96]"
              title={isAudioMuted ? "Unmute preview audio" : "Mute preview audio"}
            >
              {isAudioMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Notes Counter Pill */}
          <button
            onClick={() => {
              if (isFullMode) {
                setFullSidebarOpen(true);
              }
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white text-xs font-mono transition-all duration-150 cursor-pointer active:scale-[0.96]"
            title="Feedback threads"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{Array.isArray(project.pins) ? project.pins.filter(Boolean).filter((p) => p.status !== "resolved").length : 0}</span>
          </button>

          {/* Sign-off Approval Trigger */}
          <button
            onClick={() => setShowApprovalModal(true)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium transition-all duration-150 cursor-pointer active:scale-[0.96] ${
              project.isApproved
                ? "bg-white text-black font-semibold shadow-md border border-white"
                : "bg-white text-black hover:bg-zinc-200"
            }`}
            title="Client Sign-Off"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
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
          onApprove={handleApprove}
          onClose={() => setShowApprovalModal(false)}
        />
      )}
    </div>
  );
}

