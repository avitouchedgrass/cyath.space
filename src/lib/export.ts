import { Project } from "@/types";

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

export function getLinearExportUrl(project: Project): string {
  const title = encodeURIComponent(`Staging Feedback: ${project.title || "Review Session"}`);
  const description = encodeURIComponent(exportProjectAsMarkdown(project));
  return `https://linear.app/issue/new?title=${title}&description=${description}`;
}

export function getGitHubExportUrl(project: Project): string {
  const title = encodeURIComponent(`Staging Feedback: ${project.title || "Review Session"}`);
  const body = encodeURIComponent(exportProjectAsMarkdown(project));
  return `https://github.com/issues/new?title=${title}&body=${body}`;
}


