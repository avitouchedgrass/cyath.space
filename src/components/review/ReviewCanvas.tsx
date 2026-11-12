"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Globe, MessageSquare, X, Maximize2, Minimize2 } from "lucide-react";
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
  const hydratedShareIdRef = useRef<string | null>(null);

  const toggleNativeFullscreen = () => {
    if (typeof document === "undefined") return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsNativeFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
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
      } catch {}

      let decodedAgency = agencyParam || "Independent Firm";
      try {
        if (agencyParam) decodedAgency = decodeURIComponent(agencyParam);
      } catch {}

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
      }).catch(() => {});

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
            Connect Staging Canvas
          </h1>
          <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
            This shareable canvas link has not yet cached a deployment URL. Enter the staging target to mount this review session immediately.
          </p>

          <form onSubmit={handleManualMount} className="space-y-4 text-left">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                Staging / Preview URL
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="https://interior-sample.deploy.vercel.app"
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
                placeholder="e.g. Maison Élara Staging"
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-white hover:bg-zinc-200 text-black font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <span>Mount Staging Viewport</span>
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
    pageUrl?: string
  ) => {
    const telemetry = captureClientTelemetry(activeDeviceMode);
    addPin(project.id, xPercent, yPercent, telemetry, comment, authorName, pageUrl);
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
    <div className="min-h-screen bg-[#000000] flex flex-col text-white selection:bg-white selection:text-black relative">
      {/* Top Controls */}
      <ReviewHeader
        project={project}
        deviceMode={activeDeviceMode}
        interactionMode={interactionMode}
        isAudioMuted={isAudioMuted}
        isNativeFullscreen={isNativeFullscreen}
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
            onSelectPin={setActivePinId}
            onToggleResolve={handleToggleResolve}
            onDeviceChange={setActiveDeviceMode}
          />
        )}

        {/* Floating Cinematic HUD Island in Full Mode */}
        {isFullMode && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 p-1.5 rounded-full bg-[#09090c]/90 border border-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.95)] backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-5 duration-300 select-none">
            {/* Mode beacon badge */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-[11px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span>Full View</span>
            </div>

            {/* Current Subpage Indicator */}
            <span className="text-zinc-400 text-xs font-mono truncate max-w-[150px] px-1 hidden sm:inline">
              {formatPageLabel(currentPageUrl || project.targetUrl)}
            </span>

            {/* Open Notes Trigger */}
            <button
              onClick={() => setFullSidebarOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white text-xs font-mono transition-colors cursor-pointer"
              title="Open Feedback Thread"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{Array.isArray(project.pins) ? project.pins.filter(Boolean).filter((p) => p.status !== "resolved").length : 0} notes</span>
            </button>

            {/* Monitor Fullscreen toggle */}
            <button
              onClick={toggleNativeFullscreen}
              className="p-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white transition-colors cursor-pointer"
              title={isNativeFullscreen ? "Exit Display Fullscreen" : "Enter Display Fullscreen"}
            >
              {isNativeFullscreen ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Exit Full Mode Pill */}
            <button
              onClick={() => setActiveDeviceMode("desktop")}
              className="px-3 py-1 rounded-full bg-white text-black font-semibold text-xs font-mono hover:bg-zinc-200 transition-colors cursor-pointer"
              title="Exit Full View (Hotkey: Esc or F)"
            >
              Exit Full
            </button>
          </div>
        )}

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

