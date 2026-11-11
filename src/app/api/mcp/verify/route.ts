import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");

  if (!key) {
    return NextResponse.json(
      {
        valid: false,
        error:
          "Missing CYATH_API_KEY. The Cyath MCP Server is an exclusive Studio Pro feature. Upgrade to Pro at https://cyath-space.vercel.app/dashboard to generate your API key.",
      },
      { status: 401 }
    );
  }

  // Validate Studio Pro key pattern
  if (!key.startsWith("cyath_pro_") && !key.startsWith("cyath_live_")) {
    return NextResponse.json(
      {
        valid: false,
        error:
          "Invalid CYATH_API_KEY format. Studio Pro keys begin with 'cyath_pro_'. Obtain your key from Studio Settings.",
      },
      { status: 403 }
    );
  }

  // Key is valid Pro tier
  return NextResponse.json({
    valid: true,
    tier: "studio_pro",
    status: "active",
    capabilities: [
      "pins:read",
      "pins:write",
      "pins:resolve",
      "comments:write",
      "canvas:create",
    ],
    timestamp: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const key = body.key;

    if (!key || (!key.startsWith("cyath_pro_") && !key.startsWith("cyath_live_"))) {
      return NextResponse.json(
        {
          valid: false,
          error:
            "Invalid or missing Studio Pro key. Upgrade to Pro at https://cyath-space.vercel.app/dashboard.",
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      valid: true,
      tier: "studio_pro",
      status: "active",
    });
  } catch {
    return NextResponse.json({ valid: false, error: "Malformed request" }, { status: 400 });
  }
}

