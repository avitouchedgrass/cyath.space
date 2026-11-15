import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { audioUrl } = await req.json();

    if (!audioUrl || !audioUrl.startsWith("data:")) {
      return NextResponse.json({ error: "Missing valid base64 audio data URI" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
    }

    // Extract mimeType and raw base64
    const matches = audioUrl.match(/^data:([a-zA-Z0-9\/\-\_\.]+);base64,(.+)$/);
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

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
      const errText = await response.text();
      return NextResponse.json({ error: `Gemini API error: ${errText}` }, { status: 502 });
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
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
