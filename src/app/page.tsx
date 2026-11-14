"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Home() {
  const router = useRouter();
  const [shouldRenderLanding, setShouldRenderLanding] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isGuest = localStorage.getItem("cyath_guest_session") === "true";
      const isAuth = localStorage.getItem("cyath_auth_active") === "true";
      if (isGuest || isAuth) {
        window.location.replace("/dashboard");
        return;
      }
    }

    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        try {
          localStorage.setItem("cyath_auth_active", "true");
        } catch {}
        window.location.replace("/dashboard");
      } else {
        setShouldRenderLanding(true);
      }
    });
  }, [router]);

  return (
    <main className="w-full h-screen overflow-hidden bg-black">
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){try{
            if(localStorage.getItem("cyath_auth_active")==="true"||localStorage.getItem("cyath_guest_session")==="true"||document.cookie.indexOf("sb-")!==-1){
              window.location.replace("/dashboard");
            }
          }catch(e){}})();`,
        }}
      />
      {shouldRenderLanding && (
        <iframe
          src="/landing.html?v=18"
          title="Cyath — Visual Staging Review & Client Sign-Off Canvas"
          className="w-full h-full border-none"
        />
      )}
    </main>
  );
}
