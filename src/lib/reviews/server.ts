import "server-only";

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { nanoid } from "nanoid";
import { getAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requestOrigin } from "@/lib/request-origin";
import type { Comment, DeviceMode, DomAnchor, Project } from "@/types";

export class ReviewError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

type CanvasRow = {
  share_id: string;
  owner_id: string;
  project: Project;
  revision: number;
  approval_digest: string | null;
  approval_expires_at: string | null;
};

export type Actor = { id: string; method: "session" | "mcp" };

const validId = /^[A-Za-z0-9_-]{8,64}$/;
const tokenFormat = /^cyath_pro_[A-Za-z0-9_-]{43}$/;
const deviceModes = new Set<DeviceMode>(["desktop", "tablet", "mobile", "full"]);
export const maxUploadBytes = 2 * 1024 * 1024;

function digest(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function tokenMatches(token: string | null, hash: string | null) {
  return !!token && /^[A-Za-z0-9_-]{43}$/.test(token) && !!hash &&
    hash.length === 64 && timingSafeEqual(Buffer.from(digest(token)), Buffer.from(hash));
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ReviewError(400, "Expected a JSON object.");
  }
  return value as Record<string, unknown>;
}

function text(value: unknown, max: number, label: string, fallback?: string) {
  if (fallback !== undefined && (value === undefined || value === "")) return fallback;
  if (typeof value !== "string" || !value.trim() || value.length > max) {
    throw new ReviewError(400, `${label} must contain between 1 and ${max} characters.`);
  }
  return value.trim();
}

function id(value: unknown, label: string) {
  if (typeof value !== "string" || !validId.test(value)) throw new ReviewError(400, `Invalid ${label}.`);
  return value;
}

function number(value: unknown, min: number, max: number, label: string) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) {
    throw new ReviewError(400, `Invalid ${label}.`);
  }
  return value;
}

function websiteUrl(value: unknown) {
  const input = text(value, 4096, "Website URL");
  try {
    const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(input) ? input : `https://${input}`);
    if (url.protocol !== "https:" || url.username || url.password || url.port) throw new Error();
    return url.href;
  } catch {
    throw new ReviewError(400, "Enter an HTTPS preview URL without embedded credentials or a custom port.");
  }
}

function dataUrl(value: unknown, type: "image" | "pdf" | "audio", maxBytes: number) {
  const prefix = {
    image: /^data:image\/(?:png|jpeg|gif|webp|avif);base64,/i,
    pdf: /^data:application\/pdf;base64,/i,
    audio: /^data:audio\/(?:webm|ogg|mpeg|mp4|wav|x-wav)(?:;codecs=[\w.-]+)?;base64,/i,
  }[type];
  if (typeof value !== "string" || value.length > Math.ceil(maxBytes / 3) * 4 + 100 ||
      !prefix.test(value) || !/^[A-Za-z0-9+/]+={0,2}$/.test(value.slice(value.indexOf(",") + 1))) {
    throw new ReviewError(400, `Use a supported ${type} file within the upload limit.`);
  }
  return value;
}

export async function readJson(request: Request) {
  const limit = 3 * 1024 * 1024;
  const reader = request.body?.getReader();
  if (!reader) throw new ReviewError(400, "Missing request body.");
  let size = 0;
  let body = "";
  const decoder = new TextDecoder();
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new ReviewError(413, "The request is too large.");
      }
      body += decoder.decode(value, { stream: true });
    }
    body += decoder.decode();
    return object(JSON.parse(body));
  } catch (error) {
    if (error instanceof ReviewError) throw error;
    throw new ReviewError(400, "The request must contain valid JSON.");
  } finally {
    reader.releaseLock();
  }
}

export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "private, no-store" } });
}

export function failure(error: unknown) {
  if (error instanceof ReviewError) return json({ error: error.message }, error.status);
  console.error("Review service error", error instanceof Error ? error.message : "Database request failed");
  return json({ error: "The review service is unavailable. Please try again." }, 503);
}

export async function hasPro(ownerId: string) {
  const { data, error } = await getAdminClient().from("review_entitlements")
    .select("owner_id").eq("owner_id", ownerId).gt("active_until", new Date().toISOString()).maybeSingle();
  if (error) throw new Error("Could not check the subscription.");
  return !!data;
}

