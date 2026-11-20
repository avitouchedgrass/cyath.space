import { failure, json } from "@/lib/reviews/server";
import { resolveLinkedPins, verifiedWebhook } from "@/lib/reviews/webhooks";

export async function POST(request: Request) {
  try {
    const { owner, payload } = await verifiedWebhook(request, "linear");
    if (payload.type === "Issue" && payload.action === "update" &&
        payload.updatedFrom?.stateId && payload.data?.state?.type === "completed") {
      await resolveLinkedPins(payload.data.description, owner, "Linear");
    }
    return json({ received: true });
  } catch (error) {
    return failure(error);
  }
}
