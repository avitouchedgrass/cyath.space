import "server-only";

import { createClient } from "@supabase/supabase-js";

function keyMatchesUrl(key: string, url: string) {
  try {
    const parts = key.split(".");
    if (parts.length !== 3) return false;
    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf8"));
    const host = new URL(url).hostname;
    return !payload.ref || host.includes(payload.ref);
  } catch {
    return true;
  }
}

export function getAdminClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  let key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key && !keyMatchesUrl(key, url)) {
    key = undefined;
  }
  if (!key) {
    key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  }
  if (!url || !key) throw new Error("Review storage is unavailable.");

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
}
