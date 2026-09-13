"use client";

import React, { useState, useEffect, useMemo } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  Loader2,
  RefreshCw,
  X,
  GraduationCap,
  Globe,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Layers,
  BookMarked,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store/auth";

export interface BookOption {
  id: number | string;
  _id?: number | string;
  code?: string;
  title: string;
  class?: string;
  className?: string;
  subject?: string;
  subjectName?: string;
  language?: string;
}

export interface FilterOption {
  id: number | string;
  name: string;
  code?: string;
}

export interface Chapter {
  id: number | string;
  _id?: number | string;
  bookId: number | string;
  title: string;
  code?: string;
  chapterNumber?: number | string;
  orderNo?: number;
  description?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export default function ChaptersPage() {
  const { user } = useAuthStore();
  const isAdminOrTeacher =
    user?.role?.toLowerCase() === "admin" ||
    user?.role?.toLowerCase() === "teacher" ||
    user?.role?.toLowerCase() === "superadmin";

  // Master Data & Dropdowns
  const [books, setBooks] = useState<BookOption[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<string>("all");
  const [isLoadingBooks, setIsLoadingBooks] = useState<boolean>(true);

  // Dynamic Multi-Filters Master Lists
  const [classesList, setClassesList] = useState<FilterOption[]>([]);
  const [subjectsList, setSubjectsList] = useState<FilterOption[]>([]);
  const [languagesList, setLanguagesList] = useState<FilterOption[]>([]);

  // Active Filters State
  const [selectedClassId, setSelectedClassId] = useState<string>("all");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("all");
  const [selectedLanguageId, setSelectedLanguageId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Chapter List State
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoadingChapters, setIsLoadingChapters] = useState<boolean>(false);
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

  // Modals state
  const [isCreateEditOpen, setIsCreateEditOpen] = useState<boolean>(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
  const [chapterToDelete, setChapterToDelete] = useState<Chapter | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    chapterNumber: "",
    description: "",
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const getChapterId = (ch: Chapter): string | number => {
    return ch.id ?? ch._id ?? "";
  };

  // 1. Fetch Dynamic Master Dropdowns (Classes, Subjects, Languages)
  const fetchMasters = async () => {
    try {
      const [classRes, subRes, langRes] = await Promise.allSettled([
        api.get("/v1/classes", { params: { limit: 100 } }).catch(() => api.get("/api/v1/classes", { params: { limit: 100 } })),
        api.get("/v1/subjects", { params: { limit: 100 } }).catch(() => api.get("/api/v1/subjects", { params: { limit: 100 } })),
        api.get("/v1/languages", { params: { limit: 100 } }).catch(() => api.get("/api/v1/languages", { params: { limit: 100 } })),
      ]);

      if (classRes.status === "fulfilled" && classRes.value?.data) {
        const raw = classRes.value.data;
        const arr = Array.isArray(raw) ? raw : raw.data || [];
        setClassesList(arr.map((c: any) => ({ id: c.id ?? c._id, name: c.name || "Untitled Class", code: c.code })));
      }

      if (subRes.status === "fulfilled" && subRes.value?.data) {
        const raw = subRes.value.data;
        const arr = Array.isArray(raw) ? raw : raw.data || [];
        setSubjectsList(arr.map((s: any) => ({ id: s.id ?? s._id, name: s.name || "Untitled Subject", code: s.code })));
      }

      if (langRes.status === "fulfilled" && langRes.value?.data) {
        const raw = langRes.value.data;
        const arr = Array.isArray(raw) ? raw : raw.data || [];
        setLanguagesList(arr.map((l: any) => ({ id: l.id ?? l._id, name: l.name || "Untitled Language", code: l.code })));
      }
    } catch (err) {
      console.error("Failed to fetch filter master data:", err);
    }
  };

  // 2. Fetch Filtered Books Dropdown list based on Class, Subject, and Language filters
  const fetchFilteredBooks = async () => {
    try {
      setIsLoadingBooks(true);
      const params: Record<string, any> = { limit: 200 };
      if (selectedClassId && selectedClassId !== "all") params.classId = selectedClassId;
      if (selectedSubjectId && selectedSubjectId !== "all") params.subjectId = selectedSubjectId;
      if (selectedLanguageId && selectedLanguageId !== "all") params.languageId = selectedLanguageId;

      let booksRes: any = null;
      try {
        const res = await api.get("/v1/books", { params });
        booksRes = res.data;
      } catch {
        const res = await api.get("/api/v1/books", { params });
        booksRes = res.data;
      }

      const booksArray = Array.isArray(booksRes)
        ? booksRes
        : booksRes?.data || booksRes?.books || [];

      const normalized: BookOption[] = booksArray.map((b: any) => ({
        id: b.id ?? b._id,
        code: b.code || b.isbn || `BK-${b.id ?? b._id}`,
        title: b.title || "Untitled Book",
        class: b.class || b.className || "General",
        subject: b.subject || b.subjectName || "General",
        language: b.language || b.languageName || "English",
      }));

      setBooks(normalized);

      // Auto-set or preserve selectedBookId (supports ?bookId= from URL)
      if (normalized.length > 0) {
        const queryBookId = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("bookId") : null;
        const targetId = queryBookId || selectedBookId;
        const exists = normalized.some((b) => String(b.id) === String(targetId));
        if (exists) {
          setSelectedBookId(String(targetId));
        } else {
          setSelectedBookId(String(normalized[0].id));
        }
      } else {
        setSelectedBookId("all");
      }
    } catch (err) {
      console.error("Failed to fetch books catalog:", err);
    } finally {
      setIsLoadingBooks(false);
    }
  };

  // 3. Fetch Chapters using Backend API Contract: ?bookId={id}&classId={id}&subjectId={id}&languageId={id}&page=1&limit=10
  const fetchChapters = async (showRefreshToast = false) => {
    try {
      if (showRefreshToast) setIsRefreshing(true);
      else setIsLoadingChapters(true);

      const params: Record<string, any> = {
        page: currentPage,
        limit: itemsPerPage,
      };

      if (selectedBookId && selectedBookId !== "all") params.bookId = selectedBookId;
      if (selectedClassId && selectedClassId !== "all") params.classId = selectedClassId;
      if (selectedSubjectId && selectedSubjectId !== "all") params.subjectId = selectedSubjectId;
      if (selectedLanguageId && selectedLanguageId !== "all") params.languageId = selectedLanguageId;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      let chRes: any = null;
      try {
        const res = await api.get("/v1/chapters", { params });
        chRes = res.data;
      } catch {
        const res = await api.get("/api/v1/chapters", { params });
        chRes = res.data;
      }

      const rawArray = Array.isArray(chRes)
        ? chRes
        : chRes?.data || chRes?.chapters || [];

      // Extract pagination metadata
      const rawMeta = chRes?.meta || chRes?.pagination || {};
      const totalCount = rawMeta.total ?? chRes?.total ?? rawArray.length;
      const calcTotalPages = rawMeta.totalPages ?? Math.max(1, Math.ceil(totalCount / itemsPerPage));

      setMeta({
        total: totalCount,
        page: rawMeta.page ?? currentPage,
        limit: rawMeta.limit ?? itemsPerPage,
        totalPages: calcTotalPages,
        hasNextPage: rawMeta.hasNextPage ?? (currentPage < calcTotalPages),
        hasPrevPage: rawMeta.hasPrevPage ?? (currentPage > 1),
      });

      // Normalize chapters
      const normalized: Chapter[] = rawArray.map((ch: any, idx: number) => ({
        id: ch.id ?? ch._id,
        bookId: ch.bookId || selectedBookId,
        title: ch.title || "Untitled Chapter",
        code: ch.code || `CHP-${ch.id ?? idx + 1}`,
        chapterNumber: ch.chapterNumber ?? ch.orderNo ?? idx + 1,
        orderNo: ch.orderNo ?? Number(ch.chapterNumber) ?? idx + 1,
        description: ch.description || "",
        isActive: ch.isActive !== undefined ? ch.isActive : true,
        createdAt: ch.createdAt,
        updatedAt: ch.updatedAt,
      }));

      // Sort by sequence orderNo ascending
      normalized.sort((a, b) => (a.orderNo || 0) - (b.orderNo || 0));

      setChapters(normalized);

      if (showRefreshToast) {
        toast.success("Chapters list refreshed!");
      }
    } catch (err: any) {
      console.error("Failed to fetch chapters:", err);
      toast.error(err.response?.data?.message || "Failed to load chapters.");
    } finally {
      setIsLoadingChapters(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMasters();
  }, []);

  useEffect(() => {
    fetchFilteredBooks();
  }, [selectedClassId, selectedSubjectId, selectedLanguageId]);

  useEffect(() => {
    fetchChapters();
  }, [selectedBookId, selectedClassId, selectedSubjectId, selectedLanguageId, currentPage, itemsPerPage]);

  const selectedBookObj = useMemo(() => {
    return books.find((b) => String(b.id) === String(selectedBookId));
  }, [books, selectedBookId]);

  // Clientside search filter fallback
  const filteredChapters = useMemo(() => {
    return chapters.filter((ch) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        ch.title.toLowerCase().includes(q) ||
        (ch.code && ch.code.toLowerCase().includes(q)) ||
        (ch.description && ch.description.toLowerCase().includes(q)) ||
        String(ch.chapterNumber).includes(q)
      );
    });
  }, [chapters, searchQuery]);

  // Search submit or enter
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setCurrentPage(1);
      fetchChapters();
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedClassId("all");
    setSelectedSubjectId("all");
    setSelectedLanguageId("all");
    setSelectedBookId("all");
    setCurrentPage(1);
  };

  // Reorder sequence Move Up / Move Down
  const handleMoveSequence = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= chapters.length) return;

