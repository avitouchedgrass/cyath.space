"use client";

import React, { useEffect, useRef } from "react";

export function PrintmakerLoupeCursor() {
  const fluidRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fluidEl = fluidRef.current;
    if (!fluidEl) return;

    let mouseX = -100;
    let mouseY = -100;
    let beadX = -100;
    let beadY = -100;
    let prevBeadX = -100;
    let prevBeadY = -100;
    let isVisible = false;
    let isOverDemo = false;
    let isHoveringInteractive = false;
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

      const overDemo = !!(e.target as HTMLElement)?.closest(".pin-demo-box");
      if (overDemo !== isOverDemo) {
        isOverDemo = overDemo;
        if (isOverDemo) {
          fluidEl.classList.add("in-demo");
          document.documentElement.classList.add("over-pin-demo");
        } else {
          fluidEl.classList.remove("in-demo");
          document.documentElement.classList.remove("over-pin-demo");
        }
      }

      if (!isVisible && !isOverDemo) {
        isVisible = true;
        beadX = mouseX;
        beadY = mouseY;
        prevBeadX = mouseX;
        prevBeadY = mouseY;
        fluidEl.classList.add("active");
      }
    };

    const onMouseLeave = () => {
      isVisible = false;
      fluidEl.classList.remove("active");
    };

    const onMouseEnter = () => {
      if (!isOverDemo) {
        isVisible = true;
        fluidEl.classList.add("active");
      }
    };

    const onMouseDown = () => {
      fluidEl.classList.add("clicking");
    };

    const onMouseUp = () => {
      fluidEl.classList.remove("clicking");
    };

    const interactiveSelector = "a, button, input, [role='button']";
    const onMouseOver = (e: MouseEvent) => {
      if ((e.target as HTMLElement)?.closest(".pin-demo-box")) {
        isHoveringInteractive = false;
        fluidEl.classList.remove("hovering-interactive");
        return;
      }

      const target = (e.target as HTMLElement)?.closest(interactiveSelector);
      if (!target) {
        isHoveringInteractive = false;
        fluidEl.classList.remove("hovering-interactive");
        return;
      }

      isHoveringInteractive = true;
      fluidEl.classList.add("hovering-interactive");
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    document.addEventListener("mouseover", onMouseOver);

    const updateCursor = () => {
      if (isVisible && !isOverDemo) {
        beadX += (mouseX - beadX) * 0.38;
        beadY += (mouseY - beadY) * 0.38;

        const vx = beadX - prevBeadX;
        const vy = beadY - prevBeadY;
        const speed = Math.sqrt(vx * vx + vy * vy);
        prevBeadX = beadX;
        prevBeadY = beadY;

        if (isHoveringInteractive) {
          fluidEl.style.transform = `translate3d(${beadX}px, ${beadY}px, 0) translate(-50%, -50%)`;
        } else {
          const angle = Math.atan2(vy, vx);
          const stretch = Math.min(speed * 0.022, 0.40);
          const scaleX = 1 + stretch;
          const scaleY = 1 / (1 + stretch * 0.65);
          fluidEl.style.transform = `translate3d(${beadX}px, ${beadY}px, 0) translate(-50%, -50%) rotate(${angle}rad) scale(${scaleX}, ${scaleY})`;
        }
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
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mouseover", onMouseOver);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div id="fluidCursor" ref={fluidRef} className="fluid-cursor" aria-hidden="true" />
  );
}
