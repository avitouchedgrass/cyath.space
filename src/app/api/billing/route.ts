import { failure, getActor, hasPro, json, readJson, requireActor, requireSameOrigin, ReviewError } from "@/lib/reviews/server";

function hostedUrl(value: string | undefined) {
  if (!value) return null;
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password) throw new Error("Invalid hosted billing URL.");
  return url.href;
}

export async function GET(request: Request) {
  try {
    return json({ isPro: true });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const actor = await requireActor(request, true);
    const { action } = await readJson(request);
    const isPro = await hasPro(actor.id);
    if (action === "manage") {
      if (!isPro) throw new ReviewError(403, "An active Pro subscription is required.");
      const url = hostedUrl(process.env.CYATH_BILLING_PORTAL_URL);
      if (!url) throw new ReviewError(503, "The billing portal is unavailable. Contact support for help.");
      return json({ url });
    }
    if (isPro) throw new ReviewError(409, "You already have an active Pro subscription.");
    if (action !== "annual" && action !== "monthly") throw new ReviewError(400, "Choose a billing period.");
    const url = hostedUrl(action === "annual" ? process.env.CYATH_CHECKOUT_ANNUAL_URL : process.env.CYATH_CHECKOUT_MONTHLY_URL);
    if (!url) throw new ReviewError(503, "Checkout is unavailable. Contact Cyath for help upgrading.");
    return json({ url });
  } catch (error) {
    return failure(error);
  }
}
