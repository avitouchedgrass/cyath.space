"use client";

import { useState, useEffect } from "react";

export function getInitialTheme(): "night" | "day" {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("cyath_theme");
    if (saved === "day" || saved === "night") return saved;
    const docTheme = document.documentElement.getAttribute("data-theme");
    if (docTheme === "day" || docTheme === "night") return docTheme;
  }
  return "night";
}

export function setThemeGlobally(nextTheme: "night" | "day") {
  if (typeof window === "undefined") return;
  localStorage.setItem("cyath_theme", nextTheme);
  document.documentElement.setAttribute("data-theme", nextTheme);
  window.dispatchEvent(new CustomEvent("cyath-theme-change", { detail: nextTheme }));
}

export function useTheme() {
  const [theme, setTheme] = useState<"night" | "day">(getInitialTheme);

  useEffect(() => {
    const current = getInitialTheme();
    setTheme(current);

    const handler = (e: Event) => {
      const custom = e as CustomEvent<"night" | "day">;
      if (custom.detail) {
        setTheme(custom.detail);
      } else {
        setTheme(getInitialTheme());
      }
    };

    window.addEventListener("cyath-theme-change", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("cyath-theme-change", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const toggle = () => {
    const next = theme === "night" ? "day" : "night";
    setThemeGlobally(next);
  };

  return { theme, isDay: theme === "day", toggle };
}
