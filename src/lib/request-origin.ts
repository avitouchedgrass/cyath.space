export function requestOrigin(request: Request) {
  const url = new URL(request.url);
  const host = request.headers.get("host");
  // Next.js may reconstruct the URL with an internal listener hostname. In
  // browsers, Host is controlled by the transport, unlike forwarded headers.
  if (!host || !/^(?:[\w.-]+|\[[\da-f:]+\])(?::\d+)?$/i.test(host)) return url.origin;
  try {
    const incoming = new URL(`${url.protocol}//${host}`);
    const configured = [process.env.NEXT_PUBLIC_APP_URL, process.env.NEXT_PUBLIC_PREVIEW_ORIGIN];
    for (const value of configured) {
      if (!value) continue;
      const candidate = new URL(value);
      if (candidate.host === incoming.host) return candidate.origin;
    }
    return incoming.origin;
  } catch {
    return url.origin;
  }
}
