"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Menu,
  X,
  ArrowRight,
  Sparkles,
  QrCode,
  BookOpen,
  Video,
  FileCheck2,
  Check,
  Lightbulb,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  User as UserIcon,
  Play,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";
import { useAuthStore } from "@/lib/store/auth";

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // QR Simulator state
  const [isScanning, setIsScanning] = useState(false);
  const [isSynced, setIsSynced] = useState(false);

  // Showcase category filter
  const [activeCategory, setActiveCategory] = useState("Trending");

  // FAQ accordion state (0 open by default as in design)
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isLoggedIn = isMounted && isAuthenticated && Boolean(user);

  const handleSimulateScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setIsSynced(true);
    }, 1100);
  };

  const handleResetScan = () => {
    setIsScanning(false);
    setIsSynced(false);
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // Course cards data
  const courses = [
    {
      id: "leadership",
      category: "Leadership",
      title: "Strategic Business Leadership",
      rating: "4.9",
      reviews: "789 Reviews",
      tag: "Starts in 3 days",
      description:
        "Develop leadership skills for business success. Learn strategic planning, team alignment and execution.",
      instructor: "Raj Patel",
      instructorRole: "VP of Engineering at Zenith Tech",
      themeColor: "from-blue-600 to-blue-700",
      btnBg: "bg-brand-600 hover:bg-brand-700 text-white",
      svg: (
        <svg
          className="w-32 h-32 text-blue-200/90 group-hover:scale-105 transition-transform duration-500"
          fill="currentColor"
          viewBox="0 0 100 100"
        >
          <path d="M50 15 C45 35, 30 55, 50 85 C70 55, 55 35, 50 15 Z" opacity="0.9" />
          <path d="M50 35 C35 45, 15 60, 32 80 C45 75, 48 55, 50 35 Z" opacity="0.7" />
          <path d="M50 35 C65 45, 85 60, 68 80 C55 75, 52 55, 50 35 Z" opacity="0.7" />
          <path d="M50 48 C30 58, 8 70, 22 86 C36 84, 46 66, 50 48 Z" opacity="0.5" />
          <path d="M50 48 C70 58, 92 70, 78 86 C64 84, 54 66, 50 48 Z" opacity="0.5" />
        </svg>
      ),
    },
    {
      id: "agile",
      category: "STEM Science",
      title: "Agile Project Management",
      rating: "4.9",
      reviews: "234 Reviews",
      tag: "Most Enrolled",
      description:
        "Learn agile methodologies for managing modern projects. Enhance team collaboration and sprint delivery.",
      instructor: "Sakura Sato",
      instructorRole: "CEO of Global Dynamics Corp",
      themeColor: "bg-[#dcfce7]",
      btnBg: "bg-emerald-600 hover:bg-emerald-700 text-white",
      svg: (
        <svg
          className="w-32 h-32 text-emerald-600 group-hover:scale-105 transition-transform duration-500"
          fill="currentColor"
          viewBox="0 0 100 100"
        >
          <path d="M48 20 C48 10, 30 10, 30 25 C30 40, 48 45, 48 48 Z" />
          <path d="M52 20 C52 10, 70 10, 70 25 C70 40, 52 45, 52 48 Z" />
          <path d="M48 80 C48 90, 30 90, 30 75 C30 60, 48 55, 48 52 Z" />
          <path d="M52 80 C52 90, 70 90, 70 75 C70 60, 52 55, 52 52 Z" />
          <path d="M20 48 C10 48, 10 30, 25 30 C40 30, 45 48, 48 48 Z" />
          <path d="M20 52 C10 52, 10 70, 25 70 C40 70, 45 52, 48 52 Z" />
          <path d="M80 48 C90 48, 90 30, 75 30 C60 30, 55 48, 52 48 Z" />
          <path d="M80 52 C90 52, 90 70, 75 70 C60 70, 55 52, 52 52 Z" />
        </svg>
      ),
    },
    {
      id: "analytics",
      category: "Analytics",
      title: "Digital Marketing Analytics",
      rating: "4.8",
      reviews: "678 Reviews",
      tag: "Updated 2026",
      description:
        "Analyze digital marketing campaigns. Use funnel metrics and cohort data to maximize learning outcome returns.",
      instructor: "Isabelle Dubois",
      instructorRole: "Director of Growth at Stellaris",
      themeColor: "bg-[#fef9c3]",
      btnBg: "bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold",
      svg: (
        <svg
          className="w-32 h-32 text-amber-400 group-hover:scale-105 transition-transform duration-500"
          fill="currentColor"
          viewBox="0 0 100 100"
        >
          <circle cx="50" cy="50" fill="#f59e0b" r="18" />
          <path
            d="M50 0 C40 30, 20 40, 0 50 C20 60, 40 70, 50 100 C60 70, 80 60, 100 50 C80 40, 60 30, 50 0 Z"
            opacity="0.6"
          />
        </svg>
      ),
    },
    {
      id: "design",
      category: "Design",
      title: "UI/UX Design Fundamentals",
      rating: "4.9",
      reviews: "321 Reviews",
      tag: "Interactive Labs",
      description:
        "Master core principles of user interface and human-centered design. Create usable, joyful interfaces.",
      instructor: "Dr. Anya Sharma",
      instructorRole: "Lead Designer at NovaTech",
      themeColor: "bg-[#f1f5f9]",
      btnBg: "bg-slate-900 hover:bg-slate-800 text-white font-bold",
      svg: (
        <svg
          className="w-32 h-32 text-slate-400/80 group-hover:scale-105 transition-transform duration-500"
          fill="currentColor"
          viewBox="0 0 100 100"
        >
          <circle cx="50" cy="50" opacity="0.25" r="38" />
          <circle cx="50" cy="50" opacity="0.4" r="26" />
          <circle cx="50" cy="50" opacity="0.6" r="14" />
        </svg>
      ),
    },
  ];

  const filteredCourses =
    activeCategory === "Trending"
      ? courses
      : courses.filter((c) => c.category === activeCategory);

  // FAQ items data
  const faqItems = [
    {
      question: "Who is Knoova for?",
      answer:
        "Knoova is built for students, professionals, and lifelong learners who want to build practical skills at their own pace without pressure or rigid schedules. It pairs seamlessly with approved school curriculum books.",
    },
    {
      question: "How is Knoova different from other learning platforms?",
      answer:
        "Unlike purely digital apps that cause screen fatigue, Knoova directly bridges physical paper textbooks to the screen via instant QR scanning. You read tactile books and turn on interactive 3D flipbooks or video explanations only when you need deep clarification.",
    },
    {
      question: "Can I learn at my own pace?",
      answer:
        "Yes, 100%. All video modules are bite-sized (4 to 8 minutes), chapters are bookmarkable, and worksheets can be reset and retried as many times as necessary to achieve mastery.",
    },
    {
      question: "Do I get a certificate after completing a course?",
      answer:
        "Upon finishing all chapter worksheets and unit review milestones with 80%+ mastery, a verified digital badge and PDF certificate signed by Knoova partner educators are generated for your student portfolio.",
    },
  ];

  return (
    <div className="bg-[#fafbfc] text-slate-800 antialiased overflow-x-hidden selection:bg-brand-500 selection:text-white min-h-screen flex flex-col font-sans">
      {/* BEGIN: AnnouncementTicker */}
      <aside
        className="bg-[#1d4ed8] text-white text-xs md:text-sm font-medium py-2.5 px-4 overflow-hidden relative shadow-inner"
        data-purpose="top-ticker"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 mx-auto">
            <span className="inline-flex items-center justify-center bg-white/20 text-white rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider">
              New Semester
            </span>
            <p className="truncate text-center">
              Scan textbook QR codes instantly &amp; unlock 3D Flipbooks, video lessons &amp; auto-graded worksheets!
            </p>
            <a
              className="hidden sm:inline-flex items-center underline hover:text-blue-100 font-semibold ml-1 text-xs transition-colors"
              href="#qr-simulator"
            >
              Try scanner →
            </a>
          </div>
        </div>
      </aside>
      {/* END: AnnouncementTicker */}

      {/* BEGIN: MainHeader */}
      <header className="sticky top-4 z-50 px-4 max-w-7xl mx-auto w-full">
        <nav
          className="bg-white/90 backdrop-blur-md rounded-full px-4 sm:px-6 py-3 border border-slate-200/80 shadow-md flex items-center justify-between transition-all duration-300"
          data-purpose="floating-pill-navigation"
        >
          {/* Brand Logo */}
          <div className="flex items-center gap-6">
            <Link className="flex items-center gap-2 group" href="/">
              <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white font-black text-lg shadow-sm group-hover:scale-105 transition-transform">
                K
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">Knoova</span>
            </Link>

            {/* Navigation Links (Desktop) */}
            <div className="hidden lg:flex items-center gap-1 text-sm font-semibold text-slate-600">
              <a
                className="px-3.5 py-1.5 rounded-full hover:text-brand-600 hover:bg-slate-100 transition-colors"
                href="#features"
              >
                Explore Features
              </a>
              <a
                className="px-3.5 py-1.5 rounded-full hover:text-brand-600 hover:bg-slate-100 transition-colors"
                href="#qr-simulator"
              >
                QR Scanner
              </a>
              <a
                className="px-3.5 py-1.5 rounded-full hover:text-brand-600 hover:bg-slate-100 transition-colors"
                href="#showcase"
              >
                Digital Library
              </a>
              <a
                className="px-3.5 py-1.5 rounded-full hover:text-brand-600 hover:bg-slate-100 transition-colors"
                href="#how-it-works"
              >
                How It Works
              </a>
              <a
                className="px-3.5 py-1.5 rounded-full hover:text-brand-600 hover:bg-slate-100 transition-colors"
                href="#faq"
              >
                FAQ
              </a>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white text-xs sm:text-sm font-semibold px-4 sm:px-5 py-2 sm:py-2.5 rounded-full shadow-sm hover:shadow-brand-500/20 transition-all"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Go to Dashboard</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden sm:inline-flex px-4 py-2 text-sm font-semibold text-slate-700 hover:text-brand-600 rounded-full hover:bg-slate-100 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white text-xs sm:text-sm font-semibold px-4 sm:px-5 py-2 sm:py-2.5 rounded-full shadow-sm hover:shadow-brand-500/20 transition-all"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}

            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-full text-slate-600 hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-2 bg-white rounded-3xl border border-slate-200/80 shadow-xl p-5 space-y-3 animate-in fade-in slide-in-from-top-3 duration-200">
            <div className="flex flex-col space-y-1 text-sm font-semibold text-slate-700">
              <a
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2.5 rounded-2xl hover:bg-slate-100 hover:text-brand-600 transition-colors"
                href="#features"
              >
                Explore Features
              </a>
              <a
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2.5 rounded-2xl hover:bg-slate-100 hover:text-brand-600 transition-colors"
                href="#qr-simulator"
              >
                QR Scanner
              </a>
              <a
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2.5 rounded-2xl hover:bg-slate-100 hover:text-brand-600 transition-colors"
                href="#showcase"
              >
                Digital Library
              </a>
              <a
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2.5 rounded-2xl hover:bg-slate-100 hover:text-brand-600 transition-colors"
                href="#how-it-works"
              >
                How It Works
              </a>
              <a
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2.5 rounded-2xl hover:bg-slate-100 hover:text-brand-600 transition-colors"
                href="#faq"
              >
                FAQ
              </a>
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 bg-brand-600 text-white font-bold rounded-2xl text-sm"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2 text-slate-700 font-semibold hover:bg-slate-100 rounded-2xl text-sm"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 bg-brand-600 text-white font-bold rounded-2xl text-sm shadow-sm"
                  >
                    Get Started Free
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>
      {/* END: MainHeader */}

      <main className="flex-1">
        {/* BEGIN: HeroSection */}
        <section className="relative pt-6 pb-20 px-4 overflow-hidden" data-purpose="hero-arch-window">
          <div className="max-w-6xl mx-auto">
            {/* Arch Masked Container with shadcn-inspired dark palette and subtle borders */}
            <div className="relative bg-gradient-to-b from-[#102A43] via-[#173F5F] to-[#245B7A] arch-hero-mask p-6 sm:p-12 md:p-20 text-center shadow-2xl overflow-hidden min-h-[580px] sm:min-h-[640px] flex flex-col justify-between border border-white/10">
              {/* Subtle background tech grid pattern */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
              {/* Subtle ambient glow behind typography */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-sky-500/10 rounded-full blur-[100px] pointer-events-none" />

              {/* Refined glass telemetry chips */}
              <div className="absolute top-12 left-6 sm:left-14 animate-float-slow hidden sm:flex items-center gap-2 bg-slate-900/60 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-xl border border-white/10 text-xs font-medium text-slate-200">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Physical-to-Digital Sync
              </div>
              <div className="absolute top-20 right-6 sm:right-16 hidden sm:flex items-center gap-2 bg-slate-900/60 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-xl border border-white/10 text-xs font-medium text-slate-200">
                <QrCode className="w-3.5 h-3.5 text-amber-300" />
                <span>Instant QR Scanner</span>
              </div>
              <div className="absolute bottom-28 left-8 hidden lg:flex items-center gap-2 bg-slate-900/60 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-xl border border-white/10 text-xs font-medium text-slate-200">
                <BookOpen className="w-3.5 h-3.5 text-blue-300" />
                <span>Interactive Flipbooks</span>
              </div>
              <div className="absolute bottom-24 right-10 hidden lg:flex items-center gap-2 bg-slate-900/60 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-xl border border-white/10 text-xs font-medium text-slate-200">
                <FileCheck2 className="w-3.5 h-3.5 text-emerald-300" />
                <span>Chapter Worksheets</span>
              </div>

              {/* Top Spacing */}
              <div />

              {/* Center Content: Typography & Main CTA */}
              <div className="relative z-10 max-w-3xl mx-auto py-8 sm:py-14">
                {/* Shadcn style Announcement Pill */}
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-medium text-slate-200 backdrop-blur-md shadow-sm mb-6 hover:bg-white/15 transition-all cursor-default">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
                  <span>Curriculum-Aligned Learning System</span>
                  <span className="text-white/30">/</span>
                  <span className="text-blue-200 flex items-center gap-1 font-normal">
                    Version 4.8 Released <ArrowRight className="w-3 h-3 inline" />
                  </span>
                </div>

                {/* Headline with lighter, modern font weight */}
                <h1 className="text-3xl sm:text-5xl md:text-6xl font-semibold text-white tracking-tight leading-[1.15]">
                  Learn skills that actually <br className="hidden sm:inline" />
                  <span className="bg-gradient-to-r from-sky-200 via-blue-100 to-white bg-clip-text text-transparent underline decoration-sky-400/40 decoration-wavy decoration-2 underline-offset-8">
                    move you forward.
                  </span>
                </h1>

                <p className="mt-6 text-base sm:text-lg md:text-xl text-slate-200/90 font-normal max-w-2xl mx-auto leading-relaxed">
                  Scan your printed textbook QR code, flip through interactive 3D pages, stream HD educator video
                  lectures, and master concepts at your own pace without pressure.
                </p>

                {/* CTA Button Group - shadcn refined buttons */}
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
                  <a
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-slate-950 hover:bg-slate-100 active:scale-95 font-medium text-sm sm:text-base px-7 py-3 rounded-full shadow-lg transition-all cursor-pointer"
                    href="#qr-simulator"
                  >
                    <QrCode className="w-4 h-4 text-brand-600" />
                    <span>Scan Book QR Code</span>
                  </a>
                  <a
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 active:scale-95 border border-white/20 backdrop-blur text-white font-medium text-sm sm:text-base px-6 py-3 rounded-full transition-all cursor-pointer"
                    href="#showcase"
                  >
                    <span>Browse Digital Library</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>

                {/* Refined social proof badge */}
                <div className="mt-8 inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-slate-300 backdrop-blur-sm">
                  <div className="flex -space-x-1.5">
                    <div className="w-5 h-5 rounded-full bg-blue-500/90 border border-white/40 flex items-center justify-center text-[9px] text-white font-bold">
                      K
                    </div>
                    <div className="w-5 h-5 rounded-full bg-emerald-500/90 border border-white/40 flex items-center justify-center text-[9px] text-white font-bold">
                      S
                    </div>
                    <div className="w-5 h-5 rounded-full bg-amber-500/90 border border-white/40 flex items-center justify-center text-[9px] text-white font-bold">
                      M
                    </div>
                  </div>
                  <span className="font-normal text-slate-200">Join 48,000+ active student learners this week</span>
                </div>
              </div>

              {/* Bottom partner hint */}
              <div className="relative z-10 w-full flex items-center justify-center pt-2">
                <span className="text-xs text-white/60 font-normal tracking-wide">
                  Compatible with all Knoova curriculum partner textbooks &amp; workbooks
                </span>
              </div>
            </div>
          </div>
        </section>
        {/* END: HeroSection */}

        {/* BEGIN: TrustPartnersBanner */}
        <section className="py-6 border-y border-slate-100 bg-white" data-purpose="partners-proof">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">
              Curriculum trusted by 450+ progressive schools &amp; institutes
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 opacity-70 grayscale hover:grayscale-0 transition-all duration-300">
              <div className="flex items-center gap-2 font-bold tracking-tight text-slate-700 text-lg">
                <span className="w-4 h-4 rounded-full bg-slate-800" /> GOODCOMPANY
              </div>
              <div className="flex items-center gap-2 font-bold tracking-tight text-slate-700 text-lg">
                <span className="text-xl">🟢</span> Horizon Academies
              </div>
              <div className="flex items-center gap-1 font-bold tracking-tight text-slate-700 text-lg">
                <span>Apex</span>
                <span className="text-brand-600 font-extrabold">Learning</span>
              </div>
              <div className="flex items-center gap-2 font-bold tracking-tight text-slate-700 text-lg">
                <span className="w-3.5 h-3.5 bg-blue-600 rotate-45" /> GLOBAL STEM LABS
              </div>
              <div className="flex items-center gap-2 font-bold tracking-tight text-slate-700 text-lg">
                <span className="text-amber-500 font-black">⚡</span> Beacon Prep
              </div>
            </div>
          </div>
        </section>
        {/* END: TrustPartnersBanner */}

        {/* BEGIN: FloatingTagsMarquee */}
        <section
          className="py-8 bg-slate-50 overflow-hidden border-b border-slate-100"
          data-purpose="mood-tag-ribbon"
        >
          <div className="relative w-full">
            <div className="flex gap-3 whitespace-nowrap animate-marquee">
              {/* Tag Set 1 */}
              <div className="inline-flex items-center gap-2 bg-[#2563eb] text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-sm">
                <span>Calm</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-[#facc15] text-slate-900 px-5 py-2.5 rounded-full text-sm font-bold shadow-sm">
                <span>Motivated</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-[#059669] text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-sm">
                <span>Focused sessions</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-white text-slate-800 border border-slate-200 px-5 py-2.5 rounded-full text-sm font-bold shadow-sm">
                <span className="text-emerald-500 font-black">✓</span> Growth oriented
              </div>
              <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-sm">
                <Lightbulb className="w-4 h-4 text-white" />
                <span>Curious minds</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-amber-400 text-slate-900 px-5 py-2.5 rounded-full text-sm font-bold shadow-sm">
                <span>Practical skills</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-white text-slate-800 border border-slate-200 px-5 py-2.5 rounded-full text-sm font-bold shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Self driven
              </div>
              <div className="inline-flex items-center gap-2 bg-emerald-700 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-sm">
                <span>Real progress</span>
              </div>

              {/* Tag Set 2 (Duplicate for continuous loop) */}
              <div className="inline-flex items-center gap-2 bg-[#2563eb] text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-sm">
                <span>Calm</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-[#facc15] text-slate-900 px-5 py-2.5 rounded-full text-sm font-bold shadow-sm">
                <span>Motivated</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-[#059669] text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-sm">
                <span>Focused sessions</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-white text-slate-800 border border-slate-200 px-5 py-2.5 rounded-full text-sm font-bold shadow-sm">
                <span className="text-emerald-500 font-black">✓</span> Growth oriented
              </div>
              <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-sm">
                <Lightbulb className="w-4 h-4 text-white" />
                <span>Curious minds</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-amber-400 text-slate-900 px-5 py-2.5 rounded-full text-sm font-bold shadow-sm">
                <span>Practical skills</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-white text-slate-800 border border-slate-200 px-5 py-2.5 rounded-full text-sm font-bold shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Self driven
              </div>
              <div className="inline-flex items-center gap-2 bg-emerald-700 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-sm">
                <span>Real progress</span>
              </div>
            </div>
          </div>
        </section>
        {/* END: FloatingTagsMarquee */}

        {/* BEGIN: FocusArchQuoteSection */}
        <section className="py-20 px-4" data-purpose="clarity-arch-statement">
          <div className="max-w-4xl mx-auto text-center relative">
            {/* Arch Background outline */}
            <div className="absolute inset-x-0 top-0 -bottom-10 border-2 border-dashed border-slate-200/80 rounded-t-[140px] pointer-events-none -z-10 bg-gradient-to-b from-slate-50/60 to-transparent" />

            {/* Scattered playful tags positioned around statement */}
            <div className="flex justify-between items-center max-w-lg mx-auto pt-8 px-4">
              <span className="inline-block bg-[#2563eb] text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md">
                Calm
              </span>
              <span className="inline-block bg-white text-slate-600 border border-slate-200 text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
                Real progress
              </span>
              <span className="inline-block bg-[#facc15] text-slate-900 text-xs font-bold px-4 py-1.5 rounded-full shadow-md">
                Motivated
              </span>
            </div>

            <div className="relative py-8 px-6">
              {/* Left check badge */}
              <div className="absolute -left-2 sm:left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm shadow-md">
                ✓
              </div>
              {/* Right bulb badge */}
              <div className="absolute -right-2 sm:right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm shadow-md">
                💡
              </div>

              <h2 className="text-2xl sm:text-4xl md:text-5xl font-semibold text-slate-900 tracking-tight leading-snug">
                From focused sessions <br />
                to practical skills, we <br className="hidden sm:inline" />
                help you learn with <br />
                <span className="text-brand-600">clarity and confidence.</span>
              </h2>
            </div>

            <div className="flex justify-center gap-3 items-center pb-8">
              <span className="inline-block bg-white border border-slate-200 text-slate-700 text-xs font-semibold px-4 py-1.5 rounded-full shadow-sm">
                Growth oriented
              </span>
              <span className="inline-block bg-[#059669] text-white text-xs font-bold px-5 py-1.5 rounded-full shadow-md">
                Focused sessions
              </span>
            </div>

            <p className="text-slate-500 text-sm max-w-md mx-auto pt-2 font-medium">
              Knoova is built to support real learning with clarity and focus. No clutter, no cramming — just meaningful understanding.
            </p>
          </div>
        </section>
        {/* END: FocusArchQuoteSection */}

        {/* BEGIN: CoreFeaturesSection */}
        <section className="py-16 bg-white border-t border-slate-100" data-purpose="feature-pillar-cards" id="features">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="text-xs font-bold tracking-widest text-brand-600 uppercase bg-blue-50 px-3 py-1 rounded-full">
                All-in-One Learning Ecosystem
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-semibold text-slate-900 tracking-tight">
                How Knoova bridges your desk &amp; screen
              </h2>
              <p className="mt-3 text-slate-600 text-base">
                Turn every page in your hands into an interactive multimedia laboratory with four integrated tools.
              </p>
            </div>

            {/* 4 Core Pillars Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1: Physical Book QR Scanner */}
              <div
                className="bg-slate-50 hover:bg-white rounded-3xl p-6 border border-slate-200/80 hover:border-brand-500 hover:shadow-soft transition-all duration-300 group flex flex-col justify-between"
                data-purpose="qr-feature-card"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-brand-600 flex items-center justify-center mb-5 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                    <QrCode className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-full">
                    Instant Bridge
                  </span>
                  <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mt-2 mb-2">Physical Book QR Scanner</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Scan the printed code at the top of any chapter page to immediately open companion videos,
                    step-by-step solutions, and digital notes.
                  </p>
                </div>
                <a
                  href="#qr-simulator"
                  className="mt-6 pt-4 border-t border-slate-200/60 flex items-center justify-between text-xs font-semibold text-brand-600 group-hover:underline"
                >
                  <span>Try Live Simulator</span>
                  <span>→</span>
                </a>
              </div>

              {/* Card 2: Interactive E-Flipbooks */}
              <div
                className="bg-slate-50 hover:bg-white rounded-3xl p-6 border border-slate-200/80 hover:border-emerald-500 hover:shadow-soft transition-all duration-300 group flex flex-col justify-between"
                data-purpose="flipbook-feature-card"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-5 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                    3D Simulation
                  </span>
                  <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mt-2 mb-2">Interactive E-Flipbooks</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Realistic 3D page-turning textbooks equipped with voice read-aloud, instant highlight bookmarks, and
                    clickable diagram glossaries.
                  </p>
                </div>
                <a
                  href="#qr-simulator"
                  className="mt-6 pt-4 border-t border-slate-200/60 flex items-center justify-between text-xs font-semibold text-emerald-600 group-hover:underline"
                >
                  <span>Preview Flipbook</span>
                  <span>→</span>
                </a>
              </div>

              {/* Card 3: Curated Video Lessons */}
              <div
                className="bg-slate-50 hover:bg-white rounded-3xl p-6 border border-slate-200/80 hover:border-amber-500 hover:shadow-soft transition-all duration-300 group flex flex-col justify-between"
                data-purpose="video-feature-card"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-5 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                    <Video className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full">
                    Bite-Sized Lectures
                  </span>
                  <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mt-2 mb-2">Curated Video Lessons</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    High-definition animations and teacher walkthroughs mapped strictly to each syllabus page so you never
                    get stuck on difficult problems.
                  </p>
                </div>
                <a
                  href="#qr-simulator"
                  className="mt-6 pt-4 border-t border-slate-200/60 flex items-center justify-between text-xs font-semibold text-amber-600 group-hover:underline"
                >
                  <span>Browse 2,400+ Clips</span>
                  <span>→</span>
                </a>
              </div>

              {/* Card 4: Chapter Worksheets */}
              <div
                className="bg-slate-50 hover:bg-white rounded-3xl p-6 border border-slate-200/80 hover:border-purple-500 hover:shadow-soft transition-all duration-300 group flex flex-col justify-between"
                data-purpose="worksheets-feature-card"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mb-5 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <FileCheck2 className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full">
                    Auto-Graded
                  </span>
                  <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mt-2 mb-2">Practice Worksheets</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Test your mastery with timed chapter quizzes, instant feedback hints, and printable clean PDF problem
                    sets for exam revision.
                  </p>
                </div>
                <a
                  href="#qr-simulator"
                  className="mt-6 pt-4 border-t border-slate-200/60 flex items-center justify-between text-xs font-semibold text-purple-600 group-hover:underline"
                >
                  <span>View Sample Quiz</span>
                  <span>→</span>
                </a>
              </div>
            </div>
          </div>
        </section>
        {/* END: CoreFeaturesSection */}

        {/* BEGIN: LiveQrSimulatorSection */}
        <section
          className="py-20 bg-slate-900 text-white relative overflow-hidden"
          data-purpose="interactive-qr-simulator"
          id="qr-simulator"
        >
          {/* Background Ambient Glow */}
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-600/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="bg-brand-500/20 border border-brand-500/30 text-brand-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Interactive Experience
              </span>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mt-3">
                Try the Textbook-to-Screen Bridge
              </h2>
              <p className="mt-3 text-slate-400 text-sm sm:text-base">
                Click the scanner button below to test how easily a student transforms printed page 42 into a dynamic digital learning lab.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column: Simulated Textbook Page with QR */}
              <div className="lg:col-span-5 bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 relative">
                <div className="flex items-center justify-between border-b pb-4 mb-4">
                  <div>
                    <span className="text-xs font-bold text-brand-600 uppercase">Knoova Science • Level 4</span>
                    <h4 className="text-lg font-semibold text-slate-800">Chapter 4: Plant Cell Architecture</h4>
                  </div>
                  <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600 font-bold">
                    Page 42
                  </span>
                </div>

                {/* Page Content Simulation */}
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  &quot;Chloroplasts capture light energy to perform photosynthesis, converting solar energy into
                  cellular sustenance...&quot;
                </p>

                {/* Physical Book QR Box */}
                <div className="bg-slate-50 border-2 border-dashed border-brand-400/80 rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden">
                  {/* QR Graphic with Animated Laser */}
                  <div className="relative w-24 h-24 bg-white p-2 rounded-xl shadow-sm border border-slate-200 flex-shrink-0">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      {/* Corner Boxes */}
                      <rect fill="#1e293b" height="30" width="30" x="0" y="0" />
                      <rect fill="white" height="20" width="20" x="5" y="5" />
                      <rect fill="#2563eb" height="10" width="10" x="10" y="10" />

                      <rect fill="#1e293b" height="30" width="30" x="70" y="0" />
                      <rect fill="white" height="20" width="20" x="75" y="5" />
                      <rect fill="#2563eb" height="10" width="10" x="80" y="10" />

                      <rect fill="#1e293b" height="30" width="30" x="0" y="70" />
                      <rect fill="white" height="20" width="20" x="5" y="75" />
                      <rect fill="#2563eb" height="10" width="10" x="10" y="80" />

                      {/* Data Dots */}
                      <rect fill="#1e293b" height="10" width="10" x="40" y="10" />
                      <rect fill="#1e293b" height="10" width="10" x="55" y="10" />
                      <rect fill="#1e293b" height="10" width="10" x="40" y="30" />
                      <rect fill="#1e293b" height="10" width="10" x="55" y="45" />
                      <rect fill="#1e293b" height="10" width="15" x="75" y="45" />
                      <rect fill="#1e293b" height="10" width="10" x="35" y="70" />
                      <rect fill="#1e293b" height="10" width="20" x="55" y="70" />
                      <rect fill="#1e293b" height="10" width="10" x="45" y="85" />
                      <rect fill="#1e293b" height="15" width="15" x="75" y="75" />
                    </svg>

                    {/* Animated Laser Scan Line */}
                    <div className="absolute inset-x-1 h-0.5 bg-brand-500 shadow-[0_0_8px_#3b82f6] animate-scan-beam" />
                  </div>

                  <div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-600" /> Printed Textbook QR
                    </div>
                    <p className="text-xs font-bold text-slate-900 mt-1">Scan to launch Chapter 4 companion</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Flipbook + 3D Model + Worksheets</p>
                  </div>
                </div>

                {/* Action Button */}
                {!isSynced ? (
                  <button
                    onClick={handleSimulateScan}
                    disabled={isScanning}
                    type="button"
                    className="w-full mt-6 bg-brand-600 hover:bg-brand-500 active:scale-95 text-white font-bold py-3.5 px-4 rounded-2xl text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-80"
                  >
                    {isScanning ? (
                      <>
                        <svg
                          className="animate-spin h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        <span>Scanning Textbook Page 42...</span>
                      </>
                    ) : (
                      <>
                        <QrCode className="w-5 h-5" />
                        <span>Simulate Instant Camera Scan</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="mt-6 flex flex-col gap-2">
                    <button
                      type="button"
                      className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold py-3.5 px-4 rounded-2xl text-sm transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                      <span className="text-base">🎉</span>
                      <span>Unlocked! Chapter 4 Ready</span>
                    </button>
                    <button
                      onClick={handleResetScan}
                      type="button"
                      className="text-xs text-slate-500 hover:text-slate-700 flex items-center justify-center gap-1 py-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Simulator</span>
                    </button>
                  </div>
                )}

                <p className="text-[11px] text-center text-slate-400 mt-2">
                  Zero setup required — works directly in any mobile or tablet browser
                </p>
              </div>

              {/* Right Column: Resulting Unlocked Digital Workspace Preview */}
              <div
                className={`lg:col-span-7 bg-slate-800/90 backdrop-blur rounded-3xl p-6 sm:p-8 border transition-all duration-500 shadow-2xl relative ${
                  isSynced ? "border-emerald-500 ring-2 ring-emerald-500/50" : "border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between border-b border-slate-700 pb-4 mb-6">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-red-400" />
                    <span className="w-3 h-3 rounded-full bg-yellow-400" />
                    <span className="w-3 h-3 rounded-full bg-green-400" />
                    <span className="text-xs font-mono text-slate-400 ml-2">app.knoova.edu/book/sci4-ch04</span>
                  </div>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full border transition-all ${
                      isSynced
                        ? "text-white bg-emerald-600 border-emerald-400 shadow-md animate-pulse"
                        : "text-emerald-400 bg-emerald-950/80 border-emerald-800"
                    }`}
                  >
                    {isSynced ? "✓ Chapter 4 Synced" : "● Ready to Sync"}
                  </span>
                </div>

                {/* Dynamic Unlocked Tabs Preview */}
                <div
                  className={`space-y-4 transition-all duration-500 ${
                    isSynced ? "p-2 bg-slate-900/60 rounded-2xl ring-1 ring-emerald-400/40" : ""
                  }`}
                >
                  {/* Active Resource Banner */}
                  <div className="bg-gradient-to-r from-brand-900 to-slate-800 p-4 rounded-2xl border border-brand-500/30 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-brand-300 font-semibold uppercase">Unlocked Companion</span>
                      <h5 className="text-base font-semibold text-white">Ch. 4: Cell Architecture &amp; Energy Flow</h5>
                      <p className="text-xs text-slate-300">Grade 4 Science • 3 Modules Available</p>
                    </div>
                    <div className="hidden sm:block text-right">
                      <span className="text-xs bg-brand-500 text-white font-bold px-3 py-1 rounded-full">
                        100% Aligned
                      </span>
                    </div>
                  </div>

                  {/* 3 Interactive Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    {/* 1. Flipbook preview */}
                    <div className="bg-slate-900 p-4 rounded-2xl border border-slate-700 hover:border-brand-500 transition-colors cursor-pointer group">
                      <div className="text-brand-400 text-xl mb-2">📖</div>
                      <h6 className="font-semibold text-sm text-white group-hover:text-brand-300">3D Flipbook</h6>
                      <p className="text-xs text-slate-400 mt-1">Read pages 42–54 with interactive callouts.</p>
                      <span className="mt-3 inline-block text-[11px] font-bold text-brand-400 group-hover:underline">
                        Open Flipbook →
                      </span>
                    </div>

                    {/* 2. Video preview */}
                    <div className="bg-slate-900 p-4 rounded-2xl border border-slate-700 hover:border-amber-400 transition-colors cursor-pointer group">
                      <div className="text-amber-400 text-xl mb-2">🎬</div>
                      <h6 className="font-semibold text-sm text-white group-hover:text-amber-300">Video Lecture</h6>
                      <p className="text-xs text-slate-400 mt-1">6-min animated micro lesson by Dr. Anya.</p>
                      <span className="mt-3 inline-block text-[11px] font-bold text-amber-400 group-hover:underline">
                        Play Video →
                      </span>
                    </div>

                    {/* 3. Worksheets preview */}
                    <div className="bg-slate-900 p-4 rounded-2xl border border-slate-700 hover:border-emerald-400 transition-colors cursor-pointer group">
                      <div className="text-emerald-400 text-xl mb-2">📝</div>
                      <h6 className="font-semibold text-sm text-white group-hover:text-emerald-300">Quiz &amp; Sheet</h6>
                      <p className="text-xs text-slate-400 mt-1">10 quick check questions with instant scores.</p>
                      <span className="mt-3 inline-block text-[11px] font-bold text-emerald-400 group-hover:underline">
                        Start Quiz →
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* END: LiveQrSimulatorSection */}

        {/* BEGIN: HowItWorksSteps */}
        <section
          className="py-20 bg-slate-50 border-b border-slate-200/70"
          data-purpose="how-it-works-process"
          id="how-it-works"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs font-bold tracking-wider text-brand-600 uppercase bg-blue-50 px-3 py-1 rounded-full">
                Simple 3-Step Flow
              </span>
              <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900 tracking-tight mt-3">
                Designed for independent student success
              </h2>
              <p className="text-slate-600 mt-3 text-base">
                No complicated logins or password confusion. Students connect from desk to screen in under five seconds.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Step 1 */}
              <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm relative">
                <div className="w-10 h-10 rounded-full bg-brand-600 text-white font-extrabold flex items-center justify-center text-lg mb-6 shadow-md">
                  1
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">Open Your Textbook</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Read your assigned textbook or workbook chapter. Locate the circular or square Knoova QR code located
                  at the chapter heading.
                </p>
                <div className="mt-6 p-3 bg-slate-50 rounded-2xl flex items-center gap-3 border border-slate-100">
                  <span className="text-2xl">📖</span>
                  <span className="text-xs text-slate-500 font-medium">Over 1,200 physical textbooks supported</span>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm relative">
                <div className="w-10 h-10 rounded-full bg-amber-500 text-slate-900 font-extrabold flex items-center justify-center text-lg mb-6 shadow-md">
                  2
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">Scan with Any Camera</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Point your smartphone, iPad, or laptop webcam at the code. No special app download needed — opens
                  instantly in the web browser.
                </p>
                <div className="mt-6 p-3 bg-slate-50 rounded-2xl flex items-center gap-3 border border-slate-100">
                  <span className="text-2xl">📷</span>
                  <span className="text-xs text-slate-500 font-medium">Lightning-fast auto recognition</span>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm relative">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-extrabold flex items-center justify-center text-lg mb-6 shadow-md">
                  3
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">Watch, Flip &amp; Practice</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Switch seamlessly between video animations, high-fidelity 3D flipbook pages, and instant practice
                  worksheets with auto-score feedback.
                </p>
                <div className="mt-6 p-3 bg-slate-50 rounded-2xl flex items-center gap-3 border border-slate-100">
                  <span className="text-2xl">🎯</span>
                  <span className="text-xs text-slate-500 font-medium">Track your personal mastery badge</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* END: HowItWorksSteps */}

        {/* BEGIN: CuratedTextbookShowcase */}
        <section className="py-20 bg-white" data-purpose="class-book-showcase" id="showcase">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-blue-50 px-3 py-1 rounded-full">
                  Interactive Textbook Library
                </span>
                <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900 tracking-tight mt-2">
                  Explore our most loved classes
                </h2>
                <p className="text-slate-600 text-sm sm:text-base mt-2">
                  Curated interactive companion curricula chosen by educators to help students accelerate.
                </p>
              </div>

              {/* Category filter pill tags */}
              <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
                {["Trending", "STEM Science", "Leadership", "Design", "Analytics"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    type="button"
                    className={`px-4 py-1.5 rounded-full text-xs transition-all cursor-pointer ${
                      activeCategory === cat
                        ? "bg-brand-600 text-white font-medium shadow-sm"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200 font-normal"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Course Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredCourses.map((course) => (
                <article
                  key={course.id}
                  className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-soft transition-all duration-300 overflow-hidden flex flex-col justify-between group"
                  data-purpose="course-card"
                >
                  <div>
                    {/* Stylized Geometric Artwork Cover */}
                    <div
                      className={`h-48 ${
                        course.themeColor.startsWith("from-")
                          ? `bg-gradient-to-br ${course.themeColor}`
                          : course.themeColor
                      } flex items-center justify-center p-6 relative overflow-hidden`}
                    >
                      {course.svg}
                      <span className="absolute top-3 left-3 bg-white/90 backdrop-blur text-slate-800 text-[10px] font-medium px-2 py-0.5 rounded-full shadow-sm">
                        {course.tag}
                      </span>
                    </div>

                    <div className="p-5">
                      <h3 className="font-semibold text-base text-slate-900 group-hover:text-brand-600 transition-colors">
                        {course.title}
                      </h3>

                      {/* Rating & Reviews */}
                      <div className="flex items-center gap-1.5 mt-2">
                        <div className="flex text-amber-400 text-xs">★★★★★</div>
                        <span className="text-xs font-semibold text-slate-700">{course.rating}</span>
                        <span className="text-xs text-slate-400">( {course.reviews} )</span>
                      </div>

                      <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">{course.description}</p>

                      {/* Instructor Info */}
                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <p className="text-xs font-semibold text-slate-800">{course.instructor}</p>
                        <p className="text-[11px] text-slate-400">{course.instructorRole}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 pt-0">
                    <a
                      className={`w-full inline-flex items-center justify-center py-2 px-3 ${course.btnBg} text-xs rounded-xl transition-colors cursor-pointer`}
                      href="#qr-simulator"
                    >
                      Open Course Companion
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
        {/* END: CuratedTextbookShowcase */}

        {/* BEGIN: TestimonialCardSection */}
        <section className="py-20 bg-slate-900 text-white relative overflow-hidden" data-purpose="learner-testimonial-banner">
          {/* Background Ambient Glow matching QR simulator */}
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-600/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
            {/* Header / Tag */}
            <div className="text-center mb-10">
              <span className="bg-brand-500/20 border border-brand-500/30 text-brand-300 text-xs font-medium px-3.5 py-1 rounded-full uppercase tracking-wider">
                Learner Experience
              </span>
              <h2 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight mt-3">
                Loved by students &amp; self-paced learners
              </h2>
            </div>

            {/* Floating Quote Card */}
            <div className="relative bg-slate-800/90 backdrop-blur-md rounded-3xl p-6 sm:p-10 text-left shadow-2xl border border-slate-700/80">
              {/* Large Quote Icon */}
              <div className="text-brand-400 font-serif text-5xl leading-none -mt-2 mb-2 font-bold">“</div>
              <blockquote className="text-lg sm:text-2xl font-medium sm:font-semibold text-white leading-snug tracking-tight">
                Knoova completely changed how I approach learning. I feel more focused, less pressured, and I
                actually finish the courses I start.&rdquo;
              </blockquote>

              <div className="mt-6 flex items-center gap-3.5 pt-4 border-t border-slate-700/60">
                <div className="w-11 h-11 rounded-full bg-brand-600 text-white font-semibold flex items-center justify-center text-sm ring-2 ring-brand-400/30">
                  MC
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Maya Chen</p>
                  <p className="text-xs text-slate-400 font-normal">Product Designer • Self-taught learner</p>
                </div>
                <div className="ml-auto hidden sm:flex items-center gap-1 text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-3 py-1 rounded-full text-xs font-semibold">
                  <span>✓</span>
                  <span>Verified Student</span>
                </div>
              </div>
            </div>

            {/* Subtle retention stat */}
            <div className="text-center text-slate-400 text-xs font-normal mt-6">
              Over 94% of students report higher retention when pairing printed books with digital flipbooks.
            </div>
          </div>
        </section>
        {/* END: TestimonialCardSection */}

        {/* BEGIN: FAQSection */}
        <section className="py-20 bg-white" data-purpose="faq-accordion-section" id="faq">
          <div className="max-w-3xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900 tracking-tight">
                Frequently asked questions
              </h2>
              <p className="mt-2 text-slate-500 text-sm">
                Everything students and parents need to know about using Knoova
              </p>
            </div>

            <div className="space-y-3.5">
              {faqItems.map((item, index) => {
                const isOpen = openFaq === index;
                return (
                  <div
                    key={index}
                    className="rounded-2xl border border-slate-200 bg-slate-50/70 overflow-hidden transition-colors"
                  >
                    <button
                      onClick={() => toggleFaq(index)}
                      className="w-full text-left p-5 flex items-center justify-between font-semibold text-slate-900 text-sm sm:text-base hover:text-brand-600 transition-colors cursor-pointer"
                      type="button"
                    >
                      <span>{item.question}</span>
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                          isOpen ? "bg-brand-600 text-white" : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {isOpen ? "−" : "+"}
                      </span>
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 text-slate-600 text-sm leading-relaxed animate-in fade-in duration-200">
                        {item.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-8 text-center">
              <a
                href="#faq"
                className="inline-block bg-brand-600 hover:bg-brand-700 text-white font-medium text-xs px-6 py-2.5 rounded-full shadow-sm transition-all"
              >
                See more questions
              </a>
            </div>
          </div>
        </section>
        {/* END: FAQSection */}

        {/* BEGIN: BottomCallToActionAndArch */}
        <section className="pt-16 bg-white overflow-hidden" data-purpose="bottom-cta-banner">
          <div className="max-w-5xl mx-auto px-4 text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-semibold text-slate-900 tracking-tight leading-tight">
              Start learning in a way <br />
              that feels right for you.
            </h2>
            <p className="mt-4 text-slate-600 max-w-md mx-auto text-sm sm:text-base">
              Join thousands of students who have discovered stress-free, engaging mastery.
            </p>
            <div className="mt-6">
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm px-8 py-3.5 rounded-full shadow-lg transition-all active:scale-95 cursor-pointer"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Go to Student Dashboard</span>
                </Link>
              ) : (
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm px-8 py-3.5 rounded-full shadow-lg transition-all active:scale-95 cursor-pointer"
                >
                  <span>Get started for free</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>

          {/* Royal Blue Arch Container directly matching bottom of Image 4 */}
          <div className="relative bg-brand-600 text-white arch-bottom-mask pt-16 pb-14 px-6 md:px-12 shadow-2xl">
            {/* Large Knoova Mascot Emblem */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full bg-blue-700 border-4 border-blue-400/40 flex items-center justify-center shadow-2xl mb-12 -mt-24 ring-8 ring-white">
              <div className="text-white font-bold text-3xl sm:text-4xl tracking-tighter">K•</div>
            </div>

            <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-14 text-center md:text-left">
              {/* Col 1: Explore */}
              <div>
                <h4 className="font-semibold text-blue-200 text-xs uppercase tracking-wider mb-4">Explore</h4>
                <ul className="space-y-2 text-sm font-medium text-blue-100">
                  <li>
                    <a className="hover:text-white transition-colors" href="#showcase">
                      Courses &amp; Books
                    </a>
                  </li>
                  <li>
                    <a className="hover:text-white transition-colors" href="#showcase">
                      Learning Paths
                    </a>
                  </li>
                  <li>
                    <a className="hover:text-white transition-colors" href="#showcase">
                      Popular Classes
                    </a>
                  </li>
                  <li>
                    <a className="hover:text-white transition-colors" href="#features">
                      Worksheets Library
                    </a>
                  </li>
                  <li>
                    <a className="hover:text-white transition-colors" href="#faq">
                      Certificates
                    </a>
                  </li>
                </ul>
              </div>

              {/* Col 2: Resources */}
              <div>
                <h4 className="font-semibold text-blue-200 text-xs uppercase tracking-wider mb-4">Resources</h4>
                <ul className="space-y-2 text-sm font-medium text-blue-100">
                  <li>
                    <a className="hover:text-white transition-colors" href="#faq">
                      Student FAQ
                    </a>
                  </li>
                  <li>
                    <a className="hover:text-white transition-colors" href="#">
                      Help Center
                    </a>
                  </li>
                  <li>
                    <a className="hover:text-white transition-colors" href="#">
                      Learning Guide
                    </a>
                  </li>
                  <li>
                    <a className="hover:text-white transition-colors" href="#">
                      Community Forum
                    </a>
                  </li>
                  <li>
                    <a className="hover:text-white transition-colors" href="#">
                      Educator Portal
                    </a>
                  </li>
                </ul>
              </div>

              {/* Col 3: Company */}
              <div>
                <h4 className="font-semibold text-blue-200 text-xs uppercase tracking-wider mb-4">Company</h4>
                <ul className="space-y-2 text-sm font-medium text-blue-100">
                  <li>
                    <a className="hover:text-white transition-colors" href="#">
                      About Knoova
                    </a>
                  </li>
                  <li>
                    <a className="hover:text-white transition-colors" href="#">
                      Careers
                    </a>
                  </li>
                  <li>
                    <a className="hover:text-white transition-colors" href="#">
                      School Partners
                    </a>
                  </li>
                  <li>
                    <a className="hover:text-white transition-colors" href="#">
                      Privacy Policy
                    </a>
                  </li>
                  <li>
                    <a className="hover:text-white transition-colors" href="#">
                      Terms of Service
                    </a>
                  </li>
                </ul>
              </div>

              {/* Col 4: Platform Status */}
              <div className="col-span-2 md:col-span-1 text-center md:text-left">
                <h4 className="font-semibold text-blue-200 text-xs uppercase tracking-wider mb-4">Sync Engine</h4>
                <p className="text-xs text-blue-100/80 leading-relaxed mb-3">
                  QR Recognition v4.8 active. Ultra low latency flipbook render engine.
                </p>
                <div className="inline-flex items-center gap-2 bg-blue-700/80 px-3 py-1.5 rounded-full text-xs text-white">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>All systems operational</span>
                </div>
              </div>
            </div>

            {/* Social Channels & Copyright Line */}
            <div className="max-w-6xl mx-auto pt-8 border-t border-blue-500/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-blue-100/80">
              <p>Follow us on social media for updates, learning tips, and new courses.</p>
              <div className="flex items-center gap-4 text-xs font-semibold text-white">
                <a className="hover:underline" href="#">
                  Instagram
                </a>
                <a className="hover:underline" href="#">
                  LinkedIn
                </a>
                <a className="hover:underline" href="#">
                  Facebook
                </a>
                <a className="hover:underline" href="#">
                  Twitter
                </a>
              </div>
            </div>

            {/* Large Ghost Watermark Text at Bottom */}
            <div className="mt-12 text-center select-none pointer-events-none opacity-20">
              <span className="text-6xl sm:text-9xl font-black tracking-tighter text-blue-900">Knoova</span>
            </div>
            <div className="text-center text-[11px] text-blue-200/60 mt-4">
              © 2026 Knoova Inc. All Rights Reserved. Empowering students with physical &amp; digital learning harmony.
            </div>
          </div>
        </section>
        {/* END: BottomCallToActionAndArch */}
      </main>
    </div>
  );
}
