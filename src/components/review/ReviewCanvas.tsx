"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, MessageSquare, Moon, Share2, SunMedium, Volume2, VolumeX } from "lucide-react";
import { nanoid } from "nanoid";
import { ApprovalModal } from "@/components/review/ApprovalModal";
import { FeedbackSidebar } from "@/components/review/FeedbackSidebar";
import { ReviewStage } from "@/components/review/ReviewStage";
import { ModalDialog } from "@/components/common/ModalDialog";
import type { ReviewAction } from "@/lib/review-actions";
import { jsonRequest, reviewErrorMessage, reviewRequest, ReviewRequestError } from "@/lib/reviews/client";
import { useTheme } from "@/lib/theme";
import { useReviewStore } from "@/store/useReviewStore";
import type { ClientTelemetry, DeviceMode, DomAnchor, Project } from "@/types";

const modes: { id: DeviceMode; label: string }[] = [
  { id: "desktop", label: "Desktop" },
  { id: "tablet", label: "Tablet" },
  { id: "mobile", label: "Mobile" },
  { id: "full", label: "Full width" },
];

export function ReviewCanvas({ shareId }: { shareId: string }) {
  const [approval, setApproval] = useState<string>();
  const { theme, isDay, toggle: toggleTheme } = useTheme();
  const {
    activePinId, activeDeviceMode, interactionMode, setActivePinId, setActiveDeviceMode, setInteractionMode,
  } = useReviewStore();
  const [project, setProject] = useState<Project>();
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [status, setStatus] = useState("");
  const [retry, setRetry] = useState(0);
  const [currentPage, setCurrentPage] = useState("");
  const [showApproval, setShowApproval] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [muted, setMuted] = useState(true);
  const [reviewerName, setReviewerName] = useState(() =>
    typeof window === "undefined" ? "" : sessionStorage.getItem("cyath_reviewer_name") || "",
  );

  const receive = useCallback((next: Project) => {
    setProject(current => current?.shareId === next.shareId && (current.revision ?? 0) > (next.revision ?? 0) ? current : next);
  }, []);

  useEffect(() => {
    function readApproval() {
      setApproval(new URLSearchParams(window.location.hash.slice(1)).get("approval") ?? undefined);
    }
    readApproval();
    window.addEventListener("hashchange", readApproval);
    return () => window.removeEventListener("hashchange", readApproval);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let inFlight = false;
    async function load() {
      if (inFlight || controller.signal.aborted) return;
      inFlight = true;
      try {
        const next = await reviewRequest<Project>(`/api/canvases/${encodeURIComponent(shareId)}`, {
          signal: controller.signal,
          headers: approval ? { "X-Cyath-Approval": approval } : undefined,
        });
        if (controller.signal.aborted) return;
        receive(next);
        setLoadError("");
      } catch (error) {
        if (controller.signal.aborted) return;
        if (error instanceof ReviewRequestError && error.status === 404) setProject(undefined);
        setLoadError(reviewErrorMessage(error));
      } finally {
        inFlight = false;
      }
    }
    void load();
    const timer = setInterval(load, 3500);
    window.addEventListener("focus", load);
    return () => {
      controller.abort();
      clearInterval(timer);
      window.removeEventListener("focus", load);
    };
  }, [approval, receive, retry, shareId]);

  useEffect(() => {
    setActivePinId(null);
  }, [setActivePinId, shareId]);

  async function change(action: ReviewAction) {
    setActionError("");
    const result = await reviewRequest<{ project: Project; approvalToken?: string }>(
      `/api/canvases/${encodeURIComponent(shareId)}`, jsonRequest("PATCH", action, approval),
    );
    receive(result.project);
    return result;
  }

  async function addPin(
    x: number, y: number, content: string, name: string, pageUrl?: string, width?: number, height?: number,
    _annotationType?: "point" | "box", anchor?: DomAnchor, audioUrl?: string, audioDuration?: number,
    telemetry?: ClientTelemetry, requestId?: string,
  ) {
    const id = requestId ?? nanoid();
    if (!telemetry) throw new Error("The preview is still loading. Try again once it is ready.");
    await change({ type: "addPin", id, x, y, content, name, pageUrl, width, height, anchor, audioUrl, audioDuration, telemetry });
    sessionStorage.setItem("cyath_reviewer_name", name);
    setReviewerName(name);
    setActivePinId(id);
    setStatus("Feedback saved.");
  }

  async function reply(pinId: string, content: string, name: string, id = nanoid()) {
    await change({ type: "reply", pinId, content, name, id });
    setStatus("Reply saved.");
  }

  function resolve(pinId: string) {
    const pin = project?.pins.find(item => item.id === pinId);
    if (!pin) return;
    void change({ type: "status", pinId, status: pin.status === "resolved" ? "open" : "resolved" })
      .catch(error => setActionError(reviewErrorMessage(error)));
  }

  function selectPin(pinId: string | null) {
    setActivePinId(pinId);
    if (pinId) setShowNotes(false);
  }

  async function copyLink(forApproval: boolean) {
    setActionError("");
    try {
      const link = new URL(`/r/${encodeURIComponent(shareId)}`, window.location.origin);
      if (forApproval) {
        const { approvalToken } = await change({ type: "approvalLink" });
        if (!approvalToken) throw new Error("Could not create an approval link.");
        link.hash = new URLSearchParams({ approval: approvalToken }).toString();
      }
      await navigator.clipboard.writeText(link.href);
      setStatus(forApproval ? "Approval link copied. It expires in seven days." : "Review link copied.");
    } catch (error) {
      setActionError(reviewErrorMessage(error));
    }
  }

  if (!project || project.shareId !== shareId) {
    return (
      <main className="min-h-dvh grid place-items-center bg-[#0a0a0c] p-6 text-white">
        <div className="max-w-sm space-y-4 text-center">
          <h1 className="font-serif text-2xl">{loadError ? "Review unavailable" : "Opening review"}</h1>
          <p role={loadError ? "alert" : "status"} className="text-sm text-zinc-300">
            {loadError || "Connecting to the studio’s review."}
          </p>
          {loadError && (
            <button type="button" className="rounded-lg border border-white/30 px-4 py-2" onClick={() => setRetry(value => value + 1)}>Try again</button>
          )}
        </div>
      </main>
    );
  }

  const { canManage, canApprove } = project.access ?? { canManage: false, canApprove: false };
  const canComment = !project.isApproved;
  const showSidebar = activeDeviceMode !== "full";
  const button = `rounded-lg border px-3 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 ${isDay ? "border-stone-300 hover:bg-stone-100" : "border-white/25 hover:bg-white/10"}`;
  const sidebar = (
    <FeedbackSidebar project={project} activePinId={activePinId} activeDeviceMode={activeDeviceMode}
      currentPageUrl={currentPage || project.targetUrl} theme={theme} onSelectPin={selectPin}
      onToggleResolve={canManage && canComment ? resolve : undefined} onDeviceChange={setActiveDeviceMode} />
  );

  return (
    <main className={`flex h-dvh min-w-0 flex-col overflow-hidden ${isDay ? "bg-[#FBF9F4] text-stone-950" : "bg-black text-white"}`}>
      <header className={`z-10 flex flex-wrap items-center justify-between gap-2 border-b p-2 md:px-4 ${isDay ? "border-stone-200" : "border-white/15"}`}>
        <div className="min-w-0 px-1">
          {canManage && <Link href="/dashboard" className="text-sm underline">Projects</Link>}
          <h1 className="font-serif text-lg [overflow-wrap:anywhere]">{project.title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button type="button" className={`${button} ${showSidebar ? "md:hidden" : ""}`} onClick={() => setShowNotes(true)}>
            <MessageSquare aria-hidden="true" className="mr-1 inline h-4 w-4" /> Notes ({project.pins.length})
          </button>
          {canManage && <button type="button" className={button} onClick={() => void copyLink(false)}>
            <Share2 aria-hidden="true" className="mr-1 inline h-4 w-4" /> Share
          </button>}
          {canManage && canComment && <button type="button" className={button} onClick={() => void copyLink(true)}>Copy approval link</button>}
          {(canApprove || project.isApproved) && <button type="button" className={button} onClick={() => setShowApproval(true)}>
            <CheckCircle2 aria-hidden="true" className="mr-1 inline h-4 w-4" /> {project.isApproved ? "Approval receipt" : "Finish review"}
          </button>}
          <button type="button" className={button} onClick={toggleTheme} aria-label={isDay ? "Use dark theme" : "Use light theme"}>
            {isDay ? <Moon aria-hidden="true" className="h-4 w-4" /> : <SunMedium aria-hidden="true" className="h-4 w-4" />}
          </button>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2 px-3 py-2">
        {canComment && <div className="flex gap-1" aria-label="Review mode" role="group">
          {(["browse", "comment"] as const).map(mode => (
            <button key={mode} type="button" className={button} aria-pressed={interactionMode === mode}
              onClick={() => setInteractionMode(mode)}>{mode === "browse" ? "Browse" : "Comment"}</button>
          ))}
        </div>}
        <label className="sr-only" htmlFor="review-viewport">Preview size</label>
        <select id="review-viewport" className={`${button} ${isDay ? "bg-[#FBF9F4]" : "bg-black"}`}
          value={activeDeviceMode} onChange={event => setActiveDeviceMode(event.target.value as DeviceMode)}>
          {modes.map(mode => <option key={mode.id} value={mode.id}>{mode.label}</option>)}
        </select>
        {project.assetType === "url" && <button type="button" className={button} onClick={() => setMuted(value => !value)}
          aria-label={muted ? "Unmute preview" : "Mute preview"}>
          {muted ? <VolumeX aria-hidden="true" className="h-4 w-4" /> : <Volume2 aria-hidden="true" className="h-4 w-4" />}
        </button>}
        {(loadError || actionError) && <p role="alert" className="basis-full text-sm text-red-500">{actionError || loadError}</p>}
        <p role="status" className="text-sm">{status}</p>
      </div>

      <div className="relative flex min-h-0 min-w-0 flex-1 overflow-hidden">
        <ReviewStage project={project} deviceMode={activeDeviceMode} interactionMode={canComment ? interactionMode : "browse"}
          activePinId={activePinId} clientAuthorName={reviewerName || (canManage ? "Studio" : "Guest Reviewer")}
          currentPageUrl={currentPage || project.targetUrl} isAudioMuted={muted} theme={theme}
          canComment={canComment} onPageNavigated={setCurrentPage} onSelectPin={selectPin}
          onAddPin={addPin} onAddComment={canComment ? reply : undefined}
          onToggleResolve={canManage && canComment ? resolve : undefined}
          onDeletePin={canManage && canComment ? pinId => {
            void change({ type: "deletePin", pinId }).then(() => setActivePinId(null))
              .catch(error => setActionError(reviewErrorMessage(error)));
          } : undefined} />
        {showSidebar && <div className="hidden h-full min-h-0 w-80 shrink-0 md:block xl:w-96">{sidebar}</div>}
      </div>

      {showNotes && <ModalDialog title="Review notes" onClose={() => setShowNotes(false)} className="ml-auto mr-0 h-dvh max-h-none w-full max-w-sm rounded-none">
        <div className="min-h-0 flex-1">{sidebar}</div>
      </ModalDialog>}

      {showApproval && <ApprovalModal project={project} theme={theme}
        onApprove={canApprove ? async (name, organization) => { await change({ type: "approve", name, organization }); } : undefined}
        onRevoke={canManage ? async () => { await change({ type: "reopen" }); } : undefined}
        onClose={() => setShowApproval(false)} />}
    </main>
  );
}
