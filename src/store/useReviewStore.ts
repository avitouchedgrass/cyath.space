import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import { Project, Pin, PinStatus, DeviceMode, InteractionMode, ClientTelemetry, AssetType } from "@/types";

function syncCanvasToServer(project: Project) {
  if (!project || !project.shareId) return;
  try {
    if (typeof window !== "undefined") {
      fetch(`/api/canvases/${project.shareId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(project),
      }).catch(() => {});
    }
  } catch {}
}

interface ReviewState {
  projects: Project[];
  activePinId: string | null;
  activeDeviceMode: DeviceMode;
  interactionMode: InteractionMode;
  clientAuthorName: string;

  // Actions
  createProject: (title: string, targetUrl: string, agencyName?: string, assetType?: AssetType) => string;
  hydrateProject: (project: Project) => void;
  deleteProject: (projectId: string) => void;
  getProject: (shareId: string) => Project | undefined;
  addPin: (
    projectId: string,
    xPercent: number,
    yPercent: number,
    telemetry: ClientTelemetry,
    initialComment: string,
    authorName: string
  ) => void;
  addComment: (
    projectId: string,
    pinId: string,
    content: string,
    authorName: string,
    authorRole?: "client" | "developer"
  ) => void;
  toggleResolvePin: (projectId: string, pinId: string, resolvedBy?: string) => void;
  approveProject: (projectId: string, approverName: string) => void;
  setActivePinId: (pinId: string | null) => void;
  setActiveDeviceMode: (mode: DeviceMode) => void;
  setInteractionMode: (mode: InteractionMode) => void;
  setClientAuthorName: (name: string) => void;
}

export const useReviewStore = create<ReviewState>()(
  persist(
    (set, get) => ({
      projects: [],
      activePinId: null,
      activeDeviceMode: "desktop",
      interactionMode: "comment",
      clientAuthorName: "Guest Reviewer",

      createProject: (title, targetUrl, agencyName = "Independent Studio", assetType = "url") => {
        const shareId = nanoid(8);
        const newProject: Project = {
          id: nanoid(),
          shareId,
          title,
          targetUrl,
          agencyName,
          assetType,
          isApproved: false,
          createdAt: new Date().toISOString(),
          pins: [],
        };
        set((state) => ({ projects: [newProject, ...state.projects] }));
        syncCanvasToServer(newProject);
        return shareId;
      },

      hydrateProject: (project: Project) => {
        set((state) => {
          const existingIndex = state.projects.findIndex(
            (p) => p.shareId === project.shareId || p.id === project.id
          );
          if (existingIndex >= 0) {
            const existing = state.projects[existingIndex];
            const merged: Project = {
              ...project,
              targetUrl: project.targetUrl || existing.targetUrl,
              title: project.title || existing.title,
              agencyName: project.agencyName || existing.agencyName,
              assetType: project.assetType || existing.assetType || "url",
              pins:
                project.pins && project.pins.length > 0
                  ? project.pins
                  : existing.pins,
            };
            const updated = [...state.projects];
            updated[existingIndex] = merged;
            syncCanvasToServer(merged);
            return { projects: updated };
          }
          syncCanvasToServer(project);
          return { projects: [project, ...state.projects] };
        });
      },

      deleteProject: (projectId: string) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== projectId),
        }));
      },

      getProject: (shareId) => {
        return get().projects.find((p) => p.shareId === shareId);
      },

      addPin: (projectId, xPercent, yPercent, telemetry, initialComment, authorName) => {
        const pinId = nanoid();
        set((state) => {
          let updatedTargetProject: Project | null = null;
          const updatedProjects = state.projects.map((proj) => {
            if (proj.id !== projectId) return proj;
            const nextNumber = proj.pins.length + 1;
            const newPin: Pin = {
              id: pinId,
              projectId,
              number: nextNumber,
              xPercent,
              yPercent,
              status: "open",
              deviceMode: state.activeDeviceMode,
              pageUrl: proj.targetUrl,
              telemetry,
              createdAt: new Date().toISOString(),
              comments: [
                {
                  id: nanoid(),
                  pinId,
                  authorName: authorName || "Reviewer",
                  authorRole: "client",
                  content: initialComment,
                  createdAt: new Date().toISOString(),
                },
              ],
            };
            updatedTargetProject = {
              ...proj,
              pins: [...proj.pins, newPin],
            };
            return updatedTargetProject;
          });
          if (updatedTargetProject) {
            syncCanvasToServer(updatedTargetProject);
          }
          return {
            projects: updatedProjects,
            activePinId: pinId,
          };
        });
      },

      addComment: (projectId, pinId, content, authorName, authorRole = "developer") => {
        set((state) => {
          let updatedTargetProject: Project | null = null;
          const updatedProjects = state.projects.map((proj) => {
            if (proj.id !== projectId) return proj;
            const updatedProj = {
              ...proj,
              pins: proj.pins.map((pin) => {
                if (pin.id !== pinId) return pin;
                return {
                  ...pin,
                  comments: [
                    ...pin.comments,
                    {
                      id: nanoid(),
                      pinId,
                      authorName: authorName || "Dev",
                      authorRole,
                      content,
                      createdAt: new Date().toISOString(),
                    },
                  ],
                };
              }),
            };
            updatedTargetProject = updatedProj;
            return updatedProj;
          });
          if (updatedTargetProject) {
            syncCanvasToServer(updatedTargetProject);
          }
          return { projects: updatedProjects };
        });
      },

      toggleResolvePin: (projectId, pinId, resolvedBy = "Developer") => {
        set((state) => {
          let updatedTargetProject: Project | null = null;
          const updatedProjects = state.projects.map((proj) => {
            if (proj.id !== projectId) return proj;
            const updatedProj = {
              ...proj,
              pins: proj.pins.map((pin) => {
                if (pin.id !== pinId) return pin;
                const isResolved = pin.status === "resolved";
                const nextStatus: PinStatus = isResolved ? "open" : "resolved";
                return {
                  ...pin,
                  status: nextStatus,
                  resolvedAt: isResolved ? undefined : new Date().toISOString(),
                  resolvedBy: isResolved ? undefined : resolvedBy,
                };
              }),
            };
            updatedTargetProject = updatedProj;
            return updatedProj;
          });
          if (updatedTargetProject) {
            syncCanvasToServer(updatedTargetProject);
          }
          return { projects: updatedProjects };
        });
      },

      approveProject: (projectId, approverName) => {
        set((state) => {
          let updatedTargetProject: Project | null = null;
          const updatedProjects = state.projects.map((proj) => {
            if (proj.id !== projectId) return proj;
            const updatedProj = {
              ...proj,
              isApproved: true,
              approvedAt: new Date().toISOString(),
              approvedBy: approverName,
            };
            updatedTargetProject = updatedProj;
            return updatedProj;
          });
          if (updatedTargetProject) {
            syncCanvasToServer(updatedTargetProject);
          }
          return { projects: updatedProjects };
        });
      },

      setActivePinId: (pinId) => set({ activePinId: pinId }),
      setActiveDeviceMode: (mode) => set({ activeDeviceMode: mode }),
      setInteractionMode: (mode) => set({ interactionMode: mode }),
      setClientAuthorName: (name) => set({ clientAuthorName: name }),
    }),
    {
      name: "cyath_staging_store",
    }
  )
);

