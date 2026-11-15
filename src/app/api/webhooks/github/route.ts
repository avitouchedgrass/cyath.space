import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    // GitHub webhook trigger when an issue is closed
    const isClosed = payload.action === "closed" && payload.issue;

    if (isClosed) {
      const bodyText = payload.issue?.body || "";
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
                resolvedBy: "GitHub Sync",
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