export async function getActor(request: Request): Promise<Actor | null> {
  const authorization = request.headers.get("Authorization");
  if (authorization) {
    const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
    if (!tokenFormat.test(token)) throw new ReviewError(401, "Invalid Cyath API key.");

    const { data, error } = await getAdminClient().from("review_mcp_keys")
      .select("owner_id").eq("token_digest", digest(token)).maybeSingle();
    if (error) throw new Error("Could not verify the API key.");
    if (!data || !(await hasPro(data.owner_id))) throw new ReviewError(401, "Invalid or inactive Cyath API key.");
    return { id: data.owner_id, method: "mcp" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.email_confirmed_at ? { id: user.id, method: "session" } : null;
}

export async function requireActor(request: Request, sessionOnly = false) {
  const actor = await getActor(request);
  if (!actor || (sessionOnly && actor.method !== "session")) {
    throw new ReviewError(401, "Sign in with a verified account to continue.");
  }
  return actor;
}

export function requireSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== requestOrigin(request)) {
    throw new ReviewError(403, "This request must come from Cyath.");
  }
}

export async function rotateMcpKey(ownerId: string) {
  if (!(await hasPro(ownerId))) throw new ReviewError(403, "An active Pro subscription is required.");
  const key = `cyath_pro_${randomBytes(32).toString("base64url")}`;
  const { error } = await getAdminClient().from("review_mcp_keys")
    .upsert({ owner_id: ownerId, token_digest: digest(key) });
  if (error) throw new Error("Could not update the API key.");
  return key;
}

export async function revokeMcpKey(ownerId: string) {
  const { error } = await getAdminClient().from("review_mcp_keys").delete().eq("owner_id", ownerId);
  if (error) throw new Error("Could not revoke the API key.");
}

function isDocument(project: Project) {
  return project.assetType === "image" || project.assetType === "pdf";
}

function view(row: CanvasRow, actor: Actor | null, approval: string | null = null): Project {
  const canManage = actor?.id === row.owner_id;
  const canApprove = !canManage && !!row.approval_expires_at &&
    Date.parse(row.approval_expires_at) > Date.now() && tokenMatches(approval, row.approval_digest);
  const project = { ...row.project };
  delete project.ownerEmail;
  delete project.ownerId;
  if (isDocument(project)) project.pins = project.pins.map(pin => ({ ...pin, pageUrl: undefined }));
  return { ...project, shareId: row.share_id, revision: row.revision, access: { canManage, canApprove } };
}

function authorizeMachine(row: CanvasRow, actor: Actor | null) {
  if (actor?.method === "mcp" && row.owner_id !== actor.id) {
    throw new ReviewError(404, "This review could not be found.");
  }
}

async function getCanvasRow(shareId: string): Promise<CanvasRow> {
  id(shareId, "review link");
  const { data, error } = await getAdminClient().from("review_canvases")
    .select("*").eq("share_id", shareId).maybeSingle();
  if (error) throw new Error("Could not load the review.");
  if (!data) throw new ReviewError(404, "This review link is unavailable. Ask the studio for a new link.");
  return data as CanvasRow;
}

export async function loadCanvas(shareId: string, actor: Actor | null, approval: string | null) {
  const row = await getCanvasRow(shareId);
  authorizeMachine(row, actor);
  return view(row, actor, approval);
}

export async function listCanvases(actor: Actor) {
  const { data, error } = await getAdminClient().from("review_canvases")
    .select("*").eq("owner_id", actor.id).order("created_at", { ascending: false });
  if (error) throw new Error("Could not list the studio reviews.");
  return (data as CanvasRow[]).map(row => view(row, actor));
}

