export type DeviceMode = "desktop" | "tablet" | "mobile" | "full";
export type PinStatus = "open" | "in_progress" | "resolved";
export type InteractionMode = "browse" | "comment";
export type AnnotationType = "point" | "box";
export type AssetType = "url" | "image" | "pdf";

export interface ClientTelemetry {
  viewportWidth: number;
  viewportHeight: number;
  devicePixelRatio: number;
  deviceType: DeviceMode;
  browser: string;
  os: string;
  scrollDepthPercent: number;
  timestamp: string;
}

export interface Comment {
  id: string;
  pinId: string;
  authorName: string;
  authorRole: "client" | "developer";
  content: string;
  createdAt: string;
}

export interface Pin {
  id: string;
  projectId: string;
  number: number;
  xPercent: number;
  yPercent: number;
  annotationType?: AnnotationType;
  widthPercent?: number;
  heightPercent?: number;
  status: PinStatus;
  deviceMode: DeviceMode;
  pageUrl: string;
  telemetry: ClientTelemetry;
  comments: Comment[];
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface Project {
  id: string;
  shareId: string;
  title: string;
  targetUrl: string;
  agencyName: string;
  ownerId?: string;
  ownerEmail?: string;
  assetType?: AssetType;
  isApproved: boolean;
  approvedAt?: string;
  approvedBy?: string;
  approvalSignature?: string;
  createdAt: string;
  pins: Pin[];
}
