"use client";

import React, { useEffect, useRef } from "react";

export function PrintmakerLoupeCursor() {
  const loupeRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const tagRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const loupeEl = loupeRef.current;
    const dotEl = dotRef.current;
    const tagEl = tagRef.current;
    if (!loupeEl || !dotEl || !tagEl) return;

    let mouseX = -100;
    let mouseY = -100;
    let loupeX = -100;
    let loupeY = -100;
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
        loupeX = mouseX;
        loupeY = mouseY;
        loupeEl.classList.add("active");
        dotEl.classList.add("active");
      }
      dotEl.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
    };

    const onMouseLeave = () => {
      isVisible = false;
      loupeEl.classList.remove("active");
      dotEl.classList.remove("active");
    };

    const onMouseEnter = () => {
      isVisible = true;
      loupeEl.classList.add("active");
      dotEl.classList.add("active");
    };

    const onMouseDown = () => {
      loupeEl.classList.add("clicking");
    };

    const onMouseUp = () => {
      loupeEl.classList.remove("clicking");
    };

    const interactiveSelector = "a, button, input, [role='button'], canvas";
    const onMouseOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest(interactiveSelector);
      if (!target) {
        loupeEl.classList.remove("hovering-link", "hovering-canvas");
        tagEl.textContent = "8× LOUPE";
        return;
      }

      if (target.tagName === "CANVAS") {
        loupeEl.classList.add("hovering-canvas");
        loupeEl.classList.remove("hovering-link");
        tagEl.textContent = "4D TESSERACT";
      } else if (target.tagName === "A" || target.tagName === "BUTTON") {
        loupeEl.classList.add("hovering-link");
        tagEl.textContent = "SELECT";
      } else {
        loupeEl.classList.add("hovering-link");
        tagEl.textContent = "INPUT";
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    document.addEventListener("mouseover", onMouseOver);

    const updateLoupe = () => {
      if (isVisible) {
        loupeX += (mouseX - loupeX) * 0.18;
        loupeY += (mouseY - loupeY) * 0.18;
        loupeEl.style.transform = `translate3d(${loupeX}px, ${loupeY}px, 0)`;
      }
      animId = requestAnimationFrame(updateLoupe);
    };
    animId = requestAnimationFrame(updateLoupe);

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
    <>
      <div id="loupeCursor" ref={loupeRef} className="loupe-cursor" aria-hidden="true">
        <div className="loupe-ring">
          <span className="loupe-tick tick-n" />
          <span className="loupe-tick tick-s" />
          <span className="loupe-tick tick-w" />
          <span className="loupe-tick tick-e" />
          <span className="crop-mark crop-tl" />
          <span className="crop-mark crop-tr" />
          <span className="crop-mark crop-bl" />
          <span className="crop-mark crop-br" />
        </div>
        <div className="loupe-badge">
          <span ref={tagRef}>8× LOUPE</span>
        </div>
      </div>
      <div id="loupeDot" ref={dotRef} className="loupe-dot" aria-hidden="true" />
    </>
  );
}

