"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Globe } from "lucide-react";
import { useReviewStore } from "@/store/useReviewStore";
import { ReviewHeader } from "@/components/review/ReviewHeader";
import { ReviewStage } from "@/components/review/ReviewStage";
import { FeedbackSidebar } from "@/components/review/FeedbackSidebar";
import { ApprovalModal } from "@/components/review/ApprovalModal";
import { captureClientTelemetry } from "@/lib/telemetry";
import { createClient } from "@/lib/supabase/client";
import { TesseractMark } from "@/components/common/Logo";
import { Project } from "@/types";

function ReviewCanvasInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const shareId = params?.shareId as string;

  const [mounted, setMounted] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [manualUrl, setManualUrl] = useState("");
  const [manualTitle, setManualTitle] = useState("");
  const [isAuthor, setIsAuthor] = useState(false);
  const hydratedShareIdRef = React.useRef<string | null>(null);

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

    const currentProjects = useReviewStore.getState().projects;
    const existing = currentProjects.find((p) => p.shareId === shareId);

    // 2. Hydrate from URL search parameters if available (instant zero-network mount)
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

      let decodedAgency = agencyParam || "Independent Studio";
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
        pins: existing?.pins || [],
      });
    }

    // 3. Fetch from server canvas API (pulls full project, pins, and approvals from cloud)
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
        // Fallback
      }
    }

    fetchServerCanvas();

    // 4. Attempt async query from Supabase in background
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
            agencyName: data.agency_name || "Independent Studio",
            isApproved: data.is_approved,
            approvedAt: data.approved_at,
            approvedBy: data.approved_by,
            approvalSignature: data.approval_signature,
            createdAt: data.created_at,
            pins: (data.pins || []).map((pin: any) => ({
              id: pin.id,
              projectId: pin.project_id,
              number: pin.number,
              xPercent: pin.x_percent,
              yPercent: pin.y_percent,
              status: pin.status,
              deviceMode: pin.device_mode,
              pageUrl: pin.page_url,
              telemetry: pin.telemetry || {},
              createdAt: pin.created_at,
              resolvedAt: pin.resolved_at,
              resolvedBy: pin.resolved_by,
              comments: (pin.comments || []).map((c: any) => ({
                id: c.id,
                pinId: c.pin_id,
                authorName: c.author_name,
                authorRole: c.author_role,
                content: c.content,
                createdAt: c.created_at,
              })),
            })),
          };
          hydrateProject(remoteProject);
        }
      } catch {
        // Table might not exist yet; silent fallback
      }
    }

    fetchFromSupabase();
  }, [shareId, searchParams, hydrateProject, setClientAuthorName]);

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

  const project = projects.find((p) => p.shareId === shareId);

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
        agencyName: "Independent Studio",
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

          <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 block mb-2">
            Staging Viewport // {shareId}
          </span>
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
              className="w-full py-2.5 bg-white hover:bg-zinc-200 text-black font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm"
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
    authorName: string
  ) => {
    const telemetry = captureClientTelemetry(activeDeviceMode);
    addPin(project.id, xPercent, yPercent, telemetry, comment, authorName);
  };

  const handleAddComment = (pinId: string, content: string, authorName: string) => {
    addComment(project.id, pinId, content, authorName, "client");
  };

  // Keyboard hotkeys: C (Comment), V (Browse), 1/2/3 (Devices), Esc (Deselect)
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
        setActiveDeviceMode("full");
      } else if (e.key === "Escape") {
        setActivePinId(null);
      }
    };

    window.addEventListener("keydown", handleGlobalKeys);
    return () => window.removeEventListener("keydown", handleGlobalKeys);
  }, [setInteractionMode, setActiveDeviceMode, setActivePinId]);

  const handleToggleResolve = (pinId: string) => {
    toggleResolvePin(project.id, pinId);
  };

  const handleApprove = (approverName: string, organization?: string) => {
    approveProject(project.id, approverName, organization);
    setShowApprovalModal(false);
  };

  return (
    <div className="min-h-screen bg-[#000000] flex flex-col text-white selection:bg-white selection:text-black">
      {/* Top Controls */}
      <ReviewHeader
        project={project}
        deviceMode={activeDeviceMode}
        interactionMode={interactionMode}
        onDeviceChange={setActiveDeviceMode}
        onInteractionModeChange={setInteractionMode}
        onOpenApproval={() => setShowApprovalModal(true)}
      />

      {/* Main Interactive Stage + Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        <ReviewStage
          project={project}
          deviceMode={activeDeviceMode}
          interactionMode={interactionMode}
          activePinId={activePinId}
          clientAuthorName={clientAuthorName}
          onSelectPin={setActivePinId}
          onAddPin={handleAddPin}
          onAddComment={handleAddComment}
          onToggleResolve={handleToggleResolve}
          onDeletePin={(pinId) => deletePin(project.id, pinId)}
        />

        <FeedbackSidebar
          project={project}
          activePinId={activePinId}
          activeDeviceMode={activeDeviceMode}
          onSelectPin={setActivePinId}
          onToggleResolve={handleToggleResolve}
          onDeviceChange={setActiveDeviceMode}
        />
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

export default function ReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#000000] flex items-center justify-center text-xs text-zinc-500 font-mono">
          Mounting staging canvas...
        </div>
      }
    >
      <ReviewCanvasInner />
    </Suspense>
  );
}
