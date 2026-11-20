"use client";

import { useState, type ReactNode } from "react";
import { ModalDialog } from "./ModalDialog";

export function DeleteButton({ onDelete, confirmation, label, className, children }: {
  onDelete: () => void;
  confirmation: string;
  label: string;
  className?: string;
  children: ReactNode;
}) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const close = () => setShowConfirmation(false);

  return <>
    <button type="button" aria-label={label} title={label} className={className} onClick={event => {
      event.stopPropagation();
      setShowConfirmation(true);
    }}>{children}</button>
    {showConfirmation && <ModalDialog title={label} onClose={close}>
      <div className="space-y-4 p-4" onClick={event => event.stopPropagation()}>
        <p className="text-sm">{confirmation}</p>
        <div className="flex justify-end gap-2">
          <button type="button" className="rounded-lg border border-white/30 px-3 py-2" onClick={close}>Cancel</button>
          <button type="button" className="rounded-lg bg-red-700 px-3 py-2 font-medium text-white"
            onClick={() => { close(); onDelete(); }}>Delete</button>
        </div>
      </div>
    </ModalDialog>}
  </>;
}