    const updated = [...chapters];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    // Re-assign sequential orderNo
    const reorderedPayload = updated.map((ch, idx) => ({
      ...ch,
      orderNo: idx + 1,
    }));

    setChapters(reorderedPayload);
    setIsReordering(true);

    try {
      const apiPayload = {
        bookId: selectedBookId !== "all" ? selectedBookId : undefined,
        chapters: reorderedPayload.map((ch) => ({
          id: getChapterId(ch),
          orderNo: ch.orderNo,
        })),
      };

      try {
        await api.post("/v1/chapters/reorder", apiPayload);
      } catch {
        await api.post("/api/v1/chapters/reorder", apiPayload);
      }

      toast.success("Chapter sequence updated successfully!");
    } catch (err: any) {
      console.error("Failed to reorder chapters:", err);
      toast.error(err.response?.data?.message || "Failed to update sequence order.");
      fetchChapters(); // Revert on failure
    } finally {
      setIsReordering(false);
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingChapter(null);
    setFormData({
      title: "",
      chapterNumber: String(chapters.length + 1),
      description: "",
      isActive: true,
    });
    setIsCreateEditOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (ch: Chapter) => {
    setEditingChapter(ch);
    setFormData({
      title: ch.title || "",
      chapterNumber: String(ch.chapterNumber || ch.orderNo || ""),
      description: ch.description || "",
      isActive: ch.isActive !== false,
    });
    setIsCreateEditOpen(true);
  };

  // Submit Create or Edit Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Chapter Title is required.");
      return;
    }

