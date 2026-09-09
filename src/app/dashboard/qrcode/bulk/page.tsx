"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Layers,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  BookOpen,
  ChevronLeft,
  Loader2,
  RefreshCw,
  X,
  Sparkles,
  Check,
  Video,
  Play,
  Film,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import qrApi from "@/lib/api/qrcode";
import { BulkQRResultItem } from "@/types/qrcode";

interface BookCatalogItem {
  id: number;
  title: string;
  class?: string;
  subject?: string;
  language?: string;
  hasActiveQr?: boolean;
  activeQrCode?: string;
}

interface VideoCatalogItem {
  id: number;
  title: string;
  duration?: string | null;
  chapterId?: number | string | null;
  chapterTitle?: string | null;
  hasActiveQr?: boolean;
  activeQrCode?: string;
}

interface FilterOption {
  id: number | string;
  name: string;
}

export default function BulkGenerateQRPage() {
  const router = useRouter();

  // Top Tab Switcher: BOOKS | VIDEOS
  const [activeTab, setActiveTab] = useState<"BOOKS" | "VIDEOS">("BOOKS");

  // Books list & state
  const [books, setBooks] = useState<BookCatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Master Filter Options
  const [classesList, setClassesList] = useState<FilterOption[]>([]);
  const [subjectsList, setSubjectsList] = useState<FilterOption[]>([]);
  const [languagesList, setLanguagesList] = useState<FilterOption[]>([]);

  // Filter selections (Books)
  const [selectedClassId, setSelectedClassId] = useState<string>("all");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("all");
  const [selectedLanguageId, setSelectedLanguageId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [onlyUnmapped, setOnlyUnmapped] = useState<boolean>(false);

  // Multi-selection state (Books)
  const [selectedBookIds, setSelectedBookIds] = useState<number[]>([]);

  // Video Tab States
  const [selectedVideoBookId, setSelectedVideoBookId] = useState<string>("");
  const [videosList, setVideosList] = useState<VideoCatalogItem[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState<boolean>(false);
  const [videoSearchQuery, setVideoSearchQuery] = useState<string>("");
  const [onlyUnmappedVideos, setOnlyUnmappedVideos] = useState<boolean>(false);
  const [selectedVideoIds, setSelectedVideoIds] = useState<number[]>([]);

  // Batch progress & execution state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [bulkResults, setBulkResults] = useState<{
    totalRequested: number;
    generated: number;
    skipped: number;
    failed: number;
    results: BulkQRResultItem[];
  } | null>(null);

  // 1. Fetch filter options master data
  useEffect(() => {
    async function loadMasterData() {
      try {
        const [classRes, subRes, langRes] = await Promise.allSettled([
          api.get("/classes", { params: { limit: 100 } }).catch(() => api.get("/api/v1/classes", { params: { limit: 100 } })),
          api.get("/subjects", { params: { limit: 100 } }).catch(() => api.get("/api/v1/subjects", { params: { limit: 100 } })),
          api.get("/languages", { params: { limit: 100 } }).catch(() => api.get("/api/v1/languages", { params: { limit: 100 } })),
        ]);

        if (classRes.status === "fulfilled" && classRes.value?.data) {
          const arr = classRes.value.data.data || (Array.isArray(classRes.value.data) ? classRes.value.data : []);
          setClassesList(arr.map((c: any) => ({ id: c.id ?? c._id, name: c.name || "Class" })));
        }
        if (subRes.status === "fulfilled" && subRes.value?.data) {
          const arr = subRes.value.data.data || (Array.isArray(subRes.value.data) ? subRes.value.data : []);
          setSubjectsList(arr.map((s: any) => ({ id: s.id ?? s._id, name: s.name || "Subject" })));
        }
        if (langRes.status === "fulfilled" && langRes.value?.data) {
          const arr = langRes.value.data.data || (Array.isArray(langRes.value.data) ? langRes.value.data : []);
          setLanguagesList(arr.map((l: any) => ({ id: l.id ?? l._id, name: l.name || "Language" })));
        }
      } catch (err) {
        console.error("Failed to load master filters:", err);
      }
    }
    loadMasterData();
  }, []);

  // 2. Fetch Books Catalog with active QR status
  const fetchCatalogBooks = useCallback(
    async (showToast = false) => {
      try {
        if (showToast) setIsRefreshing(true);
        else setIsLoading(true);

        const params: any = { limit: 300 };
        if (selectedClassId !== "all") params.classId = selectedClassId;
        if (selectedSubjectId !== "all") params.subjectId = selectedSubjectId;
        if (selectedLanguageId !== "all") params.languageId = selectedLanguageId;
        if (searchQuery.trim()) params.search = searchQuery.trim();

        const [booksRes, qrRes] = await Promise.allSettled([
          api.get("/books", { params }).catch(() => api.get("/api/v1/books", { params })),
          qrApi.getList({ limit: 500, targetType: "BOOK", status: "ACTIVE" }),
        ]);

        let bookData: any[] = [];
        if (booksRes.status === "fulfilled" && booksRes.value?.data) {
          bookData = booksRes.value.data.data || (Array.isArray(booksRes.value.data) ? booksRes.value.data : []);
        }

        let activeQrs: any[] = [];
        if (qrRes.status === "fulfilled" && qrRes.value?.data) {
          activeQrs = qrRes.value.data;
        }

        // Map active QR code status to books
        const mappedBooks: BookCatalogItem[] = bookData.map((b: any) => {
          const bId = Number(b.id ?? b._id);
          const activeQr = activeQrs.find((q: any) => Number(q.bookId) === bId);
          return {
            id: bId,
            title: b.title || "Untitled Book",
            class: b.class || b.className || "",
            subject: b.subject || b.subjectName || "",
            language: b.language || b.languageName || "",
            hasActiveQr: Boolean(activeQr),
            activeQrCode: activeQr?.code,
          };
        });

        setBooks(mappedBooks);
        if (showToast) toast.success("Catalog updated successfully!");
      } catch (err) {
        console.error("Failed to load catalog:", err);
        toast.error("Failed to fetch books catalog");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [selectedClassId, selectedSubjectId, selectedLanguageId, searchQuery]
  );

  useEffect(() => {
    fetchCatalogBooks();
  }, [fetchCatalogBooks]);

  // 3. Fetch Videos for selected book (in Videos tab)
  const fetchVideosForBook = useCallback(async (bookId: string) => {
    if (!bookId) {
      setVideosList([]);
      setSelectedVideoIds([]);
      return;
    }

    try {
      setIsLoadingVideos(true);
      setSelectedVideoIds([]);

      const [vidRes, qrRes] = await Promise.allSettled([
        api.get("/v1/videos", { params: { bookId, limit: 300 } })
          .catch(() => api.get("/api/v1/videos", { params: { bookId, limit: 300 } }))
          .catch(() => ({ data: [] })),
        qrApi.getList({ limit: 500, targetType: "VIDEO", status: "ACTIVE" }),
      ]);

      let rawVideos: any[] = [];
      if (vidRes.status === "fulfilled" && vidRes.value?.data) {
        rawVideos = vidRes.value.data.data || vidRes.value.data.videos || (Array.isArray(vidRes.value.data) ? vidRes.value.data : []);
      }

      let activeVideoQrs: any[] = [];
      if (qrRes.status === "fulfilled" && qrRes.value?.data) {
        activeVideoQrs = qrRes.value.data;
      }

      const mapped: VideoCatalogItem[] = rawVideos.map((v: any) => {
        const vId = Number(v.id ?? v._id);
        const matchQr = activeVideoQrs.find((q: any) => Number(q.videoId) === vId);
        return {
          id: vId,
          title: v.title || "Untitled Video",
          duration: v.duration || null,
          chapterId: v.chapterId || null,
          chapterTitle: v.chapterTitle || null,
          hasActiveQr: Boolean(matchQr),
          activeQrCode: matchQr?.code,
        };
      });

      setVideosList(mapped);
    } catch (err) {
      console.error("Failed to load videos for bulk:", err);
      toast.error("Failed to load videos for selected book");
    } finally {
      setIsLoadingVideos(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "VIDEOS" && selectedVideoBookId) {
      fetchVideosForBook(selectedVideoBookId);
    }
  }, [activeTab, selectedVideoBookId, fetchVideosForBook]);

  // Filter visible books
  const visibleBooks = books.filter((b) => {
    if (onlyUnmapped && b.hasActiveQr) return false;
    return true;
  });

  // Filter visible videos
  const visibleVideos = videosList.filter((v) => {
    if (onlyUnmappedVideos && v.hasActiveQr) return false;
    if (videoSearchQuery.trim()) {
      return v.title.toLowerCase().includes(videoSearchQuery.toLowerCase().trim());
    }
    return true;
  });

  // Toggle Single Book
  const toggleBookSelect = (id: number) => {
    setSelectedBookIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Select / Deselect All Books
  const toggleSelectAllBooks = () => {
    if (selectedBookIds.length === visibleBooks.length) {
      setSelectedBookIds([]);
    } else {
      setSelectedBookIds(visibleBooks.map((b) => b.id));
    }
  };

  // Toggle Single Video
  const toggleVideoSelect = (id: number) => {
    setSelectedVideoIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Select / Deselect All Videos
  const toggleSelectAllVideos = () => {
    if (selectedVideoIds.length === visibleVideos.length) {
      setSelectedVideoIds([]);
    } else {
      setSelectedVideoIds(visibleVideos.map((v) => v.id));
    }
  };

  // Execute Bulk Books Generation
  const handleRunBulkBooks = async () => {
    if (selectedBookIds.length === 0) {
      toast.error("Please select at least one book");
      return;
    }

    try {
      setIsProcessing(true);
      setBulkResults(null);

      const res = await qrApi.bulkGenerate(selectedBookIds);
      if (res.success && res.data) {
        setBulkResults(res.data);
        toast.success(`Generated ${res.data.generated} Book QRs (${res.data.skipped} skipped)`);
      } else {
        toast.error("Bulk generation returned unsuccessful");
      }
      fetchCatalogBooks();
    } catch (err: any) {
      console.error("Bulk generate error:", err);
      toast.error(err?.response?.data?.message || "Failed to execute bulk QR generation");
    } finally {
      setIsProcessing(false);
    }
  };

  // Execute Bulk Videos Generation
  const handleRunBulkVideos = async () => {
    if (selectedVideoIds.length === 0) {
      toast.error("Please select at least one video");
      return;
    }

    try {
      setIsProcessing(true);
      setBulkResults(null);

      const res = await qrApi.bulkGenerateVideos(selectedVideoIds);
      if (res.success && res.data) {
        setBulkResults(res.data);
        toast.success(`Generated ${res.data.generated} Video QRs (${res.data.skipped} skipped)`);
      } else {
        toast.error("Bulk video QR generation returned unsuccessful");
      }
      if (selectedVideoBookId) {
        fetchVideosForBook(selectedVideoBookId);
      }
    } catch (err: any) {
      console.error("Bulk video generation error:", err);
      toast.error(err?.response?.data?.message || "Failed to execute bulk Video QR generation");
    } finally {
      setIsProcessing(false);
    }
  };

  const isAllBooksSelected =
    visibleBooks.length > 0 && selectedBookIds.length === visibleBooks.length;

  const isAllVideosSelected =
    visibleVideos.length > 0 && selectedVideoIds.length === visibleVideos.length;

  return (
    <div className="space-y-6 pb-24">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#c3c6d7]/30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#131b2e]">Bulk QR Code Generator</h1>
            <p className="text-xs text-[#505f76] mt-0.5">
              Batch generate QR codes for multiple <b>Books</b> or <b>Video Lectures</b> with duplicate protection
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
            setActiveTab("BOOKS");
            setBulkResults(null);
          }}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "BOOKS"
              ? "bg-[#004ac6] text-white shadow-xs"
              : "bg-white text-[#505f76] hover:bg-[#eaedff] hover:text-[#004ac6] border border-[#c3c6d7]/30"
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>Bulk Books</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("VIDEOS");
            setBulkResults(null);
          }}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "VIDEOS"
              ? "bg-[#004ac6] text-white shadow-xs"
              : "bg-white text-[#505f76] hover:bg-[#eaedff] hover:text-[#004ac6] border border-[#c3c6d7]/30"
          }`}
        >
          <Video className="h-4 w-4" />
          <span>Bulk Videos</span>
        </button>
      </div>

      {/* TAB 1: BULK BOOKS WORKSPACE */}
      {activeTab === "BOOKS" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-[#c3c6d7]/30 shadow-sm space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {/* Class Filter */}
              <div>
                <label className="block text-[11px] font-bold text-[#505f76] mb-1">Class Filter</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full p-2 text-xs border border-[#c3c6d7] rounded-lg focus:outline-none focus:border-[#004ac6] bg-[#faf8ff] font-semibold text-[#131b2e]"
                >
                  <option value="all">All Classes</option>
                  {classesList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject Filter */}
              <div>
                <label className="block text-[11px] font-bold text-[#505f76] mb-1">Subject Filter</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full p-2 text-xs border border-[#c3c6d7] rounded-lg focus:outline-none focus:border-[#004ac6] bg-[#faf8ff] font-semibold text-[#131b2e]"
                >
                  <option value="all">All Subjects</option>
                  {subjectsList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Language Filter */}
              <div>
                <label className="block text-[11px] font-bold text-[#505f76] mb-1">Language Filter</label>
                <select
                  value={selectedLanguageId}
                  onChange={(e) => setSelectedLanguageId(e.target.value)}
                  className="w-full p-2 text-xs border border-[#c3c6d7] rounded-lg focus:outline-none focus:border-[#004ac6] bg-[#faf8ff] font-semibold text-[#131b2e]"
                >
                  <option value="all">All Languages</option>
                  {languagesList.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search input */}
              <div>
                <label className="block text-[11px] font-bold text-[#505f76] mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search titles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs border border-[#c3c6d7] rounded-lg focus:outline-none focus:border-[#004ac6] bg-[#faf8ff]"
                  />
                </div>
              </div>
            </div>

            {/* Sub-bar: only unmapped toggle & selection counts */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#c3c6d7]/30 text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-[#131b2e]">
                <input
                  type="checkbox"
                  checked={onlyUnmapped}
                  onChange={(e) => setOnlyUnmapped(e.target.checked)}
                  className="h-4 w-4 rounded text-[#004ac6] border-[#c3c6d7] focus:ring-[#004ac6]"
                />
                <span>Show only books WITHOUT active QR codes</span>
              </label>

              <div className="flex items-center gap-3">
                <span className="text-[#505f76] font-semibold">
                  Showing <b>{visibleBooks.length}</b> books ({selectedBookIds.length} selected)
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchCatalogBooks(true)}
                  disabled={isRefreshing || isLoading}
                  className="h-7 text-xs gap-1 text-[#004ac6] hover:bg-[#eaedff]"
                >
                  <RefreshCw className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          {/* Books Selectable Table */}
          <div className="bg-white rounded-2xl border border-[#c3c6d7]/30 shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-[#004ac6]" />
                <p className="text-xs font-semibold text-[#505f76]">Loading textbook catalog...</p>
              </div>
            ) : visibleBooks.length === 0 ? (
              <div className="p-12 text-center text-xs text-[#505f76]">
                No books match the filter criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#faf8ff] border-b border-[#c3c6d7]/30 text-[#505f76] font-semibold">
                      <th className="py-3 px-4 w-10">
                        <input
                          type="checkbox"
                          checked={isAllBooksSelected}
                          onChange={toggleSelectAllBooks}
                          className="h-4 w-4 rounded text-[#004ac6] border-[#c3c6d7] focus:ring-[#004ac6] cursor-pointer"
                        />
                      </th>
                      <th className="py-3 px-4">Textbook Title</th>
                      <th className="py-3 px-4">Class</th>
                      <th className="py-3 px-4">Subject</th>
                      <th className="py-3 px-4">Active QR Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#c3c6d7]/20 text-[#131b2e]">
                    {visibleBooks.map((b) => {
                      const isSelected = selectedBookIds.includes(b.id);
                      return (
                        <tr
                          key={b.id}
                          onClick={() => toggleBookSelect(b.id)}
                          className={`hover:bg-[#eaedff]/30 transition-colors cursor-pointer ${
                            isSelected ? "bg-[#eaedff]/50" : ""
                          }`}
                        >
                          <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleBookSelect(b.id)}
                              className="h-4 w-4 rounded text-[#004ac6] border-[#c3c6d7] focus:ring-[#004ac6] cursor-pointer"
                            />
                          </td>
                          <td className="py-3.5 px-4 font-bold text-[#131b2e]">
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-[#004ac6] shrink-0" />
                              <span>{b.title}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-[#505f76] font-semibold">{b.class || "—"}</td>
                          <td className="py-3.5 px-4 text-[#505f76] font-semibold">{b.subject || "—"}</td>
                          <td className="py-3.5 px-4">
                            {b.hasActiveQr ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                <CheckCircle2 className="h-3 w-3" />
                                Active: {b.activeQrCode}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                <AlertTriangle className="h-3 w-3" />
                                No QR
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: BULK VIDEOS WORKSPACE */}
      {activeTab === "VIDEOS" && (
        <div className="space-y-4">
          {/* Video Selector & Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-[#c3c6d7]/30 shadow-sm space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              {/* Select Book Dropdown */}
              <div className="sm:col-span-7">
                <label className="block text-[11px] font-bold text-[#505f76] mb-1">
                  1. Select Textbook to View Videos:
                </label>
                <select
                  value={selectedVideoBookId}
                  onChange={(e) => setSelectedVideoBookId(e.target.value)}
                  className="w-full p-2.5 text-xs border border-[#c3c6d7] rounded-lg focus:outline-none focus:border-[#004ac6] bg-[#faf8ff] font-semibold text-[#131b2e] cursor-pointer"
                >
                  <option value="">-- Choose a Textbook ({books.length} available) --</option>
                  {books.map((b) => (
                    <option key={b.id} value={String(b.id)}>
                      {b.title} {b.class ? `(${b.class})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Video Title Search */}
              <div className="sm:col-span-5">
                <label className="block text-[11px] font-bold text-[#505f76] mb-1">
                  2. Search Video Titles:
                </label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search videos..."
                    value={videoSearchQuery}
                    onChange={(e) => setVideoSearchQuery(e.target.value)}
                    disabled={!selectedVideoBookId}
                    className="w-full pl-8 pr-3 py-2 text-xs border border-[#c3c6d7] rounded-lg focus:outline-none focus:border-[#004ac6] bg-[#faf8ff] disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            {/* Sub-bar: only unmapped videos toggle & counts */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#c3c6d7]/30 text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-[#131b2e]">
                <input
                  type="checkbox"
                  checked={onlyUnmappedVideos}
                  onChange={(e) => setOnlyUnmappedVideos(e.target.checked)}
                  disabled={!selectedVideoBookId}
                  className="h-4 w-4 rounded text-[#004ac6] border-[#c3c6d7] focus:ring-[#004ac6]"
                />
                <span>Show only videos WITHOUT active QR codes</span>
              </label>

              <div className="flex items-center gap-3">
                <span className="text-[#505f76] font-semibold">
                  Showing <b>{visibleVideos.length}</b> videos ({selectedVideoIds.length} selected)
                </span>
                {selectedVideoBookId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fetchVideosForBook(selectedVideoBookId)}
                    disabled={isLoadingVideos}
                    className="h-7 text-xs gap-1 text-[#004ac6] hover:bg-[#eaedff]"
                  >
                    <RefreshCw className={`h-3 w-3 ${isLoadingVideos ? "animate-spin" : ""}`} />
                    Refresh Videos
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Videos Selectable Table */}
          <div className="bg-white rounded-2xl border border-[#c3c6d7]/30 shadow-sm overflow-hidden">
            {!selectedVideoBookId ? (
              <div className="p-12 text-center text-xs text-[#505f76] space-y-2">
                <BookOpen className="h-8 w-8 text-zinc-300 mx-auto" />
                <p className="font-bold text-[#131b2e]">Please select a textbook above</p>
                <p>Choose a textbook to display its video lectures for bulk QR generation.</p>
              </div>
            ) : isLoadingVideos ? (
              <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-[#004ac6]" />
                <p className="text-xs font-semibold text-[#505f76]">Loading videos for selected book...</p>
              </div>
            ) : visibleVideos.length === 0 ? (
              <div className="p-12 text-center text-xs text-[#505f76]">
                No videos found for this book matching criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#faf8ff] border-b border-[#c3c6d7]/30 text-[#505f76] font-semibold">
                      <th className="py-3 px-4 w-10">
                        <input
                          type="checkbox"
                          checked={isAllVideosSelected}
                          onChange={toggleSelectAllVideos}
                          className="h-4 w-4 rounded text-[#004ac6] border-[#c3c6d7] focus:ring-[#004ac6] cursor-pointer"
                        />
                      </th>
                      <th className="py-3 px-4">Video Title</th>
                      <th className="py-3 px-4">Chapter</th>
                      <th className="py-3 px-4">Duration</th>
                      <th className="py-3 px-4">Active QR Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#c3c6d7]/20 text-[#131b2e]">
                    {visibleVideos.map((v) => {
                      const isSelected = selectedVideoIds.includes(v.id);
                      return (
                        <tr
                          key={v.id}
                          onClick={() => toggleVideoSelect(v.id)}
                          className={`hover:bg-[#eaedff]/30 transition-colors cursor-pointer ${
                            isSelected ? "bg-rose-50/40" : ""
                          }`}
                        >
                          <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleVideoSelect(v.id)}
                              className="h-4 w-4 rounded text-rose-600 border-[#c3c6d7] focus:ring-rose-500 cursor-pointer"
                            />
                          </td>
                          <td className="py-3.5 px-4 font-bold text-[#131b2e]">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                                <Play className="h-3 w-3 fill-current" />
                              </div>
                              <span>{v.title}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-[#505f76] font-semibold">
                            {v.chapterTitle || "—"}
                          </td>
                          <td className="py-3.5 px-4 text-[#505f76] font-semibold">
                            {v.duration || "—"}
                          </td>
                          <td className="py-3.5 px-4">
                            {v.hasActiveQr ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                <CheckCircle2 className="h-3 w-3" />
                                Active: {v.activeQrCode}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                <AlertTriangle className="h-3 w-3" />
                                No QR
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-[#c3c6d7]/50 py-3 px-6 shadow-xl z-40 flex items-center justify-between">
        <div className="text-xs font-semibold text-[#131b2e]">
          {activeTab === "BOOKS" ? (
            <span>
              Selected <b>{selectedBookIds.length}</b> of <b>{visibleBooks.length}</b> books
            </span>
          ) : (
            <span>
              Selected <b>{selectedVideoIds.length}</b> of <b>{visibleVideos.length}</b> videos
            </span>
          )}
        </div>

        {activeTab === "BOOKS" ? (
          <Button
            onClick={handleRunBulkBooks}
            disabled={selectedBookIds.length === 0 || isProcessing}
            className="bg-[#004ac6] hover:bg-[#003899] text-white font-bold text-xs h-10 px-6 rounded-xl shadow-md shadow-[#004ac6]/20 cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Generating Book QRs...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate QRs for {selectedBookIds.length} Books
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={handleRunBulkVideos}
            disabled={selectedVideoIds.length === 0 || isProcessing}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs h-10 px-6 rounded-xl shadow-md shadow-rose-600/20 cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Generating Video QRs...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate QRs for {selectedVideoIds.length} Videos
              </>
            )}
          </Button>
        )}
      </div>

      {/* Summary Results Modal */}
      {bulkResults && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-[#c3c6d7]/40 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-[#c3c6d7]/30 flex items-center justify-between bg-[#faf8ff]">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#004ac6]" />
                <h3 className="text-sm font-bold text-[#131b2e]">Bulk QR Generation Summary</h3>
              </div>
              <button
                onClick={() => setBulkResults(null)}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
              {/* Metrics row */}
              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                  <p className="text-[10px] font-bold text-[#505f76]">TOTAL</p>
                  <p className="text-xl font-black text-[#131b2e] mt-0.5">
                    {bulkResults.totalRequested}
                  </p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <p className="text-[10px] font-bold text-emerald-700">GENERATED</p>
                  <p className="text-xl font-black text-emerald-800 mt-0.5">
                    {bulkResults.generated}
                  </p>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <p className="text-[10px] font-bold text-amber-700">SKIPPED</p>
                  <p className="text-xl font-black text-amber-800 mt-0.5">
                    {bulkResults.skipped}
                  </p>
                </div>
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                  <p className="text-[10px] font-bold text-rose-700">FAILED</p>
                  <p className="text-xl font-black text-rose-800 mt-0.5">
                    {bulkResults.failed}
                  </p>
                </div>
              </div>

              {/* Detailed result breakdown table */}
              <div>
                <h4 className="text-xs font-bold text-[#131b2e] mb-2">Batch Results Breakdown</h4>
                <div className="border border-[#c3c6d7]/30 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#faf8ff] border-b border-[#c3c6d7]/30 font-semibold text-[#505f76]">
                        <th className="py-2 px-3">Item Title</th>
                        <th className="py-2 px-3">Status</th>
                        <th className="py-2 px-3">Assigned Code</th>
                        <th className="py-2 px-3">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#c3c6d7]/20 text-[#131b2e]">
                      {bulkResults.results.map((r, idx) => (
                        <tr key={idx} className="hover:bg-[#faf8ff]">
                          <td className="py-2 px-3 font-semibold">
                            {r.videoTitle || r.bookTitle || `Item #${r.videoId || r.bookId}`}
                          </td>
                          <td className="py-2 px-3">
                            {r.status === "GENERATED" ? (
                              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">
                                GENERATED
                              </span>
                            ) : r.status === "SKIPPED" ? (
                              <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">
                                SKIPPED
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded border border-rose-200">
                                FAILED
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-[#004ac6]">
                            {r.code || "—"}
                          </td>
                          <td className="py-2 px-3 text-zinc-500 font-medium">
                            {r.reason || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[#c3c6d7]/20 flex justify-end gap-3 bg-[#faf8ff]">
              <Button
                onClick={() => {
                  setBulkResults(null);
                  router.push("/dashboard/qrcode");
                }}
                className="bg-[#004ac6] hover:bg-[#003899] text-white font-bold text-xs h-9 px-4 rounded-xl cursor-pointer"
              >
                Go to QR List
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
