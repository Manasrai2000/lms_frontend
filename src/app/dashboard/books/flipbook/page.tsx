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
  BookMarked,
  BookCheck,
  Maximize2,
  LayoutGrid,
  List,
  ExternalLink,
  FileText,
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
  coverImage?: string;
}

export interface FilterOption {
  id: number | string;
  name: string;
  code?: string;
}

export interface FlipbookItem {
  id: number | string;
  _id?: number | string;
  title: string;
  fileUrl: string;
  code?: string;
  bookId?: number | string;
  bookTitle?: string;
  className?: string;
  subjectName?: string;
  coverImage?: string;
  description?: string;
  isActive?: boolean;
  createdAt?: string;
}

export default function FlipbookPage() {
  const { user } = useAuthStore();
  const isAdminOrTeacher =
    user?.role?.toLowerCase() === "admin" ||
    user?.role?.toLowerCase() === "teacher" ||
    user?.role?.toLowerCase() === "superadmin";

  // Master Data & Dropdowns
  const [books, setBooks] = useState<BookOption[]>([]);
  const [classesList, setClassesList] = useState<FilterOption[]>([]);
  const [subjectsList, setSubjectsList] = useState<FilterOption[]>([]);
  const [languagesList, setLanguagesList] = useState<FilterOption[]>([]);

  // Selected Filters State
  const [selectedBookId, setSelectedBookId] = useState<string>("all");
  const [selectedClassId, setSelectedClassId] = useState<string>("all");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("all");
  const [selectedLanguageId, setSelectedLanguageId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // View Mode Layout
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Flipbooks List State
  const [flipbooks, setFlipbooks] = useState<FlipbookItem[]>([]);
  const [isLoadingMaster, setIsLoadingMaster] = useState<boolean>(true);
  const [isLoadingFlipbooks, setIsLoadingFlipbooks] = useState<boolean>(false);
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

  // Reader Modal State
  const [readingFlipbook, setReadingFlipbook] = useState<FlipbookItem | null>(null);

  // Modals state
  const [isCreateEditOpen, setIsCreateEditOpen] = useState<boolean>(false);
  const [editingFlipbook, setEditingFlipbook] = useState<FlipbookItem | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
  const [flipbookToDelete, setFlipbookToDelete] = useState<FlipbookItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    fileUrl: "",
    bookId: "",
    code: "",
    coverImage: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const getFlipbookIdStr = (fb: FlipbookItem): string | number => {
    return fb.id ?? fb._id ?? "";
  };

  // 1. Fetch Dynamic Master Dropdowns (Books, Classes, Subjects, Languages)
  const fetchFilterMasters = async () => {
    try {
      setIsLoadingMaster(true);
      const [classRes, subRes, langRes, booksRes] = await Promise.allSettled([
        api.get("/v1/classes", { params: { limit: 100 } }).catch(() => api.get("/api/v1/classes", { params: { limit: 100 } })),
        api.get("/v1/subjects", { params: { limit: 100 } }).catch(() => api.get("/api/v1/subjects", { params: { limit: 100 } })),
        api.get("/v1/languages", { params: { limit: 100 } }).catch(() => api.get("/api/v1/languages", { params: { limit: 100 } })),
        api.get("/v1/books", { params: { limit: 200 } }).catch(() => api.get("/api/v1/books", { params: { limit: 200 } })),
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

      if (booksRes.status === "fulfilled" && booksRes.value?.data) {
        const raw = booksRes.value.data;
        const booksArray = Array.isArray(raw) ? raw : raw.data || raw.books || [];
        const normalized: BookOption[] = booksArray.map((b: any) => ({
          id: b.id ?? b._id,
          code: b.code || b.isbn || `BK-${b.id ?? b._id}`,
          title: b.title || "Untitled Book",
          class: b.class || b.className || "General",
          subject: b.subject || b.subjectName || "General",
          coverImage: b.coverImage || b.coverUrl,
        }));
        setBooks(normalized);
        const queryBookId = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("bookId") : null;
        if (queryBookId && normalized.some((b) => String(b.id) === String(queryBookId))) {
          setSelectedBookId(String(queryBookId));
        }
      }
    } catch (err) {
      console.error("Failed to fetch master data:", err);
      toast.error("Failed to load filter choices.");
    } finally {
      setIsLoadingMaster(false);
    }
  };

  // 2. Fetch Flipbooks List: GET /api/v1/flipbooks?bookId={id}&classId={id}&subjectId={id}&languageId={id}&page=1&limit=10
  const fetchFlipbooks = async (showRefreshToast = false) => {
    try {
      if (showRefreshToast) setIsRefreshing(true);
      else setIsLoadingFlipbooks(true);

      const params: Record<string, any> = {
        page: currentPage,
        limit: itemsPerPage,
      };

      if (selectedBookId && selectedBookId !== "all") params.bookId = selectedBookId;
      if (selectedClassId && selectedClassId !== "all") params.classId = selectedClassId;
      if (selectedSubjectId && selectedSubjectId !== "all") params.subjectId = selectedSubjectId;
      if (selectedLanguageId && selectedLanguageId !== "all") params.languageId = selectedLanguageId;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      let fbRes: any = null;
      try {
        const res = await api.get("/v1/flipbooks", { params });
        fbRes = res.data;
      } catch {
        const res = await api.get("/api/v1/flipbooks", { params });
        fbRes = res.data;
      }

      const rawArray = Array.isArray(fbRes)
        ? fbRes
        : fbRes?.data || fbRes?.flipbooks || [];

      // Extract pagination metadata
      const rawMeta = fbRes?.meta || fbRes?.pagination || {};
      const totalCount = rawMeta.total ?? fbRes?.total ?? rawArray.length;
      const calcTotalPages = rawMeta.totalPages ?? Math.max(1, Math.ceil(totalCount / itemsPerPage));

      setMeta({
        total: totalCount,
        page: rawMeta.page ?? currentPage,
        limit: rawMeta.limit ?? itemsPerPage,
        totalPages: calcTotalPages,
        hasNextPage: rawMeta.hasNextPage ?? (currentPage < calcTotalPages),
        hasPrevPage: rawMeta.hasPrevPage ?? (currentPage > 1),
      });

      // Normalize Flipbooks
      const normalized: FlipbookItem[] = rawArray.map((f: any, idx: number) => ({
        id: f.id ?? f._id,
        title: f.title || "Untitled Digital Flipbook",
        fileUrl: f.fileUrl || f.url || f.pdfUrl || "",
        code: f.code || `FB-${f.id ?? idx + 101}`,
        bookId: f.bookId || selectedBookId,
        bookTitle: f.bookTitle || f.book?.title || "Academic Publication",
        className: f.className || f.book?.className || f.class || "Standard",
        subjectName: f.subjectName || f.book?.subjectName || f.subject || "General",
        coverImage: f.coverImage || f.book?.coverImage,
        description: f.description || "",
        isActive: f.isActive !== false,
        createdAt: f.createdAt,
      }));

      setFlipbooks(normalized);

      if (showRefreshToast) {
        toast.success("Flipbooks list refreshed!");
      }
    } catch (err: any) {
      console.error("Failed to fetch flipbooks:", err);
      toast.error(err.response?.data?.message || "Failed to load flipbooks catalog.");
    } finally {
      setIsLoadingFlipbooks(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFilterMasters();
  }, []);

  useEffect(() => {
    fetchFlipbooks();
  }, [selectedBookId, selectedClassId, selectedSubjectId, selectedLanguageId, currentPage, itemsPerPage]);

  const selectedBookObj = useMemo(() => {
    return books.find((b) => String(b.id) === String(selectedBookId));
  }, [books, selectedBookId]);

  // Search filter keydown
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setCurrentPage(1);
      fetchFlipbooks();
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedBookId("all");
    setSelectedClassId("all");
    setSelectedSubjectId("all");
    setSelectedLanguageId("all");
    setCurrentPage(1);
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingFlipbook(null);
    setFormData({
      title: "",
      fileUrl: "",
      bookId: selectedBookId !== "all" ? selectedBookId : books[0]?.id ? String(books[0].id) : "",
      code: `FB-${Math.floor(100 + Math.random() * 900)}`,
      coverImage: "",
      description: "",
    });
    setIsCreateEditOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (fb: FlipbookItem) => {
    setEditingFlipbook(fb);
    setFormData({
      title: fb.title || "",
      fileUrl: fb.fileUrl || "",
      bookId: fb.bookId ? String(fb.bookId) : selectedBookId !== "all" ? selectedBookId : "",
      code: fb.code || "",
      coverImage: fb.coverImage || "",
      description: fb.description || "",
    });
    setIsCreateEditOpen(true);
  };

  // Submit Create or Edit Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.fileUrl.trim()) {
      toast.error("Flipbook Title and PDF/Flipbook File URL are required.");
      return;
    }

    setIsSubmitting(true);
    const payload = {
      title: formData.title.trim(),
      fileUrl: formData.fileUrl.trim(),
      bookId: formData.bookId || undefined,
      code: formData.code.trim() || undefined,
      coverImage: formData.coverImage.trim() || undefined,
      description: formData.description.trim() || undefined,
    };

    try {
      if (editingFlipbook) {
        const fbId = getFlipbookIdStr(editingFlipbook);
        try {
          await api.put(`/v1/flipbooks/${fbId}`, payload);
        } catch {
          await api.put(`/api/v1/flipbooks/${fbId}`, payload);
        }
        toast.success("Flipbook updated successfully!");
      } else {
        try {
          await api.post("/v1/flipbooks", payload);
        } catch {
          await api.post("/api/v1/flipbooks", payload);
        }
        toast.success("New digital flipbook created successfully!");
      }

      setIsCreateEditOpen(false);
      fetchFlipbooks();
    } catch (err: any) {
      console.error("Failed to save flipbook:", err);
      toast.error(err.response?.data?.message || "Failed to save flipbook.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Delete Modal
  const handleOpenDeleteModal = (fb: FlipbookItem) => {
    setFlipbookToDelete(fb);
    setIsDeleteOpen(true);
  };

  // Submit Delete
  const handleDeleteConfirm = async () => {
    if (!flipbookToDelete) return;
    setIsDeleting(true);
    const fbId = getFlipbookIdStr(flipbookToDelete);

    try {
      try {
        await api.delete(`/v1/flipbooks/${fbId}`);
      } catch {
        await api.delete(`/api/v1/flipbooks/${fbId}`);
      }

      toast.success("Flipbook deleted successfully!");
      setIsDeleteOpen(false);
      setFlipbookToDelete(null);
      fetchFlipbooks();
    } catch (err: any) {
      console.error("Failed to delete flipbook:", err);
      toast.error(err.response?.data?.message || "Failed to delete flipbook.");
    } finally {
      setIsDeleting(false);
    }
  };

  const isFilterActive =
    searchQuery !== "" ||
    selectedBookId !== "all" ||
    selectedClassId !== "all" ||
    selectedSubjectId !== "all" ||
    selectedLanguageId !== "all";

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
              <BookCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#131b2e]">
                  Flipbook & PDF Library
                </h1>
                <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-[#004ac6]/10 text-[#004ac6] border border-[#004ac6]/20">
                  {meta.total} Flipbooks
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#505f76] font-medium mt-1 max-w-2xl">
                Browse interactive digital flipbooks, preview textbook PDFs, and read digital publications online.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="outline"
              onClick={() => fetchFlipbooks(true)}
              disabled={isRefreshing || isLoadingFlipbooks}
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
                Add Flipbook
              </Button>
            )}
          </div>
        </div>

        {/* Selected Context Badge */}
        {selectedBookObj && (
          <div className="mt-6 pt-4 border-t border-[#c3c6d7]/30 flex items-center gap-2">
            <span className="text-xs font-bold text-[#505f76]">Active Book Focus:</span>
            <div className="bg-white/90 px-3 py-1 rounded-xl border border-[#c3c6d7]/40 text-xs font-extrabold text-[#131b2e] flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-[#004ac6]" />
              {selectedBookObj.title} ({selectedBookObj.class} • {selectedBookObj.subject})
            </div>
          </div>
        )}
      </div>

      {/* 2. Multi-Filter Bar: Search, Book, Class, Subject, Language */}
      <div className="bg-white rounded-2xl border border-[#c3c6d7]/40 p-4 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          {/* Search Input */}
          <div className="lg:col-span-3 relative">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search title or code (Press Enter)..."
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
                  fetchFlipbooks();
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
              disabled={isLoadingMaster}
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

          {/* Class Dropdown */}
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

          {/* Subject Dropdown */}
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

      {/* 3. Flipbook Cards Grid / Table View */}
      {isLoadingFlipbooks ? (
        /* Skeleton Loading */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-[#c3c6d7]/40 p-3.5 sm:p-4 space-y-3.5 animate-pulse shadow-xs">
              <div className="h-48 bg-zinc-200 rounded-xl" />
              <div className="h-4 w-3/4 bg-zinc-200 rounded" />
              <div className="h-3 w-1/2 bg-zinc-200 rounded" />
            </div>
          ))}
        </div>
      ) : flipbooks.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-[#c3c6d7]/40 p-4 md:p-5 text-center space-y-3 shadow-sm">
          <div className="h-16 w-16 rounded-2xl bg-[#eaedff] text-[#004ac6] flex items-center justify-center mx-auto">
            <BookCheck className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[#131b2e]">
              No Flipbooks Available
            </h3>
            <p className="text-xs text-[#505f76] max-w-md mx-auto font-medium mt-1">
              {isFilterActive
                ? "No digital flipbooks match your active search or dropdown filters."
                : "No flipbooks have been published for this book yet."}
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
                  Add First Flipbook
                </Button>
              )
            )}
          </div>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW CARDS */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {flipbooks.map((fb) => (
            <div
              key={getFlipbookIdStr(fb)}
              className="bg-white rounded-2xl border border-[#c3c6d7]/40 overflow-hidden shadow-sm hover:shadow-md hover:border-[#004ac6]/40 transition-all group flex flex-col justify-between"
            >
              <div>
                {/* Cover Image Container */}
                <div className="relative h-48 bg-gradient-to-br from-[#131b2e] to-[#1e293b] overflow-hidden group">
                  {fb.coverImage ? (
                    <img
                      src={fb.coverImage}
                      alt={fb.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 p-4 space-y-2 text-center">
                      <BookOpen className="h-12 w-12 text-[#004ac6]" />
                      <span className="text-xs font-bold text-slate-200 line-clamp-1">{fb.title}</span>
                    </div>
                  )}

                  {/* Top Badges (Code + Read Overlay) */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                    <span className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-white text-[10px] font-mono font-bold border border-white/20">
                      {fb.code || `FB-${getFlipbookIdStr(fb)}`}
                    </span>
                  </div>

                  {/* Read Overlay Button */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={() => setReadingFlipbook(fb)}
                      className="h-12 px-5 rounded-xl bg-[#004ac6] text-white font-extrabold text-xs flex items-center gap-2 shadow-xl transform group-hover:scale-105 transition-transform cursor-pointer"
                    >
                      <BookOpen className="h-4 w-4" /> Open Flipbook
                    </button>
                  </div>
                </div>

                {/* Flipbook Metadata */}
                <div className="p-3.5 sm:p-4 space-y-2.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {fb.bookTitle && (
                      <span className="px-2 py-0.5 rounded-md bg-[#eaedff] text-[#004ac6] text-[10px] font-extrabold border border-[#004ac6]/15">
                        {fb.bookTitle}
                      </span>
                    )}
                    {fb.className && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-extrabold border border-emerald-200">
                        {fb.className}
                      </span>
                    )}
                    {fb.subjectName && (
                      <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-extrabold border border-purple-200">
                        {fb.subjectName}
                      </span>
                    )}
                  </div>

                  <h3
                    onClick={() => setReadingFlipbook(fb)}
                    className="font-extrabold text-[#131b2e] text-base line-clamp-2 hover:text-[#004ac6] transition-colors cursor-pointer"
                  >
                    {fb.title}
                  </h3>

                  {fb.description ? (
                    <p className="text-xs text-[#505f76] line-clamp-2 font-medium">
                      {fb.description}
                    </p>
                  ) : (
                    <p className="text-xs text-zinc-400 italic">No description provided</p>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="px-5 py-3.5 bg-[#faf8ff] border-t border-[#c3c6d7]/30 flex items-center justify-between">
                <Button
                  size="sm"
                  onClick={() => setReadingFlipbook(fb)}
                  className="bg-[#004ac6] hover:bg-[#003cb0] text-white text-xs font-semibold h-8 px-3 cursor-pointer shadow-2xs"
                >
                  <BookOpen className="h-3.5 w-3.5 mr-1.5" /> Read
                </Button>

                {isAdminOrTeacher && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEditModal(fb)}
                      className="h-8 w-8 p-0 text-slate-600 hover:text-[#004ac6] hover:bg-slate-100 rounded-lg cursor-pointer"
                      title="Edit Flipbook"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDeleteModal(fb)}
                      className="h-8 w-8 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                      title="Delete Flipbook"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
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
                  <th className="py-2.5 px-4">Code</th>
                  <th className="py-2.5 px-4">Flipbook Title</th>
                  <th className="py-2.5 px-4">Associated Book</th>
                  <th className="py-2.5 px-4">Class & Subject</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c3c6d7]/20 text-xs">
                {flipbooks.map((fb) => (
                  <tr key={getFlipbookIdStr(fb)} className="hover:bg-[#f4f7ff]/60 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-bold">
                      <span className="px-2.5 py-1 rounded-lg bg-[#eaedff] text-[#004ac6] border border-[#004ac6]/20">
                        {fb.code || `FB-${getFlipbookIdStr(fb)}`}
                      </span>
                    </td>

                    <td className="py-2.5 px-4 max-w-sm">
                      <p
                        onClick={() => setReadingFlipbook(fb)}
                        className="font-extrabold text-[#131b2e] hover:text-[#004ac6] transition-colors cursor-pointer text-sm"
                      >
                        {fb.title}
                      </p>
                      {fb.description && (
                        <p className="text-xs text-[#505f76] truncate mt-0.5">{fb.description}</p>
                      )}
                    </td>

                    <td className="py-2.5 px-4 font-bold text-[#131b2e]">
                      {fb.bookTitle || "—"}
                    </td>

                    <td className="py-2.5 px-4 text-xs font-semibold text-[#505f76]">
                      {fb.className} • {fb.subjectName}
                    </td>

                    <td className="py-2.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setReadingFlipbook(fb)}
                          className="h-8 px-2.5 text-[#004ac6] hover:bg-[#eaedff] font-semibold text-xs cursor-pointer"
                        >
                          <BookOpen className="h-3.5 w-3.5 mr-1" /> Open Reader
                        </Button>

                        {isAdminOrTeacher && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEditModal(fb)}
                              className="h-8 w-8 p-0 text-slate-600 hover:text-[#004ac6] hover:bg-slate-100 rounded-lg cursor-pointer"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDeleteModal(fb)}
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
      {flipbooks.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#c3c6d7]/40 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs text-[#505f76] font-semibold">
            <span>
              Showing <strong className="text-[#131b2e]">{startIndex}</strong> to{" "}
              <strong className="text-[#131b2e]">{endIndex}</strong> of{" "}
              <strong className="text-[#004ac6]">{meta.total}</strong> digital flipbooks
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

      {/* FULLSCREEN FLIPBOOK / PDF READER MODAL */}
      {readingFlipbook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-6xl h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 text-white">
            {/* Reader Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950 shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-[#004ac6] text-white flex items-center justify-center font-bold">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">{readingFlipbook.title}</h3>
                  <p className="text-xs text-slate-400">
                    Code: {readingFlipbook.code} • {readingFlipbook.bookTitle || "Textbook Reader"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {readingFlipbook.fileUrl && (
                  <a
                    href={readingFlipbook.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-slate-300 hover:text-white flex items-center gap-1 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700"
                  >
                    Open External <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}

                <button
                  onClick={() => setReadingFlipbook(null)}
                  className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Responsive Iframe Reader Container */}
            <div className="flex-1 bg-slate-950 relative">
              {readingFlipbook.fileUrl ? (
                <iframe
                  src={readingFlipbook.fileUrl}
                  title={readingFlipbook.title}
                  className="w-full h-full border-0"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center space-y-3">
                  <FileText className="h-12 w-12 text-slate-500" />
                  <p className="text-sm font-bold text-slate-300">No Document File URL Configured</p>
                  <p className="text-xs text-slate-500 max-w-sm">
                    This flipbook record has no active PDF or digital flipbook link attached.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Create / Edit Flipbook Modal */}
      {isCreateEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-[#c3c6d7]/40 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#c3c6d7]/30 bg-[#faf8ff]">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-[#004ac6]/10 text-[#004ac6] flex items-center justify-center font-bold">
                  <BookCheck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-[#131b2e]">
                    {editingFlipbook ? "Edit Digital Flipbook" : "Add New Digital Flipbook"}
                  </h2>
                  <p className="text-xs text-[#505f76]">
                    Configure PDF flipbook link & cover for textbook library.
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
                  Flipbook Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Class 10 Physics Interactive Flipbook"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#c3c6d7]/60 focus:outline-none focus:border-[#004ac6] bg-[#faf8ff] font-medium"
                />
              </div>

              {/* PDF / Flipbook File URL (Required) */}
              <div>
                <label className="block text-xs font-bold text-[#131b2e] mb-1">
                  Flipbook / PDF Document URL <span className="text-rose-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://example.com/books/physics-class-10.pdf"
                  value={formData.fileUrl}
                  onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#c3c6d7]/60 focus:outline-none focus:border-[#004ac6] bg-[#faf8ff] font-medium"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Book Select */}
                <div>
                  <label className="block text-xs font-bold text-[#131b2e] mb-1">Associated Book</label>
                  <select
                    value={formData.bookId}
                    onChange={(e) => setFormData({ ...formData, bookId: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#c3c6d7]/60 focus:outline-none focus:border-[#004ac6] bg-[#faf8ff] font-medium cursor-pointer"
                  >
                    <option value="">Select Book (Optional)</option>
                    {books.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.title} ({b.class})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Code */}
                <div>
                  <label className="block text-xs font-bold text-[#131b2e] mb-1">Flipbook Code</label>
                  <input
                    type="text"
                    placeholder="e.g. FB-101"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#c3c6d7]/60 focus:outline-none focus:border-[#004ac6] bg-[#faf8ff] font-medium"
                  />
                </div>
              </div>

              {/* Cover Image URL */}
              <div>
                <label className="block text-xs font-bold text-[#131b2e] mb-1">
                  Cover Image URL <span className="text-zinc-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/covers/physics-cover.jpg"
                  value={formData.coverImage}
                  onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#c3c6d7]/60 focus:outline-none focus:border-[#004ac6] bg-[#faf8ff] font-medium"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-[#131b2e] mb-1">
                  Description <span className="text-zinc-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Summary of digital flipbook contents, edition details, or table of contents..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#c3c6d7]/60 focus:outline-none focus:border-[#004ac6] bg-[#faf8ff] font-medium"
                />
              </div>

              {/* Modal Action Buttons */}
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
                  ) : editingFlipbook ? (
                    "Update Flipbook"
                  ) : (
                    "Create Flipbook"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Delete Confirmation Modal */}
      {isDeleteOpen && flipbookToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-[#c3c6d7]/40 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 md:p-5 text-center space-y-3.5">
              <div className="h-12 w-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-[#131b2e]">Delete Flipbook?</h3>
                <p className="text-xs text-[#505f76] mt-1 font-medium">
                  Are you sure you want to delete <strong className="text-[#131b2e]">"{flipbookToDelete.title}"</strong> ({flipbookToDelete.code})? This will remove access to the digital reader.
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