    setIsSubmitting(true);
    const payload = {
      title: formData.title.trim(),
      bookId: selectedBookId !== "all" ? selectedBookId : undefined,
      chapterNumber: formData.chapterNumber.trim() ? Number(formData.chapterNumber) : undefined,
      description: formData.description.trim() || undefined,
      isActive: formData.isActive,
    };

    try {
      if (editingChapter) {
        const chId = getChapterId(editingChapter);
        try {
          await api.put(`/v1/chapters/${chId}`, payload);
        } catch {
          await api.put(`/api/v1/chapters/${chId}`, payload);
        }
        toast.success("Chapter updated successfully!");
      } else {
        try {
          await api.post("/v1/chapters", payload);
        } catch {
          await api.post("/api/v1/chapters", payload);
        }
        toast.success("Chapter created successfully!");
      }

      setIsCreateEditOpen(false);
      fetchChapters();
    } catch (err: any) {
      console.error("Failed to save chapter:", err);
      toast.error(err.response?.data?.message || "Failed to save chapter.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Delete Modal
  const handleOpenDeleteModal = (ch: Chapter) => {
    setChapterToDelete(ch);
    setIsDeleteOpen(true);
  };

  // Submit Delete
  const handleDeleteConfirm = async () => {
    if (!chapterToDelete) return;
    setIsDeleting(true);
    const chId = getChapterId(chapterToDelete);

    try {
      try {
        await api.delete(`/v1/chapters/${chId}`);
      } catch {
        await api.delete(`/api/v1/chapters/${chId}`);
      }

      toast.success("Chapter deleted successfully!");
      setIsDeleteOpen(false);
      setChapterToDelete(null);
      fetchChapters();
    } catch (err: any) {
      console.error("Failed to delete chapter:", err);
      toast.error(err.response?.data?.message || "Failed to delete chapter.");
    } finally {
      setIsDeleting(false);
    }
  };

  const isFilterActive =
    searchQuery !== "" ||
    selectedClassId !== "all" ||
    selectedSubjectId !== "all" ||
    selectedLanguageId !== "all" ||
    selectedBookId !== "all";

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
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#131b2e]">
                  Chapter Management
                </h1>
                <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-[#004ac6]/10 text-[#004ac6] border border-[#004ac6]/20">
                  {meta.total} Chapters
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#505f76] font-medium mt-1 max-w-2xl">
                Organize book chapters, sequence syllabus topics, and manage learning content order.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="outline"
              onClick={() => fetchChapters(true)}
              disabled={isRefreshing || isLoadingChapters}
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
                Add New Chapter
              </Button>
            )}
          </div>
        </div>

        {/* Primary Book Selector Dropdown & Badge Bar */}
        <div className="mt-6 pt-6 border-t border-[#c3c6d7]/30 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-6 space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#505f76]">
              Filtered Book Selection ({books.length} Books)
            </label>
            <div className="relative">
              <select
                value={selectedBookId}
                onChange={(e) => {
                  setSelectedBookId(e.target.value);
                  setCurrentPage(1);
                }}
                disabled={isLoadingBooks}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#004ac6]/40 focus:outline-none focus:border-[#004ac6] focus:ring-2 focus:ring-[#004ac6]/10 bg-white font-bold text-[#131b2e] cursor-pointer shadow-2xs"
              >
                <option value="all">All Books Catalog ({books.length})</option>
                {books.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title} ({b.class} • {b.subject})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Selected Book Info Pills */}
          {selectedBookObj && (
            <div className="md:col-span-6 flex flex-wrap items-center gap-2 md:justify-end">
              <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-[#c3c6d7]/40 text-xs flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-[#004ac6]" />
                <span className="font-extrabold text-[#131b2e]">{selectedBookObj.title}</span>
              </div>
              <div className="bg-[#eaedff] px-2.5 py-1 rounded-lg text-xs font-bold text-[#004ac6] flex items-center gap-1">
                <GraduationCap className="h-3.5 w-3.5" />
                {selectedBookObj.class}
              </div>
              <div className="bg-purple-50 px-2.5 py-1 rounded-lg text-xs font-bold text-purple-700 flex items-center gap-1">
                <BookMarked className="h-3.5 w-3.5" />
                {selectedBookObj.subject}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Multi-Filter Bar: Search, Class, Subject, Language */}
      <div className="bg-white rounded-2xl border border-[#c3c6d7]/40 p-4 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          {/* Search Bar */}
          <div className="lg:col-span-4 relative">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search chapters (Press Enter to search)..."
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
                  fetchChapters();
                }}
                className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Class Dropdown Filter (Filters Books Catalog & Chapters) */}
          <div className="lg:col-span-2 relative">
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#c3c6d7]/60 focus:outline-none focus:border-[#004ac6] bg-[#faf8ff] font-medium appearance-none cursor-pointer"
            >
              <option value="all">All Classes</option>
              {classesList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Dropdown Filter (Filters Books Catalog & Chapters) */}
          <div className="lg:col-span-2 relative">
            <select
              value={selectedSubjectId}
              onChange={(e) => {
                setSelectedSubjectId(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#c3c6d7]/60 focus:outline-none focus:border-[#004ac6] bg-[#faf8ff] font-medium appearance-none cursor-pointer"
            >
              <option value="all">All Subjects</option>
              {subjectsList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Language Dropdown Filter (Filters Books Catalog & Chapters) */}
          <div className="lg:col-span-2 relative">
            <select
              value={selectedLanguageId}
              onChange={(e) => {
                setSelectedLanguageId(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#c3c6d7]/60 focus:outline-none focus:border-[#004ac6] bg-[#faf8ff] font-medium appearance-none cursor-pointer"
            >
              <option value="all">All Languages</option>
              {languagesList.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters Button */}
          <div className="lg:col-span-2">
            <Button
              variant="outline"
              onClick={handleResetFilters}
              disabled={!isFilterActive}
              className="w-full border-[#c3c6d7] text-[#505f76] hover:bg-[#eaedff] text-xs font-semibold cursor-pointer h-9"
            >
              <Filter className="h-3.5 w-3.5 mr-1.5" />
              Reset Filters
            </Button>
          </div>
        </div>

        {/* Filter Summary */}
        {isFilterActive && (
          <div className="flex items-center justify-between pt-2 border-t border-[#c3c6d7]/20 text-xs font-semibold text-[#505f76]">
            <span>
              Showing filtered chapter results (Total: <strong className="text-[#004ac6]">{meta.total}</strong>)
            </span>
            <span className="text-[11px] text-zinc-400">Book & Filter Controls Active</span>
          </div>
        )}
      </div>

      {/* 3. Chapters Data Table */}
      <div className="bg-white rounded-2xl border border-[#c3c6d7]/40 shadow-sm overflow-hidden">
        {isLoadingChapters ? (
          /* Loading Skeleton */
          <div className="p-4 space-y-3.5">
            <div className="h-10 bg-zinc-100 animate-pulse rounded-xl" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((idx) => (
                <div key={idx} className="h-14 bg-zinc-50 animate-pulse rounded-xl border border-zinc-100 flex items-center justify-between px-4">
                  <div className="h-6 w-12 bg-zinc-200 rounded-md" />
                  <div className="h-4 w-48 bg-zinc-200 rounded" />
                  <div className="h-6 w-20 bg-zinc-200 rounded-full" />
                  <div className="h-8 w-28 bg-zinc-200 rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        ) : filteredChapters.length === 0 ? (
          /* Empty State */
          <div className="py-10 px-4 text-center space-y-3">
            <div className="h-16 w-16 rounded-2xl bg-[#eaedff] text-[#004ac6] flex items-center justify-center mx-auto">
              <Layers className="h-8 w-8" />
            </div>
            <h3 className="text-base font-extrabold text-[#131b2e]">
              No Chapters Found
            </h3>
            <p className="text-xs text-[#505f76] max-w-md mx-auto font-medium">
              {isFilterActive
                ? "No chapters match your search or filter criteria for the selected book."
                : "No chapters have been added to the catalog yet."}
            </p>
            <div className="pt-2">
              {isFilterActive ? (
                <Button
                  variant="outline"
                  onClick={handleResetFilters}
                  className="border-[#c3c6d7] text-[#004ac6] font-semibold"
                >
                  Reset All Filters
                </Button>
              ) : (
                isAdminOrTeacher && (
                  <Button
                    onClick={handleOpenCreateModal}
                    className="bg-[#004ac6] hover:bg-[#003cb0] text-white font-semibold"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Chapter
                  </Button>
                )
              )}
            </div>
          </div>
        ) : (
          /* Table View */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#faf8ff] border-b border-[#c3c6d7]/30 text-[11px] font-extrabold uppercase tracking-wider text-[#505f76]">
                  <th className="py-2.5 px-4 w-24">Order #</th>
                  <th className="py-2.5 px-4">Code</th>
                  <th className="py-2.5 px-4">Chapter Title & Description</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c3c6d7]/20 text-xs">
                {filteredChapters.map((ch, idx) => {
                  const chId = getChapterId(ch);

                  return (
                    <tr
                      key={chId}
                      className="hover:bg-[#f4f7ff]/60 transition-colors group"
                    >
                      {/* Sequence Order Number */}
                      <td className="py-2.5 px-4">
                        <span className="h-7 w-7 rounded-lg bg-[#004ac6]/10 text-[#004ac6] font-black text-xs flex items-center justify-center border border-[#004ac6]/20">
                          {ch.orderNo || ch.chapterNumber || idx + 1}
                        </span>
                      </td>

                      {/* Code Badge */}
                      <td className="py-2.5 px-4 font-mono font-bold">
                        <span className="px-2.5 py-1 rounded-lg bg-[#eaedff] text-[#004ac6] border border-[#004ac6]/20">
                          {ch.code || `CHP-${ch.orderNo || idx + 1}`}
                        </span>
                      </td>

                      {/* Title & Description */}
                      <td className="py-2.5 px-4 max-w-md">
                        <p className="font-extrabold text-[#131b2e] text-sm group-hover:text-[#004ac6] transition-colors">
                          {ch.title}
                        </p>
                        {ch.description ? (
                          <p className="text-xs text-[#505f76] truncate mt-0.5 font-medium">
                            {ch.description}
                          </p>
                        ) : (
                          <span className="text-[11px] text-zinc-400 italic">No description</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-4">
                        {ch.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <XCircle className="h-3.5 w-3.5 text-amber-600" />
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Actions (Reorder Up/Down, Edit, Delete) */}
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Reorder Buttons */}
                          {isAdminOrTeacher && (
                            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/80 mr-1">
                              <button
                                onClick={() => handleMoveSequence(idx, "up")}
                                disabled={idx === 0 || isReordering}
                                className="p-1 text-slate-600 hover:text-[#004ac6] disabled:opacity-30 disabled:hover:text-slate-600 cursor-pointer"
                                title="Move Up"
                              >
                                <ArrowUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleMoveSequence(idx, "down")}
                                disabled={idx === filteredChapters.length - 1 || isReordering}
                                className="p-1 text-slate-600 hover:text-[#004ac6] disabled:opacity-30 disabled:hover:text-slate-600 cursor-pointer"
                                title="Move Down"
                              >
                                <ArrowDown className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}

                          {isAdminOrTeacher && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEditModal(ch)}
                                className="h-8 w-8 p-0 text-slate-600 hover:text-[#004ac6] hover:bg-slate-100 rounded-lg cursor-pointer"
                                title="Edit Chapter"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDeleteModal(ch)}
                                className="h-8 w-8 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                                title="Delete Chapter"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Server-Side Pagination Bar */}
      {chapters.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#c3c6d7]/40 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs text-[#505f76] font-semibold">
            <span>
              Showing <strong className="text-[#131b2e]">{startIndex}</strong> to{" "}
              <strong className="text-[#131b2e]">{endIndex}</strong> of{" "}
              <strong className="text-[#004ac6]">{meta.total}</strong> chapters
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

      {/* MODAL 1: Create / Edit Chapter Modal */}
      {isCreateEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-[#c3c6d7]/40 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#c3c6d7]/30 bg-[#faf8ff]">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-[#004ac6]/10 text-[#004ac6] flex items-center justify-center font-bold">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-[#131b2e]">
                    {editingChapter ? "Edit Chapter" : "Add New Chapter"}
                  </h2>
                  <p className="text-xs text-[#505f76]">
                    {selectedBookObj ? `Pre-linked to "${selectedBookObj.title}"` : "Create new chapter record"}
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

            {/* Modal Form */}
            <form onSubmit={handleSubmitForm} className="p-4 space-y-3.5">
              {/* Title (Required) */}
              <div>
                <label className="block text-xs font-bold text-[#131b2e] mb-1">
                  Chapter Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chapter 1: Introduction to Calculus"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#c3c6d7]/60 focus:outline-none focus:border-[#004ac6] bg-[#faf8ff] font-medium"
                />
              </div>

              {/* Chapter Sequence Number (Optional) */}
              <div>
                <label className="block text-xs font-bold text-[#131b2e] mb-1">
                  Sequence / Chapter Number <span className="text-zinc-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="number"
                  placeholder="1"
                  value={formData.chapterNumber}
                  onChange={(e) => setFormData({ ...formData, chapterNumber: e.target.value })}
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
                  placeholder="Provide a brief summary of topics covered in this chapter..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#c3c6d7]/60 focus:outline-none focus:border-[#004ac6] bg-[#faf8ff] font-medium"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#faf8ff] border border-[#c3c6d7]/30">
                <div>
                  <p className="text-xs font-bold text-[#131b2e]">Active Status</p>
                  <p className="text-[11px] text-[#505f76]">
                    Enable or disable visibility for students & teachers.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  className={`h-6 w-11 rounded-full transition-colors p-0.5 relative cursor-pointer ${
                    formData.isActive ? "bg-emerald-500" : "bg-zinc-300"
                  }`}
                >
                  <span
                    className={`block h-5 w-5 rounded-full bg-white shadow-md transform transition-transform ${
                      formData.isActive ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Form Action Buttons */}
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
                  ) : editingChapter ? (
                    "Update Chapter"
                  ) : (
                    "Create Chapter"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Delete Confirmation Modal */}
      {isDeleteOpen && chapterToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-[#c3c6d7]/40 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 md:p-5 text-center space-y-3.5">
              <div className="h-12 w-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-[#131b2e]">Delete Chapter?</h3>
                <p className="text-xs text-[#505f76] mt-1 font-medium">
                  Are you sure you want to delete <strong className="text-[#131b2e]">"{chapterToDelete.title}"</strong> ({chapterToDelete.code})? This will permanently remove the chapter and associated lesson materials.
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
    </div>
  );
}