export async function createCanvas(input: Record<string, unknown>, actor: Actor) {
  const assetType = input.assetType ?? "url";
  if (assetType !== "url" && assetType !== "image" && assetType !== "pdf") {
    throw new ReviewError(400, "Choose a website, image, or PDF.");
  }
  const targetUrl = assetType === "url" ? websiteUrl(input.targetUrl) : dataUrl(input.targetUrl, assetType, maxUploadBytes);
  const defaultTitle = assetType === "url" ? new URL(targetUrl).hostname : "Document review";
  const shareId = nanoid(24);
  const project: Project = {
    id: nanoid(),
    shareId,
    title: text(input.title, 180, "Title", defaultTitle),
    targetUrl,
    agencyName: text(input.agencyName, 150, "Studio name", "Independent Studio"),
    assetType,
    isApproved: false,
    createdAt: new Date().toISOString(),
    nextPinNumber: 1,
    pins: [],
  };

  const { data, error } = await getAdminClient().rpc("create_review_canvas", {
    p_share_id: shareId,
    p_owner_id: actor.id,
    p_request_id: input.requestId === undefined ? null : id(input.requestId, "request ID"),
    p_project: project,
  });
  if (error?.code === "P0001") throw new ReviewError(409, "The Free plan includes one review. Delete it or upgrade to add another.");
  if (error || !data) throw new Error("Could not save the new review.");
  return view(data as CanvasRow, actor);
}

function domAnchor(value: unknown): DomAnchor | undefined {
  if (value === undefined) return undefined;
  const a = object(value);
  return {
    selector: text(a.selector, 1000, "Element selector"),
    tagName: text(a.tagName, 80, "Element name"),
    textContent: text(a.textContent, 200, "Element text", ""),
    elementOffsetXPercent: number(a.elementOffsetXPercent, -100, 200, "element X"),
    elementOffsetYPercent: number(a.elementOffsetYPercent, -100, 200, "element Y"),
    docX: number(a.docX, -16000, 120000, "page X"),
    docY: number(a.docY, -16000, 120000, "page Y"),
  };
}

function newComment(commentId: string, pinId: string, content: unknown, name: unknown, manager: boolean, now: string): Comment {
  return {
    id: commentId,
    pinId,
    content: text(content, 5000, "Feedback"),
    authorName: text(name, 120, "Reviewer name", manager ? "Studio" : "Reviewer"),
    authorRole: manager ? "developer" : "client",
    createdAt: now,
  };
}

