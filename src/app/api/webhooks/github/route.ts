import { failure, json } from "@/lib/reviews/server";
import { resolveLinkedPins, verifiedWebhook } from "@/lib/reviews/webhooks";

export async function POST(request: Request) {
  try {
    const { owner, payload } = await verifiedWebhook(request, "github");
    const closedAt = Date.parse(payload.issue?.closed_at ?? "");
    if (request.headers.get("x-github-event") === "issues" && payload.action === "closed" &&
        Math.abs(Date.now() - closedAt) < 300000) {
      await resolveLinkedPins(payload.issue?.body, owner, "GitHub");
    }
    return json({ received: true });
  } catch (error) {
    return failure(error);
  }
}
