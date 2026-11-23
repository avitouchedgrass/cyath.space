import { NextRequest, NextResponse } from "next/server";
import { failure, loadCanvas, readJson, requireActor, requireSameOrigin, ReviewError } from "@/lib/reviews/server";

export async function POST(req: NextRequest) {
  try {
    requireSameOrigin(req);
    const actor = await requireActor(req, true);
    const { audioUrl, shareId } = await readJson(req);
    if (typeof shareId !== "string") throw new ReviewError(400, "Choose a review.");
    if (!(await loadCanvas(shareId, actor, null)).access?.canManage) {
      throw new ReviewError(403, "Only the studio can transcribe a recording.");
    }

    if (typeof audioUrl !== "string" || !audioUrl.startsWith("data:")) {
      return NextResponse.json({ error: "Missing valid base64 audio data URI" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
    }

    const matches = audioUrl.match(/^data:(audio\/(?:webm|ogg|mpeg|mp4|wav|x-wav))(?:;codecs=[\w.-]+)?;base64,([A-Za-z0-9+/]+={0,2})$/i);
    if (!matches) {
      return NextResponse.json({ error: "Invalid audio DataURL format" }, { status: 400 });
    }

    const mimeType = matches[1].split(";")[0] || "audio/webm";
    const base64Data = matches[2];

    const prompt = `You are an expert software feedback assistant. Listen to this voice feedback note from a client reviewing a website.
1. Provide an exact, clean transcription of what they said.
2. Provide a one-line engineering action item summarizing what to fix.

Format your response strictly as JSON:
{
  "transcript": "Exact transcription text",
  "actionItem": "Concise developer action item"
}`;

    const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";
    if (!/^gemini-[a-z0-9.-]+$/.test(model)) throw new Error("Invalid AI model configuration.");
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      signal: AbortSignal.timeout(20000),
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: base64Data,
                },
              },
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Could not transcribe the recording. The audio is still available." }, { status: 502 });
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    let parsed = { transcript: "", actionItem: "" };
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = { transcript: rawText, actionItem: rawText };
    }

    return NextResponse.json({
      success: true,
      transcript: parsed.transcript || "Voice note recorded.",
      actionItem: parsed.actionItem || "Review attached audio memo.",
    });
  } catch (error) {
    return failure(error);
  }
}