export async function changeCanvas(shareId: string, action: Record<string, unknown>, actor: Actor | null, approval: string | null) {
  const client = getAdminClient();

  for (let attempts = 0; attempts < 6; attempts++) {
    const row = await getCanvasRow(shareId);
    authorizeMachine(row, actor);
    const project = row.project;
    const { canManage, canApprove } = view(row, actor, approval).access!;
    const now = new Date().toISOString();
    const update: Record<string, unknown> = { revision: row.revision + 1 };
    let approvalToken: string | undefined;

    if (action.type !== "addPin" && action.type !== "reply" && action.type !== "approve" && !canManage) {
      throw new ReviewError(403, "Only the studio can make that change.");
    }
    if (action.type === "approve" && !canApprove) {
      throw new ReviewError(403, "Ask the studio for an approval link.");
    }
    if (project.isApproved && action.type === "status" && action.status === "resolved" &&
        !action.comment && project.pins.some(pin => pin.id === action.pinId && pin.status === "resolved")) {
      return { project: view(row, actor, approval) };
    }
    if (project.isApproved && action.type !== "reopen") {
      throw new ReviewError(409, "This review is approved. Ask the studio to reopen it to make changes.");
    }

    switch (action.type) {
      case "addPin": {
        const pinId = id(action.id, "pin ID");
        if (project.pins.some(pin => pin.id === pinId)) return { project: view(row, actor, approval) };
        const telemetry = object(action.telemetry);
        const device = telemetry.deviceType as DeviceMode;
        if (!deviceModes.has(device)) throw new ReviewError(400, "Invalid viewport mode.");
        const width = action.width === undefined ? undefined : number(action.width, 0, 100, "annotation width");
        const height = action.height === undefined ? undefined : number(action.height, 0, 100, "annotation height");
        const pinNumber = project.nextPinNumber ?? project.pins.reduce((max, pin) => Math.max(max, pin.number), 0) + 1;
        project.pins.push({
          id: pinId,
          projectId: project.id,
          number: pinNumber,
          xPercent: number(action.x, 0, 100, "annotation X"),
          yPercent: number(action.y, 0, 100, "annotation Y"),
          widthPercent: width,
          heightPercent: height,
          annotationType: width && height ? "box" : "point",
          domAnchor: domAnchor(action.anchor),
          status: "open",
          deviceMode: device,
          pageUrl: isDocument(project) ? undefined : action.pageUrl ? websiteUrl(action.pageUrl) : project.targetUrl,
          telemetry: {
            viewportWidth: number(telemetry.viewportWidth, 0, 20000, "viewport width"),
            viewportHeight: number(telemetry.viewportHeight, 0, 20000, "viewport height"),
            devicePixelRatio: number(telemetry.devicePixelRatio, 0.01, 20, "pixel ratio"),
            scrollDepthPercent: number(telemetry.scrollDepthPercent, 0, 100, "scroll position"),
            browser: text(telemetry.browser, 80, "Browser", "Unknown"),
            browserVersion: text(telemetry.browserVersion, 80, "Browser version", ""),
            os: text(telemetry.os, 80, "Operating system", "Unknown"),
            timestamp: now,
            deviceType: device,
          },
          audioUrl: action.audioUrl === undefined ? undefined : dataUrl(action.audioUrl, "audio", maxUploadBytes),
          audioDurationSeconds: action.audioDuration === undefined ? undefined : number(action.audioDuration, 0, 300, "audio duration"),
          comments: [newComment(pinId, pinId, action.content, action.name, canManage, now)],
          createdAt: now,
        });
        project.nextPinNumber = pinNumber + 1;
        break;
      }
      case "reply":
      case "status":
      case "deletePin": {
        const pinId = id(action.pinId, "pin ID");
        const pin = project.pins.find(item => item.id === pinId);
        if (!pin) throw new ReviewError(404, "That pin no longer exists.");
        if (action.type === "deletePin") {
          project.pins = project.pins.filter(item => item.id !== pinId);
          break;
        }
        if (action.type === "status") {
          if (action.status !== "open" && action.status !== "resolved" && action.status !== "in_progress") {
            throw new ReviewError(400, "Invalid feedback status.");
          }
          const name = text(action.name, 120, "Resolver name", "Studio");
          if (pin.status === action.status && !action.comment) return { project: view(row, actor, approval) };
          if (pin.status !== action.status) {
            pin.status = action.status;
            pin.resolvedBy = action.status === "resolved" ? name : undefined;
            pin.resolvedAt = action.status === "resolved" ? now : undefined;
          }
        }
        if (action.type === "reply" || action.comment !== undefined) {
          const commentId = id(action.id, "comment ID");
          if (!pin.comments.some(item => item.id === commentId)) {
            pin.comments.push(newComment(commentId, pinId, action.type === "reply" ? action.content : action.comment, action.name, canManage, now));
          }
        }
        break;
      }
      case "approvalLink":
        approvalToken = randomBytes(32).toString("base64url");
        update.approval_digest = digest(approvalToken);
        update.approval_expires_at = new Date(Date.now() + 7 * 86400000).toISOString();
        break;
      case "approve": {
        if (project.pins.some(pin => pin.status !== "resolved")) {
          throw new ReviewError(409, "Resolve all open feedback before approving this review.");
        }
        const name = text(action.name, 120, "Approver name");
        const organization = text(action.organization, 150, "Organization", "");
        project.isApproved = true;
        project.approvedAt = now;
        project.approvedBy = organization ? `${name} · ${organization}` : name;
        project.approvedRevision = row.revision;
        update.approval_digest = null;
        update.approval_expires_at = null;
        break;
      }
      case "reopen": {
        project.isApproved = false;
        delete project.approvedAt;
        delete project.approvedBy;
        delete project.approvedRevision;
        delete project.approvalSignature;
        update.approval_digest = null;
        update.approval_expires_at = null;
        break;
      }
      default:
        throw new ReviewError(400, "Unknown review change.");
    }

    const { data, error } = await client.from("review_canvases")
      .update({ ...update, project }).eq("share_id", shareId).eq("revision", row.revision).select("*").maybeSingle();
    if (error) throw new Error("Could not save the review change.");
    if (data) return { project: view(data as CanvasRow, actor, approval), approvalToken };
  }
  throw new ReviewError(409, "This review changed while you were editing. Try again.");
}

export async function deleteCanvas(shareId: string, actor: Actor) {
  const { data, error } = await getAdminClient().from("review_canvases").delete()
    .eq("share_id", id(shareId, "review link")).eq("owner_id", actor.id).select("share_id").maybeSingle();
  if (error) throw new Error("Could not delete the review.");
  if (!data) throw new ReviewError(404, "This review could not be found.");
}
