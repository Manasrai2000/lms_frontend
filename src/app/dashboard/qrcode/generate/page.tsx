"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  QrCode,
  Search,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Download,
  Printer,
  Copy,
  Check,
  ChevronLeft,
  Loader2,
  Sparkles,
  RefreshCw,
  Video,
  Play,
  Layers,
  Film,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import qrApi from "@/lib/api/qrcode";
import { QRCodeItem } from "@/types/qrcode";

interface BookOption {
  id: number | string;
  title: string;
  class?: string;
  subject?: string;
  language?: string;
  coverImage?: string | null;
  description?: string | null;
}

interface ChapterOption {
  id: number | string;
  title: string;
  chapterNumber?: number | string;
}

interface VideoOption {
  id: number | string;
  title: string;
  videoUrl: string;
  duration?: string | null;
  chapterId?: number | string | null;
  chapterTitle?: string | null;
  thumbnailUrl?: string | null;
}

export default function GenerateQRPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialBookId = searchParams.get("bookId");

  // Tab Switcher State: BOOK | VIDEO
  const [activeTab, setActiveTab] = useState<"BOOK" | "VIDEO">("BOOK");

  // Books catalog
  const [booksList, setBooksList] = useState<BookOption[]>([]);
  const [isLoadingBooks, setIsLoadingBooks] = useState<boolean>(true);
  const [bookQuery, setBookQuery] = useState<string>("");

  // Selected book state
  const [selectedBook, setSelectedBook] = useState<BookOption | null>(null);

  // Video Tab States
  const [selectedVideoBook, setSelectedVideoBook] = useState<BookOption | null>(null);
  const [videoBookQuery, setVideoBookQuery] = useState<string>("");
  const [chaptersList, setChaptersList] = useState<ChapterOption[]>([]);
  const [isLoadingChapters, setIsLoadingChapters] = useState<boolean>(false);
  const [selectedChapterId, setSelectedChapterId] = useState<string>("all");
  const [videosList, setVideosList] = useState<VideoOption[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState<boolean>(false);
  const [videoSearchQuery, setVideoSearchQuery] = useState<string>("");
  const [selectedVideo, setSelectedVideo] = useState<VideoOption | null>(null);

  // Active QR check state
  const [isCheckingActive, setIsCheckingActive] = useState<boolean>(false);
  const [existingActiveQr, setExistingActiveQr] = useState<QRCodeItem | null>(null);

  // Generation state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedResult, setGeneratedResult] = useState<QRCodeItem | null>(null);

  // Copy URL state tracker
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Fetch books catalog
  const fetchBooks = useCallback(async () => {
    try {
      setIsLoadingBooks(true);
      const res = await api.get("/books", { params: { limit: 200 } }).catch(() =>
        api.get("/api/v1/books", { params: { limit: 200 } })
      );
      const arr = res.data?.data || (Array.isArray(res.data) ? res.data : []);
      const formatted: BookOption[] = arr.map((b: any) => ({
        id: b.id ?? b._id,
        title: b.title || "Untitled Book",
        class: b.class || b.className || "",
        subject: b.subject || b.subjectName || "",
        language: b.language || b.languageName || "",
        coverImage: b.coverImage || null,
        description: b.description || null,
      }));

      setBooksList(formatted);

      // Pre-select if URL query param provided
      if (initialBookId) {
        const match = formatted.find((b) => String(b.id) === String(initialBookId));
        if (match) {
          setSelectedBook(match);
          setSelectedVideoBook(match);
        }
      }
    } catch (err) {
      console.error("Failed to load books:", err);
      toast.error("Failed to load books list");
    } finally {
      setIsLoadingBooks(false);
    }
  }, [initialBookId]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  // Load chapters & videos when video book changes
  useEffect(() => {
    const currentBook = selectedVideoBook;
    if (!currentBook) {
      setChaptersList([]);
      setVideosList([]);
      setSelectedVideo(null);
      return;
    }

    const targetBookId = currentBook.id;

    async function loadChaptersAndVideos() {
      try {
        setIsLoadingChapters(true);
        setIsLoadingVideos(true);
        setSelectedVideo(null);
        setSelectedChapterId("all");

        // Fetch chapters
        const chRes = await api.get("/v1/chapters", { params: { bookId: targetBookId, limit: 200 } })
          .catch(() => api.get("/api/v1/chapters", { params: { bookId: targetBookId, limit: 200 } }))
          .catch(() => ({ data: [] }));
        
        const chArr = chRes.data?.data || (Array.isArray(chRes.data) ? chRes.data : []);
        setChaptersList(chArr.map((c: any) => ({
          id: c.id ?? c._id,
          title: c.title || `Chapter ${c.chapterNumber || ""}`,
          chapterNumber: c.chapterNumber,
        })));

        // Fetch videos
        const vidRes = await api.get("/v1/videos", { params: { bookId: targetBookId, limit: 200 } })
          .catch(() => api.get("/api/v1/videos", { params: { bookId: targetBookId, limit: 200 } }))
          .catch(() => ({ data: [] }));

        const vidArr = vidRes.data?.data || vidRes.data?.videos || (Array.isArray(vidRes.data) ? vidRes.data : []);
        setVideosList(vidArr.map((v: any) => ({
          id: v.id ?? v._id,
          title: v.title || "Untitled Video",
          videoUrl: v.videoUrl || "",
          duration: v.duration || null,
          chapterId: v.chapterId || null,
          chapterTitle: v.chapterTitle || null,
          thumbnailUrl: v.thumbnailUrl || null,
        })));
      } catch (err) {
        console.error("Error loading video relations:", err);
      } finally {
        setIsLoadingChapters(false);
        setIsLoadingVideos(false);
      }
    }

    loadChaptersAndVideos();
  }, [selectedVideoBook]);

  // Check existing active QR for selected Book
  useEffect(() => {
    if (activeTab !== "BOOK" || !selectedBook) {
      if (activeTab === "BOOK") {
        setExistingActiveQr(null);
        setGeneratedResult(null);
      }
      return;
    }

    async function checkActiveQR() {
      if (!selectedBook) return;
      try {
        setIsCheckingActive(true);
        setExistingActiveQr(null);
        setGeneratedResult(null);

        const res = await qrApi.getList({
          bookId: selectedBook.id,
          targetType: "BOOK",
          status: "ACTIVE",
          limit: 1,
        });

        if (res.data && res.data.length > 0) {
          setExistingActiveQr(res.data[0]);
        }
      } catch (err) {
        console.error("Active QR check failed:", err);
      } finally {
        setIsCheckingActive(false);
      }
    }

    checkActiveQR();
  }, [selectedBook, activeTab]);

  // Check existing active QR for selected Video
  useEffect(() => {
    if (activeTab !== "VIDEO" || !selectedVideo) {
      if (activeTab === "VIDEO") {
        setExistingActiveQr(null);
        setGeneratedResult(null);
      }
      return;
    }

    async function checkActiveVideoQR() {
      if (!selectedVideo) return;
      try {
        setIsCheckingActive(true);
        setExistingActiveQr(null);
        setGeneratedResult(null);

        const res = await qrApi.getList({
          videoId: selectedVideo.id,
          targetType: "VIDEO",
          status: "ACTIVE",
          limit: 1,
        });

        if (res.data && res.data.length > 0) {
          setExistingActiveQr(res.data[0]);
        }
      } catch (err) {
        console.error("Active video QR check failed:", err);
      } finally {
        setIsCheckingActive(false);
      }
    }

    checkActiveVideoQR();
  }, [selectedVideo, activeTab]);

  // Handle Book QR Generation Action
  const handleGenerateBookQR = async () => {
    if (!selectedBook) return;
    try {
      setIsGenerating(true);
      const res = await qrApi.generateForBook(selectedBook.id);
      const dataItem: QRCodeItem = res.data || res;
      setGeneratedResult(dataItem);
      toast.success(`Book QR Code ${dataItem.code || ""} generated successfully!`);
    } catch (err: any) {
      console.error("Generation error:", err);
      toast.error(err?.response?.data?.message || "Failed to generate Book QR code");
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Video QR Generation Action
  const handleGenerateVideoQR = async () => {
    if (!selectedVideo) return;
    try {
      setIsGenerating(true);
      const res = await qrApi.generateForVideo(selectedVideo.id);
      const dataItem: QRCodeItem = res.data || res;
      setGeneratedResult(dataItem);
      toast.success(`Video QR Code ${dataItem.code || ""} generated successfully!`);
    } catch (err: any) {
      console.error("Generation error:", err);
      toast.error(err?.response?.data?.message || "Failed to generate Video QR code");
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy Public Link Helper
  const handleCopyLink = (code: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const publicUrl = `${origin}/q/${code}`;
    navigator.clipboard.writeText(publicUrl);
    setIsCopied(true);
    toast.success("Public scanner link copied to clipboard!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Print Label Handler
  const handlePrintLabel = (item: QRCodeItem) => {
    const imageUrl = qrApi.getImageUrl(item.id, "png");
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups to print QR label");
      return;
    }

    const titleText = activeTab === "BOOK"
      ? (selectedBook?.title || item.book?.title || "Textbook")
      : (selectedVideo?.title || item.video?.title || "Video Lesson");

    const metaText = activeTab === "BOOK"
      ? `${selectedBook?.class || ""} • ${selectedBook?.subject || ""}`
      : `Video QR • ${selectedVideoBook?.title || ""}`;

    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Label - ${item.code}</title>
          <style>
            body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .label-card { border: 2px solid #333; border-radius: 12px; padding: 16px; text-align: center; width: 220px; }
            .qr-img { width: 160px; height: 160px; margin: 0 auto 8px; display: block; }
            .code-text { font-family: monospace; font-size: 14px; font-weight: bold; margin-bottom: 4px; }
            .book-title { font-size: 11px; font-weight: bold; color: #222; margin-bottom: 2px; }
            .meta-text { font-size: 9px; color: #666; }
          </style>
        </head>
        <body>
          <div class="label-card">
            <img class="qr-img" src="${imageUrl}" alt="${item.code}" />
            <div class="code-text">${item.code}</div>
            <div class="book-title">${titleText}</div>
            <div class="meta-text">${metaText}</div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Filtered books list for Book Tab
  const filteredBooks = booksList.filter((b) => {
    const q = bookQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      b.title.toLowerCase().includes(q) ||
      (b.class && b.class.toLowerCase().includes(q)) ||
      (b.subject && b.subject.toLowerCase().includes(q))
    );
  });

  // Filtered books list for Video Tab
  const filteredVideoBooks = booksList.filter((b) => {
    const q = videoBookQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      b.title.toLowerCase().includes(q) ||
      (b.class && b.class.toLowerCase().includes(q)) ||
      (b.subject && b.subject.toLowerCase().includes(q))
    );
  });

  // Filtered videos list for Video Tab
  const filteredVideos = videosList.filter((v) => {
    if (selectedChapterId !== "all" && String(v.chapterId) !== String(selectedChapterId)) {
      return false;
    }
    const q = videoSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return v.title.toLowerCase().includes(q);
  });

  const activeTargetItem = activeTab === "BOOK" ? selectedBook : selectedVideo;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-[#c3c6d7]/30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#004ac6]/10 text-[#004ac6]">
            <QrCode className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#131b2e]">Generate Single QR Code</h1>
            <p className="text-xs text-[#505f76] mt-0.5">
              Generate a unique cryptographic QR code for a <b>Textbook</b> or direct <b>Video Lesson</b>
            </p>
          </div>
        </div>

        <Link href="/dashboard/qrcode">
          <Button
            variant="outline"
            className="border-[#c3c6d7] text-[#131b2e] hover:bg-[#eaedff]/50 gap-2 font-semibold text-xs h-9 cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to List
          </Button>
        </Link>
      </div>

      {/* Target Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-[#c3c6d7]/30 pb-2">
        <button
          type="button"
          onClick={() => {
            setActiveTab("BOOK");
            setGeneratedResult(null);
          }}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "BOOK"
              ? "bg-[#004ac6] text-white shadow-xs"
              : "bg-white text-[#505f76] hover:bg-[#eaedff] hover:text-[#004ac6] border border-[#c3c6d7]/30"
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>Book QR (`BK-XXXXXXXX`)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("VIDEO");
            setGeneratedResult(null);
          }}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "VIDEO"
              ? "bg-[#004ac6] text-white shadow-xs"
              : "bg-white text-[#505f76] hover:bg-[#eaedff] hover:text-[#004ac6] border border-[#c3c6d7]/30"
          }`}
        >
          <Video className="h-4 w-4" />
          <span>Video QR (`VD-XXXXXXXX`)</span>
        </button>
      </div>

      {/* Main Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Selectors */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-[#c3c6d7]/30 shadow-sm space-y-4">
          {/* TAB 1: BOOK SELECTOR */}
          {activeTab === "BOOK" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-bold text-[#131b2e]">Select Textbook</h2>
                <p className="text-xs text-[#505f76] mt-0.5">
                  Choose the book for which you want to generate a new QR code sticker.
                </p>
              </div>

              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search by book title, class, or subject..."
                  value={bookQuery}
                  onChange={(e) => setBookQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-xs border border-[#c3c6d7] rounded-xl focus:outline-none focus:border-[#004ac6] bg-[#faf8ff]"
                />
              </div>

              {/* Book Catalog List */}
              {isLoadingBooks ? (
                <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-[#004ac6]" />
                  <p className="text-xs text-[#505f76]">Loading textbook catalog...</p>
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto border border-[#c3c6d7]/40 rounded-xl divide-y divide-[#c3c6d7]/20 custom-scrollbar">
                  {filteredBooks.length === 0 ? (
                    <div className="p-4 text-center text-xs text-[#505f76]">
                      No matching books found.
                    </div>
                  ) : (
                    filteredBooks.map((b) => {
                      const isSelected = selectedBook?.id === b.id;
                      return (
                        <div
                          key={b.id}
                          onClick={() => setSelectedBook(b)}
                          className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-[#eaedff] border-l-4 border-l-[#004ac6]"
                              : "hover:bg-[#faf8ff]"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-[#004ac6]/10 text-[#004ac6] flex items-center justify-center font-bold text-xs shrink-0">
                              <BookOpen className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-[#131b2e]">{b.title}</p>
                              <p className="text-[11px] text-[#505f76] mt-0.5">
                                {b.class && <span>{b.class} • </span>}
                                {b.subject && <span>{b.subject}</span>}
                              </p>
                            </div>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="h-4 w-4 text-[#004ac6] shrink-0" />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: VIDEO SELECTOR (Book -> Chapter -> Video) */}
          {activeTab === "VIDEO" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-bold text-[#131b2e]">Select Video Lesson</h2>
                <p className="text-xs text-[#505f76] mt-0.5">
                  Select a textbook, optionally filter by chapter, and pick the video to generate a QR for.
                </p>
              </div>

              {/* Step 1: Select Book */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#131b2e] flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5 text-[#004ac6]" /> 1. Select Textbook:
                </label>
                <select
                  value={selectedVideoBook?.id ? String(selectedVideoBook.id) : ""}
                  onChange={(e) => {
                    const match = booksList.find((b) => String(b.id) === e.target.value);
                    setSelectedVideoBook(match || null);
                  }}
                  className="w-full p-2.5 text-xs bg-[#faf8ff] border border-[#c3c6d7] rounded-xl focus:outline-none focus:border-[#004ac6] font-semibold text-[#131b2e] cursor-pointer"
                >
                  <option value="">-- Choose Book --</option>
                  {booksList.map((b) => (
                    <option key={b.id} value={String(b.id)}>
                      {b.title} {b.class ? `(${b.class})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Filter by Chapter */}
              {selectedVideoBook && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#131b2e] flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5 text-emerald-600" /> 2. Chapter (Optional filter):
                  </label>
                  <select
                    value={selectedChapterId}
                    onChange={(e) => setSelectedChapterId(e.target.value)}
                    className="w-full p-2.5 text-xs bg-[#faf8ff] border border-[#c3c6d7] rounded-xl focus:outline-none focus:border-[#004ac6] font-semibold text-[#131b2e] cursor-pointer"
                  >
                    <option value="all">All Chapters</option>
                    {chaptersList.map((ch) => (
                      <option key={ch.id} value={String(ch.id)}>
                        {ch.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Step 3: Video List */}
              {selectedVideoBook && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#131b2e] flex items-center gap-1">
                      <Film className="h-3.5 w-3.5 text-rose-600" /> 3. Select Video:
                    </label>
                    <span className="text-[10px] text-[#505f76]">{filteredVideos.length} videos available</span>
                  </div>

                  {isLoadingVideos ? (
                    <div className="p-6 text-center text-xs text-[#505f76]">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-[#004ac6] mb-1" />
                      Loading videos...
                    </div>
                  ) : filteredVideos.length === 0 ? (
                    <div className="p-6 text-center text-xs text-[#505f76] border border-dashed rounded-xl bg-zinc-50">
                      No video lectures found for this selection.
                    </div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto border border-[#c3c6d7]/40 rounded-xl divide-y divide-[#c3c6d7]/20 custom-scrollbar">
                      {filteredVideos.map((vid) => {
                        const isSelected = selectedVideo?.id === vid.id;
                        return (
                          <div
                            key={vid.id}
                            onClick={() => setSelectedVideo(vid)}
                            className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-rose-50/60 border-l-4 border-l-rose-600"
                                : "hover:bg-[#faf8ff]"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                                <Play className="h-4 w-4 fill-current" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-[#131b2e]">{vid.title}</p>
                                {vid.duration && (
                                  <p className="text-[10px] text-[#505f76] mt-0.5">Duration: {vid.duration}</p>
                                )}
                              </div>
                            </div>
                            {isSelected && (
                              <CheckCircle2 className="h-4 w-4 text-rose-600 shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Preview & Generator Action */}
        <div className="lg:col-span-5 space-y-4">
          {/* Target Selected Summary Card */}
          {activeTab === "BOOK" && selectedBook && (
            <div className="bg-white p-5 rounded-2xl border border-[#c3c6d7]/30 shadow-sm space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#004ac6] bg-[#eaedff] px-2 py-0.5 rounded-full">
                Selected Book
              </span>
              <div>
                <h3 className="text-sm font-bold text-[#131b2e]">{selectedBook.title}</h3>
                <p className="text-xs text-[#505f76] mt-0.5">
                  {selectedBook.class} • {selectedBook.subject}
                </p>
              </div>

              {/* Active QR Warning / Notice */}
              {isCheckingActive ? (
                <div className="flex items-center gap-2 text-xs text-[#505f76] py-1">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Checking existing active QR code...
                </div>
              ) : existingActiveQr ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-amber-800">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>Already has an Active QR Code!</span>
                  </div>
                  <p className="text-[11px] text-amber-700">
                    This book is already mapped to:{" "}
                    <b className="font-mono text-amber-900">{existingActiveQr.code}</b>
                  </p>
                </div>
              ) : (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>No active QR sticker linked. Ready to generate!</span>
                </div>
              )}

              {/* Generation Button */}
              <button
                type="button"
                onClick={handleGenerateBookQR}
                disabled={isGenerating}
                className="w-full py-3 bg-[#004ac6] hover:bg-[#003899] text-white rounded-xl font-bold text-xs shadow-md shadow-[#004ac6]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Generating Book QR...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Generate Book QR Code</span>
                  </>
                )}
              </button>
            </div>
          )}

          {activeTab === "VIDEO" && selectedVideo && (
            <div className="bg-white p-5 rounded-2xl border border-[#c3c6d7]/30 shadow-sm space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                Selected Video
              </span>
              <div>
                <h3 className="text-sm font-bold text-[#131b2e]">{selectedVideo.title}</h3>
                <p className="text-xs text-[#505f76] mt-0.5 truncate">
                  {selectedVideoBook?.title}
                </p>
              </div>

              {/* Active Video QR Warning */}
              {isCheckingActive ? (
                <div className="flex items-center gap-2 text-xs text-[#505f76] py-1">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Checking existing active QR code...
                </div>
              ) : existingActiveQr ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-amber-800">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>Already has an Active Video QR!</span>
                  </div>
                  <p className="text-[11px] text-amber-700">
                    Mapped code: <b className="font-mono text-amber-900">{existingActiveQr.code}</b>
                  </p>
                </div>
              ) : (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Ready to generate Video QR Code!</span>
                </div>
              )}

              {/* Generation Button */}
              <button
                type="button"
                onClick={handleGenerateVideoQR}
                disabled={isGenerating}
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Generating Video QR...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Generate Video QR Code</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Generated Result Showcase Card */}
          {generatedResult && (
            <div className="bg-white p-6 rounded-2xl border-2 border-emerald-400/80 shadow-md space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                    QR Generated Successfully!
                  </span>
                </div>
                <span className="font-mono text-xs font-bold bg-[#eaedff] text-[#004ac6] px-2 py-0.5 rounded">
                  {generatedResult.code}
                </span>
              </div>

              {/* QR Image Preview */}
              <div className="flex flex-col items-center justify-center p-4 bg-[#faf8ff] rounded-xl border border-[#c3c6d7]/30">
                <img
                  src={qrApi.getImageUrl(generatedResult.id, "png")}
                  alt={generatedResult.code}
                  className="h-40 w-40 object-contain shadow-xs bg-white p-2 rounded-lg"
                />
                <p className="font-mono text-xs font-black text-[#131b2e] mt-2">
                  {generatedResult.code}
                </p>
                <p className="text-[10px] text-[#505f76] mt-0.5 text-center">
                  Target: <b>{generatedResult.targetType || activeTab}</b>
                </p>
              </div>

              {/* Download & Print Actions */}
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={qrApi.getImageUrl(generatedResult.id, "png", true)}
                  download={`${generatedResult.code}.png`}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>PNG</span>
                </a>

                <a
                  href={qrApi.getImageUrl(generatedResult.id, "svg", true)}
                  download={`${generatedResult.code}.svg`}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>SVG</span>
                </a>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handlePrintLabel(generatedResult)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-[#c3c6d7] hover:bg-[#eaedff]/30 text-[#131b2e] rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print Label</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyLink(generatedResult.code)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-[#004ac6] hover:bg-[#003899] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{isCopied ? "Copied!" : "Copy Link"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
