"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.replace("/dashboard");
      }
    });
  }, [router]);

  return (
    <main className="w-full h-screen overflow-hidden bg-black">
      <iframe
        src="/landing.html?v=12"
        title="Cyath — Visual Staging Review & Client Sign-Off Canvas"
        className="w-full h-full border-none"
      />
    </main>
  );
}
