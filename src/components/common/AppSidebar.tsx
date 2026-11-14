"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  BookOpen,
  Sliders,
  CreditCard,
  LogOut,
  SunMedium,
  Moon,
  FolderGit2,
} from "lucide-react";
import { useReviewStore } from "@/store/useReviewStore";
import { TesseractMark } from "@/components/common/Logo";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { startDashboardTour } from "@/lib/dashboardTour";
import { useTheme } from "@/lib/theme";

interface AppSidebarProps {
  activeItem: "projects" | "settings" | "plans";
  onNewReviewClick?: () => void;
  className?: string;
}

export function AppSidebar({
  activeItem,
  onNewReviewClick,
  className = "",
}: AppSidebarProps) {
  const router = useRouter();
  const supabase = createClient();
  const { theme, isDay, toggle: toggleTheme } = useTheme();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [agencyName, setAgencyName] = useState("Studio");

  const { projects, isPro, proCancelled } = useReviewStore();
  const isUserPro = !proCancelled && (isPro || (typeof window !== "undefined" && localStorage.getItem("cyath_pro_member") === "true"));
  const userProjects = Array.isArray(projects) ? projects.filter(Boolean) : [];

  useEffect(() => {
    let isCancelled = false;

    const verifyAuth = async () => {
      const isGuest =
        typeof window !== "undefined" &&
        (localStorage.getItem("cyath_guest_session") === "true" ||
          new URLSearchParams(window.location.search).get("demo") === "true");

      if (isGuest) {
        if (!isCancelled) {
          setCurrentUser({
            id: "guest-user",
            email: "guest@cyath.space",
            user_metadata: { agency_name: "Studio" },
            app_metadata: {},
            aud: "authenticated",
            created_at: new Date().toISOString(),
          } as User);
          setAgencyName("Studio");
        }
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && !isCancelled) {
        setCurrentUser(session.user);
        const storedAgency = localStorage.getItem("cyath_agency_name");
        const userFirm = session.user.user_metadata?.agency_name;
        setAgencyName(storedAgency || userFirm || "Studio");
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user && !isCancelled) {
        setCurrentUser(user);
        const storedAgency = localStorage.getItem("cyath_agency_name");
        const userFirm = user.user_metadata?.agency_name;
        setAgencyName(storedAgency || userFirm || "Studio");
      }
    };

    verifyAuth();
    return () => {
      isCancelled = true;
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("cyath_auth_active");
    localStorage.removeItem("cyath_guest_session");
    router.push("/login");
  };

  const handleTourClick = () => {
    if (activeItem !== "projects") {
      router.push("/dashboard?startTour=1");
    } else {
      startDashboardTour();
    }
  };

  const handlePageNavigation = (e: React.MouseEvent, targetPath: string) => {
    if (typeof window !== "undefined" && window.location.pathname === targetPath) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    const mainEl = document.querySelector("main");
    if (mainEl) {
      mainEl.classList.remove("page-enter");
      mainEl.classList.add("page-exit");
      setTimeout(() => {
        router.push(targetPath);
      }, 130);
    } else {
      router.push(targetPath);
    }
  };

  const handleNewReview = () => {
    if (onNewReviewClick) {
      onNewReviewClick();
    } else {
      router.push("/dashboard?new=1");
    }
  };

  return (
    <aside
      id="tour-sidebar"
      className={`w-64 border-r flex flex-col justify-between p-5 select-none shrink-0 transition-colors duration-200 z-30 ${
        isDay
          ? "bg-[#F4F1EA] border-stone-200 text-stone-900"
          : "bg-[#000000] border-white/[0.08] text-white"
      } ${className}`}
    >
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            prefetch={true}
            onClick={(e) => handlePageNavigation(e, "/dashboard")}
            className="flex items-center gap-2.5 group transition-transform active:scale-[0.96]"
          >
            <TesseractMark
              size={22}
              className={`shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                isDay ? "text-stone-900" : "text-white"
              }`}
            />
            <span
              style={{
                fontFamily: "var(--font-wordmark, 'Space Grotesk', sans-serif)",
                fontWeight: 700,
                fontSize: "19px",
                letterSpacing: "-0.04em",
              }}
              className={`leading-none transition-colors ${
                isDay ? "text-[#1C1A18] group-hover:text-black" : "text-[#FFFFFF] group-hover:text-white"
              }`}
            >
              cyath
            </span>
          </Link>

          <button
            onClick={toggleTheme}
            className={`p-1.5 rounded-lg transition-all duration-150 cursor-pointer active:scale-[0.92] ${
              isDay
                ? "text-stone-600 hover:text-stone-950 hover:bg-stone-200/60"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.08]"
            }`}
            title={isDay ? "Switch to Night Mode" : "Switch to Day Mode"}
          >
            {isDay ? <Moon className="w-4 h-4" /> : <SunMedium className="w-4 h-4" />}
          </button>
        </div>

        {/* Primary CTA */}
        <button
          id="tour-new-review-btn"
          onClick={handleNewReview}
          className={`w-full py-2 px-3 rounded-xl text-xs font-mono font-medium flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer shadow-sm active:scale-[0.96] ${
            isDay
              ? "bg-stone-900 text-white hover:bg-stone-800"
              : "bg-white text-black hover:bg-zinc-200"
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Review</span>
        </button>

        {/* Persistent Left Nav Rail */}
        <nav className="space-y-1">
          <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 px-3 py-1 mb-1">
            Workspace
          </div>

          <Link
            id="tour-sidebar-projects"
            href="/dashboard"
            prefetch={true}
            onClick={(e) => handlePageNavigation(e, "/dashboard")}
            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 active:scale-[0.96] ${
              activeItem === "projects"
                ? isDay
                  ? "bg-stone-200 text-stone-950 border border-stone-300 font-semibold"
                  : "bg-white/[0.08] text-white border border-white/10 font-semibold"
                : isDay
                ? "text-stone-600 hover:text-stone-900 hover:bg-stone-200/60"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FolderGit2 className="w-4 h-4" />
              <span>Projects</span>
            </div>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                isDay ? "bg-stone-300/80 text-stone-800" : "bg-white/10 text-zinc-300"
              }`}
            >
              {userProjects.length}
            </span>
          </Link>

          <button
            id="tour-sidebar-guide"
            onClick={handleTourClick}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer active:scale-[0.96] ${
              isDay
                ? "text-stone-600 hover:text-stone-900 hover:bg-stone-200/60"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <BookOpen className="w-4 h-4" />
              <span>Guide (Tour)</span>
            </div>
          </button>

          <Link
            id="tour-sidebar-settings"
            href="/settings"
            prefetch={true}
            onClick={(e) => handlePageNavigation(e, "/settings")}
            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 active:scale-[0.96] ${
              activeItem === "settings"
                ? isDay
                  ? "bg-stone-200 text-stone-950 border border-stone-300 font-semibold"
                  : "bg-white/[0.08] text-white border border-white/10 font-semibold"
                : isDay
                ? "text-stone-600 hover:text-stone-900 hover:bg-stone-200/60"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Sliders className="w-4 h-4" />
              <span>Settings</span>
            </div>
          </Link>

          <Link
            id="tour-sidebar-plans"
            href="/pro"
            prefetch={true}
            onClick={(e) => handlePageNavigation(e, "/pro")}
            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 active:scale-[0.96] ${
              activeItem === "plans"
                ? isDay
                  ? "bg-stone-200 text-stone-950 border border-stone-300 font-semibold"
                  : "bg-white/[0.08] text-white border border-white/10 font-semibold"
                : isDay
                ? "text-stone-600 hover:text-stone-900 hover:bg-stone-200/60"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <CreditCard className="w-4 h-4" />
              <span>Plans</span>
            </div>
            {isUserPro ? (
              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                isDay ? "bg-stone-900 text-white" : "bg-white text-black"
              }`}>
                PRO
              </span>
            ) : (
              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                isDay ? "border-stone-400 text-stone-700 bg-stone-100" : "border-white/20 text-zinc-400 bg-white/[0.02]"
              }`}>
                FREE
              </span>
            )}
          </Link>
        </nav>
      </div>

      {/* Plan Quota Indicator in Sidebar */}
      <div className="space-y-4">
        <div
          className={`p-3 rounded-xl border text-xs font-mono transition-colors ${
            isDay ? "bg-stone-200/60 border-stone-300 text-stone-800" : "bg-white/[0.03] border-white/[0.06] text-zinc-200"
          }`}
        >
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className={isDay ? "text-stone-600 font-medium" : "text-zinc-400"}>Canvas Quota</span>
            <span className={`font-semibold ${isDay ? "text-stone-900" : "text-white"}`}>
              {isUserPro ? "Unlimited" : `${userProjects.length} / 1`}
            </span>
          </div>
          {!isUserPro && (
            <div className={`w-full h-1 rounded-full overflow-hidden ${isDay ? "bg-stone-300" : "bg-white/10"}`}>
              <div
                className={`h-full transition-all duration-300 ${isDay ? "bg-stone-900" : "bg-white"}`}
                style={{ width: `${Math.min(100, userProjects.length * 100)}%` }}
              />
            </div>
          )}
          {!isUserPro && userProjects.length >= 1 && (
            <Link
              href="/pro"
              prefetch={true}
              onClick={(e) => handlePageNavigation(e, "/pro")}
              className={`mt-2 text-[10px] underline cursor-pointer block text-left transition-colors ${
                isDay ? "text-stone-700 hover:text-stone-950 font-medium" : "text-zinc-400 hover:text-white"
              }`}
            >
              Upgrade to Pro for more
            </Link>
          )}
        </div>

        {/* Bottom User Profile Pill */}
        <div className={`pt-4 border-t ${isDay ? "border-stone-300" : "border-white/[0.08]"}`}>
          <div className="flex items-center justify-between px-2 py-1.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-7 h-7 rounded-full border flex items-center justify-center font-mono font-bold text-xs uppercase shrink-0 ${
                isDay ? "bg-stone-300 border-stone-400 text-stone-900" : "bg-white/10 border-white/20 text-white"
              }`}>
                {(currentUser?.email || "U")[0]}
              </div>
              <div className="min-w-0">
                <div className={`text-xs font-medium truncate ${isDay ? "text-stone-900 font-semibold" : "text-zinc-100"}`}>
                  {agencyName || "Studio"}
                </div>
                <div className={`text-[10px] font-mono truncate ${isDay ? "text-stone-600" : "text-zinc-500"}`}>
                  {currentUser?.email || "guest"}
                </div>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer active:scale-[0.96] ${
                isDay ? "text-stone-600 hover:text-stone-950 hover:bg-stone-200" : "text-zinc-400 hover:text-white hover:bg-white/10"
              }`}
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

