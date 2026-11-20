import type { ClientTelemetry, DomAnchor, PinStatus } from "@/types";

export type ReviewAction =
  | {
      type: "addPin";
      id: string;
      x: number;
      y: number;
      content: string;
      name: string;
      pageUrl?: string;
      width?: number;
      height?: number;
      anchor?: DomAnchor;
      telemetry: ClientTelemetry;
      audioUrl?: string;
      audioDuration?: number;
    }
  | { type: "reply"; pinId: string; id: string; content: string; name: string }
  | { type: "status"; pinId: string; status: PinStatus; name?: string; comment?: string; id?: string }
  | { type: "deletePin"; pinId: string }
  | { type: "approve"; name: string; organization?: string }
  | { type: "reopen" }
  | { type: "approvalLink" };
