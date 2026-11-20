"use client";

import { useState, type FormEvent } from "react";
import { ModalDialog } from "@/components/common/ModalDialog";
import { reviewErrorMessage } from "@/lib/reviews/client";
import type { Project } from "@/types";

function printReceipt(project: Project) {
  const popup = window.open("", "_blank");
  if (!popup) throw new Error("Allow pop-ups for Cyath to print the receipt.");
  popup.opener = null;
  const doc = popup.document;
  doc.title = "Cyath approval receipt";
  const style = doc.createElement("style");
  style.textContent = "body{font:16px system-ui;color:#18181b;margin:3rem}p{overflow-wrap:anywhere}";
  doc.head.append(style);
  const heading = doc.createElement("h1");
  heading.textContent = doc.title;
  doc.body.append(heading);
  for (const line of [
    project.title,
    `Studio: ${project.agencyName}`,
    `Approved by: ${project.approvedBy ?? "Reviewer"}`,
    `Approval time: ${project.approvedAt ? new Date(project.approvedAt).toISOString() : "Unknown"}`,
    `Review revision: ${project.approvedRevision ?? "Legacy review"}`,
  ]) {
    const paragraph = doc.createElement("p");
    paragraph.textContent = line;
    doc.body.append(paragraph);
  }
  popup.print();
}

export function ApprovalModal({ project, onApprove, onRevoke, onClose }: {
  project: Project;
  theme?: "day" | "night";
  onApprove?: (name: string, organization?: string) => Promise<void>;
  onRevoke?: () => Promise<void>;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const open = project.pins.filter(pin => pin.status !== "resolved").length;
  const button = "rounded-lg border border-white/30 px-3 py-2 text-sm disabled:opacity-50";

  async function update(action: () => Promise<void>) {
    if (busy) return;
    setError("");
    setBusy(true);
    try {
      await action();
    } catch (error) {
      setError(reviewErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!onApprove || open) return;
    const form = new FormData(event.currentTarget);
    void update(() => onApprove(String(form.get("name")), String(form.get("organization") || "")));
  }

  return (
    <ModalDialog title={project.isApproved ? "Approval receipt" : "Finish review"} onClose={onClose}>
      <div className="space-y-4 p-4">
        <h3 className="font-serif text-xl">{project.title}</h3>
        {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
        {project.isApproved ? (
          <>
            <p className="text-sm">Approved by {project.approvedBy || "Reviewer"}</p>
            {project.approvedAt && <p className="text-sm text-zinc-300">{new Date(project.approvedAt).toLocaleString()}</p>}
            {project.approvedRevision !== undefined && <p className="text-sm text-zinc-300">Review revision {project.approvedRevision}</p>}
            <div className="flex flex-wrap gap-2">
              <button type="button" className={button} onClick={() => {
                try { printReceipt(project); } catch (error) { setError(reviewErrorMessage(error)); }
              }}>Print receipt</button>
              {onRevoke && <button type="button" className={button} disabled={busy}
                onClick={() => void update(async () => { await onRevoke(); onClose(); })}>Reopen review</button>}
            </div>
          </>
        ) : open ? (
          <p className="text-sm text-zinc-200">The studio needs to resolve {open} open {open === 1 ? "note" : "notes"} before approval.</p>
        ) : onApprove && (
          <form onSubmit={submit} className="space-y-3">
            <p className="text-sm text-zinc-200">Approve this review as shown. Cyath records your name and the time of approval.</p>
            <label className="block text-sm">Your name
              <input name="name" autoComplete="name" required maxLength={120}
                className="mt-1 block w-full rounded-md border border-white/30 bg-white/5 p-2" />
            </label>
            <label className="block text-sm">Organization (optional)
              <input name="organization" autoComplete="organization" maxLength={150}
                className="mt-1 block w-full rounded-md border border-white/30 bg-white/5 p-2" />
            </label>
            <button type="submit" className={button} disabled={busy}>{busy ? "Saving…" : "Approve review"}</button>
          </form>
        )}
      </div>
    </ModalDialog>
  );
}
