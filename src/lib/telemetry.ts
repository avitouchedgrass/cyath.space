import { ClientTelemetry, DeviceMode } from "@/types";

export function captureClientTelemetry(deviceMode: DeviceMode): ClientTelemetry {
  if (typeof window === "undefined") {
    return {
      viewportWidth: 1440,
      viewportHeight: 900,
      devicePixelRatio: 1,
      deviceType: deviceMode,
      browser: "Unknown",
      os: "Unknown",
      scrollDepthPercent: 0,
      timestamp: new Date().toISOString(),
    };
  }

  const userAgent = navigator.userAgent;
  let browser = "Chrome";
  if (userAgent.includes("Firefox")) browser = "Firefox";
  else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) browser = "Safari";
  else if (userAgent.includes("Edg")) browser = "Edge";

  let os = "Desktop";
  if (userAgent.includes("Mac")) os = "macOS";
  else if (userAgent.includes("Win")) os = "Windows";
  else if (userAgent.includes("Linux")) os = "Linux";
  else if (userAgent.includes("iPhone") || userAgent.includes("iPad")) os = "iOS";
  else if (userAgent.includes("Android")) os = "Android";

  const scrollTotal = document.documentElement.scrollHeight - window.innerHeight;
  const scrollDepthPercent = scrollTotal > 0 ? Math.round((window.scrollY / scrollTotal) * 100) : 0;

  return {
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio || 1,
    deviceType: deviceMode,
    browser,
    os,
    scrollDepthPercent,
    timestamp: new Date().toISOString(),
  };
}

