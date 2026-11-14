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
      }).catch(() => { });
    }
  } catch { }
}

interface ReviewState {
  projects: Project[];
  activePinId: string | null;
  activeDeviceMode: DeviceMode;
  interactionMode: InteractionMode;
  clientAuthorName: string;
  isPro: boolean;
  proCancelled: boolean;

  // Actions
  createProject: (
    title: string,
    targetUrl: string,
    agencyName?: string,
    assetType?: AssetType,
    ownerId?: string,
    ownerEmail?: string
  ) => string;
  hydrateProject: (project: Project) => void;
  deleteProject: (projectId: string) => void;
  getProject: (shareId: string) => Project | undefined;
  addPin: (
    projectId: string,
    xPercent: number,
    yPercent: number,
    telemetry: ClientTelemetry,
    initialComment: string,
    authorName: string,
    pageUrl?: string,
    widthPercent?: number,
    heightPercent?: number,
    annotationType?: "point" | "box"
  ) => void;
  addComment: (
    projectId: string,
    pinId: string,
    content: string,
    authorName: string,
    authorRole?: "client" | "developer"
  ) => void;
  deletePin: (projectId: string, pinId: string) => void;
  toggleResolvePin: (projectId: string, pinId: string, resolvedBy?: string) => void;
  approveProject: (projectId: string, approverName: string, organization?: string) => void;
  activatePro: () => void;
  cancelPro: () => void;
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
      isPro: false,
      proCancelled: false,

