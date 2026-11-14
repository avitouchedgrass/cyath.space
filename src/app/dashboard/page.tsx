"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  ExternalLink,
  Share2,
  Globe,
  LogOut,
  Sun,
  Moon,
  Check,
  Trash2,
  Search,
  BookOpen,
  UploadCloud,
  FileText,
  LayoutGrid,
  List,
  ChevronDown,
  MessageSquare,
  ShieldCheck,
  Terminal,
  X,
  Zap,
  ArrowRight,
  ArrowUpRight,
  User as UserIcon,
  Building,
  Shield,
  Lock,
} from "lucide-react";
import { useReviewStore } from "@/store/useReviewStore";
import { TesseractMark } from "@/components/common/Logo";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Project } from "@/types";
import { StudioWalkthroughModal } from "@/components/dashboard/StudioWalkthroughModal";
import { ProjectPunchlistDrawer } from "@/components/dashboard/ProjectPunchlistDrawer";
import { AccountSettingsModal } from "@/components/dashboard/AccountSettingsModal";
import { Footer } from "@/components/common/Footer";

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [theme, setTheme] = useState<"night" | "day">("night");
  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [onboardingFirmInput, setOnboardingFirmInput] = useState("");
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [selectedPunchlistProject, setSelectedPunchlistProject] = useState<Project | null>(null);

  const [title, setTitle] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [quickUrl, setQuickUrl] = useState("");
  const [agencyInput, setAgencyInput] = useState("");

  const [viewMode, setViewMode] = useState<"gallery" | "ledger">("gallery");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "signed_off">("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { projects, createProject, deleteProject, isPro, proCancelled } = useReviewStore();
  const isUserPro = !proCancelled && (isPro || (typeof window !== "undefined" && localStorage.getItem("cyath_pro_member") === "true"));

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("cyath_theme");
      if (savedTheme === "day" || savedTheme === "night") {
        setTheme(savedTheme);
        document.documentElement.setAttribute("data-theme", savedTheme);
      } else {
        const docTheme = document.documentElement.getAttribute("data-theme");
        if (docTheme === "day" || docTheme === "night") {
          setTheme(docTheme);
        }
      }
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "night" ? "day" : "night";
    setTheme(next);
    localStorage.setItem("cyath_theme", next);
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", next);
    }
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        const isGuest =
          typeof window !== "undefined" &&
          (localStorage.getItem("cyath_guest_session") === "true" ||
            new URLSearchParams(window.location.search).get("demo") === "true");

        if (isGuest) {
          setCurrentUser({
            id: "guest-user",
            email: "guest@cyath.space",
            user_metadata: { agency_name: "My Studio" },
            app_metadata: {},
            aud: "authenticated",
            created_at: new Date().toISOString(),
          } as User);
          setAgencyInput("My Studio");
          setMounted(true);
        } else {
          router.replace("/login");
        }
      } else {
        setCurrentUser(user);
        const userFirm = user.user_metadata?.agency_name;
        if (!userFirm) {
          setShowOnboardingModal(true);
          setAgencyInput("My Studio");
        } else {
          setAgencyInput(userFirm);
        }
        setMounted(true);
      }
    });
  }, [router, supabase]);

  const handleSignOut = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("cyath_guest_session");
      localStorage.removeItem("cyath_pro_member");
      localStorage.removeItem("cyath_pro_api_key");
      // Destroy all child iframes and audio contexts immediately before teardown
      document.querySelectorAll("iframe").forEach((f) => {
        try {
          f.src = "about:blank";
          f.remove();
        } catch { }
      });
    }
    try {
      localStorage.removeItem("cyath_auth_active");
      localStorage.removeItem("cyath_guest_session");
    } catch { }
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !targetUrl.trim()) return;

    const userWebCanvases = userProjects.filter((p) => p.assetType === "url" || (!p.assetType && p.targetUrl?.startsWith("http")));
    if (!isUserPro && userWebCanvases.length >= 1) {
      setShowCreateModal(false);
      router.push("/pro");
      return;
    }

    let formattedUrl = targetUrl.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = "https://" + formattedUrl;
    }

    const agency = agencyInput.trim() || (currentUser?.user_metadata?.agency_name as string) || "My Studio";
    createProject(title.trim(), formattedUrl, agency, "url", currentUser?.id, currentUser?.email);
    setTitle("");
    setTargetUrl("");
    setShowCreateModal(false);
  };

  const handleQuickUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickUrl.trim()) return;

    const userWebCanvases = userProjects.filter((p) => p.assetType === "url" || (!p.assetType && p.targetUrl?.startsWith("http")));
    if (!isUserPro && userWebCanvases.length >= 1) {
      router.push("/pro");
      return;
    }

    let formattedUrl = quickUrl.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = "https://" + formattedUrl;
    }

    let parsedTitle = "Staging Review";
    try {
      const hostname = new URL(formattedUrl).hostname.replace(/^www\./, "");
      parsedTitle = hostname.charAt(0).toUpperCase() + hostname.slice(1);
    } catch {
      parsedTitle = "Web Review";
    }

    const agency = agencyInput.trim() || (currentUser?.user_metadata?.agency_name as string) || "My Studio";
    const shareId = createProject(parsedTitle, formattedUrl, agency, "url", currentUser?.id, currentUser?.email);
    setQuickUrl("");
    const params = new URLSearchParams();
    params.set("u", formattedUrl);
    params.set("t", parsedTitle);
    params.set("a", agency);
    router.push(`/r/${shareId}?${params.toString()}`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
    const assetType = isPdf ? "pdf" : "image";
    const reader = new FileReader();

    reader.onload = () => {
      const dataUrl = reader.result as string;
      const title = file.name.replace(/\.[^/.]+$/, "");
      const agency = agencyInput.trim() || (currentUser?.user_metadata?.agency_name as string) || "My Studio";
      const shareId = createProject(title, dataUrl, agency, assetType, currentUser?.id, currentUser?.email);
      router.push(`/r/${shareId}`);
    };

    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const chosenName = onboardingFirmInput.trim() || "My Studio";
    await handleUpdateAgencyName(chosenName);
    setShowOnboardingModal(false);
    setShowWalkthrough(true);
  };

  const handleUpdateAgencyName = async (newName: string) => {
    setAgencyInput(newName);
    if (currentUser) {
      setCurrentUser({
        ...currentUser,
        user_metadata: {
          ...currentUser.user_metadata,
          agency_name: newName,
        },
      });
      try {
        await supabase.auth.updateUser({
          data: { agency_name: newName },
        });
      } catch {
        // Fallback
      }
    }
  };

  const handleCopyLink = (shareId: string) => {
    if (typeof window !== "undefined") {
      const proj = projects.find((p) => p.shareId === shareId);
      let fullUrl = `${window.location.origin}/r/${shareId}`;
      if (proj?.targetUrl && !proj.targetUrl.startsWith("data:")) {
        const params = new URLSearchParams();
        params.set("u", proj.targetUrl);
        if (proj.title) params.set("t", proj.title);
        if (proj.agencyName) params.set("a", proj.agencyName);
        fullUrl = `${window.location.origin}/r/${shareId}?${params.toString()}`;
      }
      navigator.clipboard.writeText(fullUrl);
      setCopiedId(shareId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const getCanvasHref = (project: Project) => {
    if (project.targetUrl && !project.targetUrl.startsWith("data:")) {
      const params = new URLSearchParams();
      params.set("u", project.targetUrl);
      if (project.title) params.set("t", project.title);
      if (project.agencyName) params.set("a", project.agencyName);
      return `/r/${project.shareId}?${params.toString()}`;
    }
    return `/r/${project.shareId}`;
  };

  const handleDeleteProject = (projectId: string, projectTitle: string) => {
    if (window.confirm(`Delete "${projectTitle}" and all its notes?`)) {
      deleteProject(projectId);
      if (selectedPunchlistProject?.id === projectId) {
        setSelectedPunchlistProject(null);
      }
    }
  };

  // Isolate canvases to the currently authenticated account
  const userProjects = useMemo(() => {
    if (!currentUser) return [];
    return projects.filter((p) => {
      if (!p) return false;
      if (p.ownerId && currentUser.id) return p.ownerId === currentUser.id;
      if (p.ownerEmail && currentUser.email) {
        return p.ownerEmail.toLowerCase() === currentUser.email.toLowerCase();
      }
      if (p.agencyName && p.agencyName.includes("@")) {
        return p.agencyName.toLowerCase() === (currentUser.email || "").toLowerCase();
      }
      if (currentUser.id === "guest-user") {
        return !p.ownerId && !p.agencyName?.includes("@");
      }
      return false;
    });
  }, [projects, currentUser]);

  const filteredProjects = useMemo(() => {
    return userProjects.filter((p) => {
      if (statusFilter === "active" && (p.isApproved || p.pins.length === 0)) return false;
      if (statusFilter === "signed_off" && !p.isApproved) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(query);
        const matchesUrl = p.targetUrl.toLowerCase().includes(query);
        const matchesAgency = p.agencyName.toLowerCase().includes(query);
        return matchesTitle || matchesUrl || matchesAgency;
      }
      return true;
    });
  }, [userProjects, searchQuery, statusFilter]);

  const totalOpenNotes = useMemo(() => {
    return userProjects.reduce((acc, p) => acc + p.pins.filter((pin) => pin.status !== "resolved").length, 0);
  }, [userProjects]);

  const isDay = theme === "day";

  if (!mounted) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center font-mono text-xs transition-colors duration-200 ${isDay ? "bg-[#F5F3EC] text-zinc-600" : "bg-black text-zinc-400"
          }`}
      >
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-300 relative selection:bg-stone-300 selection:text-black ${isDay ? "bg-[#FBF9F4] text-[#1C1917]" : "bg-black text-[#FFFFFF]"
        }`}
    >
      <div
        className={`fixed inset-0 pointer-events-none z-0 [background-size:24px_24px] ${isDay
            ? "bg-[radial-gradient(#0000000d_1px,transparent_1px)]"
            : "bg-[radial-gradient(#ffffff0a_1px,transparent_1px)]"
          }`}
      />

      <header
        className={`sticky top-0 z-40 w-full backdrop-blur-2xl transition-all border-b ${isDay
            ? "bg-[#FBF9F4]/90 border-stone-200/80"
            : "bg-black/80 border-white/[0.08]"
          }`}
      >
        <div className="max-w-[1400px] mx-auto px-6 sm:px-12 h-16 flex items-center justify-between">
          <Link
            href="/dashboard"
            prefetch={true}
            className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-stone-400 rounded-lg p-1"
          >
            <TesseractMark
              size={24}
              className={`shrink-0 transition-transform duration-200 group-hover:scale-105 ${isDay ? "text-stone-900" : "text-white"
                }`}
            />
            <span
              className={`font-sans font-bold text-[19px] tracking-[-0.04em] leading-none transition-colors ${isDay ? "text-[#1C1A18] group-hover:text-black" : "text-white"
                }`}
            >
              cyath
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {!isUserPro && (
              <Link
                href="/pro"
                prefetch={true}
                className={`hidden sm:inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-semibold text-xs transition-all shadow-md hover:scale-105 border ${isDay
                    ? "bg-stone-900 text-white hover:bg-stone-800 border-stone-900"
                    : "bg-white text-black hover:bg-zinc-200 border-white"
                  }`}
              >
                <Zap className={`w-3.5 h-3.5 ${isDay ? "fill-white stroke-white" : "fill-black stroke-black"}`} />
                <span>Cyath Pro</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${isDay ? "bg-stone-800 text-stone-200" : "bg-black text-white"
                    }`}
                >
                  $12
                </span>
              </Link>
            )}

            <div
              className={`inline-flex items-center gap-1 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full border shadow-xl backdrop-blur-2xl transition-all ${isDay
                  ? "bg-white border-stone-200 shadow-stone-900/5"
                  : "bg-white/[0.05] border-white/15 shadow-black/40"
                }`}
            >
              <div className="relative">
                <button
                  onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-sans transition-all cursor-pointer ${isDay
                      ? "text-stone-800 hover:bg-stone-100"
                      : "text-zinc-300 hover:text-white hover:bg-white/[0.06]"
                    }`}
                  title="Company Profile & Settings"
                >
                  <span
                    className={`w-4 h-4 rounded-full border flex items-center justify-center text-[9px] font-mono font-semibold ${isDay
                        ? "bg-stone-100 border-stone-300 text-stone-900"
                        : "bg-white/10 border-white/20 text-white"
                      }`}
                  >
                    {agencyInput ? agencyInput.charAt(0).toUpperCase() : "M"}
                  </span>
                  <span className="font-medium truncate max-w-[130px]">
                    {agencyInput && !agencyInput.includes("@") ? agencyInput : "My Company"}
                  </span>
                  <ChevronDown className="w-3 h-3 opacity-60 shrink-0" />
                </button>

                {/* Account Dropdown Menu */}
                {showAccountDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowAccountDropdown(false)}
                    />
                    <div
                      className={`absolute right-0 mt-2 w-64 rounded-2xl border p-2 z-50 font-sans animate-in fade-in slide-in-from-top-2 duration-150 ${isDay
                          ? "bg-white border-stone-200 shadow-[0_20px_50px_rgba(0,0,0,0.12)] text-stone-900"
                          : "bg-[#0a0a0d] border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.95)] text-white"
                        }`}
                    >
                      <div className={`px-3 py-2 border-b mb-1 ${isDay ? "border-stone-100" : "border-white/10"}`}>
                        <span className={`text-xs block mb-0.5 ${isDay ? "text-stone-500" : "text-zinc-400"}`}>
                          Signed in as
                        </span>
                        <span className={`text-xs font-medium truncate block ${isDay ? "text-stone-900" : "text-white"}`}>
                          {currentUser?.email || "Team Member"}
                        </span>
                      </div>

                      <Link
                        href="/settings?tab=profile"
                        prefetch={true}
                        onClick={() => setShowAccountDropdown(false)}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors ${isDay
                            ? "text-stone-700 hover:text-stone-950 hover:bg-stone-100"
                            : "text-zinc-300 hover:text-white hover:bg-white/[0.06]"
                          }`}
                      >
                        <Building className={`w-3.5 h-3.5 ${isDay ? "text-stone-500" : "text-zinc-400"}`} />
                        <span>Company Profile</span>
                      </Link>

                      <Link
                        href="/settings?tab=account"
                        prefetch={true}
                        onClick={() => setShowAccountDropdown(false)}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors ${isDay
                            ? "text-stone-700 hover:text-stone-950 hover:bg-stone-100"
                            : "text-zinc-300 hover:text-white hover:bg-white/[0.06]"
                          }`}
                      >
                        <Shield className={`w-3.5 h-3.5 ${isDay ? "text-stone-500" : "text-zinc-400"}`} />
                        <span>Account Settings</span>
                      </Link>

                      <Link
                        href="/settings?tab=mcp"
                        prefetch={true}
                        onClick={() => setShowAccountDropdown(false)}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors ${isDay
                            ? "text-stone-700 hover:text-stone-950 hover:bg-stone-100"
                            : "text-zinc-300 hover:text-white hover:bg-white/[0.06]"
                          }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Terminal className={`w-3.5 h-3.5 ${isDay ? "text-stone-500" : "text-zinc-400"}`} />
                          <span>MCP Keys</span>
                        </div>
                        <span
                          className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${isDay ? "bg-stone-100 text-stone-700 border border-stone-200" : "bg-white/10 text-zinc-300"
                            }`}
                        >
                          PRO
                        </span>
                      </Link>

                      <Link
                        href="/settings?tab=billing"
                        prefetch={true}
                        onClick={() => setShowAccountDropdown(false)}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors ${isDay
                            ? "text-stone-700 hover:text-stone-950 hover:bg-stone-100"
                            : "text-zinc-300 hover:text-white hover:bg-white/[0.06]"
                          }`}
                      >
                        <Zap className={`w-3.5 h-3.5 ${isDay ? "text-stone-500" : "text-zinc-400"}`} />
                        <span>Plan & Billing</span>
                      </Link>

                      <div className={`my-1 border-t ${isDay ? "border-stone-100" : "border-white/10"}`} />

                      <button
                        onClick={() => {
                          setShowAccountDropdown(false);
                          handleSignOut();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className={`w-px h-4 ${isDay ? "bg-stone-200" : "bg-white/10"}`} />

              <button
                onClick={() => setShowWalkthrough(true)}
                className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono transition-all cursor-pointer ${isDay
                    ? "text-stone-700 hover:text-stone-950 hover:bg-stone-100"
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
                  }`}
                title="Guide"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Guide</span>
              </button>

              <button
                onClick={toggleTheme}
                className={`p-1.5 rounded-full transition-all cursor-pointer ${isDay
                    ? "text-stone-700 hover:text-stone-950 hover:bg-stone-100"
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
                  }`}
                title="Toggle theme"
                aria-label="Toggle theme"
              >
                {isDay ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={handleSignOut}
                className={`p-1.5 rounded-full transition-all cursor-pointer ${isDay
                    ? "text-stone-600 hover:text-stone-950 hover:bg-stone-100"
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
                  }`}
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => {
                  const userWebCanvases = userProjects.filter((p) => p.assetType === "url" || (!p.assetType && p.targetUrl?.startsWith("http")));
                  if (!isUserPro && userWebCanvases.length >= 1) {
                    router.push("/pro");
                  } else {
                    setShowCreateModal(true);
                  }
                }}
                className={`ml-1 px-4 py-1.5 rounded-full text-xs font-sans font-semibold tracking-tight transition-all flex items-center gap-1.5 shadow-md cursor-pointer hover:scale-105 ${isDay
                    ? "bg-stone-900 text-white hover:bg-stone-800"
                    : "bg-white text-black hover:bg-zinc-200"
                  }`}
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.2]" />
                <span>New Canvas</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-[1400px] mx-auto px-6 sm:px-12 py-10 sm:py-14 space-y-10">
        <section className="space-y-4">
          <div className={`flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b ${isDay ? "border-stone-200" : "border-white/[0.08]"}`}>
            <div className="space-y-2 max-w-2xl">
              <h1 className={`font-serif text-3xl sm:text-5xl font-normal tracking-tight leading-[1.1] ${isDay ? "text-stone-900" : "text-white"}`}>
                Canvases
              </h1>
              <p className={`font-sans text-sm sm:text-base font-normal leading-relaxed ${isDay ? "text-stone-600" : "text-zinc-400"}`}>
                Review live websites, designs, and prototypes with clients.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0 font-mono text-[11px]">
              <span className={`px-3 py-1 rounded-full border ${isDay ? "border-stone-200 bg-white text-stone-700 shadow-sm" : "border-white/10 bg-white/[0.03] text-zinc-400"}`}>
                {userProjects.length} {userProjects.length === 1 ? "canvas" : "canvases"}
              </span>
              <span className={`px-3 py-1 rounded-full border ${isDay ? "border-stone-200 bg-white text-stone-700 shadow-sm" : "border-white/10 bg-white/[0.03] text-zinc-400"}`}>
                {totalOpenNotes} open {totalOpenNotes === 1 ? "note" : "notes"}
              </span>
            </div>
          </div>

          <div
            className={`p-3 sm:p-3.5 rounded-2xl border transition-all duration-300 shadow-xl ${isDay
                ? "bg-white border-stone-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.04)] focus-within:border-stone-400"
                : "bg-[#0a0a0d] border-white/15 focus-within:border-white/40 focus-within:shadow-[0_0_35px_rgba(255,255,255,0.07)]"
              }`}
          >
            <form onSubmit={handleQuickUrlSubmit} className="flex flex-col md:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Globe
                  className={`w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${isDay ? "text-stone-400 group-focus-within:text-stone-900" : "text-zinc-500 group-focus-within:text-white"
                    }`}
                />
                <input
                  type="text"
                  placeholder="Enter website URL (e.g. https://yoursite.com)"
                  value={quickUrl}
                  onChange={(e) => setQuickUrl(e.target.value)}
                  className={`w-full pl-11 pr-4 py-3 rounded-xl border text-xs sm:text-sm font-mono transition-all outline-none ${isDay
                      ? "bg-stone-50 border-stone-200 focus:border-stone-900 focus:bg-white text-stone-900 placeholder:text-stone-400"
                      : "bg-black border-white/10 focus:border-white/30 text-white placeholder:text-zinc-600"
                    }`}
                  aria-label="Enter website URL"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <label
                  className={`flex-1 md:flex-initial px-4 py-3 rounded-xl border text-xs font-mono flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer hover:scale-[1.01] active:scale-[0.99] ${isDay
                      ? "border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-800"
                      : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/25 text-zinc-300 hover:text-white"
                    }`}
                  title="Upload image or PDF"
                >
                  <UploadCloud className={`w-3.5 h-3.5 ${isDay ? "text-stone-500" : "text-zinc-400"}`} />
                  <span>Upload File</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileUpload}
                    className="sr-only"
                  />
                </label>

                <button
                  type="submit"
                  disabled={!quickUrl.trim()}
                  className={`flex-1 md:flex-initial px-5 py-3 rounded-xl text-xs font-mono font-semibold tracking-wider transition-all duration-200 whitespace-nowrap cursor-pointer disabled:opacity-30 hover:scale-[1.02] active:scale-[0.98] ${isDay
                      ? "bg-stone-900 text-white hover:bg-stone-800 shadow-sm"
                      : "bg-white text-black hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(255,255,255,0.25)]"
                    }`}
                >
                  Review URL →
                </button>
              </div>
            </form>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div
              className={`flex items-center gap-1.5 p-1 rounded-xl border transition-all ${isDay ? "border-stone-200 bg-stone-100" : "border-white/10 bg-white/[0.02]"
                }`}
            >
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${statusFilter === "all"
                    ? isDay
                      ? "bg-stone-900 text-white font-semibold shadow-sm"
                      : "bg-white text-black font-semibold shadow-sm"
                    : isDay
                      ? "text-stone-600 hover:text-stone-900"
                      : "text-zinc-400 hover:text-white"
                  }`}
              >
                All ({userProjects.length})
              </button>
              <button
                onClick={() => setStatusFilter("active")}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${statusFilter === "active"
                    ? isDay
                      ? "bg-stone-900 text-white font-semibold shadow-sm"
                      : "bg-white text-black font-semibold shadow-sm"
                    : isDay
                      ? "text-stone-600 hover:text-stone-900"
                      : "text-zinc-400 hover:text-white"
                  }`}
              >
                Needs Review ({userProjects.filter((p) => !p.isApproved && p.pins.length > 0).length})
              </button>
              <button
                onClick={() => setStatusFilter("signed_off")}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${statusFilter === "signed_off"
                    ? isDay
                      ? "bg-stone-900 text-white font-semibold shadow-sm"
                      : "bg-white text-black font-semibold shadow-sm"
                    : isDay
                      ? "text-stone-600 hover:text-stone-900"
                      : "text-zinc-400 hover:text-white"
                  }`}
              >
                Approved ({userProjects.filter((p) => p.isApproved).length})
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search
                  className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${isDay ? "text-stone-400" : "text-zinc-500"
                    }`}
                />
                <input
                  type="text"
                  placeholder="Filter canvases..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-48 sm:w-60 pl-8 pr-3 py-1.5 rounded-xl border text-xs font-mono transition-all outline-none ${isDay
                      ? "bg-white border-stone-200 focus:border-stone-900 text-stone-900 placeholder:text-stone-400 shadow-sm"
                      : "bg-white/[0.03] border-white/10 focus:border-white/30 text-white placeholder:text-zinc-600"
                    }`}
                  aria-label="Filter canvases"
                />
              </div>

              <div
                className={`p-0.5 rounded-xl border flex items-center transition-all ${isDay ? "bg-stone-100 border-stone-200" : "bg-white/[0.03] border-white/10"
                  }`}
              >
                <button
                  onClick={() => setViewMode("gallery")}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === "gallery"
                      ? isDay
                        ? "bg-white text-stone-900 font-semibold shadow-sm"
                        : "bg-white/15 text-white"
                      : isDay
                        ? "text-stone-500 hover:text-stone-900"
                        : "text-zinc-500 hover:text-white"
                    }`}
                  title="Gallery view"
                  aria-label="Gallery view"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode("ledger")}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === "ledger"
                      ? isDay
                        ? "bg-white text-stone-900 font-semibold shadow-sm"
                        : "bg-white/15 text-white"
                      : isDay
                        ? "text-stone-500 hover:text-stone-900"
                        : "text-zinc-500 hover:text-white"
                    }`}
                  title="List view"
                  aria-label="List view"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {proCancelled && (
            <div
              className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${isDay
                  ? "bg-stone-100 border-stone-200 text-stone-800"
                  : "bg-white/[0.04] border-white/15 text-zinc-300"
                }`}
            >
              <div className="flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-stone-500 shrink-0" />
                <span className="text-xs font-mono">
                  Your Pro membership has ended. Canvases are locked in read-only mode until reactivated.
                </span>
              </div>
              <Link
                href="/pro"
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold whitespace-nowrap transition-colors ${isDay
                    ? "bg-stone-900 text-white hover:bg-stone-800"
                    : "bg-white text-black hover:bg-zinc-200"
                  }`}
              >
                Reactivate Pro →
              </Link>
            </div>
          )}

          {viewMode === "gallery" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <ViewfinderCard
                  key={project.id}
                  project={project}
                  isDay={isDay}
                  isLocked={proCancelled}
                  copiedId={copiedId}
                  onCopyLink={handleCopyLink}
                  onSelectPunchlist={setSelectedPunchlistProject}
                  onDelete={handleDeleteProject}
                  getCanvasHref={getCanvasHref}
                />
              ))}

              <div
                onClick={() => setShowCreateModal(true)}
                className={`group rounded-2xl border border-dashed transition-all duration-300 p-8 flex flex-col items-center justify-center text-center min-h-[350px] cursor-pointer hover:-translate-y-1 ${isDay
                    ? "border-stone-300 hover:border-stone-400 bg-white hover:bg-stone-50/80 shadow-sm"
                    : "border-white/10 hover:border-white/25 bg-white/[0.01] hover:bg-white/[0.03]"
                  }`}
              >
                <div
                  className={`w-12 h-12 rounded-full border flex items-center justify-center mb-3 group-hover:scale-110 transition-transform ${isDay ? "border-stone-300 bg-stone-50" : "border-white/15 bg-white/[0.02]"
                    }`}
                >
                  <Plus className={`w-5 h-5 transition-colors ${isDay ? "text-stone-700 group-hover:text-stone-950" : "text-zinc-400 group-hover:text-white"}`} />
                </div>
                <h3 className={`font-serif text-lg font-normal mb-1 ${isDay ? "text-stone-900" : "text-zinc-200"}`}>
                  New Canvas
                </h3>
                <p className={`font-sans text-xs max-w-[200px] ${isDay ? "text-stone-500" : "text-zinc-500"}`}>
                  Paste a URL or drop a design file to start reviewing.
                </p>
              </div>
            </div>
          ) : (
            <div
              className={`rounded-2xl border overflow-hidden transition-all ${isDay ? "bg-white border-stone-200 shadow-sm text-stone-900" : "bg-[#0a0a0d] border-white/10 text-white"
                }`}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr
                      className={`border-b text-[10px] font-mono tracking-wider uppercase ${isDay ? "border-stone-200 bg-stone-50 text-stone-500" : "border-white/[0.08] bg-white/[0.01] text-zinc-500"
                        }`}
                    >
                      <th className="py-3 px-6">Name</th>
                      <th className="py-3 px-6">URL / Target</th>
                      <th className="py-3 px-6">Notes</th>
                      <th className="py-3 px-6">Status</th>
                      <th className="py-3 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y text-xs font-mono ${isDay ? "divide-stone-100" : "divide-white/[0.06]"}`}>
                    {filteredProjects.length === 0 ? (
                      <tr>
                        <td colSpan={5} className={`py-12 text-center font-mono text-xs ${isDay ? "text-stone-400" : "text-zinc-500"}`}>
                          No canvases found.
                        </td>
                      </tr>
                    ) : (
                      filteredProjects.map((project) => {
                        const pinCount = project.pins.length;
                        const resolvedCount = project.pins.filter((p) => p.status === "resolved").length;
                        const openCount = pinCount - resolvedCount;

                        return (
                          <tr
                            key={project.id}
                            className={`transition-colors group ${proCancelled ? "grayscale opacity-80" : ""
                              } ${isDay ? "hover:bg-stone-50/80" : "hover:bg-white/[0.03]"}`}
                          >
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <TesseractMark
                                  size={16}
                                  className={`shrink-0 ${isDay ? "text-stone-900" : "text-white/70"}`}
                                />
                                <div>
                                  <Link
                                    href={proCancelled ? "/pro" : getCanvasHref(project)}
                                    className={`font-serif text-sm font-normal block leading-snug hover:underline ${isDay ? "text-stone-900 hover:text-stone-700" : "text-white"
                                      }`}
                                  >
                                    {project.title}
                                  </Link>
                                  <span className={`text-[10px] ${isDay ? "text-stone-500" : "text-zinc-500"}`}>
                                    {project.agencyName}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className={`py-4 px-6 truncate max-w-[260px] ${isDay ? "text-stone-600" : "text-zinc-400"}`}>
                              {project.targetUrl}
                            </td>
                            <td className="py-4 px-6">
                              <span
                                className={`px-2.5 py-1 rounded-full border text-[10px] ${isDay
                                    ? "border-stone-200 bg-stone-100 text-stone-700"
                                    : "border-white/10 bg-white/5 text-zinc-300"
                                  }`}
                              >
                                {openCount} open · {resolvedCount} resolved
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              {proCancelled ? (
                                <span
                                  className={`px-2.5 py-1 rounded-full border text-[10px] inline-flex items-center gap-1 ${isDay ? "border-stone-300 bg-stone-200 text-stone-700" : "border-white/10 bg-white/10 text-zinc-300"
                                    }`}
                                >
                                  <Lock className="w-2.5 h-2.5" />
                                  Locked
                                </span>
                              ) : project.isApproved ? (
                                <span
                                  className={`px-2.5 py-1 rounded-full border font-medium text-[10px] ${isDay ? "border-stone-400 bg-stone-100 text-stone-900" : "border-white/30 text-white"
                                    }`}
                                >
                                  Approved
                                </span>
                              ) : openCount > 0 ? (
                                <span
                                  className={`px-2.5 py-1 rounded-full border text-[10px] ${isDay ? "border-stone-200 bg-stone-50 text-stone-700" : "border-white/15 text-zinc-300"
                                    }`}
                                >
                                  Needs Review
                                </span>
                              ) : (
                                <span
                                  className={`px-2.5 py-1 rounded-full border text-[10px] ${isDay ? "border-stone-200 bg-stone-50 text-stone-500" : "border-white/10 text-zinc-500"
                                    }`}
                                >
                                  Draft
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Link
                                  href={getCanvasHref(project)}
                                  className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${isDay
                                      ? "bg-stone-900 text-white hover:bg-stone-800"
                                      : "bg-white text-black hover:bg-zinc-200"
                                    }`}
                                >
                                  Open →
                                </Link>
                                <button
                                  onClick={() => handleCopyLink(project.shareId)}
                                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${isDay
                                      ? "border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                                      : "border-white/10 text-zinc-400 hover:text-white"
                                    }`}
                                  title="Copy link"
                                  aria-label="Copy link"
                                >
                                  {copiedId === project.shareId ? (
                                    <Check className={`w-3.5 h-3.5 ${isDay ? "text-stone-900" : "text-white"}`} />
                                  ) : (
                                    <Share2 className="w-3.5 h-3.5" />
                                  )}
                                </button>
                                <button
                                  onClick={() => setSelectedPunchlistProject(project)}
                                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${isDay
                                      ? "border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                                      : "border-white/10 text-zinc-400 hover:text-white"
                                    }`}
                                  title="Notes"
                                  aria-label="Notes"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteProject(project.id, project.title)}
                                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${isDay
                                      ? "border-stone-200 text-stone-400 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50"
                                      : "border-white/10 text-zinc-500 hover:text-white"
                                    }`}
                                  title="Delete"
                                  aria-label="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Standardized Unified Footer */}
      <Footer onOpenGuide={() => setShowWalkthrough(true)} theme={theme} />

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl animate-in fade-in duration-150">
          <div
            className={`w-full max-w-lg rounded-2xl border p-6 sm:p-8 shadow-2xl relative transition-all ${isDay ? "bg-white border-stone-200 text-stone-900 shadow-[0_25px_90px_rgba(0,0,0,0.12)]" : "bg-[#070709] border-white/20 text-white"
              }`}
          >
            <div className={`flex items-center justify-between pb-4 mb-4 border-b ${isDay ? "border-stone-200" : "border-white/10"}`}>
              <div className="flex items-center gap-2.5">
                <TesseractMark size={18} className={isDay ? "text-stone-900" : "text-white"} />
                <span className={`font-serif text-sm font-normal ${isDay ? "text-stone-700" : "text-zinc-200"}`}>
                  New Review Canvas
                </span>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className={`p-1 rounded-lg transition-colors cursor-pointer ${isDay ? "text-stone-400 hover:text-stone-900 hover:bg-stone-100" : "text-zinc-400 hover:text-white hover:bg-white/10"
                  }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h3 className={`font-serif text-2xl font-normal mb-2 ${isDay ? "text-stone-900" : "text-white"}`}>
              Deploy Review Canvas
            </h3>
            <p className={`text-xs font-sans mb-6 leading-relaxed ${isDay ? "text-stone-600" : "text-zinc-400"}`}>
              Mount any live web application or staging domain to generate an isolated, hardware-anchored review link.
            </p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className={`block text-xs font-mono uppercase tracking-wider mb-1.5 ${isDay ? "text-stone-700" : "text-zinc-300"}`}>
                  Canvas Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Acme Corp Brand Staging"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono transition-all outline-none ${isDay
                      ? "bg-stone-50 border-stone-300 focus:border-stone-900 focus:bg-white text-stone-900 placeholder:text-stone-400"
                      : "bg-black border-white/15 focus:border-white text-white"
                    }`}
                  required
                />
              </div>

              <div>
                <label className={`block text-xs font-mono uppercase tracking-wider mb-1.5 ${isDay ? "text-stone-700" : "text-zinc-300"}`}>
                  Staging / Production URL
                </label>
                <input
                  type="text"
                  placeholder="e.g. https://staging.acmecorp.com"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono transition-all outline-none ${isDay
                      ? "bg-stone-50 border-stone-300 focus:border-stone-900 focus:bg-white text-stone-900 placeholder:text-stone-400"
                      : "bg-black border-white/15 focus:border-white text-white"
                    }`}
                  required
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className={`px-4 py-2 text-xs font-mono transition-colors cursor-pointer ${isDay ? "text-stone-600 hover:text-stone-900" : "text-zinc-400 hover:text-white"
                    }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!title.trim() || !targetUrl.trim()}
                  className={`px-5 py-2.5 rounded-xl text-xs font-mono font-semibold tracking-wider transition-all cursor-pointer disabled:opacity-30 ${isDay ? "bg-stone-900 text-white hover:bg-stone-800" : "bg-white text-black hover:bg-zinc-200"
                    }`}
                >
                  Deploy Canvas →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Onboarding Firm Name Modal (For new accounts before dashboard) */}
      {showOnboardingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className={`w-full max-w-md p-6 sm:p-8 rounded-2xl border shadow-2xl relative animate-in zoom-in-95 duration-200 ${
              isDay
                ? "bg-[#FBF9F4] border-stone-200 text-stone-900 shadow-stone-900/10"
                : "bg-[#0b0b0e] border-white/15 text-white shadow-black/80"
            }`}
          >
            <div className="flex items-center gap-2 mb-4">
              <TesseractMark size={22} className={isDay ? "text-stone-900" : "text-white"} />
              <span className="font-serif tracking-tight font-medium text-lg">cyath</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-serif font-medium tracking-tight mb-2">
              What is your firm or company name?
            </h2>
            <p className={`text-xs leading-relaxed mb-6 ${isDay ? "text-stone-600" : "text-zinc-400"}`}>
              This will be displayed on staging links, milestone sign-off deeds, and client review banners.
            </p>

            <form onSubmit={handleOnboardingSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider mb-2 text-zinc-400">
                  Firm / Studio / Company Name
                </label>
                <div className="relative">
                  <Building className={`w-4 h-4 absolute left-3.5 top-3 ${isDay ? "text-stone-400" : "text-zinc-500"}`} />
                  <input
                    type="text"
                    required
                    autoFocus
                    value={onboardingFirmInput}
                    onChange={(e) => setOnboardingFirmInput(e.target.value)}
                    placeholder="e.g. Acme Design Studio"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs sm:text-sm font-sans outline-none transition-colors ${
                      isDay
                        ? "bg-white border-stone-300 focus:border-stone-900 text-stone-900 placeholder:text-stone-400"
                        : "bg-black border-white/15 focus:border-white/40 text-white placeholder:text-zinc-600"
                    }`}
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end">
                <button
                  type="submit"
                  className={`px-5 py-2.5 rounded-xl font-sans font-semibold text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer hover:scale-105 ${
                    isDay
                      ? "bg-stone-900 text-white hover:bg-stone-800"
                      : "bg-white text-black hover:bg-zinc-200"
                  }`}
                >
                  <span>Next</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showWalkthrough && (
        <StudioWalkthroughModal
          isOpen={showWalkthrough}
          onClose={() => setShowWalkthrough(false)}
          theme={theme}
        />
      )}

      {showAccountModal && (
        <AccountSettingsModal
          user={currentUser}
          agencyName={agencyInput}
          isPro={isUserPro}
          theme={theme}
          onUpdateAgencyName={handleUpdateAgencyName}
          onSignOut={handleSignOut}
          onOpenUpgrade={() => {
            setShowAccountModal(false);
            router.push("/pro");
          }}
          onClose={() => setShowAccountModal(false)}
        />
      )}

      {selectedPunchlistProject && (
        <ProjectPunchlistDrawer
          project={selectedPunchlistProject}
          theme={theme}
          onClose={() => setSelectedPunchlistProject(null)}
        />
      )}
    </div>
  );
}

interface ViewfinderCardProps {
  project: Project;
  isDay: boolean;
  isLocked?: boolean;
  copiedId: string | null;
  onCopyLink: (shareId: string) => void;
  onSelectPunchlist: (project: Project) => void;
  onDelete: (id: string, title: string) => void;
  getCanvasHref: (project: Project) => string;
}

function ViewfinderCard({
  project,
  isDay,
  isLocked = false,
  copiedId,
  onCopyLink,
  onSelectPunchlist,
  onDelete,
  getCanvasHref,
}: ViewfinderCardProps) {
  const pinCount = project.pins.length;
  const resolvedCount = project.pins.filter((p) => p.status === "resolved").length;
  const openCount = pinCount - resolvedCount;

  let hostname = "";
  try {
    hostname = new URL(project.targetUrl).hostname.replace(/^www\./, "");
  } catch {
    hostname = project.targetUrl;
  }

  const isWebUrl = project.assetType === "url" || (!project.assetType && project.targetUrl.startsWith("http"));

  return (
    <div
      className={`group rounded-2xl border transition-all duration-300 flex flex-col overflow-hidden relative shadow-xl hover:-translate-y-1 ${isLocked ? "grayscale opacity-85 hover:grayscale-0 hover:opacity-100" : ""
        } ${isDay
          ? "bg-white border-stone-200/90 hover:border-stone-300 hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] text-stone-900"
          : "bg-[#0a0a0d] border-white/12 hover:border-white/25 hover:shadow-[0_12px_40px_rgba(0,0,0,0.8)] text-white shadow-black/40"
        }`}
    >
      <Link
        href={isLocked ? "/pro" : getCanvasHref(project)}
        className={`block relative w-full h-48 overflow-hidden border-b transition-colors ${isDay ? "bg-stone-50 border-stone-200" : "bg-black border-white/[0.08] group-hover:border-white/20"
          }`}
      >
        <div
          className={`h-7 border-b px-3 flex items-center justify-between z-20 relative select-none ${isDay ? "bg-stone-100/90 border-stone-200" : "bg-[#0d0d10] border-white/[0.06]"
            }`}
        >
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isDay ? "bg-stone-400" : "bg-white/20"}`} />
            <span className={`w-1.5 h-1.5 rounded-full ${isDay ? "bg-stone-300" : "bg-white/10"}`} />
            <span className={`w-1.5 h-1.5 rounded-full ${isDay ? "bg-stone-300" : "bg-white/10"}`} />
            <span className={`text-[10px] font-mono truncate max-w-[150px] ml-1.5 ${isDay ? "text-stone-600" : "text-zinc-400"}`}>
              {hostname}
            </span>
          </div>

          <div>
            {isLocked ? (
              <span
                className={`text-[9px] font-mono tracking-wider px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 shadow-sm ${isDay ? "bg-stone-200 text-stone-700 border border-stone-300" : "bg-white/10 text-zinc-300 border border-white/10"
                  }`}
              >
                <Lock className="w-2.5 h-2.5" />
                Locked
              </span>
            ) : project.isApproved ? (
              <span
                className={`text-[9px] font-mono tracking-wider px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 shadow-sm ${isDay ? "bg-stone-900 text-white" : "bg-white text-black"
                  }`}
              >
                <ShieldCheck className="w-2.5 h-2.5" />
                Approved
              </span>
            ) : openCount > 0 ? (
              <span
                className={`text-[9px] font-mono tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-md border ${isDay
                    ? "bg-stone-200 text-stone-800 border-stone-300"
                    : "bg-white/10 border-white/20 text-white"
                  }`}
              >
                <MessageSquare className="w-2.5 h-2.5 opacity-70" />
                {openCount} {openCount === 1 ? "note" : "notes"}
              </span>
            ) : (
              <span
                className={`text-[9px] font-mono tracking-wider px-2 py-0.5 rounded-full backdrop-blur-md border ${isDay
                    ? "bg-stone-100 border-stone-200 text-stone-600"
                    : "bg-white/5 border-white/10 text-zinc-400"
                  }`}
              >
                Draft
              </span>
            )}
          </div>
        </div>

        <div className={`relative w-full h-[calc(100%-1.75rem)] overflow-hidden ${isDay ? "bg-stone-100" : "bg-[#050507]"}`}>
          {project.assetType === "image" ? (
            <img
              src={project.targetUrl}
              alt={project.title}
              className="w-full h-full object-cover object-top opacity-90 group-hover:opacity-100 group-hover:scale-[1.02] transition-all duration-300"
            />
          ) : project.assetType === "pdf" ? (
            <div className={`w-full h-full flex flex-col items-center justify-center p-4 text-center ${isDay ? "bg-white text-stone-900" : "bg-black text-white"}`}>
              <FileText className={`w-7 h-7 mb-1.5 stroke-[1.5] ${isDay ? "text-stone-500" : "text-zinc-400"}`} />
              <span className={`text-xs font-serif font-medium truncate max-w-[90%] ${isDay ? "text-stone-800" : "text-zinc-200"}`}>
                {project.title}.pdf
              </span>
              <span className={`text-[9px] font-mono uppercase mt-0.5 ${isDay ? "text-stone-500" : "text-zinc-500"}`}>
                PDF Document
              </span>
            </div>
          ) : isWebUrl ? (
            <div className={`relative w-full h-full overflow-hidden pointer-events-none select-none ${isDay ? "bg-stone-50" : "bg-[#0a0a0d]"}`}>
              <iframe
                src={`/api/proxy?url=${encodeURIComponent(project.targetUrl)}&mute=1`}
                title={project.title}
                className="absolute top-0 left-0 border-none select-none z-10 opacity-90 group-hover:opacity-100 transition-opacity"
                style={{
                  width: "1280px",
                  height: "800px",
                  transform: "scale(0.32)",
                  transformOrigin: "0 0",
                }}
                tabIndex={-1}
                loading="lazy"
                sandbox="allow-scripts allow-same-origin allow-forms"
                allow="autoplay 'none'; camera 'none'; microphone 'none'"
              />
            </div>
          ) : (
            <div className={`w-full h-full flex flex-col items-center justify-center p-4 text-center ${isDay ? "bg-white" : "bg-[#09090b]"}`}>
              <TesseractMark size={20} className={`mb-2 ${isDay ? "text-stone-700" : "text-white/60"}`} />
              <span className={`text-xs font-serif ${isDay ? "text-stone-800" : "text-white/80"}`}>{project.title}</span>
            </div>
          )}
        </div>
      </Link>

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className={`text-[10px] font-mono truncate ${isDay ? "text-stone-500" : "text-zinc-500"}`}>
              {project.agencyName}
            </span>
            <span
              className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border ${isDay
                  ? "border-stone-200 bg-stone-100 text-stone-600"
                  : "border-white/10 bg-white/5 text-zinc-400"
                }`}
            >
              {project.assetType || "web"}
            </span>
          </div>

          <h3 className={`font-serif text-lg font-normal tracking-wide truncate leading-snug ${isDay ? "text-stone-900" : "text-white"}`}>
            {project.title}
          </h3>

          <p className={`text-[11px] font-mono truncate mt-1 ${isDay ? "text-stone-500" : "text-zinc-500"}`}>
            {project.targetUrl}
          </p>
        </div>

        <div className={`mt-5 pt-3.5 border-t flex items-center gap-2 ${isDay ? "border-stone-200" : "border-white/[0.08]"}`}>
          {isLocked ? (
            <Link
              href="/pro"
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-mono font-medium tracking-wide text-center flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm ${isDay
                  ? "bg-stone-200 hover:bg-stone-300 text-stone-800"
                  : "bg-white/10 hover:bg-white/20 text-white"
                }`}
            >
              <Lock className="w-3 h-3" />
              <span>Reactivate Canvas</span>
            </Link>
          ) : (
            <Link
              href={getCanvasHref(project)}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-mono font-medium tracking-wide text-center flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm ${isDay
                  ? "bg-stone-900 text-white hover:bg-stone-800"
                  : "bg-white text-black hover:bg-zinc-200"
                }`}
            >
              <span>Open Canvas</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          )}

          <button
            onClick={() => onCopyLink(project.shareId)}
            className={`py-2 px-3 rounded-xl border transition-colors flex items-center gap-1.5 cursor-pointer text-xs font-mono ${isDay
                ? "border-stone-200 text-stone-700 hover:bg-stone-100 hover:text-stone-900"
                : "border-white/10 hover:border-white/25 text-zinc-300 hover:text-white"
              }`}
            title="Copy link"
            aria-label="Copy link"
          >
            {copiedId === project.shareId ? (
              <>
                <Check className={`w-3 h-3 ${isDay ? "text-stone-900" : "text-white"}`} />
                <span className="text-[10px]">Copied</span>
              </>
            ) : (
              <>
                <Share2 className={`w-3 h-3 ${isDay ? "text-stone-500" : "text-zinc-400"}`} />
                <span className="text-[10px]">Share</span>
              </>
            )}
          </button>

          <button
            onClick={() => onSelectPunchlist(project)}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${isDay
                ? "border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                : "border-white/10 hover:border-white/25 text-zinc-400 hover:text-white"
              }`}
            title="Notes"
            aria-label="Notes"
          >
            <MessageSquare className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onDelete(project.id, project.title)}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${isDay
                ? "border-stone-200 text-stone-400 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50"
                : "border-white/10 hover:border-white/30 text-zinc-500 hover:text-white"
              }`}
            title="Delete"
            aria-label="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
