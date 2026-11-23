"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export interface PeerCursor {
  id: string;
  name: string;
  xPercent: number;
  yPercent: number;
  color: string;
  lastSeen: number;
}

const CURSOR_COLORS = ["#10B981", "#8B5CF6", "#06B6D4", "#F59E0B", "#EC4899", "#3B82F6"];

export function useLiveCursors(shareId: string, clientName: string) {
  const [cursors, setCursors] = useState<Record<string, PeerCursor>>({});
  const channelRef = useRef<any>(null);
  const lastBroadcastRef = useRef<number>(0);
  const userColorRef = useRef<string>(CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)]);

  useEffect(() => {
    if (!shareId) return;

    const supabase = createClient();
    const channel = supabase.channel(`cyath_canvas:${shareId}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on("broadcast", { event: "cursor" }, ({ payload }) => {
        if (!payload || !payload.id || payload.name === clientName) return;
        setCursors((prev) => ({
          ...prev,
          [payload.id]: {
            id: payload.id,
            name: payload.name || "Reviewer",
            xPercent: payload.xPercent,
            yPercent: payload.yPercent,
            color: payload.color || "#10B981",
            lastSeen: Date.now(),
          },
        }));
      })
      .subscribe();

    channelRef.current = channel;

    const interval = setInterval(() => {
      const now = Date.now();
      setCursors((prev) => {
        const next: Record<string, PeerCursor> = {};
        let changed = false;
        for (const [id, cursor] of Object.entries(prev)) {
          if (now - cursor.lastSeen < 3500) {
            next[id] = cursor;
          } else {
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 1500);

    return () => {
      clearInterval(interval);
      try {
        supabase.removeChannel(channel);
      } catch {}
    };
  }, [shareId, clientName]);

  const sendCursorPosition = useCallback(
    (xPercent: number, yPercent: number) => {
      const now = Date.now();
      if (now - lastBroadcastRef.current < 40) return;
      lastBroadcastRef.current = now;

      try {
        channelRef.current?.send({
          type: "broadcast",
          event: "cursor",
          payload: {
            id: clientName,
            name: clientName,
            xPercent: Math.max(0, Math.min(100, xPercent)),
            yPercent: Math.max(0, Math.min(100, yPercent)),
            color: userColorRef.current,
          },
        });
      } catch {}
    },
    [clientName]
  );

  return { cursors, sendCursorPosition };
}