      createProject: (
        title,
        targetUrl,
        agencyName = "Independent Firm",
        assetType = "url",
        ownerId,
        ownerEmail
      ) => {
        const shareId = nanoid(8);
        const newProject: Project = {
          id: nanoid(),
          shareId,
          title,
          targetUrl,
          agencyName,
          ownerId,
          ownerEmail,
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
          const currentProjects = Array.isArray(state.projects) ? state.projects.filter(Boolean) : [];
          const incomingPins = Array.isArray(project.pins) ? project.pins.filter(Boolean) : [];
          const existingIndex = currentProjects.findIndex(
            (p) => p && (p.shareId === project.shareId || p.id === project.id)
          );
          if (existingIndex >= 0) {
            const existing = currentProjects[existingIndex];
            const existingPins = Array.isArray(existing?.pins) ? existing.pins.filter(Boolean) : [];
            const mergedPins = incomingPins.length > 0 ? incomingPins : existingPins;
            const merged: Project = {
              ...existing,
              ...project,
              targetUrl: project.targetUrl || existing.targetUrl || "",
              title: project.title || existing.title || "Staging Review",
              agencyName: project.agencyName || existing.agencyName || "Independent Firm",
              assetType: project.assetType || existing.assetType || "url",
              pins: mergedPins,
            };
            const updated = [...currentProjects];
            updated[existingIndex] = merged;
            syncCanvasToServer(merged);
            return { projects: updated };
          }
          const sanitizedProject: Project = {
            ...project,
            agencyName: project.agencyName || "Independent Firm",
            pins: incomingPins,
          };
          syncCanvasToServer(sanitizedProject);
          return { projects: [sanitizedProject, ...currentProjects] };
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

      addPin: (projectId, xPercent, yPercent, telemetry, initialComment, authorName, pageUrl, widthPercent, heightPercent, annotationType) => {
        const pinId = nanoid();
        set((state) => {
          let updatedTargetProject: Project | null = null;
          const updatedProjects = state.projects.map((proj) => {
            if (proj.id !== projectId && proj.shareId !== projectId) return proj;
            const currentPins = Array.isArray(proj.pins) ? proj.pins : [];
            const nextNumber = currentPins.length + 1;
            const newPin: Pin = {
              id: pinId,
              projectId: proj.id,
              number: nextNumber,
              xPercent,
              yPercent,
              annotationType: annotationType || (widthPercent && heightPercent ? "box" : "point"),
              widthPercent: widthPercent || undefined,
              heightPercent: heightPercent || undefined,
              status: "open",
              deviceMode: state.activeDeviceMode,
              pageUrl: pageUrl || proj.targetUrl,
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
              pins: [...currentPins, newPin],
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
            if (proj.id !== projectId && proj.shareId !== projectId) return proj;
            const currentPins = Array.isArray(proj.pins) ? proj.pins : [];
            const updatedProj = {
              ...proj,
              pins: currentPins.map((pin) => {
                if (pin.id !== pinId) return pin;
                const currentComments = Array.isArray(pin.comments) ? pin.comments : [];
                return {
                  ...pin,
                  comments: [
                    ...currentComments,
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
            if (proj.id !== projectId && proj.shareId !== projectId) return proj;
            const currentPins = Array.isArray(proj.pins) ? proj.pins : [];
            const updatedProj = {
              ...proj,
              pins: currentPins.map((pin) => {
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

      deletePin: (projectId, pinId) => {
        let updatedTargetProject: Project | null = null;
        set((state) => {
          const updated = state.projects.map((p) => {
            if (p.id === projectId || p.shareId === projectId) {
              const currentPins = Array.isArray(p.pins) ? p.pins : [];
              const remaining = currentPins.filter((pin) => pin.id !== pinId);
              const renumbered = remaining.map((pin, index) => ({
                ...pin,
                number: index + 1,
              }));
              const res = { ...p, pins: renumbered };
              updatedTargetProject = res;
              return res;
            }
            return p;
          });
          return {
            projects: updated,
            activePinId: state.activePinId === pinId ? null : state.activePinId,
          };
        });
        if (updatedTargetProject) {
          syncCanvasToServer(updatedTargetProject);
        }
      },

      approveProject: (projectId, approverName, organization) => {
        set((state) => {
          let updatedTargetProject: Project | null = null;
          const updatedProjects = state.projects.map((proj) => {
            if (proj.id !== projectId && proj.shareId !== projectId) return proj;
            const signature = organization ? `${approverName} · ${organization}` : approverName;
            const updatedProj = {
              ...proj,
              isApproved: true,
              approvedAt: new Date().toISOString(),
              approvedBy: signature,
              approvalSignature: signature,
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

      activatePro: () => {
        set({ isPro: true, proCancelled: false });
        if (typeof window !== "undefined") {
          localStorage.setItem("cyath_pro_member", "true");
          localStorage.removeItem("cyath_pro_cancelled");
        }
      },

      cancelPro: () => {
        set({ isPro: false, proCancelled: true });
        if (typeof window !== "undefined") {
          localStorage.removeItem("cyath_pro_member");
          localStorage.setItem("cyath_pro_cancelled", "true");
        }
      },

      setActivePinId: (pinId) => set({ activePinId: pinId }),
      setActiveDeviceMode: (mode) => set({ activeDeviceMode: mode }),
      setInteractionMode: (mode) => set({ interactionMode: mode }),
      setClientAuthorName: (name) => set({ clientAuthorName: name }),
    }),
    {
      name: "cyath_staging_store",
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (typeof window !== "undefined") {
            if (localStorage.getItem("cyath_pro_cancelled") === "true") {
              state.proCancelled = true;
              state.isPro = false;
            } else if (localStorage.getItem("cyath_pro_member") === "true") {
              state.isPro = true;
              state.proCancelled = false;
            }
          }
        }
        if (state && Array.isArray(state.projects)) {
          state.projects = state.projects
            .filter(Boolean)
            .map((p) => ({
              ...p,
              agencyName: p?.agencyName || "Independent Firm",
              pins: (Array.isArray(p?.pins) ? p.pins : [])
                .filter(Boolean)
                .map((pin) => ({
                  ...pin,
                  comments: (Array.isArray(pin?.comments) ? pin.comments : []).filter(Boolean),
                  telemetry: pin?.telemetry || {},
                  deviceMode: pin?.deviceMode || "desktop",
                })),
            }));
        }
      },
    }
  )
);

