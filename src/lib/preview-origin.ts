export function configuredPreviewOrigin() {
  const value = process.env.NEXT_PUBLIC_PREVIEW_ORIGIN;
  if (!value) return null;
  try {
    const url = new URL(value);
    const appOrigin = new URL(process.env.NEXT_PUBLIC_APP_URL || "https://cyath.space").origin;
    return url.protocol === "https:" && url.href === `${url.origin}/` && url.origin !== appOrigin ? url.origin : null;
  } catch {
    return null;
  }
}

export function previewFrameSource(target: string) {
  const origin = configuredPreviewOrigin();
  if (!origin && process.env.NODE_ENV !== "development") return null;
  return `${origin || ""}/api/proxy?${new URLSearchParams({ url: target, mute: "1" })}`;
}
