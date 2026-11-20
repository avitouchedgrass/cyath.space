"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

export function ModalDialog({ title, onClose, children, className = "" }: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    const trigger = document.activeElement;
    element?.showModal();
    return () => {
      element?.close();
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus();
    };
  }, []);

  return (
    <dialog ref={dialog} aria-label={title} onCancel={event => { event.preventDefault(); onClose(); }}
      className={`m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto overscroll-contain rounded-xl border border-stone-500 bg-[#0a0a0c] p-0 text-white backdrop:bg-black/70 ${className}`}>
      <div className="flex h-full min-h-0 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-white/20 px-4 py-3">
          <h2 className="text-base font-semibold">{title}</h2>
          <button type="button" aria-label={`Close ${title.toLowerCase()}`} className="rounded-md p-2 hover:bg-white/10" onClick={onClose}>
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </header>
        {children}
      </div>
    </dialog>
  );
}
