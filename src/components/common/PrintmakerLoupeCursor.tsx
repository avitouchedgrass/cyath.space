"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useReviewStore } from "@/store/useReviewStore";

export function PrintmakerLoupeCursor() {
  const pathname = usePathname();
  const cursorRef = useRef<HTMLDivElement>(null);
  const clientAuthorName = useReviewStore((s) => s.clientAuthorName) || "Reviewer";
  const [isClient, setIsClient] = useState(false);

  // When on the home landing page ("/"), the embedded landing iframe manages its own cursor.
  const isLandingPage = pathname === "/";

  useEffect(() => {
    setIsClient(true);
    if (isLandingPage) return;

    const cursorEl = cursorRef.current;
    if (!cursorEl) return;

    let mouseX = -100;
    let mouseY = -100;
    let posX = -100;
    let posY = -100;
    let isVisible = false;
    let animId: number;

    const activateCursor = () => {
      if (!document.documentElement.classList.contains("custom-cursor-active")) {
        document.documentElement.classList.add("custom-cursor-active");
      }
      if (!document.body.classList.contains("custom-cursor-active")) {
        document.body.classList.add("custom-cursor-active");
      }
    };

    activateCursor();

    const onMouseMove = (e: MouseEvent) => {
      activateCursor();
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!isVisible) {
        isVisible = true;
        posX = mouseX;
        posY = mouseY;
        cursorEl.style.opacity = "1";
      }
    };

    const onMouseLeave = () => {
      isVisible = false;
      cursorEl.style.opacity = "0";
    };

    const onMouseEnter = () => {
      isVisible = true;
      cursorEl.style.opacity = "1";
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);

    const updateCursor = () => {
      if (isVisible) {
        // High-precision snappy spring physics
        posX += (mouseX - posX) * 0.45;
        posY += (mouseY - posY) * 0.45;
        cursorEl.style.transform = `translate3d(${posX}px, ${posY}px, 0)`;
      }
      animId = requestAnimationFrame(updateCursor);
    };
    animId = requestAnimationFrame(updateCursor);

    return () => {
      document.documentElement.classList.remove("custom-cursor-active");
      document.body.classList.remove("custom-cursor-active");
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
      cancelAnimationFrame(animId);
    };
  }, [isLandingPage]);

  if (!isClient || isLandingPage) {
    return null;
  }

  return (
    <div
      ref={cursorRef}
      className="fixed top-0 left-0 pointer-events-none z-[99999999] opacity-0 will-change-transform flex items-start"
      aria-hidden="true"
    >
      {/* 01/Capture Architectural Drafting Arrow */}
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
        <path
          d="M4 3L11 20L14 13L21 10L4 3Z"
          fill="#FFFFFF"
          stroke="#000000"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
      {/* Label Pill */}
      <div className="absolute left-[13px] top-[9px] bg-white text-black font-mono font-bold text-[9px] px-1.5 py-0.5 rounded shadow-[0_2px_8px_rgba(0,0,0,0.5)] whitespace-nowrap select-none">
        {clientAuthorName}
      </div>
    </div>
  );
}
