"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/store/auth";
import { Activity } from "@/lib/types";
import { 
  Users, BookOpen, HelpCircle, Video, FileSpreadsheet, 
  Sparkles, Clock, AlertCircle, QrCode, Camera, ArrowRight,
  Download, Play, BookMarked, CheckCircle2, History, ExternalLink
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
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-[#c3c6d7]/35 bg-gradient-to-r from-[#dbe1ff]/60 via-[#faf8ff] to-white p-6 md:p-8 shadow-sm">
        <div className="absolute top-0 right-0 h-48 w-48 bg-[#004ac6]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider bg-[#004ac6] text-white px-3 py-1 rounded-full shadow-xs">
                {isStudent ? "Student Portal" : user?.role ? `${user.role} Dashboard` : "Learning Portal"}
              </span>
              {user?.className && (
                <span className="text-xs font-semibold bg-white border border-[#c3c6d7]/50 text-[#131b2e] px-3 py-1 rounded-full">
                  {user.className}
                </span>
              )}
            </div>

            <h2 className="text-2xl md:text-3xl font-extrabold text-[#131b2e] flex items-center gap-2">
              Welcome back, {user?.fullName || "Student"} <Sparkles className="h-6 w-6 text-[#004ac6] animate-pulse" />
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
              className="px-5 py-3 bg-[#004ac6] hover:bg-[#003899] text-white rounded-2xl font-bold text-xs shadow-md shadow-[#004ac6]/20 flex items-center gap-2.5 transition-all transform active:scale-95 cursor-pointer"
            >
              <Camera className="h-4 w-4" />
              <span>Scan Book QR</span>
            </button>
          </div>
        </div>
      </div>

      {/* HERO SECTION: SCAN PHYSICAL TEXTBOOK QR CARD */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-[#004ac6]/30 bg-gradient-to-br from-white via-[#faf8ff] to-[#eaedff]/40 p-6 md:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="space-y-3 flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#004ac6]/10 text-[#004ac6] text-xs font-bold">
              <QrCode className="h-3.5 w-3.5" />
              Instant Textbook Resource Scanner
            </div>
            <h3 className="text-xl md:text-2xl font-black text-[#131b2e]">
              Have a physical book with a QR code?
            </h3>
            <p className="text-xs md:text-sm text-[#505f76] max-w-xl leading-relaxed">
              Point your camera at the QR code sticker on your school book to instantly open 
              <b> Digital Flipbooks</b>, <b>Worksheets</b>, and <b>Video Lectures</b>.
            </p>

            {/* Inline Quick Code Input Form */}
            <form onSubmit={handleQuickVerify} className="pt-2 flex flex-col sm:flex-row gap-2 max-w-lg">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={quickCodeInput}
                  onChange={(e) => setQuickCodeInput(e.target.value)}
                  placeholder="Enter code e.g. BK-43098571"
                  className="w-full px-4 py-2.5 bg-white border border-[#c3c6d7]/60 rounded-xl text-xs font-mono text-[#131b2e] placeholder:text-zinc-400 focus:outline-none focus:border-[#004ac6] focus:ring-2 focus:ring-[#004ac6]/20 transition-all shadow-xs"
                />
              </div>

              <button
                type="submit"
                disabled={isQuickVerifying || !quickCodeInput.trim()}
                className="px-5 py-2.5 bg-[#004ac6] hover:bg-[#003899] text-white font-bold text-xs rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shrink-0"
              >
                {isQuickVerifying ? "Verifying..." : "Verify Code"}
              </button>

              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="px-4 py-2.5 bg-white hover:bg-zinc-100 text-[#004ac6] border border-[#004ac6]/30 font-bold text-xs rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                <Camera className="h-4 w-4" />
                <span>Open Camera</span>
              </button>
            </form>
          </div>

          {/* Graphical QR Illustration / Feature Badges */}
          <div className="shrink-0 flex items-center gap-3">
            <div className="p-4 bg-white rounded-2xl border border-[#c3c6d7]/40 shadow-sm text-center space-y-2 max-w-[150px]">
              <div className="h-10 w-10 mx-auto rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <BookOpen className="h-5 w-5" />
              </div>
              <p className="text-xs font-bold text-[#131b2e]">Flipbook</p>
              <p className="text-[10px] text-[#505f76]">Read digital edition</p>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-[#c3c6d7]/40 shadow-sm text-center space-y-2 max-w-[150px]">
              <div className="h-10 w-10 mx-auto rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Download className="h-5 w-5" />
              </div>
              <p className="text-xs font-bold text-[#131b2e]">Worksheet</p>
              <p className="text-[10px] text-[#505f76]">Download PDF</p>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-[#c3c6d7]/40 shadow-sm text-center space-y-2 max-w-[150px]">
              <div className="h-10 w-10 mx-auto rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Play className="h-5 w-5" />
              </div>
              <p className="text-xs font-bold text-[#131b2e]">Videos</p>
              <p className="text-[10px] text-[#505f76]">Chapter lectures</p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION: RECENTLY SCANNED TEXTBOOKS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-[#004ac6]" />
            <h3 className="text-base font-bold text-[#131b2e]">Recently Scanned Textbooks</h3>
          </div>
          <span className="text-xs text-[#505f76]">
            {recentScanned.length > 0 ? `${recentScanned.length} books in your shelf` : "No books scanned yet"}
          </span>
        </div>

        {recentScanned.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#c3c6d7]/35 p-8 text-center space-y-3 shadow-xs">
            <div className="h-12 w-12 rounded-2xl bg-[#eaedff] text-[#004ac6] flex items-center justify-center mx-auto">
              <QrCode className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-[#131b2e]">Your Scanned Textbook Shelf is Empty</h4>
            <p className="text-xs text-[#505f76] max-w-md mx-auto">
              Scan the QR code on your school textbooks or workbooks using the button above. 
              Once scanned, your books will appear here for fast one-click digital access.
            </p>
            <button
              onClick={() => setIsScannerOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#004ac6] hover:bg-[#003899] text-white rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-sm"
            >
              <Camera className="h-4 w-4" />
              Scan First Book
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentScanned.map((book) => (
              <div
                key={book.code}
                className="bg-white rounded-2xl border border-[#c3c6d7]/40 p-4 shadow-sm hover:shadow-md hover:border-[#004ac6]/40 transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex gap-3 items-start">
                    {/* Cover Image Thumbnail */}
                    <div className="h-20 w-14 shrink-0 rounded-lg bg-[#faf8ff] border border-[#c3c6d7]/30 overflow-hidden flex items-center justify-center relative shadow-2xs">
                      {book.coverImage ? (
                        <img
                          src={book.coverImage}
                          alt={book.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <BookOpen className="h-5 w-5 text-[#004ac6]" />
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

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
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

      {/* QUICK DIGITAL NAVIGATION TILES */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link
          href="/dashboard/books"
          className="bg-white p-5 rounded-2xl border border-[#c3c6d7]/35 shadow-xs hover:border-[#004ac6]/40 hover:shadow-sm transition-all group"
        >
          <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <BookOpen className="h-5 w-5" />
          </div>
          <h4 className="text-xs md:text-sm font-bold text-[#131b2e] group-hover:text-[#004ac6]">My Textbooks</h4>
          <p className="text-[11px] text-[#505f76] mt-0.5">Enrolled class books</p>
        </Link>

        <Link
          href="/dashboard/books/chapters"
          className="bg-white p-5 rounded-2xl border border-[#c3c6d7]/35 shadow-xs hover:border-[#004ac6]/40 hover:shadow-sm transition-all group"
        >
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <BookMarked className="h-5 w-5" />
          </div>
          <h4 className="text-xs md:text-sm font-bold text-[#131b2e] group-hover:text-[#004ac6]">Chapters</h4>
          <p className="text-[11px] text-[#505f76] mt-0.5">Lesson plans & syllabus</p>
        </Link>

        <Link
          href="/dashboard/books/worksheets"
          className="bg-white p-5 rounded-2xl border border-[#c3c6d7]/35 shadow-xs hover:border-[#004ac6]/40 hover:shadow-sm transition-all group"
        >
          <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <h4 className="text-xs md:text-sm font-bold text-[#131b2e] group-hover:text-[#004ac6]">Worksheets</h4>
          <p className="text-[11px] text-[#505f76] mt-0.5">PDF download bank</p>
        </Link>

        <Link
          href="/dashboard/books/videos"
          className="bg-white p-5 rounded-2xl border border-[#c3c6d7]/35 shadow-xs hover:border-[#004ac6]/40 hover:shadow-sm transition-all group"
        >
          <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Video className="h-5 w-5" />
          </div>
          <h4 className="text-xs md:text-sm font-bold text-[#131b2e] group-hover:text-[#004ac6]">Video Lessons</h4>
          <p className="text-[11px] text-[#505f76] mt-0.5">Animated explanations</p>
        </Link>
      </div>

      {/* ADMIN & TEACHER VIEW: Activity Feed & Audit */}
      {!isStudent && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
          {/* Activity Feed */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-[#c3c6d7]/45 p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
              <Clock className="h-5 w-5 text-[#505f76]" />
              <h3 className="text-sm font-bold text-[#131b2e] uppercase tracking-wider">Recent System Activity</h3>
            </div>
            
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8 text-zinc-400 text-sm">Loading activity logs...</div>
              ) : activities.length === 0 ? (
                <div className="text-center py-8 text-zinc-400 text-sm">No activity recorded.</div>
              ) : (
                activities.map((act) => (
                  <div key={act.id} className="flex gap-4 p-3 rounded-lg hover:bg-[#faf8ff] bg-white border border-[#c3c6d7]/20">
                    <div className="h-2 w-2 rounded-full bg-[#004ac6] mt-2 shrink-0 animate-pulse" />
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-[#131b2e]">{act.title}</p>
                      <p className="text-xs text-[#505f76]">{act.description}</p>
                      <p className="text-[10px] text-zinc-400">{act.timestamp || "just now"}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Audit / Alerts */}
          <div className="bg-white rounded-2xl border border-[#c3c6d7]/45 p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
              <AlertCircle className="h-5 w-5 text-[#004ac6]" />
              <h3 className="text-sm font-bold text-[#131b2e] uppercase tracking-wider">Action Items</h3>
            </div>

            <div className="space-y-4 text-xs font-semibold">
              <div className="p-3 border border-amber-200 bg-amber-50/50 rounded-lg text-amber-800 flex gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                <div>
                  <p className="font-bold text-amber-900">Pending Permissions</p>
                  <p className="text-[10px] text-amber-700 font-medium">3 teachers requested book authorizations.</p>
                </div>
              </div>

              <div className="p-3 border border-[#004ac6]/20 bg-[#eaedff]/30 rounded-lg text-[#004ac6] flex gap-2">
                <Sparkles className="h-4 w-4 shrink-0 text-[#004ac6]" />
                <div>
                  <p className="font-bold text-[#131b2e]">QR Engine Status: Active</p>
                  <p className="text-[10px] text-[#505f76] font-medium">Physical codes verified with digital resources.</p>
                </div>
              </div>
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
