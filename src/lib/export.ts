import { Project, Pin } from "@/types";

export function exportProjectAsMarkdown(project: Project): string {
  const pins = Array.isArray(project?.pins) ? project.pins : [];
  const openPins = pins.filter((p) => p.status !== "resolved");
  const resolvedPins = pins.filter((p) => p.status === "resolved");

  let md = `# Staging Review: ${project.title || "Review Session"}\n`;
  md += `**Target URL:** ${project.targetUrl || "—"}\n`;
  md += `**Agency:** ${project.agencyName || "Independent Studio"}\n`;
  md += `**Status:** ${project.isApproved ? "Approved by " + (project.approvedBy || "Client") : "Review In Progress"}\n`;
  md += `**Generated:** ${new Date().toLocaleDateString()}\n\n`;

  md += `## Open Feedback (${openPins.length})\n\n`;
  if (openPins.length === 0) {
    md += `_No open feedback items._\n\n`;
  } else {
    openPins.forEach((pin) => {
      const firstComment = pin.comments?.[0]?.content || "No description provided";
      const telemetryInfo = pin.telemetry
        ? `${pin.deviceMode} · ${pin.telemetry.viewportWidth || "—"}x${pin.telemetry.viewportHeight || "—"} · ${pin.telemetry.browser || ""} ${pin.telemetry.os || ""}`
        : `${pin.deviceMode}`;
      md += `- [ ] **#${pin.number}** (${telemetryInfo})\n`;
      md += `  > ${firstComment}\n`;
      if (pin.audioUrl) {
        md += `  _Voice note attached (${pin.audioDurationSeconds || 5}s)_\n`;
      }
      if (Array.isArray(pin.comments) && pin.comments.length > 1) {
        md += `  _(${pin.comments.length - 1} follow-up replies)_\n`;
      }
      md += `  <!-- cyath:{"shareId":"${project.shareId}","pinId":"${pin.id}","pinNumber":${pin.number}} -->\n`;
    });
    md += `\n`;
  }

  md += `## Resolved Items (${resolvedPins.length})\n\n`;
  if (resolvedPins.length === 0) {
    md += `_No resolved items yet._\n\n`;
  } else {
    resolvedPins.forEach((pin) => {
      const firstComment = pin.comments?.[0]?.content || "No description provided";
      md += `- [x] **#${pin.number}** ${firstComment} — _Resolved by ${pin.resolvedBy || "Developer"}_\n`;
    });
  }

  return md;
}

export function exportPinAsMarkdown(pin: Pin, project?: Project): string {
  const firstComment = pin.comments?.[0]?.content || "No description provided";
  const telemetryInfo = pin.telemetry
    ? `${pin.deviceMode} · ${pin.telemetry.viewportWidth || "—"}x${pin.telemetry.viewportHeight || "—"} · ${pin.telemetry.browser || ""} ${pin.telemetry.os || ""}`
    : `${pin.deviceMode}`;

  let md = `### [Cyath Pin #${pin.number}] ${firstComment.slice(0, 80)}\n\n`;
  md += `- **Status:** ${pin.status === "resolved" ? "Resolved" : "Open"}\n`;
  md += `- **Page / Target:** \`${pin.pageUrl || "/"}\`\n`;
  md += `- **Telemetry:** ${telemetryInfo}\n`;
  md += `- **Coordinates:** X: ${pin.xPercent.toFixed(1)}%, Y: ${pin.yPercent.toFixed(1)}%\n\n`;
  md += `#### Feedback\n${firstComment}\n\n`;

  if (pin.audioUrl) {
    md += `_Voice note attached (${pin.audioDurationSeconds || 5}s)_\n\n`;
  }

  if (Array.isArray(pin.comments) && pin.comments.length > 1) {
    md += `#### Discussion\n`;
    pin.comments.slice(1).forEach((c) => {
      md += `- **${c.authorName || "Reviewer"}**: ${c.content}\n`;
    });
    md += `\n`;
  }

  if (project?.shareId) {
    md += `<!-- cyath:{"shareId":"${project.shareId}","pinId":"${pin.id}","pinNumber":${pin.number}} -->\n`;
  }

  return md;
}

export function getLinearExportUrl(project: Project): string {
  const title = encodeURIComponent(`Staging Feedback: ${project.title || "Review Session"}`);
  const description = encodeURIComponent(exportProjectAsMarkdown(project));
  return `https://linear.app/issue/new?title=${title}&description=${description}`;
}

export function getGitHubExportUrl(project: Project, repo?: string): string {
  const title = encodeURIComponent(`Staging Feedback: ${project.title || "Review Session"}`);
  const body = encodeURIComponent(exportProjectAsMarkdown(project));
  const cleanRepo = repo?.trim().replace(/^https?:\/\/github\.com\//, "").replace(/\.git$/, "").replace(/\/$/, "");

  if (cleanRepo && cleanRepo.includes("/")) {
    return `https://github.com/${cleanRepo}/issues/new?title=${title}&body=${body}&labels=feedback,staging`;
  }
  return `https://github.com/issues/new?title=${title}&body=${body}`;
}
