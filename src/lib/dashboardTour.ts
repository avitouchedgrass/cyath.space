"use client";

import { openDashboardTour } from "@/components/dashboard/DashboardTour";

export function startDashboardTour(onComplete?: () => void) {
  if (typeof window === "undefined") return;
  openDashboardTour();
  if (onComplete) {
    const handleComplete = () => {
      onComplete();
      window.removeEventListener("cyath-tour-complete", handleComplete);
    };
    window.addEventListener("cyath-tour-complete", handleComplete);
  }
}
