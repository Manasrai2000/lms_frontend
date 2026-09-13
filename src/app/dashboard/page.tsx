"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/store/auth";
import { Activity } from "@/lib/types";
import {
  Users, BookOpen, HelpCircle, Video, FileSpreadsheet,
  Sparkles, Clock, AlertCircle, QrCode, Camera, ArrowRight,
  Download, Play, BookMarked, CheckCircle2, History, ExternalLink,
  ArrowUpRight, ChevronLeft, ChevronRight
} from "lucide-react";
import QRScannerModal from "@/components/dashboard/QRScannerModal";
import BookResourceDrawer from "@/components/dashboard/BookResourceDrawer";
import VideoPlayerModal from "@/components/dashboard/VideoPlayerModal";
import {
  getRecentlyScannedBooks,
  saveRecentlyScannedBook,
  ScannedBookRecord
} from "@/lib/storage/recentQRs";
import qrApi, { extractQRCode } from "@/lib/api/qrcode";
import { QRCodeBook, QRCodeVideo } from "@/types/qrcode";
import { toast } from "sonner";

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Desktop Navigation Tiles Auto-scroll state
  const desktopTilesScrollRef = useRef<HTMLDivElement>(null);
  const [isTilesHovered, setIsTilesHovered] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Auto-scroll Desktop Navigation Tiles every 3.5s
  useEffect(() => {
    const updateScrollButtons = () => {
      const el = desktopTilesScrollRef.current;
      if (!el) return;
      setCanScrollLeft(el.scrollLeft > 10);
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
    };

    const el = desktopTilesScrollRef.current;
    if (el) {
      el.addEventListener("scroll", updateScrollButtons, { passive: true });
      updateScrollButtons();
    }

    if (isTilesHovered) {
      return () => {
        if (el) el.removeEventListener("scroll", updateScrollButtons);
      };
    }

    const interval = setInterval(() => {
      const scrollEl = desktopTilesScrollRef.current;
      if (!scrollEl) return;

      const maxScrollLeft = scrollEl.scrollWidth - scrollEl.clientWidth;
      if (maxScrollLeft <= 10) return;

      const scrollStep = 296; // card width (280px) + gap (16px)

      if (scrollEl.scrollLeft >= maxScrollLeft - 15) {
        scrollEl.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        scrollEl.scrollBy({ left: scrollStep, behavior: "smooth" });
      }
    }, 3500);

    return () => {
      clearInterval(interval);
      if (el) el.removeEventListener("scroll", updateScrollButtons);
    };
  }, [isTilesHovered]);

  const scrollTiles = (direction: "left" | "right") => {
    const el = desktopTilesScrollRef.current;
    if (!el) return;
    const scrollStep = 296;
    el.scrollBy({
      left: direction === "right" ? scrollStep : -scrollStep,
      behavior: "smooth",
    });
  };

  // QR Modal & Drawer states
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [activeBook, setActiveBook] = useState<QRCodeBook | null>(null);
  const [activeVideo, setActiveVideo] = useState<QRCodeVideo | null>(null);
  const [activeCode, setActiveCode] = useState<string>("");
  const [quickCodeInput, setQuickCodeInput] = useState<string>("");
  const [isQuickVerifying, setIsQuickVerifying] = useState<boolean>(false);

  // Recently Scanned Books
  const [recentScanned, setRecentScanned] = useState<ScannedBookRecord[]>([]);

  const isStudent = user?.role?.toLowerCase() === "student";

  // Dynamic Menu Permissions from GET /auth/my-menu API
  const [permittedRoutes, setPermittedRoutes] = useState<string[] | null>(null);
  const [permittedKeys, setPermittedKeys] = useState<string[] | null>(null);

  // Fetch Allowed Routes from GET /auth/my-menu API (with role fallback)
  useEffect(() => {
    let isSubscribed = true;

    async function fetchMenuRoutes() {
      try {
        let resData: any = null;
        try {
          const res = await api.get("/auth/my-menu");
          resData = res.data?.data || res.data;
        } catch {
          const res = await api.get("/v1/auth/my-menu");
          resData = res.data?.data || res.data;
        }

        if (isSubscribed && resData && Array.isArray(resData.menus)) {
          const routes: string[] = [];
          const keys: string[] = [];
          const extractRoutes = (items: any[]) => {
            for (const item of items) {
              const p = item.route || item.path;
              if (p && typeof p === "string") {
                routes.push(p.toLowerCase().replace(/\/+$/, "").trim());
              }
              if (item.key && typeof item.key === "string") {
                keys.push(item.key.toLowerCase().trim());
              }
              const subs = item.children || item.subItems;
              if (Array.isArray(subs)) {
                extractRoutes(subs);
              }
            }
          };
          extractRoutes(resData.menus);
          setPermittedRoutes(routes);
          setPermittedKeys(keys);
        }
      } catch {
        // Fallback to role-based filtering if menu API is unavailable
      }
    }

    fetchMenuRoutes();

    return () => {
      isSubscribed = false;
    };
  }, []);

  // Helper to determine whether a tile route should be displayed based on exact Menu API route & role
  const canAccessRoute = (routePath: string, key?: string): boolean => {
    const cleanPath = routePath.split("?")[0].toLowerCase().replace(/\/+$/, "").trim();

    // 1. Dynamic check from /auth/my-menu if backend returned allowed routes
    if (permittedRoutes && permittedRoutes.length > 0) {
      if (permittedRoutes.includes(cleanPath)) {
        return true;
      }
      if (key && permittedKeys && permittedKeys.includes(key.toLowerCase().trim())) {
        return true;
      }
      return false;
    }

    // 2. Fallback based on user role when menu API is offline/pending
    const userRole = user?.role?.toLowerCase() || "";
    if (userRole === "student") {
      // Per student menu schema: ONLY books, worksheets, videos, flipbooks (NO chapters)
      const studentAllowed = [
        "/dashboard",
        "/dashboard/books",
        "/dashboard/books/worksheets",
        "/dashboard/books/videos",
        "/dashboard/books/flipbook",
        "/dashboard/profile",
      ];
      return studentAllowed.includes(cleanPath);
    }

    if (userRole === "teacher") {
      const teacherAllowed = [
        "/dashboard",
        "/dashboard/classes",
        "/dashboard/books",
        "/dashboard/books/chapters",
        "/dashboard/books/worksheets",
        "/dashboard/books/videos",
        "/dashboard/books/teacher-manual",
        "/dashboard/books/lesson-planner",
      ];
      return teacherAllowed.includes(cleanPath);
    }

    // Admins have full access
    return true;
  };

  // Load recently scanned books
  useEffect(() => {
    setRecentScanned(getRecentlyScannedBooks());

    const handleRecentUpdate = () => {
      setRecentScanned(getRecentlyScannedBooks());
    };

    window.addEventListener("lms_recent_qr_updated", handleRecentUpdate);
    return () => {
      window.removeEventListener("lms_recent_qr_updated", handleRecentUpdate);
    };
  }, []);

  // Fetch activities (for admin/teacher)
  useEffect(() => {
    async function fetchActivities() {
      try {
        const res = await api.get("/activities");
        setActivities(res.data || []);
      } catch (err) {
        setActivities([
          { id: 1, title: "Book 'English Grammar' Added", description: "Teacher Manual & Lesson Planner files uploaded by Admin.", timestamp: "10 mins ago" },
          { id: 2, title: "Bulk QR Codes Generated", description: "Successfully generated 45 codes for Class 8 Mathematics Chapters.", timestamp: "2 hours ago" },
          { id: 3, title: "Question Bank Import", description: "Excel template imported: 120 MCQ questions added to Science.", timestamp: "1 day ago" },
          { id: 4, title: "Permissions Updated", description: "Book permissions assigned to Teacher ID #204.", timestamp: "2 days ago" },
        ]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchActivities();
  }, []);

  // Handle Quick Code Submission from Hero Banner
  const handleQuickVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = extractQRCode(quickCodeInput);
    if (!clean) {
      toast.error("Please enter a valid QR code or URL");
      return;
    }

    setIsQuickVerifying(true);
    try {
      const res = await qrApi.verify(clean);
      if (res.valid) {
        if (res.targetType === "VIDEO" && res.video) {
          toast.success(`Video: ${res.video.title}`);
          setActiveVideo(res.video);
          setActiveCode(clean);
          setQuickCodeInput("");
        } else if (res.book) {
          toast.success(`Found: ${res.book.title}`);
          saveRecentlyScannedBook(res.book, clean);
          setActiveBook(res.book);
          setActiveCode(clean);
          setQuickCodeInput("");
        }
      } else {
        toast.error(res.message || "QR code is not active or mapped to any item");
      }
    } catch (err) {
      toast.error("Failed to verify QR code. Please try again.");
    } finally {
      setIsQuickVerifying(false);
    }
  };

  // Open resource drawer for a recently scanned book
  const handleOpenRecent = async (record: ScannedBookRecord) => {
    // Re-fetch fresh book details to ensure digital resources are up-to-date
    try {
      toast.loading("Loading textbook resources...", { id: "recent-load" });
      const res = await qrApi.verify(record.code);
      toast.dismiss("recent-load");
      if (res.valid && res.book) {
        setActiveBook(res.book);
        setActiveCode(record.code);
      } else {
        // Fallback to cached summary
        setActiveBook({
          id: record.id,
          title: record.title,
          class: record.class,
          subject: record.subject,
          language: record.language,
          coverImage: record.coverImage,
          chaptersCount: record.chaptersCount,
        });
        setActiveCode(record.code);
      }
    } catch (err) {
      toast.dismiss("recent-load");
      // Fallback
      setActiveBook({
        id: record.id,
        title: record.title,
        class: record.class,
        subject: record.subject,
        language: record.language,
        coverImage: record.coverImage,
        chaptersCount: record.chaptersCount,
      });
      setActiveCode(record.code);
    }
  };

  return (
    <div className="space-y-4 md:space-y-5">
      {/* Top Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl md:rounded-3xl border border-[#c3c6d7]/35 bg-gradient-to-r from-[#dbe1ff]/60 via-[#faf8ff] to-white p-4 md:p-5 shadow-sm">
        <div className="absolute top-0 right-0 h-48 w-48 bg-[#004ac6]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider bg-[#004ac6] text-white px-2.5 py-0.5 rounded-full shadow-xs">
                {isStudent ? "Student Portal" : user?.role ? `${user.role} Dashboard` : "Learning Portal"}
              </span>
              {user?.className && (
                <span className="text-xs font-semibold bg-white border border-[#c3c6d7]/50 text-[#131b2e] px-2.5 py-0.5 rounded-full">
                  {user.className}
                </span>
              )}
            </div>

            <h2 className="text-xl md:text-2xl font-extrabold text-[#131b2e] flex items-center gap-2">
              Welcome back, {user?.fullName || "Student"} <Sparkles className="h-5 w-5 text-[#004ac6] animate-pulse" />
            </h2>
            <p className="text-xs md:text-sm text-[#505f76] max-w-xl leading-relaxed">
              {isStudent
                ? "Scan your physical textbooks to access interactive digital flipbooks, PDF worksheets, teacher video lessons, and chapter curriculum."
                : "Manage curriculum objects, audit access logs, review statistics, and verify physical textbook QR codes."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsScannerOpen(true)}
              className="px-4 py-2 bg-[#004ac6] hover:bg-[#003899] text-white rounded-xl font-bold text-xs shadow-md shadow-[#004ac6]/20 flex items-center gap-2 transition-all transform active:scale-95 cursor-pointer"
            >
              <Camera className="h-4 w-4" />
              <span>Scan Book QR</span>
            </button>
          </div>
        </div>
      </div>

      {/* QUICK DIGITAL NAVIGATION TILES (Controlled by Menu API & RBAC) */}
      {(() => {
        const quickNavigationTiles = [
          {
            id: "books",
            key: "books",
            title: "My Textbooks",
            description: "Assigned class books & curriculum",
            path: "/dashboard/books",
            tag: "Catalog",
            actionLabel: "Explore catalog",
            icon: BookOpen,
            glowGradient: "from-blue-500/15 to-indigo-500/5",
            hoverBorder: "hover:border-blue-500/40 hover:shadow-blue-500/10",
            iconStyle:
              "bg-blue-50 text-[#004ac6] border-blue-200/60 group-hover:bg-[#004ac6] group-hover:text-white group-hover:shadow-[#004ac6]/30",
            tagStyle:
              "bg-blue-50 text-[#004ac6] border-blue-200/50 group-hover:bg-blue-100/80",
            arrowHover: "group-hover:text-[#004ac6]",
            titleHover: "group-hover:text-[#004ac6]",
            footerText: "text-[#004ac6]",
          },
          {
            id: "flipbooks",
            key: "flipbooks",
            title: "Digital Flipbooks",
            description: "Interactive e-reader with flip animations",
            path: "/dashboard/books/flipbook",
            tag: "Reader",
            actionLabel: "Open reader",
            icon: BookOpen,
            glowGradient: "from-indigo-500/15 to-purple-500/5",
            hoverBorder: "hover:border-indigo-500/40 hover:shadow-indigo-500/10",
            iconStyle:
              "bg-indigo-50 text-indigo-600 border-indigo-200/60 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-indigo-600/30",
            tagStyle:
              "bg-indigo-50 text-indigo-700 border-indigo-200/50 group-hover:bg-indigo-100/80",
            arrowHover: "group-hover:text-indigo-600",
            titleHover: "group-hover:text-indigo-700",
            footerText: "text-indigo-700",
          },
          {
            id: "chapters",
            key: "chapters",
            title: "Chapters & Units",
            description: "Unit plans, lesson notes & topics",
            path: "/dashboard/books/chapters",
            tag: "Syllabus",
            actionLabel: "View curriculum",
            icon: BookMarked,
            glowGradient: "from-emerald-500/15 to-teal-500/5",
            hoverBorder: "hover:border-emerald-500/40 hover:shadow-emerald-500/10",
            iconStyle:
              "bg-emerald-50 text-emerald-600 border-emerald-200/60 group-hover:bg-emerald-600 group-hover:text-white group-hover:shadow-emerald-600/30",
            tagStyle:
              "bg-emerald-50 text-emerald-700 border-emerald-200/50 group-hover:bg-emerald-100/80",
            arrowHover: "group-hover:text-emerald-600",
            titleHover: "group-hover:text-emerald-700",
            footerText: "text-emerald-700",
          },
          {
            id: "worksheets",
            key: "worksheets",
            title: "Worksheets",
            description: "Printable exercises & practice tests",
            path: "/dashboard/books/worksheets",
            tag: "PDF Bank",
            actionLabel: "Download sheets",
            icon: FileSpreadsheet,
            glowGradient: "from-amber-500/15 to-orange-500/5",
            hoverBorder: "hover:border-amber-500/40 hover:shadow-amber-500/10",
            iconStyle:
              "bg-amber-50 text-amber-600 border-amber-200/60 group-hover:bg-amber-600 group-hover:text-white group-hover:shadow-amber-600/30",
            tagStyle:
              "bg-amber-50 text-amber-700 border-amber-200/50 group-hover:bg-amber-100/80",
            arrowHover: "group-hover:text-amber-600",
            titleHover: "group-hover:text-amber-700",
            footerText: "text-amber-700",
          },
          {
            id: "videos",
            key: "videos",
            title: "Video Lessons",
            description: "Curated tutorials & animated lectures",
            path: "/dashboard/books/videos",
            tag: "Lectures",
            actionLabel: "Watch lessons",
            icon: Video,
            glowGradient: "from-rose-500/15 to-pink-500/5",
            hoverBorder: "hover:border-rose-500/40 hover:shadow-rose-500/10",
            iconStyle:
              "bg-rose-50 text-rose-600 border-rose-200/60 group-hover:bg-rose-600 group-hover:text-white group-hover:shadow-rose-600/30",
            tagStyle:
              "bg-rose-50 text-rose-700 border-rose-200/50 group-hover:bg-rose-100/80",
            arrowHover: "group-hover:text-rose-600",
            titleHover: "group-hover:text-rose-700",
            footerText: "text-rose-700",
          },
        ];

        const visibleTiles = quickNavigationTiles.filter((tile) =>
          canAccessRoute(tile.path, tile.key)
        );

        if (visibleTiles.length === 0) return null;

        return (
          <>
            {/* MOBILE VIEW: 2 CARDS PER ROW WITH TAILORED COMPACT DESIGN */}
            <div className="grid grid-cols-2 gap-2.5 md:hidden">
              {visibleTiles.map((tile) => {
                const Icon = tile.icon;
                return (
                  <Link
                    key={`mobile-${tile.id}`}
                    href={tile.path}
                    className={`group relative overflow-hidden bg-white rounded-xl p-3 border border-slate-200/80 shadow-2xs hover:shadow-md ${tile.hoverBorder} active:scale-[0.98] transition-all flex flex-col justify-between cursor-pointer`}
                  >
                    {/* Ambient Corner Glow */}
                    <div
                      className={`absolute -right-4 -bottom-4 w-16 h-16 bg-gradient-to-br ${tile.glowGradient} rounded-full blur-md pointer-events-none`}
                    />

                    <div>
                      <div className="flex items-center justify-between">
                        <div
                          className={`h-8 w-8 rounded-lg flex items-center justify-center border transition-all ${tile.iconStyle}`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider border ${tile.tagStyle}`}
                        >
                          {tile.tag}
                        </span>
                      </div>

                      <div className="mt-2.5">
                        <h4
                          className={`text-xs font-bold text-[#131b2e] ${tile.titleHover} transition-colors tracking-tight line-clamp-1`}
                        >
                          {tile.title}
                        </h4>
                        <p className="text-[10px] text-[#505f76] mt-0.5 font-medium line-clamp-2 leading-tight">
                          {tile.description}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold ${tile.footerText}`}
                    >
                      <span className="truncate">{tile.actionLabel}</span>
                      <ArrowRight className="h-2.5 w-2.5 shrink-0" />
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* DESKTOP VIEW: SINGLE ROW WITH AUTO-SCROLL CAROUSEL (EXACT ORIGINAL CARDS PRESERVED) */}
            <div
              className="hidden md:block relative group/carousel"
              onMouseEnter={() => setIsTilesHovered(true)}
              onMouseLeave={() => setIsTilesHovered(false)}
            >
              {/* Left Scroll Button */}
              <button
                type="button"
                onClick={() => scrollTiles("left")}
                className={`absolute -left-3.5 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-white/95 backdrop-blur border border-slate-200 shadow-md flex items-center justify-center text-slate-600 hover:text-[#004ac6] hover:bg-slate-50 transition-all cursor-pointer ${
                  canScrollLeft ? "opacity-100 scale-100" : "opacity-0 pointer-events-none scale-90"
                }`}
                aria-label="Scroll Left"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {/* Right Scroll Button */}
              <button
                type="button"
                onClick={() => scrollTiles("right")}
                className={`absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-white/95 backdrop-blur border border-slate-200 shadow-md flex items-center justify-center text-slate-600 hover:text-[#004ac6] hover:bg-slate-50 transition-all cursor-pointer ${
                  canScrollRight ? "opacity-100 scale-100" : "opacity-0 pointer-events-none scale-90"
                }`}
                aria-label="Scroll Right"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              {/* Single Row Horizontal Scroll Container */}
              <div
                ref={desktopTilesScrollRef}
                className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth py-1 px-0.5"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {visibleTiles.map((tile) => {
                  const Icon = tile.icon;
                  return (
                    <Link
                      key={`desktop-${tile.id}`}
                      href={tile.path}
                      className={`group relative overflow-hidden bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs hover:shadow-xl ${tile.hoverBorder} hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer w-[280px] shrink-0`}
                    >
                      {/* Ambient Corner Glow */}
                      <div
                        className={`absolute -right-6 -bottom-6 w-24 h-24 bg-gradient-to-br ${tile.glowGradient} rounded-full blur-xl group-hover:scale-150 transition-transform duration-500 pointer-events-none`}
                      />

                      <div>
                        <div className="flex items-center justify-between">
                          <div
                            className={`h-10 w-10 rounded-xl flex items-center justify-center border group-hover:scale-110 group-hover:shadow-md transition-all duration-300 ${tile.iconStyle}`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border transition-colors ${tile.tagStyle}`}
                            >
                              {tile.tag}
                            </span>
                            <ArrowUpRight
                              className={`h-4 w-4 text-slate-300 ${tile.arrowHover} group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300`}
                            />
                          </div>
                        </div>

                        <div className="mt-3.5">
                          <h4
                            className={`text-sm font-extrabold text-[#131b2e] ${tile.titleHover} transition-colors tracking-tight`}
                          >
                            {tile.title}
                          </h4>
                          <p className="text-xs text-[#505f76] mt-1 font-medium leading-relaxed">
                            {tile.description}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`pt-3 mt-3 border-t border-slate-100 flex items-center text-[11px] font-bold ${tile.footerText} gap-1 group-hover:gap-1.5 transition-all`}
                      >
                        <span>{tile.actionLabel}</span>
                        <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </>
        );
      })()}


      {/* HERO SECTION: SCAN PHYSICAL TEXTBOOK QR CARD */}
      <div className="relative overflow-hidden rounded-2xl md:rounded-3xl border-2 border-[#004ac6]/30 bg-gradient-to-br from-white via-[#faf8ff] to-[#eaedff]/40 p-4 md:p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-5">
          <div className="space-y-2.5 flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#004ac6]/10 text-[#004ac6] text-xs font-bold">
              <QrCode className="h-3.5 w-3.5" />
              Instant Textbook Resource Scanner
            </div>
            <h3 className="text-lg md:text-xl font-black text-[#131b2e]">
              Have a physical book with a QR code?
            </h3>
            <p className="text-xs md:text-sm text-[#505f76] max-w-xl leading-relaxed">
              Point your camera at the QR code sticker on your school book to instantly open
              <b> Digital Flipbooks</b>, <b>Worksheets</b>, and <b>Video Lectures</b>.
            </p>

            {/* Inline Quick Code Input Form */}
            <form onSubmit={handleQuickVerify} className="pt-1.5 flex flex-col sm:flex-row gap-2 max-w-lg">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={quickCodeInput}
                  onChange={(e) => setQuickCodeInput(e.target.value)}
                  placeholder="Enter code e.g. BK-43098571"
                  className="w-full px-3.5 py-2 bg-white border border-[#c3c6d7]/60 rounded-xl text-xs font-mono text-[#131b2e] placeholder:text-zinc-400 focus:outline-none focus:border-[#004ac6] focus:ring-2 focus:ring-[#004ac6]/20 transition-all shadow-xs"
                />
              </div>

              <button
                type="submit"
                disabled={isQuickVerifying || !quickCodeInput.trim()}
                className="px-4 py-2 bg-[#004ac6] hover:bg-[#003899] text-white font-bold text-xs rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shrink-0"
              >
                {isQuickVerifying ? "Verifying..." : "Verify Code"}
              </button>

              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="px-3.5 py-2 bg-white hover:bg-zinc-100 text-[#004ac6] border border-[#004ac6]/30 font-bold text-xs rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                <Camera className="h-4 w-4" />
                <span>Open Camera</span>
              </button>
            </form>
          </div>

          {/* Graphical QR Illustration / Feature Badges */}
          <div className="shrink-0 flex items-center gap-2.5">
            <div className="p-3 bg-white rounded-xl border border-[#c3c6d7]/40 shadow-sm text-center space-y-1.5 max-w-[130px]">
              <div className="h-9 w-9 mx-auto rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <BookOpen className="h-4 w-4" />
              </div>
              <p className="text-xs font-bold text-[#131b2e]">Flipbook</p>
              <p className="text-[10px] text-[#505f76]">Read digital edition</p>
            </div>

            <div className="p-3 bg-white rounded-xl border border-[#c3c6d7]/40 shadow-sm text-center space-y-1.5 max-w-[130px]">
              <div className="h-9 w-9 mx-auto rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Download className="h-4 w-4" />
              </div>
              <p className="text-xs font-bold text-[#131b2e]">Worksheet</p>
              <p className="text-[10px] text-[#505f76]">Download PDF</p>
            </div>

            <div className="p-3 bg-white rounded-xl border border-[#c3c6d7]/40 shadow-sm text-center space-y-1.5 max-w-[130px]">
              <div className="h-9 w-9 mx-auto rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <Play className="h-4 w-4" />
              </div>
              <p className="text-xs font-bold text-[#131b2e]">Videos</p>
              <p className="text-[10px] text-[#505f76]">Chapter lectures</p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION: RECENTLY SCANNED TEXTBOOKS */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-[#004ac6]" />
            <h3 className="text-sm md:text-base font-bold text-[#131b2e]">Recently Scanned Textbooks</h3>
          </div>
          <span className="text-xs text-[#505f76]">
            {recentScanned.length > 0 ? `${recentScanned.length} books in your shelf` : "No books scanned yet"}
          </span>
        </div>

        {recentScanned.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#c3c6d7]/35 p-5 text-center space-y-2.5 shadow-xs">
            <div className="h-10 w-10 rounded-xl bg-[#eaedff] text-[#004ac6] flex items-center justify-center mx-auto">
              <QrCode className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-bold text-[#131b2e]">Your Scanned Textbook Shelf is Empty</h4>
            <p className="text-xs text-[#505f76] max-w-md mx-auto">
              Scan the QR code on your school textbooks or workbooks using the button above.
              Once scanned, your books will appear here for fast one-click digital access.
            </p>
            <button
              onClick={() => setIsScannerOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#004ac6] hover:bg-[#003899] text-white rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-sm"
            >
              <Camera className="h-4 w-4" />
              <span>Scan First Book</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {recentScanned.map((book) => (
              <div
                key={book.code}
                className="bg-white rounded-xl border border-[#c3c6d7]/40 p-3.5 shadow-sm hover:shadow-md hover:border-[#004ac6]/40 transition-all flex flex-col justify-between group"
              >
                <div className="space-y-2.5">
                  <div className="flex gap-2.5 items-start">
                    {/* Cover Image Thumbnail */}
                    <div className="h-18 w-13 shrink-0 rounded-lg bg-[#faf8ff] border border-[#c3c6d7]/30 overflow-hidden flex items-center justify-center relative shadow-2xs">
                      {book.coverImage ? (
                        <img
                          src={book.coverImage}
                          alt={book.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <BookOpen className="h-4 w-4 text-[#004ac6]" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5">
                        {book.class && (
                          <span className="text-[9px] font-bold bg-[#eaedff] text-[#004ac6] px-1.5 py-0.5 rounded">
                            {book.class}
                          </span>
                        )}
                        {book.subject && (
                          <span className="text-[9px] font-medium bg-zinc-100 text-zinc-700 px-1.5 py-0.5 rounded truncate">
                            {book.subject}
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs font-bold text-[#131b2e] line-clamp-2 leading-snug group-hover:text-[#004ac6] transition-colors">
                        {book.title}
                      </h4>

                      <p className="text-[10px] font-mono text-zinc-400">
                        {book.code}
                      </p>
                    </div>
                  </div>

                  {/* Resource Badges */}
                  <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-100 text-[10px]">
                    {book.hasFlipbook && (
                      <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 font-semibold rounded">
                        📖 Flipbook
                      </span>
                    )}
                    {book.hasWorksheet && (
                      <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 font-semibold rounded">
                        📝 Worksheet
                      </span>
                    )}
                    {book.hasVideos && (
                      <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 font-semibold rounded">
                        🎥 Videos
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-2.5 mt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => handleOpenRecent(book)}
                    className="flex-1 py-1.5 bg-[#004ac6]/10 hover:bg-[#004ac6] text-[#004ac6] hover:text-white rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>Open Resources</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>



      {/* ADMIN & TEACHER VIEW: Activity Feed & Audit */}
      {!isStudent && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-1">
          {/* Activity Feed */}
          <div className="lg:col-span-2 bg-white rounded-xl md:rounded-2xl border border-[#c3c6d7]/45 p-4 space-y-3.5 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Clock className="h-4 w-4 text-[#505f76]" />
              <h3 className="text-xs md:text-sm font-bold text-[#131b2e] uppercase tracking-wider">Recent System Activity</h3>
            </div>

            <div className="space-y-3">
              {isLoading ? (
                <div className="text-center py-6 text-zinc-400 text-xs">Loading activity logs...</div>
              ) : activities.length === 0 ? (
                <div className="text-center py-6 text-zinc-400 text-xs">No activity recorded.</div>
              ) : (
                activities.map((act) => (
                  <div key={act.id} className="flex gap-3 p-2.5 rounded-lg hover:bg-[#faf8ff] bg-white border border-[#c3c6d7]/20">
                    <div className="h-2 w-2 rounded-full bg-[#004ac6] mt-2 shrink-0 animate-pulse" />
                    <div className="space-y-1">
                      <p className="text-xs md:text-sm font-bold text-[#131b2e]">{act.title}</p>
                      <p className="text-xs text-[#505f76]">{act.description}</p>
                      <p className="text-[10px] text-zinc-400">{act.timestamp || "just now"}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>


        </div>
      )}

      {/* In-Page QR Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onVerified={(book, code) => {
          saveRecentlyScannedBook(book, code);
          setActiveBook(book);
          setActiveCode(code);
        }}
        onVerifiedVideo={(video, code) => {
          setActiveVideo(video);
          setActiveCode(code);
        }}
      />

      {/* Book Digital Resource Drawer */}
      <BookResourceDrawer
        isOpen={Boolean(activeBook)}
        onClose={() => setActiveBook(null)}
        book={activeBook}
        scannedCode={activeCode}
      />

      {/* Direct Video Auto-Player Modal */}
      <VideoPlayerModal
        isOpen={Boolean(activeVideo)}
        onClose={() => setActiveVideo(null)}
        video={activeVideo}
        scannedCode={activeCode}
      />
    </div>
  );
}
