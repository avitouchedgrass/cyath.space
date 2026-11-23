import { create } from "zustand";
import { nanoid } from "nanoid";
import { jsonRequest, reviewRequest } from "@/lib/reviews/client";
import type { AssetType, DeviceMode, InteractionMode, PinStatus, Project } from "@/types";

interface ReviewState {
  projects: Project[];
  activePinId: string | null;
  activeDeviceMode: DeviceMode;
  interactionMode: InteractionMode;
  isPro: boolean;
  loadProjects: (signal?: AbortSignal) => Promise<void>;
  createProject: (title: string, targetUrl: string, agencyName: string, assetType?: AssetType) => Promise<string>;
  deleteProject: (shareId: string) => Promise<void>;
  setPinStatus: (shareId: string, pinId: string, status: PinStatus) => Promise<void>;
  refreshPro: () => Promise<void>;
  clearAccount: () => void;
  setActivePinId: (pinId: string | null) => void;
  setActiveDeviceMode: (mode: DeviceMode) => void;
  setInteractionMode: (mode: InteractionMode) => void;
}

export const useReviewStore = create<ReviewState>((set) => ({
  projects: [],
  activePinId: null,
  activeDeviceMode: "desktop",
  interactionMode: "comment",
  isPro: true,

  loadProjects: async (signal) => {
    const { projects } = await reviewRequest<{ projects: Project[] }>("/api/canvases", { signal });
    if (!signal?.aborted) set({ projects });
  },

  createProject: async (title, targetUrl, agencyName, assetType = "url") => {
    const project = await reviewRequest<Project>("/api/canvases", jsonRequest("POST", {
      title, targetUrl, agencyName, assetType, requestId: nanoid(),
    }));
    set(state => ({ projects: [project, ...state.projects.filter(item => item.shareId !== project.shareId)] }));
    return project.shareId;
  },

  deleteProject: async (shareId) => {
    await reviewRequest<void>(`/api/canvases/${encodeURIComponent(shareId)}`, { method: "DELETE" });
    set(state => ({ projects: state.projects.filter(project => project.shareId !== shareId) }));
  },

  setPinStatus: async (shareId, pinId, status) => {
    const { project } = await reviewRequest<{ project: Project }>(
      `/api/canvases/${encodeURIComponent(shareId)}`, jsonRequest("PATCH", { type: "status", pinId, status }),
    );
    set(state => ({ projects: state.projects.map(item => item.shareId === shareId &&
      (item.revision ?? 0) <= (project.revision ?? 0) ? project : item) }));
  },

  refreshPro: async () => {
    set({ isPro: true });
  },

  clearAccount: () => set({ projects: [], isPro: false }),
  setActivePinId: (activePinId) => set({ activePinId }),
  setActiveDeviceMode: (activeDeviceMode) => set({ activeDeviceMode }),
  setInteractionMode: (interactionMode) => set({ interactionMode }),
}));
