import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { changeCanvas, ReviewError } from "@/lib/reviews/server";

type Provider = "github" | "linear";

export async function verifiedWebhook(request: Request, provider: Provider) {
  const github = provider === "github";
  const secret = github ? process.env.GITHUB_WEBHOOK_SECRET : process.env.LINEAR_WEBHOOK_SECRET;
  const expectedScope = github ? process.env.CYATH_GITHUB_REPOSITORY : process.env.CYATH_LINEAR_ORGANIZATION_ID;
  const owner = process.env.CYATH_INTEGRATION_OWNER_ID;
  if (!secret || !expectedScope || !owner) throw new ReviewError(503, "This webhook is not configured.");
  const signature = request.headers.get(github ? "x-hub-signature-256" : "linear-signature") ?? "";
  const hex = github && signature.startsWith("sha256=") ? signature.slice(7) : github ? "" : signature;
  if (!/^[a-f\d]{64}$/i.test(hex)) throw new ReviewError(401, "Missing or invalid webhook signature.");

  const maxBytes = 1024 * 1024;
  const reader = request.body?.getReader();
  if (!reader) throw new ReviewError(400, "Missing webhook body.");
  let size = 0;
  const chunks = [];
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new ReviewError(413, "Webhook payload is too large.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const body = Buffer.concat(chunks, size);
  const expected = createHmac("sha256", secret).update(body).digest();
  if (!timingSafeEqual(expected, Buffer.from(hex, "hex"))) throw new ReviewError(401, "Invalid webhook signature.");
  let payload: {
    action?: string; type?: string; organizationId?: string; webhookTimestamp?: number;
    updatedFrom?: { stateId?: string }; repository?: { full_name?: string };
    issue?: { body?: string | null; closed_at?: string | null };
    data?: { description?: string | null; state?: { type?: string } };
  };
  try {
    payload = JSON.parse(body.toString("utf8"));
    if (!payload || typeof payload !== "object") throw new Error();
  } catch {
    throw new ReviewError(400, "Invalid webhook body.");
  }
  const actualScope = github ? payload.repository?.full_name : payload.organizationId;
  if (actualScope?.toLowerCase() !== expectedScope.toLowerCase()) throw new ReviewError(403, "Unexpected webhook source.");
  if (!github && (typeof payload.webhookTimestamp !== "number" ||
      !Number.isFinite(payload.webhookTimestamp) || Math.abs(Date.now() - payload.webhookTimestamp) > 60000)) {
    throw new ReviewError(401, "The webhook timestamp is outside the allowed window.");
  }
  return { owner, payload };
}

export async function resolveLinkedPins(description: unknown, owner: string, source: string) {
  if (typeof description !== "string") return;
  const completed = new Set<string>();
  for (const match of description.matchAll(/<!--\s*cyath:({[^{}]{1,310}})\s*-->/g)) {
    let shareId: unknown, pinId: unknown;
    try { ({ shareId, pinId } = JSON.parse(match[1])); } catch { continue; }
    if (typeof shareId !== "string" || typeof pinId !== "string" ||
        !/^[A-Za-z0-9_-]{8,64}$/.test(shareId) || !/^[A-Za-z0-9_-]{8,64}$/.test(pinId)) continue;
    const pair = shareId + ":" + pinId;
    if (completed.has(pair)) continue;
    completed.add(pair);
    try {
      await changeCanvas(shareId, { type: "status", pinId, status: "resolved", name: source },
        { method: "mcp", id: owner }, null);
    } catch (error) {
      if (!(error instanceof ReviewError && error.status === 404)) throw error;
    }
  }
}
