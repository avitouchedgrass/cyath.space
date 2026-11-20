"use client";

import Link from "next/link";
import { ModalDialog } from "@/components/common/ModalDialog";

export function StudioUpgradeModal({ onClose }: { onClose: () => void; theme?: "night" | "day" }) {
  return (
    <ModalDialog title="Upgrade to Cyath Pro" onClose={onClose}>
      <div className="space-y-4 p-4">
        <p>The Free plan includes one active review. Pro includes unlimited reviews and access to the Cyath MCP server.</p>
        <Link href="/pro" className="inline-block rounded-lg bg-white px-4 py-2 font-semibold text-black">View Pro pricing</Link>
      </div>
    </ModalDialog>
  );
}
