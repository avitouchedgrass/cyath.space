import { NextRequest, NextResponse } from "next/server";
import { Project } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { project } = (await req.json()) as { project: Project };

    if (!project) {
      return NextResponse.json({ error: "Missing project payload" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
    }

    const pins = Array.isArray(project.pins) ? project.pins.filter(Boolean) : [];
    const openPins = pins.filter((p) => p.status !== "resolved");

    if (openPins.length === 0) {
      return NextResponse.json({
        digest: `# Sprint Digest: ${project.title || "Review Session"}\n\n**Status:** All ${pins.length} feedback items resolved.\nZero open engineering tasks remaining. Ready for client milestone acceptance.`,
        summary: "All visual feedback items have been resolved.",
      });
    }

    const pinsContext = openPins.map((p) => {
      const firstComment = p.comments?.[0]?.content || "No description";
      const followUps = (p.comments?.slice(1) || []).map((c) => `${c.authorName}: ${c.content}`).join(" | ");
      return `Pin #${p.number} (${p.deviceMode || "desktop"} @ ${p.pageUrl || "/"}): "${firstComment}" ${followUps ? `[Follow-ups: ${followUps}]` : ""} [Location: ${p.xPercent.toFixed(1)}%, ${p.yPercent.toFixed(1)}%]`;
    }).join("\n");

    const prompt = `You are a staff software engineer reviewing client punchlist feedback for "${project.title || "Staging Web Project"}" (Target: ${project.targetUrl || "staging"}).
Analyze these ${openPins.length} open feedback pins:
${pinsContext}

Generate an executive sprint punchlist formatted in GitHub Markdown.
Structure your output as follows:
# Sprint Digest: ${project.title || "Staging Review"}
**Target:** ${project.targetUrl || "—"} | **Scope:** ${openPins.length} Open Items

## 1. High-Priority Fixes
(List critical layout breaks, functional blocks, or urgent issues with Pin # and recommended code remedy)

## 2. Layout, Responsive & Style Polish
(List mobile/desktop alignment, font sizes, padding, spacing with practical CSS/Tailwind suggestions)

## 3. Copy, Assets & Minor Tweaks
(List textual changes, asset replacements, or subtle notes)

## Executive Summary
(Two concise sentences summarizing total engineering effort and estimated turnaround)`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.3,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: `Gemini API error: ${errText}` }, { status: 502 });
    }

    const data = await response.json();
    const digestText = data.candidates?.[0]?.content?.parts?.[0]?.text || "# Sprint Digest\nNo output generated.";

    return NextResponse.json({
      success: true,
      digest: digestText,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
