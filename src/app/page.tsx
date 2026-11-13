"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isGuest = localStorage.getItem("cyath_guest_session") === "true";
      const hasAuth = localStorage.getItem("cyath_auth_active") === "true";
      let hasSbToken = false;
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith("sb-") && key.endsWith("-auth-token"))) {
            const raw = localStorage.getItem(key);
            if (raw && raw.length > 20) {
              hasSbToken = true;
              break;
            }
          }
        }
      } catch { }

      if (isGuest || hasAuth || hasSbToken) {
        router.replace("/dashboard");
        return;
      }
    }

    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        try { localStorage.setItem("cyath_auth_active", "true"); } catch { }
        router.replace("/dashboard");
      }
    });
  }, [router]);

  return (
    <main className="w-full h-screen overflow-hidden bg-black">
      <iframe
        src="/landing.html?v=17"
        title="Cyath — Visual Staging Review & Client Sign-Off Canvas"
        className="w-full h-full border-none"
      />
    </main>
  );
}
