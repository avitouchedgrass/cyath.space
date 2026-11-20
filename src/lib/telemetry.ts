import { ClientTelemetry, DeviceMode } from "@/types";

export function captureClientTelemetry(
  deviceMode: DeviceMode, viewportWidth: number, viewportHeight: number, scrollDepthPercent: number,
): ClientTelemetry {
  if (typeof window === "undefined") {
    return {
      viewportWidth,
      viewportHeight,
      devicePixelRatio: 1,
      deviceType: deviceMode,
      browser: "Unknown",
      os: "Unknown",
      scrollDepthPercent: 0,
      timestamp: new Date().toISOString(),
    };
  }

  const userAgent = navigator.userAgent;
  const browserPatterns = [
    ["Edge", /Edg(?:A|iOS)?\/([\d.]+)/],
    ["Firefox", /(?:Firefox|FxiOS)\/([\d.]+)/],
    ["Chromium", /(?:Chrome|CriOS)\/([\d.]+)/],
    ["Safari", /Version\/([\d.]+).*Safari/],
  ] as const;
  const matched = browserPatterns.find(([, pattern]) => pattern.test(userAgent));

  let os = "Desktop";
  if (/iPhone|iPad|iPod/.test(userAgent)) os = "iOS";
  else if (userAgent.includes("Android")) os = "Android";
  else if (userAgent.includes("Mac")) os = "macOS";
  else if (userAgent.includes("Win")) os = "Windows";
  else if (userAgent.includes("Linux")) os = "Linux";

  return {
    viewportWidth,
    viewportHeight,
    devicePixelRatio: window.devicePixelRatio || 1,
    deviceType: deviceMode,
    browser: matched?.[0] ?? "Unknown",
    browserVersion: matched ? userAgent.match(matched[1])?.[1] : undefined,
    os,
    scrollDepthPercent,
    timestamp: new Date().toISOString(),
  };
}

