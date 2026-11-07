"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useReviewStore } from "@/store/useReviewStore";
import { ReviewHeader } from "@/components/review/ReviewHeader";
import { ReviewStage } from "@/components/review/ReviewStage";
import { FeedbackSidebar } from "@/components/review/FeedbackSidebar";
import { ApprovalModal } from "@/components/review/ApprovalModal";
import { captureClientTelemetry } from "@/lib/telemetry";

function ReviewCanvasInner() {
  const params = useParams();
  const shareId = params?.shareId as string;

  const [mounted, setMounted] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  const {
    projects,
    activePinId,
    activeDeviceMode,
    interactionMode,
    clientAuthorName,
    setActivePinId,
    setActiveDeviceMode,
    setInteractionMode,
    addPin,
    addComment,
    toggleResolvePin,
    approveProject,
  } = useReviewStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center text-xs text-[#A1A1AA] font-mono">
        Loading staging canvas...
      </div>
    );
  }

  const project = projects.find((p) => p.shareId === shareId);

  if (!project) {
    return (
      <div className="min-h-screen bg-[#09090B] flex flex-col items-center justify-center p-6 text-center text-[#FAFAFA]">
        <div className="w-12 h-12 rounded-2xl bg-[#18181B] border border-[#27272A] flex items-center justify-center text-[#F59E0B] font-bold text-lg mb-4">
          C
        </div>
        <h1 className="text-xl font-bold mb-2">Review Canvas Not Found</h1>
        <p className="text-xs text-[#A1A1AA] max-w-sm mb-6">
          The link <code className="text-[#F59E0B]">/r/{shareId}</code> doesn&apos;t match an active staging session.
        </p>
        <Link
          href="/dashboard"
          className="px-4 py-2 bg-[#F59E0B] text-[#09090B] font-semibold text-xs rounded-lg hover:bg-[#D97706] transition-colors"
        >
          Go to Agency Dashboard
        </Link>
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

  const handleToggleResolve = (pinId: string) => {
    toggleResolvePin(project.id, pinId);
  };

  const handleApprove = (approverName: string) => {
    approveProject(project.id, approverName);
    setShowApprovalModal(false);
  };

  return (
    <div className="min-h-screen bg-[#09090B] flex flex-col">
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
        />

        <FeedbackSidebar
          project={project}
          activePinId={activePinId}
          onSelectPin={setActivePinId}
          onToggleResolve={handleToggleResolve}
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
        <div className="min-h-screen bg-[#09090B] flex items-center justify-center text-xs text-[#A1A1AA] font-mono">
          Loading staging canvas...
        </div>
      }
    >
      <ReviewCanvasInner />
    </Suspense>
  );
}
