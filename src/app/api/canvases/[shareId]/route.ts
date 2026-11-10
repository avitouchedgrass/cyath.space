import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// In-memory fallback cache
const canvasMemoryStore = new Map<string, any>();

function getStorageDir() {
  const tmpDir = path.join("/tmp", "cyath_canvases");
  try {
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    return tmpDir;
  } catch {
    return null;
  }
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

  // 2. Check disk store in /tmp
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
    const data = {
      ...body,
      shareId,
      updatedAt: new Date().toISOString(),
    };

    // Store in memory
    canvasMemoryStore.set(shareId, data);

    // Store on disk in /tmp
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

