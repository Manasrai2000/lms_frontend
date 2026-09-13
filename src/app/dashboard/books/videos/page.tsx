"use client";

import React, { useState, useEffect, useMemo } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import {
  Video,
  Play,
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  Loader2,
  RefreshCw,
  X,
  BookOpen,
  Layers,
  Clock,
  LayoutGrid,
  List,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  ExternalLink,
  QrCode,
  Download,
  Printer,
  Copy,
  Check,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store/auth";
import qrApi from "@/lib/api/qrcode";
import { QRCodeItem } from "@/types/qrcode";

export interface BookOption {
  id: number | string;
  _id?: number | string;
  code?: string;
  title: string;
  class?: string;
  className?: string;
  subject?: string;
  subjectName?: string;
}

export interface ChapterOption {
  id: number | string;
  _id?: number | string;
  title: string;
  chapterNumber?: number | string;
  orderNo?: number;
}

export interface VideoItem {
  id: number | string;
  _id?: number | string;
  title: string;
  videoUrl: string;
  youtubeVideoId?: string;
  thumbnailUrl?: string;
  bookId?: number | string;
  bookTitle?: string;
  chapterId?: number | string;
  chapterTitle?: string;
  duration?: string;
  description?: string;
  orderNo?: number;
  isActive?: boolean;
  createdAt?: string;
}

export default function VideosPage() {
  const { user } = useAuthStore();
  const userRole = user?.role?.toLowerCase() || "";
  const isStudent = userRole === "student";
  const isAdmin = userRole === "admin" || userRole === "superadmin";
  const isTeacher = userRole === "teacher";
  const isAdminOrTeacher = isAdmin || isTeacher;
  const canAccessQr = isAdmin;

  // Master Data & Dropdowns
  const [books, setBooks] = useState<BookOption[]>([]);
  const [chapters, setChapters] = useState<ChapterOption[]>([]);
  const [modalChapters, setModalChapters] = useState<ChapterOption[]>([]);

  // Selected Filters State
  const [selectedBookId, setSelectedBookId] = useState<string>("all");
  const [selectedChapterId, setSelectedChapterId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Layout View Mode
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Video List State
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [isLoadingBooks, setIsLoadingBooks] = useState<boolean>(true);
  const [isLoadingChapters, setIsLoadingChapters] = useState<boolean>(false);
  const [isLoadingVideos, setIsLoadingVideos] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Server-Side Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [meta, setMeta] = useState<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  }>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Reorder Loading state
  const [isReordering, setIsReordering] = useState<boolean>(false);

  // Video Player Modal State
  const [playingVideo, setPlayingVideo] = useState<VideoItem | null>(null);

  // Modals state
  const [isCreateEditOpen, setIsCreateEditOpen] = useState<boolean>(false);
  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
  const [videoToDelete, setVideoToDelete] = useState<VideoItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Video QR Code Modal State
  const [videoQrMap, setVideoQrMap] = useState<Record<string, QRCodeItem>>({});
  const [selectedVideoQr, setSelectedVideoQr] = useState<{ video: VideoItem; qr: QRCodeItem | null } | null>(null);
  const [isGeneratingQr, setIsGeneratingQr] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    videoUrl: "",
    bookId: "",
    chapterId: "",
    duration: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const getVideoIdStr = (v: VideoItem): string | number => {
    return v.id ?? v._id ?? "";
  };

  // Helper: Extract YouTube Video ID from various URL formats
  const extractYoutubeId = (url: string): string => {
    if (!url) return "";
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return match[2];
    }
    // If user entered raw 11-char ID
    if (url.length === 11 && !url.includes("/")) {
      return url;
    }
    return "";
  };

  // 1. Fetch Books Options
  const fetchBooksOptions = async () => {
    try {
      setIsLoadingBooks(true);
      let res: any = null;
      try {
        const r = await api.get("/v1/books", { params: { limit: 200 } });
        res = r.data;
      } catch {
        const r = await api.get("/api/v1/books", { params: { limit: 200 } });
        res = r.data;
      }

      const rawArray = Array.isArray(res) ? res : res?.data || res?.books || [];
      const normalized: BookOption[] = rawArray.map((b: any) => ({
        id: b.id ?? b._id,
        code: b.code || b.isbn || `BK-${b.id ?? b._id}`,
        title: b.title || "Untitled Book",
        class: b.class || b.className || "General",
        subject: b.subject || b.subjectName || "General",
      }));

      setBooks(normalized);
      const queryBookId = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("bookId") : null;
      if (queryBookId && normalized.some((b) => String(b.id) === String(queryBookId))) {
        setSelectedBookId(String(queryBookId));
      }
    } catch (err) {
      console.error("Failed to fetch books options:", err);
      toast.error("Failed to load books dropdown.");
    } finally {
      setIsLoadingBooks(false);
    }
  };

  // 2. Fetch Cascading Chapters Options based on Selected Book
  const fetchChaptersOptions = async (bookId: string, isModal = false) => {
    if (!bookId || bookId === "all") {
      if (isModal) setModalChapters([]);
      else setChapters([]);
      return;
    }

    try {
      if (!isModal) setIsLoadingChapters(true);
      let res: any = null;
      try {
        const r = await api.get("/v1/chapters", { params: { bookId, limit: 200 } });
        res = r.data;
      } catch {
        const r = await api.get("/api/v1/chapters", { params: { bookId, limit: 200 } });
        res = r.data;
      }

      const rawArray = Array.isArray(res) ? res : res?.data || res?.chapters || [];
      const normalized: ChapterOption[] = rawArray.map((c: any, idx: number) => ({
        id: c.id ?? c._id,
        title: c.title || `Chapter ${idx + 1}`,
        chapterNumber: c.chapterNumber ?? c.orderNo ?? idx + 1,
        orderNo: c.orderNo ?? idx + 1,
      }));

      if (isModal) {
        setModalChapters(normalized);
      } else {
        setChapters(normalized);
      }
    } catch (err) {
      console.error("Failed to fetch chapters options:", err);
    } finally {
      if (!isModal) setIsLoadingChapters(false);
    }
  };

  // 3. Fetch Videos List: GET /api/v1/videos?bookId={id}&chapterId={id}&page=1&limit=10
  const fetchVideos = async (showRefreshToast = false) => {
    try {
      if (showRefreshToast) setIsRefreshing(true);
      else setIsLoadingVideos(true);

      const params: Record<string, any> = {
        page: currentPage,
        limit: itemsPerPage,
      };

      if (selectedBookId && selectedBookId !== "all") params.bookId = selectedBookId;
      if (selectedChapterId && selectedChapterId !== "all") params.chapterId = selectedChapterId;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      let vidRes: any = null;
      try {
        const res = await api.get("/v1/videos", { params });
        vidRes = res.data;
      } catch {
        const res = await api.get("/api/v1/videos", { params });
        vidRes = res.data;
      }

      const rawArray = Array.isArray(vidRes)
        ? vidRes
        : vidRes?.data || vidRes?.videos || [];

      // Extract pagination metadata
      const rawMeta = vidRes?.meta || vidRes?.pagination || {};
      const totalCount = rawMeta.total ?? vidRes?.total ?? rawArray.length;
      const calcTotalPages = rawMeta.totalPages ?? Math.max(1, Math.ceil(totalCount / itemsPerPage));

      setMeta({
        total: totalCount,
        page: rawMeta.page ?? currentPage,
        limit: rawMeta.limit ?? itemsPerPage,
        totalPages: calcTotalPages,
        hasNextPage: rawMeta.hasNextPage ?? (currentPage < calcTotalPages),
        hasPrevPage: rawMeta.hasPrevPage ?? (currentPage > 1),
      });

      // Normalize Videos with YouTube ID extraction & Thumbnail calculation
      const normalized: VideoItem[] = rawArray.map((v: any, idx: number) => {
        const ytId = extractYoutubeId(v.videoUrl || v.youtubeVideoId || "");
        const thumb =
          v.thumbnailUrl ||
          (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : undefined);

        return {
          id: v.id ?? v._id,
          title: v.title || "Untitled Video Lesson",
          videoUrl: v.videoUrl || (ytId ? `https://www.youtube.com/watch?v=${ytId}` : ""),
          youtubeVideoId: ytId,
          thumbnailUrl: thumb,
          bookId: v.bookId || selectedBookId,
          bookTitle: v.bookTitle || v.book?.title || "Book Content",
          chapterId: v.chapterId || selectedChapterId,
          chapterTitle: v.chapterTitle || v.chapter?.title || "Chapter Topic",
          duration: v.duration || "10:00",
          description: v.description || "",
          orderNo: v.orderNo ?? idx + 1,
          isActive: v.isActive !== false,
          createdAt: v.createdAt,
        };
      });

      // Sort by sequence orderNo ascending
      normalized.sort((a, b) => (a.orderNo || 0) - (b.orderNo || 0));

      setVideos(normalized);

      if (showRefreshToast) {
        toast.success("Videos list refreshed!");
      }
    } catch (err: any) {
      console.error("Failed to fetch videos:", err);
      toast.error(err.response?.data?.message || "Failed to load video lessons.");
    } finally {
      setIsLoadingVideos(false);
      setIsRefreshing(false);
    }
  };

  // 3.1 Fetch Video QR Codes mapping
  const fetchVideoQrs = async () => {
    if (isStudent || !canAccessQr) return;
    try {
      const res = await qrApi.getList({ targetType: "VIDEO", limit: 500 });
      const items = res?.data || [];
      const map: Record<string, QRCodeItem> = {};
      items.forEach((item: QRCodeItem) => {
        const vId = item.videoId || (item.video ? (item.video.id || (item.video as any)._id) : null);
        if (vId) {
          map[String(vId)] = item;
        }
      });
      setVideoQrMap(map);
    } catch (err: any) {
      if (err?.response?.status === 403 || err?.response?.status === 401) {
        setVideoQrMap({});
        return;
      }
      console.warn("Could not load video QR codes mapping:", err?.message || err);
    }
  };

  useEffect(() => {
    fetchBooksOptions();
  }, []);

  useEffect(() => {
    if (canAccessQr) {
      fetchVideoQrs();
    }
  }, [canAccessQr]);

  useEffect(() => {
    if (selectedBookId && selectedBookId !== "all") {
      fetchChaptersOptions(selectedBookId, false);
    } else {
      setChapters([]);
      setSelectedChapterId("all");
    }
  }, [selectedBookId]);

  useEffect(() => {
    fetchVideos();
  }, [selectedBookId, selectedChapterId, currentPage, itemsPerPage]);

  // Video QR Code Handlers
  const handleOpenVideoQrModal = (v: VideoItem) => {
    const vId = String(getVideoIdStr(v));
    const existingQr = videoQrMap[vId] || null;
    setSelectedVideoQr({ video: v, qr: existingQr });
  };

  const handleGenerateVideoQr = async (v: VideoItem) => {
    const vId = String(getVideoIdStr(v));
    try {
      setIsGeneratingQr(true);
      const newQr = await qrApi.generateForVideo(vId);
      toast.success(`Video QR Code (${newQr.code}) generated successfully!`);
      setVideoQrMap((prev) => ({ ...prev, [vId]: newQr }));
      setSelectedVideoQr({ video: v, qr: newQr });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to generate video QR code");
    } finally {
      setIsGeneratingQr(false);
    }
  };

  const handleCopyUrl = (code: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const publicUrl = `${origin}/q/${code}`;
    navigator.clipboard.writeText(publicUrl);
    setCopiedCode(code);
    toast.success("Video QR Link copied to clipboard!");
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handlePrintVideoLabel = (item: QRCodeItem, video: VideoItem) => {
    const imageUrl = qrApi.getImageUrl(item.id, "png");
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups to print QR label");
      return;
    }

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const publicUrl = `${origin}/q/${item.code}`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Video QR Label - ${item.code}</title>
          <style>
            body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #fff; }
            .label { border: 2px dashed #004ac6; padding: 24px; text-align: center; border-radius: 12px; max-width: 320px; }
            .badge { display: inline-block; font-size: 10px; font-weight: 800; background: #eaedff; color: #004ac6; padding: 3px 8px; border-radius: 999px; text-transform: uppercase; margin-bottom: 8px; }
            .img-box { margin: 14px 0; }
            .img-box img { width: 170px; height: 170px; }
            .title { font-weight: bold; font-size: 15px; margin-bottom: 4px; color: #131b2e; }
            .sub { font-size: 11px; color: #505f76; margin-bottom: 12px; }
            .code { font-family: monospace; font-size: 13px; font-weight: bold; background: #eaedff; padding: 4px 8px; border-radius: 4px; color: #004ac6; }
            .url { font-size: 9px; color: #888; margin-top: 8px; word-break: break-all; }
          </style>
        </head>
        <body>
          <div class="label">
            <div class="badge">🎥 Video Lesson QR</div>
            <div class="title">${video.title}</div>
            <div class="sub">${video.bookTitle ? `Book: ${video.bookTitle}` : ""} ${video.chapterTitle ? `| Ch: ${video.chapterTitle}` : ""}</div>
            <div class="img-box">
              <img src="${imageUrl}" alt="Video QR Code" />
            </div>
            <div class="code">${item.code}</div>
            <div class="url">${publicUrl}</div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const selectedBookObj = useMemo(() => {
    return books.find((b) => String(b.id) === String(selectedBookId));
  }, [books, selectedBookId]);

  const selectedChapterObj = useMemo(() => {
    return chapters.find((c) => String(c.id) === String(selectedChapterId));
  }, [chapters, selectedChapterId]);

  // Search filter keydown
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setCurrentPage(1);
      fetchVideos();
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedBookId("all");
    setSelectedChapterId("all");
    setCurrentPage(1);
  };

  // Reorder sequence Move Up / Move Down
  const handleMoveSequence = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= videos.length) return;

    const updated = [...videos];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    const reorderedPayload = updated.map((v, idx) => ({
      ...v,
      orderNo: idx + 1,
    }));

    setVideos(reorderedPayload);
    setIsReordering(true);

    try {
      const apiPayload = {
        videos: reorderedPayload.map((v) => ({
          id: getVideoIdStr(v),
          orderNo: v.orderNo,
        })),
      };

      try {
        await api.post("/v1/videos/reorder", apiPayload);
      } catch {
        await api.post("/api/v1/videos/reorder", apiPayload);
      }

      toast.success("Video sequence order updated!");
    } catch (err: any) {
      console.error("Failed to reorder videos:", err);
      toast.error("Failed to update sequence order.");
      fetchVideos();
    } finally {
      setIsReordering(false);
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingVideo(null);
    const initialBookId = selectedBookId !== "all" ? selectedBookId : books[0]?.id ? String(books[0].id) : "";
    setFormData({
      title: "",
      videoUrl: "",
      bookId: initialBookId,
      chapterId: selectedChapterId !== "all" ? selectedChapterId : "",
      duration: "",
      description: "",
    });
    if (initialBookId) {
      fetchChaptersOptions(initialBookId, true);
    }
    setIsCreateEditOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (v: VideoItem) => {
    setEditingVideo(v);
    const bId = v.bookId ? String(v.bookId) : selectedBookId !== "all" ? selectedBookId : "";
    setFormData({
      title: v.title || "",
      videoUrl: v.videoUrl || "",
      bookId: bId,
      chapterId: v.chapterId ? String(v.chapterId) : "",
      duration: v.duration || "",
      description: v.description || "",
    });
    if (bId) {
      fetchChaptersOptions(bId, true);
    }
    setIsCreateEditOpen(true);
  };

  // Submit Create or Edit Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.videoUrl.trim()) {
      toast.error("Video Title and YouTube Video URL are required.");
      return;
    }

    setIsSubmitting(true);
    const payload = {
      title: formData.title.trim(),
      videoUrl: formData.videoUrl.trim(),
      bookId: formData.bookId || undefined,
      chapterId: formData.chapterId || undefined,
      duration: formData.duration.trim() || undefined,
      description: formData.description.trim() || undefined,
    };

    try {
      if (editingVideo) {
        const vId = getVideoIdStr(editingVideo);
        try {
          await api.put(`/v1/videos/${vId}`, payload);
        } catch {
          await api.put(`/api/v1/videos/${vId}`, payload);
        }
        toast.success("Video lesson updated successfully!");
      } else {
        try {
          await api.post("/v1/videos", payload);
        } catch {
          await api.post("/api/v1/videos", payload);
        }
        toast.success("New video lesson created successfully!");
      }

      setIsCreateEditOpen(false);
      fetchVideos();
    } catch (err: any) {
      console.error("Failed to save video:", err);
      toast.error(err.response?.data?.message || "Failed to save video lesson.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Delete Modal
  const handleOpenDeleteModal = (v: VideoItem) => {
    setVideoToDelete(v);
    setIsDeleteOpen(true);
  };

  // Submit Delete
  const handleDeleteConfirm = async () => {
    if (!videoToDelete) return;
    setIsDeleting(true);
    const vId = getVideoIdStr(videoToDelete);

    try {
      try {
        await api.delete(`/v1/videos/${vId}`);
      } catch {
        await api.delete(`/api/v1/videos/${vId}`);
      }

      toast.success("Video deleted successfully!");
      setIsDeleteOpen(false);
      setVideoToDelete(null);
      fetchVideos();
    } catch (err: any) {
      console.error("Failed to delete video:", err);
      toast.error(err.response?.data?.message || "Failed to delete video.");
    } finally {
      setIsDeleting(false);
    }
  };

  const isFilterActive =
    searchQuery !== "" ||
    selectedBookId !== "all" ||
    selectedChapterId !== "all";

  const startIndex = (meta.page - 1) * meta.limit + 1;
  const endIndex = Math.min(meta.page * meta.limit, meta.total);

  return (
    <div className="space-y-4 md:space-y-5 max-w-7xl mx-auto pb-12 text-[#131b2e]">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-white via-[#f0f4ff] to-[#e6eeff] p-4 md:p-5 border border-[#c3c6d7]/40 shadow-sm backdrop-blur-md">
        <div className="absolute right-0 top-0 -mr-12 -mt-12 h-64 w-64 rounded-full bg-[#004ac6]/5 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-[#004ac6] text-white flex items-center justify-center shadow-lg shadow-[#004ac6]/20 shrink-0">
              <Video className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#131b2e]">
                  Video Library & Player
                </h1>
                <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-[#004ac6]/10 text-[#004ac6] border border-[#004ac6]/20">
                  {meta.total} Videos
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#505f76] font-medium mt-1 max-w-2xl">
                Organize video lectures, embed YouTube streams, and stream video content for textbook chapters.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="outline"
              onClick={() => fetchVideos(true)}
              disabled={isRefreshing || isLoadingVideos}
              className="border-[#c3c6d7] text-[#505f76] hover:bg-[#eaedff]/50 cursor-pointer h-10 px-3"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin text-[#004ac6]" : ""}`} />
              Refresh
            </Button>

            {isAdminOrTeacher && (
              <Button
                onClick={handleOpenCreateModal}
                className="bg-[#004ac6] hover:bg-[#003cb0] text-white font-semibold shadow-md shadow-[#004ac6]/20 cursor-pointer h-10 px-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Video
              </Button>
            )}
          </div>
        </div>

        {/* Selected Context Badges */}
        {(selectedBookObj || selectedChapterObj) && (
          <div className="mt-6 pt-4 border-t border-[#c3c6d7]/30 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[#505f76]">Active Selection:</span>
            {selectedBookObj && (
              <div className="bg-white/90 px-3 py-1 rounded-xl border border-[#c3c6d7]/40 text-xs font-extrabold text-[#131b2e] flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-[#004ac6]" />
                {selectedBookObj.title}
              </div>
            )}
            {selectedChapterObj && (
              <div className="bg-[#eaedff] px-3 py-1 rounded-xl text-xs font-extrabold text-[#004ac6] flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" />
                {selectedChapterObj.title}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Cascading Filter Bar */}
      <div className="bg-white rounded-2xl border border-[#c3c6d7]/40 p-4 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          {/* Search Input */}
          <div className="lg:col-span-4 relative">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search videos by title or description (Press Enter)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full pl-10 pr-9 py-2 text-xs rounded-xl border border-[#c3c6d7]/60 focus:outline-none focus:border-[#004ac6] focus:ring-2 focus:ring-[#004ac6]/10 bg-[#faf8ff] font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setCurrentPage(1);
                  fetchVideos();
                }}
                className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Book Selector Dropdown */}
          <div className="lg:col-span-3 relative">
            <select
              value={selectedBookId}
              onChange={(e) => {
                setSelectedBookId(e.target.value);
                setCurrentPage(1);
              }}
              disabled={isLoadingBooks}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#c3c6d7]/60 focus:outline-none focus:border-[#004ac6] bg-[#faf8ff] font-semibold text-[#131b2e] cursor-pointer"
            >
              <option value="all">All Books Catalog</option>
              {books.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title} ({b.class})
                </option>
              ))}
            </select>
          </div>

          {/* Cascading Chapter Selector Dropdown */}
          <div className="lg:col-span-3 relative">
            <select
              value={selectedChapterId}
              onChange={(e) => {
                setSelectedChapterId(e.target.value);
                setCurrentPage(1);
              }}
              disabled={isLoadingChapters || selectedBookId === "all"}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#c3c6d7]/60 focus:outline-none focus:border-[#004ac6] bg-[#faf8ff] font-semibold text-[#131b2e] cursor-pointer disabled:opacity-50"
            >
              <option value="all">
                {selectedBookId === "all" ? "Select a book first" : "All Chapters of Book"}
              </option>
              {chapters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle & Reset */}
          <div className="lg:col-span-2 flex items-center justify-end gap-2">
            <div className="flex items-center bg-[#faf8ff] p-1 rounded-xl border border-[#c3c6d7]/50">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-[#004ac6] text-white shadow-xs"
                    : "text-[#505f76] hover:text-[#131b2e]"
                }`}
                title="Grid View"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === "table"
                    ? "bg-[#004ac6] text-white shadow-xs"
                    : "text-[#505f76] hover:text-[#131b2e]"
                }`}
                title="Table View"
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            <Button
              variant="outline"
              onClick={handleResetFilters}
              disabled={!isFilterActive}
              className="border-[#c3c6d7] text-[#505f76] hover:bg-[#eaedff] text-xs font-semibold cursor-pointer h-9 px-2.5"
              title="Reset Filters"
            >
              <Filter className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* 3. Video Cards Grid / Data Table View */}
      {isLoadingVideos ? (
        /* Skeleton loading */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-[#c3c6d7]/40 overflow-hidden shadow-xs animate-pulse p-4 space-y-3">
              <div className="h-40 bg-zinc-200 rounded-xl" />
              <div className="h-4 w-3/4 bg-zinc-200 rounded" />
              <div className="h-3 w-1/2 bg-zinc-200 rounded" />
            </div>
          ))}
        </div>
      ) : videos.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-[#c3c6d7]/40 p-12 text-center space-y-4 shadow-sm">
          <div className="h-16 w-16 rounded-2xl bg-[#eaedff] text-[#004ac6] flex items-center justify-center mx-auto">
            <Video className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[#131b2e]">
              No Video Lessons Available
            </h3>
            <p className="text-xs text-[#505f76] max-w-md mx-auto font-medium mt-1">
              {isFilterActive
                ? "No videos match your search or selected chapter/book filters."
                : "No videos have been added for this chapter yet."}
            </p>
          </div>

          <div>
            {isFilterActive ? (
              <Button
                variant="outline"
                onClick={handleResetFilters}
                className="border-[#c3c6d7] text-[#004ac6] font-semibold"
              >
                Clear Filters
              </Button>
            ) : (
              isAdminOrTeacher && (
                <Button
                  onClick={handleOpenCreateModal}
                  className="bg-[#004ac6] hover:bg-[#003cb0] text-white font-semibold"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Video Lesson
                </Button>
              )
            )}
          </div>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW CARDS */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((v, idx) => (
            <div
              key={getVideoIdStr(v)}
              className="bg-white rounded-2xl border border-[#c3c6d7]/40 overflow-hidden shadow-sm hover:shadow-md hover:border-[#004ac6]/40 transition-all group flex flex-col justify-between"
            >
              <div>
                {/* Thumbnail Container with Play Overlay */}
                <div className="relative aspect-video bg-slate-900 overflow-hidden group">
                  {v.thumbnailUrl ? (
                    <img
                      src={v.thumbnailUrl}
                      alt={v.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-slate-400">
                      <Video className="h-12 w-12" />
                    </div>
                  )}

                  {/* Dark Backdrop Overlay */}
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <button
                      onClick={() => setPlayingVideo(v)}
                      className="h-14 w-14 rounded-full bg-[#004ac6] text-white flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-all cursor-pointer"
                      title="Play Video"
                    >
                      <Play className="h-6 w-6 ml-1 fill-current" />
                    </button>
                  </div>

                  {/* Duration Badge */}
                  {v.duration && (
                    <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-md text-[11px] font-bold text-white flex items-center gap-1">
                      <Clock className="h-3 w-3 text-amber-400" />
                      {v.duration}
                    </div>
                  )}
                </div>

                {/* Video Info Content */}
                <div className="p-3.5 sm:p-4 space-y-2.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {v.bookTitle && (
                      <span className="px-2 py-0.5 rounded-md bg-[#eaedff] text-[#004ac6] text-[10px] font-extrabold border border-[#004ac6]/15">
                        {v.bookTitle}
                      </span>
                    )}
                    {v.chapterTitle && (
                      <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-extrabold border border-purple-200">
                        {v.chapterTitle}
                      </span>
                    )}
                  </div>

                  <h3
                    onClick={() => setPlayingVideo(v)}
                    className="font-extrabold text-[#131b2e] text-base line-clamp-2 hover:text-[#004ac6] transition-colors cursor-pointer"
                  >
                    {v.title}
                  </h3>

                  {v.description ? (
                    <p className="text-xs text-[#505f76] line-clamp-2 font-medium">
                      {v.description}
                    </p>
                  ) : (
                    <p className="text-xs text-zinc-400 italic">No description provided</p>
                  )}
                </div>
              </div>

              {/* Action Bar Footer */}
              <div className="px-5 py-3.5 bg-[#faf8ff] border-t border-[#c3c6d7]/30 flex items-center justify-between">
                <Button
                  size="sm"
                  onClick={() => setPlayingVideo(v)}
                  className="bg-[#004ac6] hover:bg-[#003cb0] text-white text-xs font-semibold h-8 px-3 cursor-pointer shadow-2xs"
                >
                  <Play className="h-3.5 w-3.5 mr-1.5 fill-current" /> Play
                </Button>

                <div className="flex items-center gap-1">
                  {/* Reorder Buttons */}
                  {isAdminOrTeacher && (
                    <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/80 mr-1">
                      <button
                        onClick={() => handleMoveSequence(idx, "up")}
                        disabled={idx === 0 || isReordering}
                        className="p-1 text-slate-600 hover:text-[#004ac6] disabled:opacity-30 cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveSequence(idx, "down")}
                        disabled={idx === videos.length - 1 || isReordering}
                        className="p-1 text-slate-600 hover:text-[#004ac6] disabled:opacity-30 cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  {isAdminOrTeacher && (
                    <>
                      {canAccessQr && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenVideoQrModal(v)}
                          className={`h-8 w-8 p-0 rounded-lg cursor-pointer ${
                            videoQrMap[String(getVideoIdStr(v))]
                              ? "text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                              : "text-slate-400 hover:text-[#004ac6] hover:bg-slate-100"
                          }`}
                          title={
                            videoQrMap[String(getVideoIdStr(v))]
                              ? `Video QR Code (${videoQrMap[String(getVideoIdStr(v))].code})`
                              : "Generate / View Video QR Code"
                          }
                        >
                          <QrCode className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEditModal(v)}
                        className="h-8 w-8 p-0 text-slate-600 hover:text-[#004ac6] hover:bg-slate-100 rounded-lg cursor-pointer"
                        title="Edit Video"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDeleteModal(v)}
                        className="h-8 w-8 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                        title="Delete Video"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-[#c3c6d7]/40 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#faf8ff] border-b border-[#c3c6d7]/30 text-[11px] font-extrabold uppercase tracking-wider text-[#505f76]">
                  <th className="py-2.5 px-4 w-16">#</th>
                  <th className="py-2.5 px-4">Thumbnail & Title</th>
                  <th className="py-2.5 px-4">Book & Chapter</th>
                  <th className="py-2.5 px-4">Duration</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c3c6d7]/20 text-xs">
                {videos.map((v, idx) => (
                  <tr key={getVideoIdStr(v)} className="hover:bg-[#f4f7ff]/60 transition-colors">
                    <td className="py-2.5 px-4 font-bold text-[#505f76]">
                      {idx + 1}
                    </td>

                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          onClick={() => setPlayingVideo(v)}
                          className="h-12 w-20 bg-slate-900 rounded-lg overflow-hidden shrink-0 relative group cursor-pointer"
                        >
                          {v.thumbnailUrl ? (
                            <img src={v.thumbnailUrl} alt={v.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-500">
                              <Video className="h-5 w-5" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play className="h-5 w-5 text-white fill-current" />
                          </div>
                        </div>

                        <div>
                          <p
                            onClick={() => setPlayingVideo(v)}
                            className="font-extrabold text-[#131b2e] hover:text-[#004ac6] transition-colors cursor-pointer"
                          >
                            {v.title}
                          </p>
                          <p className="text-xs text-[#505f76] truncate max-w-xs">{v.description || "No description"}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-2.5 px-4 space-y-1">
                      <p className="font-bold text-[#131b2e]">{v.bookTitle || "—"}</p>
                      <p className="text-xs text-[#505f76]">{v.chapterTitle || "—"}</p>
                    </td>

                    <td className="py-2.5 px-4 font-semibold text-[#131b2e]">
                      {v.duration || "10:00"}
                    </td>

                    <td className="py-2.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPlayingVideo(v)}
                          className="h-8 px-2.5 text-[#004ac6] hover:bg-[#eaedff] font-semibold text-xs cursor-pointer"
                        >
                          <Play className="h-3.5 w-3.5 mr-1 fill-current" /> Play
                        </Button>

                        {isAdminOrTeacher && (
                          <>
                            {canAccessQr && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenVideoQrModal(v)}
                                className={`h-8 w-8 p-0 rounded-lg cursor-pointer ${
                                  videoQrMap[String(getVideoIdStr(v))]
                                    ? "text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                                    : "text-slate-400 hover:text-[#004ac6] hover:bg-slate-100"
                                }`}
                                title={
                                  videoQrMap[String(getVideoIdStr(v))]
                                    ? `Video QR Code (${videoQrMap[String(getVideoIdStr(v))].code})`
                                    : "Generate / View Video QR Code"
                                }
                              >
                                <QrCode className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEditModal(v)}
                              className="h-8 w-8 p-0 text-slate-600 hover:text-[#004ac6] hover:bg-slate-100 rounded-lg cursor-pointer"
                              title="Edit Video"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDeleteModal(v)}
                              className="h-8 w-8 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Server-Side Pagination Bar */}
      {videos.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#c3c6d7]/40 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs text-[#505f76] font-semibold">
            <span>
              Showing <strong className="text-[#131b2e]">{startIndex}</strong> to{" "}
              <strong className="text-[#131b2e]">{endIndex}</strong> of{" "}
              <strong className="text-[#004ac6]">{meta.total}</strong> video lessons
            </span>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-zinc-400">Show:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 text-xs rounded-lg border border-[#c3c6d7]/60 bg-[#faf8ff] font-semibold cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={!meta.hasPrevPage && currentPage <= 1}
              className="border-[#c3c6d7] text-[#505f76] text-xs font-semibold cursor-pointer h-8 px-2.5"
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Prev
            </Button>

            <span className="text-xs font-bold text-[#131b2e] px-2">
              Page {meta.page} of {meta.totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={!meta.hasNextPage && currentPage >= meta.totalPages}
              className="border-[#c3c6d7] text-[#505f76] text-xs font-semibold cursor-pointer h-8 px-2.5"
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* YOUTUBE PLAYER MODAL */}
      {playingVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 text-white">
            {/* Player Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
              <div>
                <h3 className="font-extrabold text-base text-white">{playingVideo.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {playingVideo.bookTitle} • {playingVideo.chapterTitle}
                </p>
              </div>
              <button
                onClick={() => setPlayingVideo(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Responsive 16:9 Iframe Player */}
            <div className="relative aspect-video bg-black">
              {playingVideo.youtubeVideoId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${playingVideo.youtubeVideoId}?autoplay=1&rel=0`}
                  title={playingVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center space-y-3 p-4 text-center">
                  <AlertTriangle className="h-10 w-10 text-amber-400" />
                  <p className="text-sm font-semibold">Invalid YouTube Video URL or Video ID</p>
                  <a
                    href={playingVideo.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center text-xs text-[#004ac6] hover:underline"
                  >
                    Open direct video link <ExternalLink className="h-3.5 w-3.5 ml-1" />
                  </a>
                </div>
              )}
            </div>

            {/* Player Description Footer */}
            {playingVideo.description && (
              <div className="p-4 bg-slate-900 border-t border-slate-800 text-xs text-slate-300 space-y-1">
                <p className="font-bold text-slate-100">About this video:</p>
                <p className="leading-relaxed">{playingVideo.description}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: Create / Edit Video Modal */}
      {isCreateEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-[#c3c6d7]/40 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#c3c6d7]/30 bg-[#faf8ff]">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-[#004ac6]/10 text-[#004ac6] flex items-center justify-center font-bold">
                  <Video className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-[#131b2e]">
                    {editingVideo ? "Edit Video Lesson" : "Add New Video Lesson"}
                  </h2>
                  <p className="text-xs text-[#505f76]">
                    Embed YouTube lecture link for student textbook chapters.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateEditOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 p-1.5 rounded-lg hover:bg-zinc-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-4 space-y-3.5">
              {/* Title (Required) */}
              <div>
                <label className="block text-xs font-bold text-[#131b2e] mb-1">
                  Video Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chapter 1: Differential Calculus Complete Lecture"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#c3c6d7]/60 focus:outline-none focus:border-[#004ac6] bg-[#faf8ff] font-medium"
                />
              </div>

              {/* YouTube Video URL (Required) */}
              <div>
                <label className="block text-xs font-bold text-[#131b2e] mb-1">
                  YouTube Video Link / URL <span className="text-rose-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#c3c6d7]/60 focus:outline-none focus:border-[#004ac6] bg-[#faf8ff] font-medium"
                />
              </div>

              {/* Cascading Book Select */}
              <div>
                <label className="block text-xs font-bold text-[#131b2e] mb-1">Target Book</label>
                <select
                  value={formData.bookId}
                  onChange={(e) => {
                    const bId = e.target.value;
                    setFormData({ ...formData, bookId: bId, chapterId: "" });
                    if (bId) fetchChaptersOptions(bId, true);
                  }}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#c3c6d7]/60 focus:outline-none focus:border-[#004ac6] bg-[#faf8ff] font-medium cursor-pointer"
                >
                  <option value="">Select Target Book</option>
                  {books.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title} ({b.class})
                    </option>
                  ))}
                </select>
              </div>

              {/* Cascading Chapter Select */}
              <div>
                <label className="block text-xs font-bold text-[#131b2e] mb-1">Target Chapter</label>
                <select
                  value={formData.chapterId}
                  onChange={(e) => setFormData({ ...formData, chapterId: e.target.value })}
                  disabled={!formData.bookId}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#c3c6d7]/60 focus:outline-none focus:border-[#004ac6] bg-[#faf8ff] font-medium cursor-pointer disabled:opacity-50"
                >
                  <option value="">
                    {formData.bookId ? "Select Chapter (Optional)" : "Select Book First"}
                  </option>
                  {modalChapters.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Duration (Optional) */}
              <div>
                <label className="block text-xs font-bold text-[#131b2e] mb-1">
                  Duration <span className="text-zinc-400 font-normal">(Optional e.g. 14:30)</span>
                </label>
                <input
                  type="text"
                  placeholder="14:30"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#c3c6d7]/60 focus:outline-none focus:border-[#004ac6] bg-[#faf8ff] font-medium"
                />
              </div>

              {/* Description (Optional) */}
              <div>
                <label className="block text-xs font-bold text-[#131b2e] mb-1">
                  Description <span className="text-zinc-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Summary of video contents, timestamps, or lecture notes..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#c3c6d7]/60 focus:outline-none focus:border-[#004ac6] bg-[#faf8ff] font-medium"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#c3c6d7]/30">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateEditOpen(false)}
                  className="border-[#c3c6d7] text-[#505f76] text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#004ac6] hover:bg-[#003cb0] text-white text-xs font-semibold shadow-md cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : editingVideo ? (
                    "Update Video"
                  ) : (
                    "Create Video"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Delete Confirmation Modal */}
      {isDeleteOpen && videoToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-[#c3c6d7]/40 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 md:p-5 text-center space-y-3.5">
              <div className="h-12 w-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-[#131b2e]">Delete Video Lesson?</h3>
                <p className="text-xs text-[#505f76] mt-1 font-medium">
                  Are you sure you want to delete <strong className="text-[#131b2e]">"{videoToDelete.title}"</strong>? This action cannot be undone.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDeleteOpen(false)}
                  className="border-[#c3c6d7] text-[#505f76] text-xs font-semibold cursor-pointer w-28"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md cursor-pointer w-28"
                >
                  {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto" /> : "Yes, Delete"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Video QR Code Preview & Generator Modal */}
      {selectedVideoQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-[#c3c6d7]/40 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-4 py-3 border-b border-[#c3c6d7]/30 flex items-center justify-between bg-[#faf8ff]">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <QrCode className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#131b2e]">Video QR Code</h3>
                  <p className="text-[11px] text-[#505f76] truncate max-w-xs font-medium">
                    {selectedVideoQr.video.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedVideoQr(null)}
                className="h-8 w-8 rounded-full hover:bg-slate-200/60 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4">
              {selectedVideoQr.qr ? (
                /* QR EXISTS: Show Preview & Download Options */
                <div className="space-y-4">
                  {/* QR Image & Code Display */}
                  <div className="flex flex-col items-center justify-center p-4 bg-[#f4f7ff]/70 rounded-2xl border border-[#004ac6]/15 text-center">
                    <div className="bg-white p-3 rounded-2xl shadow-sm border border-[#c3c6d7]/40 mb-3">
                      <img
                        src={qrApi.getImageUrl(selectedVideoQr.qr.id, "png")}
                        alt={`QR Code ${selectedVideoQr.qr.code}`}
                        className="w-44 h-44 object-contain rounded-lg"
                      />
                    </div>

                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-base font-black text-[#004ac6] tracking-wider bg-white px-3 py-1 rounded-lg border border-[#004ac6]/20 shadow-2xs">
                        {selectedVideoQr.qr.code}
                      </span>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Active
                      </span>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                        🎥 Video
                      </span>
                    </div>

                    <p className="text-[11px] text-[#505f76] mt-1 font-medium">
                      Scan this code to immediately autoplay this video lesson.
                    </p>
                  </div>

                  {/* Video Lesson Context Card */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center gap-3">
                    {selectedVideoQr.video.thumbnailUrl && (
                      <img
                        src={selectedVideoQr.video.thumbnailUrl}
                        alt={selectedVideoQr.video.title}
                        className="w-16 h-11 object-cover rounded-lg shrink-0 border border-slate-200"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-extrabold text-[#131b2e] truncate">
                        {selectedVideoQr.video.title}
                      </p>
                      <p className="text-[11px] text-[#505f76] truncate font-medium">
                        {selectedVideoQr.video.bookTitle ? `Book: ${selectedVideoQr.video.bookTitle}` : ""}
                        {selectedVideoQr.video.chapterTitle ? ` | Ch: ${selectedVideoQr.video.chapterTitle}` : ""}
                      </p>
                    </div>
                  </div>

                  {/* Public Link Box */}
                  <div className="flex items-center justify-between p-2.5 bg-slate-100 rounded-xl text-xs font-mono text-[#505f76] border border-slate-200">
                    <span className="truncate mr-2">/q/{selectedVideoQr.qr.code}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyUrl(selectedVideoQr.qr!.code)}
                      className="h-7 px-2 text-xs font-semibold text-[#004ac6] hover:bg-white cursor-pointer shrink-0"
                    >
                      {copiedCode === selectedVideoQr.qr.code ? (
                        <>
                          <Check className="h-3 w-3 mr-1 text-emerald-600" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 mr-1" /> Copy Link
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Download & Print Buttons */}
                  <div className="grid grid-cols-3 gap-2.5 pt-1">
                    <a
                      href={qrApi.getImageUrl(selectedVideoQr.qr.id, "png", true)}
                      download={`Video-QR-${selectedVideoQr.qr.code}.png`}
                      className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white border border-[#c3c6d7] text-xs font-bold text-[#131b2e] hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5 text-[#004ac6]" />
                      <span>PNG</span>
                    </a>

                    <a
                      href={qrApi.getImageUrl(selectedVideoQr.qr.id, "svg", true)}
                      download={`Video-QR-${selectedVideoQr.qr.code}.svg`}
                      className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white border border-[#c3c6d7] text-xs font-bold text-[#131b2e] hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5 text-purple-600" />
                      <span>SVG</span>
                    </a>

                    <Button
                      variant="outline"
                      onClick={() => handlePrintVideoLabel(selectedVideoQr.qr!, selectedVideoQr.video)}
                      className="flex items-center justify-center gap-1.5 h-auto py-2.5 px-3 rounded-xl border-[#c3c6d7] text-xs font-bold text-[#131b2e] hover:bg-slate-50 shadow-2xs cursor-pointer"
                    >
                      <Printer className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Print</span>
                    </Button>
                  </div>

                  {/* Test Scan / Open Link */}
                  <div className="pt-2 text-center">
                    <a
                      href={`/q/${selectedVideoQr.qr.code}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#004ac6] hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Test Scan Link (Open Video Viewer)
                    </a>
                  </div>
                </div>
              ) : (
                /* NO QR: Prompt to Generate */
                <div className="text-center py-4 space-y-4">
                  <div className="h-16 w-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-100 shadow-sm">
                    <QrCode className="h-8 w-8" />
                  </div>

                  <div>
                    <h4 className="font-extrabold text-base text-[#131b2e]">
                      No QR Code for this Video
                    </h4>
                    <p className="text-xs text-[#505f76] mt-1 max-w-sm mx-auto font-medium">
                      Generate a unique QR code for <strong className="text-[#131b2e]">"{selectedVideoQr.video.title}"</strong>.
                      Students can scan it with their phone camera or web scanner to autoplay this lesson instantly.
                    </p>
                  </div>

                  {/* Video Preview Snippet */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-left flex items-center gap-3">
                    {selectedVideoQr.video.thumbnailUrl && (
                      <img
                        src={selectedVideoQr.video.thumbnailUrl}
                        alt={selectedVideoQr.video.title}
                        className="w-16 h-11 object-cover rounded-lg shrink-0 border border-slate-200"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-extrabold text-[#131b2e] truncate">
                        {selectedVideoQr.video.title}
                      </p>
                      <p className="text-[11px] text-[#505f76] truncate font-medium">
                        {selectedVideoQr.video.bookTitle ? `Book: ${selectedVideoQr.video.bookTitle}` : "Standalone"}
                        {selectedVideoQr.video.chapterTitle ? ` | Ch: ${selectedVideoQr.video.chapterTitle}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      onClick={() => handleGenerateVideoQr(selectedVideoQr.video)}
                      disabled={isGeneratingQr}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md cursor-pointer gap-2"
                    >
                      {isGeneratingQr ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Generating Video QR...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" /> Generate Video QR Code
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
