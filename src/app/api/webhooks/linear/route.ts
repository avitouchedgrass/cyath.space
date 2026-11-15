import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    // Linear webhook trigger when an issue transitions to 'completed' / 'done'
    const isCompleted =
      payload.type === "Issue" &&
      payload.action === "update" &&
      payload.data?.state?.type === "completed";

    if (isCompleted) {
      const bodyText = payload.data?.description || "";
      const match = bodyText.match(/<!--\s*cyath:({.*?})\s*-->/);

      if (match && match[1]) {
        try {
          const { shareId, pinId } = JSON.parse(match[1]);
          if (shareId && pinId) {
            const baseUrl = req.nextUrl.origin;
            await fetch(`${baseUrl}/api/canvases/${shareId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                pinId,
                status: "resolved",
                resolvedBy: "Linear Sync",
              }),
            });
          }
        } catch {}
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
