"use client";

import Shepherd, { Tour } from "shepherd.js";
import "shepherd.js/dist/css/shepherd.css";

let activeTour: Tour | null = null;

export function startDashboardTour(onComplete?: () => void) {
  if (typeof window === "undefined") return;

  // Cleanup any lingering tour instance
  if (activeTour) {
    try {
      activeTour.complete();
    } catch { }
    activeTour = null;
  }

  const tour = new Shepherd.Tour({
    useModalOverlay: true,
    defaultStepOptions: {
      classes: "cyath-shepherd-theme",
      scrollTo: { behavior: "smooth", block: "center" },
      cancelIcon: { enabled: true },
    },
  });

  tour.addStep({
    id: "welcome",
    title: "Cyath Staging Workspace",
    text: "Welcome to your review cockpit. Clients leave hardware-anchored notes on live deployments with exact screen telemetry attached.",
    attachTo: {
      element: "#tour-sidebar",
      on: "right",
    },
    buttons: [
      {
        text: "Skip Tour",
        classes: "shepherd-button-secondary",
        action: () => tour.complete(),
      },
      {
        text: "Next",
        classes: "shepherd-button-primary",
        action: () => tour.next(),
      },
    ],
  });

  tour.addStep({
    id: "intake",
    title: "Instant Intake Bar",
    text: "Paste any deployed URL or drag and drop a design asset/PDF. A client-ready review canvas is provisioned immediately.",
    attachTo: {
      element: "#tour-create-card",
      on: "bottom",
    },
    buttons: [
      {
        text: "Back",
        classes: "shepherd-button-secondary",
        action: () => tour.back(),
      },
      {
        text: "Next",
        classes: "shepherd-button-primary",
        action: () => tour.next(),
      },
    ],
  });

  tour.addStep({
    id: "cards",
    title: "Viewfinder Preview Cards",
    text: "Each card displays a live preview viewport, client notes counter, and instant share link. Click to open the review canvas.",
    attachTo: {
      element: "#tour-projects-section",
      on: "top",
    },
    buttons: [
      {
        text: "Back",
        classes: "shepherd-button-secondary",
        action: () => tour.back(),
      },
      {
        text: "Next",
        classes: "shepherd-button-primary",
        action: () => tour.next(),
      },
    ],
  });

  tour.addStep({
    id: "plans",
    title: "Active Canvas Quota",
    text: "Free accounts include 1 active review canvas. Upgrade to Pro for unlimited canvases, team punchlists, and MCP agent sync.",
    attachTo: {
      element: "#tour-plans-link",
      on: "right",
    },
    buttons: [
      {
        text: "Back",
        classes: "shepherd-button-secondary",
        action: () => tour.back(),
      },
      {
        text: "Got It",
        classes: "shepherd-button-primary",
        action: () => {
          tour.complete();
          onComplete?.();
        },
      },
    ],
  });

  tour.on("complete", () => {
    try {
      localStorage.setItem("cyath_guide_seen", "true");
    } catch { }
    activeTour = null;
    onComplete?.();
  });

  tour.on("cancel", () => {
    try {
      localStorage.setItem("cyath_guide_seen", "true");
    } catch { }
    activeTour = null;
    onComplete?.();
  });

  activeTour = tour;
  tour.start();
}

