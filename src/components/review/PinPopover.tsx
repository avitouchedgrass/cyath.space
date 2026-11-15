"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Check, Send, Trash2, Copy, Mic, Square, Play, Pause, Volume2 } from "lucide-react";
import { Pin } from "@/types";
import { HoldButton } from "@/components/common/HoldButton";

interface PinPopoverProps {
  pin?: Pin;
  deviceMode?: string;
  xPercent: number;
  yPercent: number;
  isNew?: boolean;
  theme?: "day" | "night";
  authorName: string;
  onSaveNewPin?: (comment: string, authorName: string, audioUrl?: string, audioDuration?: number) => void;
  onAddComment?: (pinId: string, content: string, authorName: string) => void;
  onToggleResolve?: (pinId: string) => void;
  onDeletePin?: (pinId: string) => void;
  onClose: () => void;
}

export const PinPopover: React.FC<PinPopoverProps> = ({
  pin,
  deviceMode = "desktop",
  xPercent,
  yPercent,
  isNew = false,
  theme = "night",
  authorName: initialAuthorName,
  onSaveNewPin,
  onAddComment,
  onToggleResolve,
  onDeletePin,
  onClose,
}) => {
  const isDay = theme === "day";
  const popoverRef = useRef<HTMLDivElement>(null);
  const [commentText, setCommentText] = useState("");
  const [name, setName] = useState(initialAuthorName || "Guest Reviewer");
  const [replyText, setReplyText] = useState("");
  const [copiedIssue, setCopiedIssue] = useState(false);
  const [isVibrating, setIsVibrating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isCollapsing, setIsCollapsing] = useState(false);

  // Instant Audio State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const durationTrackerRef = useRef(0);

  useEffect(() => {
    return () => {
      if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        try { mediaRecorderRef.current.stop(); } catch {}
      }
      if (mediaStreamRef.current) {
        try { mediaStreamRef.current.getTracks().forEach((t) => t.stop()); } catch {}
      }
      if (audioElementRef.current) {
        try { audioElementRef.current.pause(); } catch {}
        audioElementRef.current = null;
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorMessage("Microphone not supported");
        setTimeout(() => setErrorMessage(""), 2000);
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "audio/webm";

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType || "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          setRecordedAudioUrl(base64data);
          handleTranscribeAudio(base64data);
        };
        reader.readAsDataURL(audioBlob);
        setAudioDuration(durationTrackerRef.current);
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((t) => t.stop());
          mediaStreamRef.current = null;
        }
      };

      recorder.start(100);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingSeconds(0);
      durationTrackerRef.current = 0;

      recordIntervalRef.current = setInterval(() => {
        durationTrackerRef.current += 1;
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.warn("Audio recording failed:", err);
      setErrorMessage("Microphone permission denied");
      setTimeout(() => setErrorMessage(""), 2000);
    }
  };

  const stopRecording = () => {
    if (recordIntervalRef.current) {
      clearInterval(recordIntervalRef.current);
      recordIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const discardRecording = () => {
    stopRecording();
    setRecordedAudioUrl(null);
    setAudioDuration(0);
    setRecordingSeconds(0);
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      setIsPlayingAudio(false);
    }
  };

  const handleTranscribeAudio = async (base64data: string) => {
    try {
      setIsTranscribing(true);
      const res = await fetch("/api/ai/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioUrl: base64data }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.transcript) {
          const aiText = `"${data.transcript}"\n\nAction item: ${data.actionItem}`;
          setCommentText((prev) => (prev.trim() ? `${prev}\n\n${aiText}` : aiText));
        }
      }
    } catch (err) {
      console.warn("AI transcription error:", err);
    } finally {
      setIsTranscribing(false);
    }
  };

  const togglePlayAudio = (url: string) => {
    if (!audioElementRef.current || audioElementRef.current.src !== url) {
      if (audioElementRef.current) audioElementRef.current.pause();
      const audio = new Audio(url);
      audio.onended = () => {
        setIsPlayingAudio(false);
        setPlaybackTime(0);
      };
      audio.ontimeupdate = () => {
        setPlaybackTime(Math.floor(audio.currentTime));
      };
      audioElementRef.current = audio;
    }

    if (isPlayingAudio) {
      audioElementRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioElementRef.current.play().catch(() => setIsPlayingAudio(false));
      setIsPlayingAudio(true);
    }
  };

  useEffect(() => {
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const t = setTimeout(() => {
      document.addEventListener("mousedown", handleOutside);
      document.addEventListener("touchstart", handleOutside);
    }, 80);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [onClose]);

  const handleCopyIssue = () => {
    if (!pin) return;
    const firstComment = pin.comments?.[0]?.content || "No feedback content.";
    const extraComments = (pin.comments?.slice(1) || [])
      .map((c) => `- **${c.authorName || "Reviewer"}**: ${c.content}`)
      .join("\n");

    const text = [
      `### [Cyath Pin #${pin.number}] ${firstComment.slice(0, 80)}${firstComment.length > 80 ? "..." : ""}`,
      "",
      `- **Status:** ${pin.status === "resolved" ? "Resolved" : "Open"}`,
      `- **Page:** \`${pin.pageUrl || "/"}\``,
      `- **Viewport:** ${pin.deviceMode || deviceMode} (${pin.telemetry?.viewportWidth || 1440}×${pin.telemetry?.viewportHeight || 900})`,
      `- **Browser:** ${pin.telemetry?.browser || "Browser"}`,
      `- **Coordinates:** ${pin.xPercent.toFixed(1)}% X, ${pin.yPercent.toFixed(1)}% Y`,
      "",
      "#### Feedback",
      firstComment,
      extraComments ? `\n#### Discussion\n${extraComments}` : "",
      "",
      "---",
      "*Captured via [Cyath](https://cyath-space.vercel.app)*",
    ]
      .filter(Boolean)
      .join("\n");

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedIssue(true);
      setTimeout(() => setCopiedIssue(false), 2000);
    }
  };

  useEffect(() => {
    setName(initialAuthorName || "Guest Reviewer");
  }, [initialAuthorName]);

  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const isSmallScreen = windowWidth < 640;
  const isMobileLayout = deviceMode === "mobile" || isSmallScreen;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() && !recordedAudioUrl) {
      setIsVibrating(true);
      setErrorMessage("write or record something");
      setTimeout(() => setIsVibrating(false), 400);
      setTimeout(() => setErrorMessage(""), 1500);
      return;
    }
    const finalComment = commentText.trim() || `Voice Note (${audioDuration || recordingSeconds || 5}s)`;
    setIsCollapsing(true);
    setTimeout(() => {
      if (onSaveNewPin) {
        onSaveNewPin(
          finalComment,
          name.trim() || "Guest Reviewer",
          recordedAudioUrl || undefined,
          audioDuration || recordingSeconds || undefined
        );
        setCommentText("");
        setRecordedAudioUrl(null);
      }
    }, 220);
  };

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !pin) return;
    if (onAddComment) {
      onAddComment(pin.id, replyText.trim(), name.trim() || "Guest Reviewer");
      setReplyText("");
    }
  };

  const isRight = xPercent > 50;
  const isBottom = yPercent > 70;

  const popoverStyle: React.CSSProperties = isMobileLayout
    ? {
      position: "absolute",
      bottom: "12px",
      left: "12px",
      right: "12px",
      width: "calc(100% - 24px)",
      maxWidth: "none",
      zIndex: 50,
    }
    : {
      position: "absolute",
      zIndex: 50,
      left: isRight ? "auto" : `${Math.max(2, Math.min(68, xPercent + 1.5))}%`,
      right: isRight ? `${Math.max(2, Math.min(68, 100 - xPercent + 1.5))}%` : "auto",
      top: isBottom ? "auto" : `${Math.max(1, Math.min(96, yPercent + 1))}%`,
      bottom: isBottom ? `${Math.max(1, Math.min(96, 100 - yPercent + 1))}%` : "auto",
      width: "320px",
      maxWidth: "calc(100% - 16px)",
    };

  return (
    <div
      ref={popoverRef}
      onClick={(e) => e.stopPropagation()}
      style={popoverStyle}
      className={`border rounded-xl shadow-2xl p-4 text-xs transition-all animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl font-sans cursor-default ${
        isVibrating ? "animate-modal-shake" : ""
      } ${isCollapsing ? "animate-pin-collapse" : ""} ${
        isDay
          ? "bg-white border-stone-300 text-stone-900 shadow-[0_20px_60px_rgba(0,0,0,0.16)] selection:bg-stone-200"
          : "bg-[#0a0a0a] border-white/20 text-white shadow-2xl selection:bg-white selection:text-black"
      }`}
    >
      {/* Header */}
      <div className={`flex items-center justify-between border-b pb-2.5 mb-3 ${isDay ? "border-stone-200" : "border-white/[0.08]"}`}>
        <div className="flex items-center gap-2">
          <div className={`w-5 h-5 rounded-full font-mono font-bold text-[10px] flex items-center justify-center ${isDay ? "bg-stone-900 text-white" : "bg-white text-black"
            }`}>
            {isNew ? "+" : `#${pin?.number}`}
          </div>
          <span className={`font-sans text-sm font-semibold tracking-tight ${isDay ? "text-stone-900" : "text-white"}`}>
            {isNew ? "New Feedback Pin" : `Pin #${pin?.number}`}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {!isNew && pin && (
            <button
              onClick={handleCopyIssue}
              className={`p-1 rounded text-xs transition-colors flex items-center gap-1 cursor-pointer ${copiedIssue
                  ? isDay
                    ? "bg-stone-200 text-stone-900"
                    : "bg-white/20 text-white"
                  : isDay
                    ? "text-stone-500 hover:text-stone-900 hover:bg-stone-100"
                    : "text-zinc-500 hover:text-white hover:bg-white/10"
                }`}
              title={copiedIssue ? "Copied Markdown to clipboard!" : "Copy for GitHub / Linear"}
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          )}

          {!isNew && pin && onToggleResolve && (
            <button
              onClick={() => onToggleResolve(pin.id)}
              className={`p-1 rounded text-xs transition-colors flex items-center gap-1 cursor-pointer ${pin.status === "resolved"
                  ? isDay
                    ? "bg-stone-200 text-stone-900 font-bold"
                    : "bg-white/10 text-white"
                  : isDay
                    ? "text-stone-500 hover:text-stone-900 hover:bg-stone-100"
                    : "text-zinc-500 hover:text-white hover:bg-white/10"
                }`}
              title={pin.status === "resolved" ? "Reopen pin" : "Mark as resolved"}
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          )}

          {!isNew && pin && onDeletePin && (
            <HoldButton
              onHoldComplete={() => {
                onDeletePin(pin.id);
                onClose();
              }}
              title="Hold to delete this pin"
              className={`p-1 rounded transition-colors cursor-pointer ${isDay ? "text-stone-400 hover:text-rose-600 hover:bg-rose-50" : "text-zinc-500 hover:text-white hover:bg-white/10"
                }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </HoldButton>
          )}

          <button
            onClick={onClose}
            className={`p-1 rounded transition-colors cursor-pointer ${isDay ? "text-stone-400 hover:text-stone-900 hover:bg-stone-100" : "text-zinc-400 hover:text-white hover:bg-white/10"
              }`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Mode 1: New Pin Form */}
      {isNew ? (
        <form onSubmit={handleCreateSubmit} className="space-y-3">
          <div>
            <label className={`block text-[11px] font-medium mb-1 ${isDay ? "text-stone-700" : "text-zinc-300"}`}>
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex (Client)"
              className={`w-full rounded-lg px-2.5 py-1.5 text-xs focus:outline-none font-sans border ${isDay
                  ? "bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-400 focus:border-stone-900"
                  : "bg-white/[0.04] border-white/10 text-white placeholder:text-zinc-600 focus:border-white/50"
                }`}
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={`block text-[11px] font-medium ${isDay ? "text-stone-700" : "text-zinc-300"}`}>
                Feedback / Change Request
              </label>
              {isTranscribing && (
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-500 animate-pulse">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Transcribing with Gemini...</span>
                </div>
              )}
            </div>
            <div className="relative">
              <textarea
                autoFocus
                value={commentText}
                onChange={(e) => {
                  setCommentText(e.target.value);
                  if (errorMessage) setErrorMessage("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleCreateSubmit(e);
                  }
                }}
                rows={3}
                placeholder={errorMessage ? "" : "What needs to change here?"}
                className={`w-full rounded-lg p-2.5 text-xs focus:outline-none resize-none font-sans border transition-colors ${
                  errorMessage
                    ? "border-red-500/70 bg-red-500/[0.04]"
                    : isDay
                      ? "bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-400 focus:border-stone-900"
                      : "bg-white/[0.04] border-white/10 text-white placeholder:text-zinc-600 focus:border-white/50"
                }`}
              />
              {errorMessage && (
                <div className="absolute inset-0 p-2.5 pointer-events-none flex items-start text-red-500 font-sans font-medium text-xs animate-in fade-in duration-150">
                  {errorMessage}
                </div>
              )}
            </div>
          </div>

          {/* Instant Audio Recorder / Player */}
          {isRecording ? (
            <div className={`p-2.5 rounded-xl border flex items-center justify-between animate-in fade-in duration-150 ${
              isDay ? "bg-red-50/80 border-red-200 text-red-900" : "bg-red-950/30 border-red-500/30 text-red-200"
            }`}>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <span className="font-mono text-xs font-semibold">
                  Recording {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, "0")}
                </span>
              </div>
              <button
                type="button"
                onClick={stopRecording}
                className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-all"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Stop</span>
              </button>
            </div>
          ) : recordedAudioUrl ? (
            <div className={`p-2.5 rounded-xl border flex items-center justify-between animate-in fade-in duration-150 ${
              isDay ? "bg-stone-50 border-stone-200" : "bg-white/[0.04] border-white/10"
            }`}>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => togglePlayAudio(recordedAudioUrl)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform active:scale-90 cursor-pointer shadow-xs ${
                    isDay ? "bg-stone-900 text-white" : "bg-white text-black"
                  }`}
                >
                  {isPlayingAudio ? (
                    <Pause className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  )}
                </button>
                <div>
                  <div className="text-xs font-sans font-semibold flex items-center gap-1">
                    <Volume2 className="w-3 h-3 opacity-70" />
                    <span>Voice Note Ready</span>
                  </div>
                  <div className={`text-[10px] font-mono ${isDay ? "text-stone-500" : "text-zinc-500"}`}>
                    {audioDuration || recordingSeconds || 5}s audio attached
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={discardRecording}
                title="Discard voice note"
                className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                  isDay ? "text-stone-400 hover:text-rose-600 hover:bg-rose-50" : "text-zinc-500 hover:text-rose-400 hover:bg-white/10"
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              className={`w-full py-2 px-3 rounded-xl border border-dashed flex items-center justify-center gap-2 transition-all cursor-pointer text-xs font-sans active:scale-[0.99] ${
                isDay
                  ? "border-stone-300 hover:border-stone-400 bg-stone-50/80 hover:bg-stone-100 text-stone-700"
                  : "border-white/15 hover:border-white/30 bg-white/[0.02] hover:bg-white/[0.05] text-zinc-300"
              }`}
            >
              <Mic className="w-3.5 h-3.5 opacity-80" />
              <span>Record Voice Note</span>
            </button>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className={`text-[11px] ${isDay ? "text-stone-500" : "text-zinc-500"}`}>Enter ↵ to drop</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className={`px-2.5 py-1 text-xs cursor-pointer ${isDay ? "text-stone-600 hover:text-stone-950" : "text-zinc-400 hover:text-white"}`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-3.5 py-1.5 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1 shadow-sm cursor-pointer ${isDay
                    ? "bg-stone-900 hover:bg-stone-800 text-white"
                    : "bg-white hover:bg-zinc-200 text-black"
                  }`}
              >
                <span>Drop Pin</span>
              </button>
            </div>
          </div>
        </form>
      ) : (
        /* Mode 2: Existing Pin Thread */
        <div className="space-y-3">
          {/* Telemetry Chip */}
          {pin?.telemetry && (
            <div className={`border rounded-md px-2.5 py-1 text-[10px] font-mono flex items-center justify-between ${isDay ? "bg-stone-50 border-stone-200 text-stone-600" : "bg-white/[0.03] border-white/[0.08] text-zinc-400"
              }`}>
              <span>{(pin.deviceMode || "desktop").toUpperCase()} · {pin.telemetry.viewportWidth || "—"}×{pin.telemetry.viewportHeight || "—"}</span>
              <span>{pin.telemetry.browser || "Browser"}</span>
            </div>
          )}

          {/* Attached Voice Note Audio Player */}
          {pin?.audioUrl && (
            <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
              isDay ? "bg-stone-50 border-stone-200" : "bg-white/[0.04] border-white/10"
            }`}>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => togglePlayAudio(pin.audioUrl!)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform active:scale-90 cursor-pointer shadow-xs ${
                    isDay ? "bg-stone-900 text-white" : "bg-white text-black"
                  }`}
                >
                  {isPlayingAudio ? (
                    <Pause className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  )}
                </button>
                <div>
                  <div className="text-xs font-sans font-semibold flex items-center gap-1">
                    <Volume2 className="w-3 h-3 opacity-70" />
                    <span>Client Voice Note</span>
                  </div>
                  <div className={`text-[10px] font-mono ${isDay ? "text-stone-500" : "text-zinc-500"}`}>
                    {pin.audioDurationSeconds ? `${pin.audioDurationSeconds}s clip` : "Audio note"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 pr-1">
                <span className={`w-1 h-3 rounded-full transition-all ${isPlayingAudio ? "bg-emerald-500 animate-pulse" : isDay ? "bg-stone-300" : "bg-zinc-700"}`} />
                <span className={`w-1 h-4 rounded-full transition-all ${isPlayingAudio ? "bg-emerald-500 animate-pulse delay-75" : isDay ? "bg-stone-300" : "bg-zinc-700"}`} />
                <span className={`w-1 h-2 rounded-full transition-all ${isPlayingAudio ? "bg-emerald-500 animate-pulse delay-150" : isDay ? "bg-stone-300" : "bg-zinc-700"}`} />
              </div>
            </div>
          )}

          {/* Comment Thread List */}
          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
            {(Array.isArray(pin?.comments) ? pin.comments : []).map((comment) => (
              <div
                key={comment.id}
                className={`rounded-lg p-2.5 border ${isDay ? "bg-stone-50 border-stone-200 text-stone-900" : "bg-white/[0.03] border-white/[0.06] text-zinc-300"
                  }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-semibold text-xs ${isDay ? "text-stone-950" : "text-white"}`}>{comment.authorName}</span>
                  <span className={`text-[10px] font-mono ${isDay ? "text-stone-500" : "text-zinc-500"}`}>
                    {new Date(comment.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="text-xs leading-relaxed whitespace-pre-wrap">{comment.content}</p>
              </div>
            ))}
          </div>

          {/* Reply Form */}
          <form onSubmit={handleReplySubmit} className={`pt-2 border-t flex items-center gap-2 ${isDay ? "border-stone-200" : "border-white/[0.08]"}`}>
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Reply to thread..."
              className={`flex-1 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none font-sans border ${isDay
                  ? "bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-400 focus:border-stone-900"
                  : "bg-white/[0.04] border-white/10 text-white placeholder:text-zinc-600 focus:border-white/50"
                }`}
            />
            <button
              type="submit"
              disabled={!replyText.trim()}
              className={`p-2 rounded-lg transition-colors cursor-pointer disabled:opacity-30 ${isDay
                  ? "bg-stone-900 hover:bg-stone-800 text-white"
                  : "bg-white hover:bg-zinc-200 text-black"
                }`}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
