import "server-only";

import { isIP } from "node:net";
import { configuredPreviewOrigin } from "@/lib/preview-origin";

const defaultHosts = [
  "vercel.app", "webflow.io", "framer.website", "framer.app", "netlify.app",
];
const redirects = new Set([301, 302, 303, 307, 308]);
const maxBody = 8 * 1024 * 1024;

export function previewBoundary(request: Request) {
  const requestOrigin = new URL(request.url).origin;
  if (process.env.NODE_ENV === "development" && !configuredPreviewOrigin()) {
    return { appOrigin: requestOrigin, sandbox: "allow-scripts" };
  }
  const previewOrigin = configuredPreviewOrigin();
  const appOrigin = new URL(process.env.NEXT_PUBLIC_APP_URL || "https://cyath.space").origin;
  if (!previewOrigin || previewOrigin === appOrigin || requestOrigin !== previewOrigin) return null;
  return { appOrigin, sandbox: "allow-scripts allow-same-origin" };
}

export function allowedPreviewUrl(url: URL, appOrigin: string, previewOrigin: string) {
  const host = url.hostname.toLowerCase();
  if (url.protocol !== "https:" || url.port || url.username || url.password ||
      !host.includes(".") || host.endsWith(".") || isIP(host) || host.startsWith("[") ||
      url.origin === appOrigin || url.origin === previewOrigin) return false;
  const configured = process.env.CYATH_PREVIEW_HOSTS?.split(",").map(value => value.trim().toLowerCase()).filter(Boolean);
  const allowed = configured?.length ? configured : defaultHosts;
  return (process.env.NODE_ENV === "development" && host === "example.com") ||
    allowed.some(entry => entry.startsWith("*.") ? host.endsWith(entry.slice(1)) :
      host === entry || (defaultHosts.includes(entry) && host.endsWith(`.${entry}`)));
}

export async function fetchPreview(target: URL, appOrigin: string, previewOrigin: string, accept: string) {
  const signal = AbortSignal.timeout(10000);
  for (let count = 0; count <= 5; count++) {
    if (!allowedPreviewUrl(target, appOrigin, previewOrigin)) throw new Error("Unsupported preview host.");
    const response = await fetch(target, {
      redirect: "manual",
      cache: "no-store",
      signal,
      headers: { Accept: accept },
    });
    if (!redirects.has(response.status)) return { response, url: target };
    await response.body?.cancel();
    const next = response.headers.get("location");
    if (!next) throw new Error("The preview returned an invalid redirect.");
    target = new URL(next, target);
  }
  throw new Error("The preview redirected too many times.");
}

export async function readPreviewBody(response: Response) {
  if (Number(response.headers.get("content-length")) > maxBody) {
    await response.body?.cancel();
    throw new Error("The preview is too large.");
  }
  if (!response.body) return new Uint8Array();
  const reader = response.body.getReader();
  const parts: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > maxBody) {
        await reader.cancel();
        throw new Error("The preview is too large.");
      }
      parts.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const content = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    content.set(part, offset);
    offset += part.byteLength;
  }
  return content;
}
