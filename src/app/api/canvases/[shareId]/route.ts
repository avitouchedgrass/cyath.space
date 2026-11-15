import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";

// In-memory runtime cache
const canvasMemoryStore = new Map<string, any>();

function getStorageDir() {
  try {
    const localDir = path.join(process.cwd(), ".cyath_data");
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    return localDir;
  } catch {
    const tmpDir = path.join(os.tmpdir(), "cyath_canvases");
    try {
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
      return tmpDir;
    } catch {
      return null;
    }
  }
}

function getBlobPublicUrl(shareId: string): string | null {
  const storeId = process.env.BLOB_STORE_ID;
  if (!storeId) return null;
  const subdomain = storeId.replace("store_", "").toLowerCase();
  return `https://${subdomain}.public.blob.vercel-storage.com/canvases/${shareId}.json`;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  const { shareId } = await params;
  if (!shareId) {
    return NextResponse.json({ error: "Missing shareId" }, { status: 400 });
  }

  // 1. Check memory store
  if (canvasMemoryStore.has(shareId)) {
    return NextResponse.json(canvasMemoryStore.get(shareId));
  }

  // 2. Check Vercel Blob persistent store
  const blobUrl = getBlobPublicUrl(shareId);
  if (blobUrl) {
    try {
      const blobRes = await fetch(blobUrl, { cache: "no-store" });
      if (blobRes.ok) {
        const parsed = await blobRes.json();
        canvasMemoryStore.set(shareId, parsed);
        return NextResponse.json(parsed);
      }
    } catch {
      // Fall through to disk fallback
    }
  }

  // 3. Check disk store in /tmp (development fallback)
  const storageDir = getStorageDir();
  if (storageDir) {
    const filePath = path.join(storageDir, `${shareId}.json`);
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf8");
        const parsed = JSON.parse(content);
        canvasMemoryStore.set(shareId, parsed);
        return NextResponse.json(parsed);
      }
    } catch {
      // Fallback
    }
  }

  return NextResponse.json({ error: "Canvas not found" }, { status: 404 });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  const { shareId } = await params;
  if (!shareId) {
    return NextResponse.json({ error: "Missing shareId" }, { status: 400 });
  }

  try {
    const body = await req.json();

    // Check existing stored data to prevent clobbering pins when anonymous visitors mount
    let existingData = canvasMemoryStore.get(shareId);
    if (!existingData) {
      const storageDir = getStorageDir();
      if (storageDir) {
        const filePath = path.join(storageDir, `${shareId}.json`);
        if (fs.existsSync(filePath)) {
          try {
            existingData = JSON.parse(fs.readFileSync(filePath, "utf8"));
          } catch {}
        }
      }
    }

    const incomingPins = Array.isArray(body.pins) ? body.pins : [];
    const existingPins = Array.isArray(existingData?.pins) ? existingData.pins : [];
    const resolvedPins =
      incomingPins.length > 0 ? incomingPins : body._explicitEmpty ? [] : existingPins;

    const data = {
      ...(existingData || {}),
      ...body,
      pins: resolvedPins,
      shareId,
      updatedAt: new Date().toISOString(),
    };

    // 1. Store in memory
    canvasMemoryStore.set(shareId, data);

    // 2. Persist to Vercel Blob (distributed global cloud)
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (token) {
      try {
        await fetch(`https://blob.vercel-storage.com/canvases/${shareId}.json`, {
          method: "PUT",
          headers: {
            authorization: `Bearer ${token}`,
            "x-api-version": "7",
            "content-type": "application/json",
            "x-add-random-suffix": "0",
          },
          body: JSON.stringify(data),
        });
      } catch (blobErr) {
        console.warn("Could not sync canvas to Vercel Blob:", blobErr);
      }
    }

    // 3. Store on disk in /tmp
    const storageDir = getStorageDir();
    if (storageDir) {
      try {
        const filePath = path.join(storageDir, `${shareId}.json`);
        fs.writeFileSync(filePath, JSON.stringify(data), "utf8");
      } catch (e) {
        console.warn("Could not write canvas to /tmp:", e);
      }
    }

    return NextResponse.json({ success: true, shareId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  const { shareId } = await params;
  try {
    const { pinId, status, resolvedBy } = await req.json();
    if (!shareId || !pinId) {
      return NextResponse.json({ error: "Missing shareId or pinId" }, { status: 400 });
    }

    let canvas = canvasMemoryStore.get(shareId);
    const blobUrl = getBlobPublicUrl(shareId);
    if (!canvas && blobUrl) {
      try {
        const res = await fetch(blobUrl, { cache: "no-store" });
        if (res.ok) canvas = await res.json();
      } catch {}
    }

    if (!canvas) {
      return NextResponse.json({ error: "Canvas not found" }, { status: 404 });
    }

    canvas.pins = (canvas.pins || []).map((p: any) => {
      if (p.id === pinId || String(p.number) === String(pinId)) {
        return {
          ...p,
          status: status || "resolved",
          resolvedAt: new Date().toISOString(),
          resolvedBy: resolvedBy || "Webhook Automation",
        };
      }
      return p;
    });
    canvas.updatedAt = new Date().toISOString();

    canvasMemoryStore.set(shareId, canvas);
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (token) {
      try {
        await fetch(`https://blob.vercel-storage.com/canvases/${shareId}.json`, {
          method: "PUT",
          headers: {
            authorization: `Bearer ${token}`,
            "x-api-version": "7",
            "content-type": "application/json",
            "x-add-random-suffix": "0",
          },
          body: JSON.stringify(canvas),
        });
      } catch {}
    }

    return NextResponse.json({ success: true, canvas });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
