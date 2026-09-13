"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { toast } from "sonner";
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  LayoutGrid,
  List,
  Edit3,
  Trash2,
  Eye,
  Loader2,
  RefreshCw,
  X,
  GraduationCap,
  Globe,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  BookMarked,
  CheckCircle2,
  QrCode,
  Sparkles,
  Download,
  Printer,
  Copy,
  Check,
  ExternalLink,
  Layers,
  Video,
  FileText,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store/auth";
import qrApi from "@/lib/api/qrcode";
import { QRCodeItem } from "@/types/qrcode";

export interface Book {
  id: number | string;
  _id?: number | string;
  code?: string;
  title: string;
  class?: string;
  className?: string;
  classId?: number | string;
  subject?: string;
  subjectName?: string;
  subjectId?: number | string;
  language?: string;
  languageName?: string;
  languageId?: number | string;
  coverImage?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  worksheetUrl?: string;
  worksheetDownloadUrl?: string;
  worksheet?: any;
  teacherManualUrl?: string;
  teacherManualDownloadUrl?: string;
  teacherManual?: any;
  lessonPlannerUrl?: string;
  lessonPlannerDownloadUrl?: string;
  lessonPlanner?: any;
}

interface FilterOption {
  id: number | string;
  name: string;
  code?: string;
}

export default function BookLibraryPage() {
  const { user } = useAuthStore();
  const userRole = user?.role?.toLowerCase() || "";
  const isStudent = userRole === "student";
  const isTeacher = userRole === "teacher";
  const isAdmin = userRole === "admin" || userRole === "superadmin";

  const isAdminOrTeacher = isAdmin || isTeacher;

  // Dynamic Module Permissions from GET /auth/my-menu API
  const [permittedRoutes, setPermittedRoutes] = useState<string[] | null>(null);
  const [permittedKeys, setPermittedKeys] = useState<string[] | null>(null);

  // Can user access QR code operations (Only Admins or roles with explicit qr_code_management permissions)
  const canAccessQr = Boolean(
    !isStudent &&
    (isAdmin ||
      (permittedRoutes &&
        (permittedRoutes.includes("/dashboard/qrcode") ||
          permittedKeys?.includes("qr_code_management"))))
  );

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
        // Fallback to role-based filtering if dynamic menu endpoint is not available
      }
    }

    fetchMenuRoutes();

    return () => {
      isSubscribed = false;
    };
  }, []);

  // Helper to determine whether a module route button should be displayed in the sidebar
  const canAccessModuleRoute = (routePath: string, key?: string): boolean => {
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

    // 2. Fallback based on user role when dynamic menu is pending or offline
    if (isStudent) {
      // Per student menu schema: ONLY flipbook, videos, worksheets. NO chapters, NO teacher-manual, NO lesson-planner, NO qrcode!
      const studentAllowed = [
        "/dashboard/books/flipbook",
        "/dashboard/books/videos",
        "/dashboard/books/worksheets",
      ];
      return studentAllowed.includes(cleanPath);
    }

    if (isTeacher) {
      // Teachers: Access chapters, flipbook, videos, worksheets, teacher-manual, lesson-planner. Block QR code.
      const teacherAllowed = [
        "/dashboard/books/chapters",
        "/dashboard/books/flipbook",
        "/dashboard/books/videos",
        "/dashboard/books/worksheets",
        "/dashboard/books/teacher-manual",
        "/dashboard/books/lesson-planner",
      ];
      return teacherAllowed.includes(cleanPath);
    }

    // Admin & Superadmin have full access
    return true;
  };

  // Data States
  const [books, setBooks] = useState<Book[]>([]);
  const [classesList, setClassesList] = useState<FilterOption[]>([]);
  const [subjectsList, setSubjectsList] = useState<FilterOption[]>([]);
  const [languagesList, setLanguagesList] = useState<FilterOption[]>([]);

  // Loading States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Book QR Code States
  const [bookQrMap, setBookQrMap] = useState<Record<string, QRCodeItem>>({});
  const [selectedBookQr, setSelectedBookQr] = useState<{ book: Book; qr: QRCodeItem | null } | null>(null);
  const [isGeneratingQr, setIsGeneratingQr] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // View Mode: Grid or Table
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Filters State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedClassId, setSelectedClassId] = useState<string>("all");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("all");
  const [selectedLanguageId, setSelectedLanguageId] = useState<string>("all");

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

  // Modal States
  const [isCreateEditOpen, setIsCreateEditOpen] = useState<boolean>(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState<boolean>(false);
  const [viewingBook, setViewingBook] = useState<Book | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    code: "",
    classId: "",
    className: "",
    subjectId: "",
    subjectName: "",
    languageId: "",
    languageName: "",
    coverImage: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Image load error fallback map
  const [imageErrorMap, setImageErrorMap] = useState<Record<string | number, boolean>>({});

  const getBookId = (book: Book): string | number => {
    return book.id ?? book._id ?? "";
  };

  // 1. Fetch Dynamic Dropdown Master Data (Classes, Subjects, Languages)
  const fetchFilterMasters = async () => {
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
      console.error("Error loading filter master data:", err);
    }
  };

  // 2. Fetch Books Catalog with Server-Side Pagination Query Params
  const fetchBooks = async (showRefreshToast = false) => {
    try {
      if (showRefreshToast) setIsRefreshing(true);
      else setIsLoading(true);

      const params: Record<string, any> = {
        page: currentPage,
        limit: itemsPerPage,
        worksheets: true,
        teacher_manual: true,
        lesson_planner: true,
      };
      if (selectedClassId !== "all") params.classId = selectedClassId;
      if (selectedSubjectId !== "all") params.subjectId = selectedSubjectId;
      if (selectedLanguageId !== "all") params.languageId = selectedLanguageId;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      let booksRes: any = null;
      try {
        const res = await api.get("/v1/books", { params });
        booksRes = res.data;
      } catch {
        try {
          const res = await api.get("/api/v1/books", { params });
          booksRes = res.data;
        } catch {
          const res = await api.get("/books", { params });
          booksRes = res.data;
        }
      }

      const booksArray = Array.isArray(booksRes)
        ? booksRes
        : booksRes?.data || booksRes?.books || [];

      // Extract pagination meta contract
      const rawMeta = booksRes?.meta || booksRes?.pagination || {};
      const totalCount = rawMeta.total ?? booksRes?.total ?? booksArray.length;
      const calcTotalPages = rawMeta.totalPages ?? Math.max(1, Math.ceil(totalCount / itemsPerPage));

      setMeta({
        total: totalCount,
        page: rawMeta.page ?? currentPage,
        limit: rawMeta.limit ?? itemsPerPage,
        totalPages: calcTotalPages,
        hasNextPage: rawMeta.hasNextPage ?? (currentPage < calcTotalPages),
        hasPrevPage: rawMeta.hasPrevPage ?? (currentPage > 1),
      });

      const normalized: Book[] = booksArray.map((b: any, idx: number) => ({
        id: b.id ?? b._id ?? `bk-${idx}`,
        code: b.code || b.isbn || `BK-${b.id ?? idx + 100}`,
        title: b.title || "Untitled Book",
        class: b.class || b.className || "General",
        classId: b.classId,
        subject: b.subject || b.subjectName || "General",
        subjectId: b.subjectId,
        language: b.language || b.languageName || "English",
        languageId: b.languageId,
        coverImage: b.coverImage || b.cover_image || "",
        description: b.description || "",
        worksheetUrl: b.worksheetUrl || b.worksheetPdfUrl || b.worksheet?.fileUrl,
        worksheetDownloadUrl: b.worksheetDownloadUrl || b.worksheet?.downloadUrl,
        worksheet: b.worksheet,
        teacherManualUrl: b.teacherManualUrl || b.teacherManualPdfUrl || b.teacherManual?.fileUrl,
        teacherManualDownloadUrl: b.teacherManualDownloadUrl || b.teacherManual?.downloadUrl,
        teacherManual: b.teacherManual,
        lessonPlannerUrl: b.lessonPlannerUrl || b.lessonPlannerPdfUrl || b.lessonPlanner?.fileUrl,
        lessonPlannerDownloadUrl: b.lessonPlannerDownloadUrl || b.lessonPlanner?.downloadUrl,
        lessonPlanner: b.lessonPlanner,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
      }));

      setBooks(normalized);

      if (showRefreshToast) {
        toast.success("Book catalog refreshed!");
      }
    } catch (err: any) {
      console.error("Failed to fetch books:", err);
      toast.error(err.response?.data?.message || "Failed to load book library.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Fetch Book QR Codes mapping (strictly guarded for authorized roles)
  const fetchBookQrs = async () => {
    if (isStudent || !canAccessQr) return;
    try {
      const res = await qrApi.getList({ targetType: "BOOK", limit: 500 });
      const items = res?.data || [];
      const map: Record<string, QRCodeItem> = {};
      items.forEach((item: QRCodeItem) => {
        const bId = item.bookId || (item.book ? (item.book.id || (item.book as any)._id) : null);
        if (bId) {
          map[String(bId)] = item;
        }
      });
      setBookQrMap(map);
    } catch (err: any) {
      // Gracefully handle 403 Forbidden or 401 Unauthorized without triggering dev console error overlays
      if (err?.response?.status === 403 || err?.response?.status === 401) {
        setBookQrMap({});
        return;
      }
      console.warn("Could not load book QR codes mapping:", err?.message || err);
    }
  };

  useEffect(() => {
    fetchFilterMasters();
  }, []);

  useEffect(() => {
    if (canAccessQr) {
      fetchBookQrs();
    }
  }, [canAccessQr]);

  useEffect(() => {
    fetchBooks();
  }, [currentPage, itemsPerPage, selectedClassId, selectedSubjectId, selectedLanguageId]);

  // Handle ESC key to dismiss Right Sidebar Drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isViewDetailsOpen) {
        setIsViewDetailsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isViewDetailsOpen]);

  // Handle Search input enter or change
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setCurrentPage(1);
      fetchBooks();
    }
  };

  // Reset all active filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedClassId("all");
    setSelectedSubjectId("all");
    setSelectedLanguageId("all");
    setCurrentPage(1);
    fetchBooks();
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingBook(null);
    setFormData({
      title: "",
      code: "",
      classId: classesList[0]?.id ? String(classesList[0].id) : "",
      className: classesList[0]?.name || "",
      subjectId: subjectsList[0]?.id ? String(subjectsList[0].id) : "",
      subjectName: subjectsList[0]?.name || "",
      languageId: languagesList[0]?.id ? String(languagesList[0].id) : "",
      languageName: languagesList[0]?.name || "",
      coverImage: "",
      description: "",
    });
    setIsCreateEditOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (book: Book, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingBook(book);

    const matchingClass = classesList.find((c) => String(c.id) === String(book.classId) || c.name === book.class);
    const matchingSub = subjectsList.find((s) => String(s.id) === String(book.subjectId) || s.name === book.subject);
    const matchingLang = languagesList.find((l) => String(l.id) === String(book.languageId) || l.name === book.language);

    setFormData({
      title: book.title || "",
      code: book.code || "",
      classId: matchingClass ? String(matchingClass.id) : String(book.classId || ""),
      className: book.class || "",
      subjectId: matchingSub ? String(matchingSub.id) : String(book.subjectId || ""),
      subjectName: book.subject || "",
      languageId: matchingLang ? String(matchingLang.id) : String(book.languageId || ""),
      languageName: book.language || "",
      coverImage: book.coverImage || "",
      description: book.description || "",
    });
    setIsCreateEditOpen(true);
  };

  // Open View Details Modal
  const handleOpenViewDetails = (book: Book) => {
    setViewingBook(book);
    setIsViewDetailsOpen(true);
  };

  // Submit Create or Edit Form
  const handleSubmitBookForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Book Title is required.");
      return;
    }

    setIsSubmitting(true);

    const selectedClassObj = classesList.find((c) => String(c.id) === String(formData.classId));
    const selectedSubObj = subjectsList.find((s) => String(s.id) === String(formData.subjectId));
    const selectedLangObj = languagesList.find((l) => String(l.id) === String(formData.languageId));

    const payload = {
      title: formData.title.trim(),
      code: formData.code.trim() || undefined,
      classId: formData.classId ? formData.classId : undefined,
      class: selectedClassObj ? selectedClassObj.name : formData.className || undefined,
      subjectId: formData.subjectId ? formData.subjectId : undefined,
      subject: selectedSubObj ? selectedSubObj.name : formData.subjectName || undefined,
      languageId: formData.languageId ? formData.languageId : undefined,
      language: selectedLangObj ? selectedLangObj.name : formData.languageName || undefined,
      coverImage: formData.coverImage.trim() || undefined,
      description: formData.description.trim() || undefined,
    };

    try {
      if (editingBook) {
        const bId = getBookId(editingBook);
        try {
          await api.put(`/v1/books/${bId}`, payload);
        } catch {
          await api.put(`/api/v1/books/${bId}`, payload);
        }
        toast.success("Book updated successfully!");
      } else {
        try {
          await api.post("/v1/books", payload);
        } catch {
          await api.post("/api/v1/books", payload);
        }
        toast.success("Book created successfully!");
      }

      setIsCreateEditOpen(false);
      fetchBooks();
    } catch (err: any) {
      console.error("Failed to save book:", err);
      toast.error(err.response?.data?.message || "Failed to save book.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Delete Modal
  const handleOpenDeleteModal = (book: Book, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setBookToDelete(book);
    setIsDeleteOpen(true);
  };

  // Confirm Delete
  const handleDeleteBookConfirm = async () => {
    if (!bookToDelete) return;
    setIsDeleting(true);
    const bId = getBookId(bookToDelete);

    try {
      try {
        await api.delete(`/v1/books/${bId}`);
      } catch {
        await api.delete(`/api/v1/books/${bId}`);
      }

      toast.success("Book deleted successfully!");
      setIsDeleteOpen(false);
      setBookToDelete(null);
      fetchBooks();
    } catch (err: any) {
      console.error("Failed to delete book:", err);
      toast.error(err.response?.data?.message || "Failed to delete book.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Book QR Code Handlers
  const handleOpenBookQrModal = (book: Book, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const bId = String(getBookId(book));
    const existingQr = bookQrMap[bId] || null;
    setSelectedBookQr({ book, qr: existingQr });
  };

  const handleGenerateBookQr = async (book: Book) => {
    const bId = String(getBookId(book));
    try {
      setIsGeneratingQr(true);
      const newQr = await qrApi.generateForBook(bId);
      toast.success(`Book QR Code (${newQr.code}) generated successfully!`);
      setBookQrMap((prev) => ({ ...prev, [bId]: newQr }));
      setSelectedBookQr({ book, qr: newQr });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to generate book QR code");
    } finally {
      setIsGeneratingQr(false);
    }
  };

  const handleCopyUrl = (code: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const publicUrl = `${origin}/q/${code}`;
    navigator.clipboard.writeText(publicUrl);
    setCopiedCode(code);
    toast.success("Book QR Link copied to clipboard!");
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handlePrintBookLabel = (item: QRCodeItem, book: Book) => {
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
          <title>Print Book QR Label - ${item.code}</title>
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
            <div class="badge">📖 Textbook QR</div>
            <div class="title">${book.title}</div>
            <div class="sub">${book.class ? `Class: ${book.class}` : ""} ${book.subject ? `| ${book.subject}` : ""}</div>
            <div class="img-box">
              <img src="${imageUrl}" alt="Book QR Code" />
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

  const isFilterActive =
    searchQuery !== "" ||
    selectedClassId !== "all" ||
    selectedSubjectId !== "all" ||
    selectedLanguageId !== "all";

  const startIndex = (meta.page - 1) * meta.limit + 1;
  const endIndex = Math.min(meta.page * meta.limit, meta.total);

  return (
    <div className="space-y-4 md:space-y-5 max-w-7xl mx-auto pb-12 text-[#131b2e]">
      {/* 1. Header Banner & Action Bar */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-white via-[#f0f4ff] to-[#e6eeff] p-4 md:p-5 border border-[#c3c6d7]/40 shadow-sm backdrop-blur-md">
        <div className="absolute right-0 top-0 -mr-12 -mt-12 h-64 w-64 rounded-full bg-[#004ac6]/5 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-[#004ac6] text-white flex items-center justify-center shadow-lg shadow-[#004ac6]/20 shrink-0">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#131b2e]">
                  Book Library & Management
                </h1>
                <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-[#004ac6]/10 text-[#004ac6] border border-[#004ac6]/20">
                  {meta.total} Total Books
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#505f76] font-medium mt-1 max-w-2xl">
                Browse, search, and manage curriculum textbooks, supplementary reading materials, and course books.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* View Mode Toggle: Grid vs Table */}
            <div className="flex items-center bg-white p-1 rounded-xl border border-[#c3c6d7]/40 shadow-2xs">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-all cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-[#004ac6] text-white shadow-sm"
                    : "text-[#505f76] hover:text-[#131b2e] hover:bg-[#faf8ff]"
                }`}
                title="Grid View"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-2 rounded-lg transition-all cursor-pointer ${
                  viewMode === "table"
                    ? "bg-[#004ac6] text-white shadow-sm"
                    : "text-[#505f76] hover:text-[#131b2e] hover:bg-[#faf8ff]"
                }`}
                title="Table View"
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            <Button
              variant="outline"
              onClick={() => {
                fetchBooks(true);
                fetchBookQrs();
              }}
              disabled={isRefreshing || isLoading}
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
                Add New Book
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Dynamic Multi-Filter Bar */}
      <div className="bg-white rounded-2xl border border-[#c3c6d7]/40 p-4 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          {/* Keyword Search */}
          <div className="lg:col-span-4 relative">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search books (Press Enter to search)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full pl-10 pr-8 py-2 text-xs rounded-xl border border-[#c3c6d7]/60 focus:outline-none focus:border-[#004ac6] focus:ring-2 focus:ring-[#004ac6]/10 bg-[#faf8ff] font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setCurrentPage(1);
                  fetchBooks();
                }}
                className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
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

          {/* Language Dropdown */}
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
              Showing search results (Total: <strong className="text-[#004ac6]">{meta.total}</strong>)
            </span>
            <span className="text-[11px] text-zinc-400">Server Filters Active</span>
          </div>
        )}
      </div>

      {/* 3. Catalog Content: Grid View or Table View */}
      {isLoading ? (
        /* Loading Skeleton */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-[#c3c6d7]/30 p-4 space-y-3 animate-pulse">
              <div className="h-44 w-full bg-zinc-200 rounded-xl" />
              <div className="h-4 w-3/4 bg-zinc-200 rounded" />
              <div className="h-3 w-1/2 bg-zinc-200 rounded" />
              <div className="flex gap-2 pt-2">
                <div className="h-5 w-16 bg-zinc-200 rounded-full" />
                <div className="h-5 w-16 bg-zinc-200 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : books.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-[#c3c6d7]/40 p-12 text-center space-y-3">
          <div className="h-16 w-16 rounded-2xl bg-[#eaedff] text-[#004ac6] flex items-center justify-center mx-auto">
            <BookOpen className="h-8 w-8" />
          </div>
          <h3 className="text-base font-extrabold text-[#131b2e]">No Books Found</h3>
          <p className="text-xs text-[#505f76] max-w-md mx-auto font-medium">
            {isFilterActive
              ? "No books match your current search and filter selections. Try resetting the filters."
              : "The book catalog is currently empty."}
          </p>
          <div className="pt-2">
            {isFilterActive ? (
              <Button onClick={handleResetFilters} variant="outline" className="border-[#c3c6d7] text-[#004ac6] font-semibold">
                Reset All Filters
              </Button>
            ) : (
              isAdminOrTeacher && (
                <Button onClick={handleOpenCreateModal} className="bg-[#004ac6] hover:bg-[#003cb0] text-white font-semibold">
                  <Plus className="h-4 w-4 mr-2" /> Add First Book
                </Button>
              )
            )}
          </div>
        </div>
      ) : viewMode === "grid" ? (
        /* Grid View Layout */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {books.map((book) => {
            const bId = getBookId(book);
            const hasErr = imageErrorMap[bId];

            return (
              <div
                key={bId}
                onClick={() => handleOpenViewDetails(book)}
                className="group bg-white rounded-2xl border border-[#c3c6d7]/45 shadow-2xs hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col cursor-pointer"
              >
                {/* Cover Image Header */}
                <div className="relative h-48 w-full bg-[#f4f7ff] overflow-hidden flex items-center justify-center border-b border-[#c3c6d7]/20">
                  {!hasErr && book.coverImage ? (
                    <img
                      src={book.coverImage}
                      alt={book.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={() => setImageErrorMap((prev) => ({ ...prev, [bId]: true }))}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-zinc-400 p-4 text-center">
                      <BookMarked className="h-12 w-12 text-[#004ac6]/30 mb-1" />
                      <span className="text-[10px] font-bold uppercase text-zinc-400">Cover Unavailable</span>
                    </div>
                  )}

                  {/* Code Badge */}
                  <div className="absolute top-2.5 left-2.5">
                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-white/95 text-[#004ac6] shadow-sm border border-[#004ac6]/20 backdrop-blur-md">
                      {book.code || `BK-${bId}`}
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <h3 className="text-sm font-extrabold text-[#131b2e] group-hover:text-[#004ac6] transition-colors line-clamp-1">
                      {book.title}
                    </h3>
                    <p className="text-xs text-[#505f76] line-clamp-2 font-medium leading-relaxed">
                      {book.description || "No description provided."}
                    </p>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#eaedff] text-[#004ac6]">
                      <GraduationCap className="h-3 w-3" />
                      {book.class}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700">
                      <BookOpen className="h-3 w-3" />
                      {book.subject}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700">
                      <Globe className="h-3 w-3" />
                      {book.language}
                    </span>
                  </div>

                  {/* Action Buttons Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-[#c3c6d7]/30 text-xs">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenViewDetails(book);
                      }}
                      className="h-7 px-2.5 text-xs text-[#004ac6] hover:bg-[#eaedff] font-semibold cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" /> View
                    </Button>

                    {isAdminOrTeacher && (
                      <div className="flex items-center gap-1">
                        {canAccessQr && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleOpenBookQrModal(book, e)}
                            className={`h-7 w-7 p-0 rounded-lg cursor-pointer ${
                              bookQrMap[String(bId)]
                                ? "text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                                : "text-slate-400 hover:text-[#004ac6] hover:bg-slate-100"
                            }`}
                            title={
                              bookQrMap[String(bId)]
                                ? `Book QR Code (${bookQrMap[String(bId)].code})`
                                : "Generate / View Book QR Code"
                            }
                          >
                            <QrCode className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleOpenEditModal(book, e)}
                          className="h-7 w-7 p-0 text-slate-600 hover:text-[#004ac6] hover:bg-slate-100 rounded-lg cursor-pointer"
                          title="Edit Book"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleOpenDeleteModal(book, e)}
                          className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                          title="Delete Book"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View Layout */
        <div className="bg-white rounded-2xl border border-[#c3c6d7]/40 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#faf8ff] border-b border-[#c3c6d7]/30 text-[11px] font-extrabold uppercase tracking-wider text-[#505f76]">
                  <th className="py-2.5 px-4">Book</th>
                  <th className="py-2.5 px-4">Code</th>
                  <th className="py-2.5 px-4">Class</th>
                  <th className="py-2.5 px-4">Subject</th>
                  <th className="py-2.5 px-4">Language</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c3c6d7]/20 text-xs">
                {books.map((book) => {
                  const bId = getBookId(book);
                  const hasErr = imageErrorMap[bId];

                  return (
                    <tr key={bId} className="hover:bg-[#f4f7ff]/60 transition-colors group">
                      {/* Title & Cover Thumbnail */}
                      <td className="py-2.5 px-4 max-w-sm">
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-11 rounded-lg bg-[#faf8ff] border border-[#c3c6d7]/30 overflow-hidden shrink-0 flex items-center justify-center">
                            {!hasErr && book.coverImage ? (
                              <img
                                src={book.coverImage}
                                alt={book.title}
                                className="h-full w-full object-cover"
                                onError={() => setImageErrorMap((prev) => ({ ...prev, [bId]: true }))}
                              />
                            ) : (
                              <BookOpen className="h-5 w-5 text-[#004ac6]/40" />
                            )}
                          </div>
                          <div>
                            <p className="font-extrabold text-[#131b2e] text-sm group-hover:text-[#004ac6] transition-colors truncate max-w-xs">
                              {book.title}
                            </p>
                            <p className="text-[11px] text-[#505f76] truncate max-w-xs">
                              {book.description || "No description provided."}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Code */}
                      <td className="py-2.5 px-4 font-mono font-bold">
                        <span className="px-2 py-0.5 rounded bg-[#eaedff] text-[#004ac6] text-[11px]">
                          {book.code || `BK-${bId}`}
                        </span>
                      </td>

                      {/* Class Badge */}
                      <td className="py-2.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#eaedff] text-[#004ac6]">
                          <GraduationCap className="h-3 w-3" />
                          {book.class}
                        </span>
                      </td>

                      {/* Subject Badge */}
                      <td className="py-2.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700">
                          <BookOpen className="h-3 w-3" />
                          {book.subject}
                        </span>
                      </td>

                      {/* Language Badge */}
                      <td className="py-2.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
                          <Globe className="h-3 w-3" />
                          {book.language}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenViewDetails(book)}
                            className="h-8 px-2 text-xs text-[#004ac6] hover:bg-[#eaedff] font-semibold cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" /> View
                          </Button>
                          {isAdminOrTeacher && (
                            <>
                              {canAccessQr && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => handleOpenBookQrModal(book, e)}
                                  className={`h-8 w-8 p-0 rounded-lg cursor-pointer ${
                                    bookQrMap[String(bId)]
                                      ? "text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                                      : "text-slate-400 hover:text-[#004ac6] hover:bg-slate-100"
                                  }`}
                                  title={
                                    bookQrMap[String(bId)]
                                      ? `Book QR Code (${bookQrMap[String(bId)].code})`
                                      : "Generate / View Book QR Code"
                                  }
                                >
                                  <QrCode className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => handleOpenEditModal(book, e)}
                                className="h-8 w-8 p-0 text-slate-600 hover:text-[#004ac6] hover:bg-slate-100 rounded-lg cursor-pointer"
                                title="Edit"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => handleOpenDeleteModal(book, e)}
                                className="h-8 w-8 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                                title="Delete"
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
        </div>
      )}

      {/* 4. Server-Side Pagination Bar */}
      {books.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#c3c6d7]/40 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs text-[#505f76] font-semibold">
            <span>
              Showing <strong className="text-[#131b2e]">{startIndex}</strong> to{" "}
              <strong className="text-[#131b2e]">{endIndex}</strong> of{" "}
              <strong className="text-[#004ac6]">{meta.total}</strong> books
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

      {/* MODAL 1: Create / Edit Book Modal */}
      {isCreateEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-[#c3c6d7]/40 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#c3c6d7]/30 bg-[#faf8ff]">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-[#004ac6]/10 text-[#004ac6] flex items-center justify-center font-bold">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-[#131b2e]">
                    {editingBook ? "Edit Book" : "Add New Book"}
                  </h2>
                  <p className="text-xs text-[#505f76]">
                    Configure book catalog metadata and academic mapping.
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
            <form onSubmit={handleSubmitBookForm} className="p-4 space-y-3.5 max-h-[75vh] overflow-y-auto custom-scrollbar">
              {/* Title (Required) */}
              <div>
                <label className="block text-xs font-bold text-[#131b2e] mb-1">
                  Book Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mathematics Standard 10"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#c3c6d7]/60 focus:outline-none focus:border-[#004ac6] bg-[#faf8ff] font-medium"
                />
              </div>

              {/* Book Code (Optional) */}
              <div>
                <label className="block text-xs font-bold text-[#131b2e] mb-1">
                  Book Code / ISBN <span className="text-zinc-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. BK-101 or ISBN-978-3-16"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2.5 text-xs font-mono uppercase rounded-xl border border-[#c3c6d7]/60 focus:outline-none focus:border-[#004ac6] bg-[#faf8ff]"
                />
              </div>

              {/* Grid: Class & Subject */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Class */}
                <div>
                  <label className="block text-xs font-bold text-[#131b2e] mb-1">
                    Class Grade
                  </label>
                  <select
                    value={formData.classId}
                    onChange={(e) => {
                      const sel = classesList.find((c) => String(c.id) === e.target.value);
                      setFormData({
                        ...formData,
                        classId: e.target.value,
                        className: sel ? sel.name : "",
                      });
                    }}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-[#c3c6d7]/60 focus:outline-none focus:border-[#004ac6] bg-[#faf8ff] font-medium"
                  >
                    <option value="">Select Class</option>
                    {classesList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-xs font-bold text-[#131b2e] mb-1">
                    Subject
                  </label>
                  <select
                    value={formData.subjectId}
                    onChange={(e) => {
                      const sel = subjectsList.find((s) => String(s.id) === e.target.value);
                      setFormData({
                        ...formData,
                        subjectId: e.target.value,
                        subjectName: sel ? sel.name : "",
                      });
                    }}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-[#c3c6d7]/60 focus:outline-none focus:border-[#004ac6] bg-[#faf8ff] font-medium"
                  >
                    <option value="">Select Subject</option>
                    {subjectsList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Language */}
              <div>
                <label className="block text-xs font-bold text-[#131b2e] mb-1">
                  Language Medium
                </label>
                <select
                  value={formData.languageId}
                  onChange={(e) => {
                    const sel = languagesList.find((l) => String(l.id) === e.target.value);
                    setFormData({
                      ...formData,
                      languageId: e.target.value,
                      languageName: sel ? sel.name : "",
                    });
                  }}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-[#c3c6d7]/60 focus:outline-none focus:border-[#004ac6] bg-[#faf8ff] font-medium"
                >
                  <option value="">Select Language</option>
                  {languagesList.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cover Image URL */}
              <div>
                <label className="block text-xs font-bold text-[#131b2e] mb-1">
                  Cover Image URL <span className="text-zinc-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/cover.jpg"
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
                  placeholder="Brief summary of book contents or syllabus overview..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#c3c6d7]/60 focus:outline-none focus:border-[#004ac6] bg-[#faf8ff] font-medium"
                />
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
                  ) : editingBook ? (
                    "Update Book"
                  ) : (
                    "Create Book"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RIGHT SIDEBAR DRAWER: View Book Details & Content Resources */}
      {isViewDetailsOpen && viewingBook && (
        <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          {/* Backdrop Click to Dismiss */}
          <div
            className="absolute inset-0"
            onClick={() => setIsViewDetailsOpen(false)}
          />

          {/* Right Sidebar Container */}
          <div className="relative w-full sm:w-[480px] md:w-[540px] max-w-full h-full bg-[#faf8ff] text-[#131b2e] shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300 overflow-hidden border-l border-[#c3c6d7]/40">
            {/* Drawer Header */}
            <div className="bg-white border-b border-[#c3c6d7]/30 px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="h-8 w-8 rounded-xl bg-[#004ac6]/10 text-[#004ac6] flex items-center justify-center font-black text-sm shrink-0">
                  <BookOpen className="h-4.5 w-4.5" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-sm font-extrabold text-[#131b2e] leading-tight truncate">
                    {viewingBook.title}
                  </h2>
                  <p className="text-[11px] text-[#505f76] flex items-center gap-1.5 font-medium mt-0.5">
                    <span className="font-mono font-bold text-[#004ac6]">
                      {viewingBook.code || `BK-${getBookId(viewingBook)}`}
                    </span>
                    <span>•</span>
                    <span>Book Overview & Resources</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setIsViewDetailsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-[#131b2e] transition-colors cursor-pointer"
                  title="Close (Esc)"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Drawer Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {/* Top Section: Book Details Card */}
              <div className="bg-gradient-to-r from-[#eaedff]/60 via-[#faf8ff] to-white p-4 rounded-2xl border border-[#c3c6d7]/35 shadow-xs space-y-3">
                <div className="flex gap-3.5 items-start">
                  {/* Cover Image */}
                  <div className="h-28 w-20 shrink-0 rounded-xl bg-white border border-[#c3c6d7]/40 shadow-sm overflow-hidden flex items-center justify-center relative">
                    {viewingBook.coverImage ? (
                      <img
                        src={viewingBook.coverImage}
                        alt={viewingBook.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="p-2 text-center flex flex-col items-center justify-center text-zinc-400">
                        <BookMarked className="h-7 w-7 text-[#004ac6]/30 mb-1" />
                        <span className="text-[9px] font-bold text-zinc-400">No Cover</span>
                      </div>
                    )}
                  </div>

                  {/* Meta Details */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap gap-1 items-center">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#004ac6] text-white px-2 py-0.5 rounded-full">
                        <GraduationCap className="h-3 w-3" />
                        {viewingBook.class}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full">
                        <BookOpen className="h-3 w-3" />
                        {viewingBook.subject}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <Globe className="h-3 w-3" />
                        {viewingBook.language}
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-[#131b2e] leading-snug">
                      {viewingBook.title}
                    </h3>

                    <p className="text-xs text-[#505f76] font-medium leading-relaxed line-clamp-3">
                      {viewingBook.description || "No description recorded for this textbook."}
                    </p>
                  </div>
                </div>

                {/* Quick Info Bar */}
                <div className="flex items-center justify-between pt-2 border-t border-[#c3c6d7]/30 text-[11px] text-[#505f76]">
                  <span>
                    Catalog Code: <strong className="font-mono text-[#004ac6]">{viewingBook.code || `BK-${getBookId(viewingBook)}`}</strong>
                  </span>
                  {canAccessQr && (
                    bookQrMap[String(getBookId(viewingBook))] ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <CheckCircle2 className="h-3 w-3" /> QR Active: {bookQrMap[String(getBookId(viewingBook))].code}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        <AlertTriangle className="h-3 w-3" /> No QR Code
                      </span>
                    )
                  )}
                </div>
              </div>

              {/* Bottom Section: Dynamic Book Contents & Module Buttons */}
              {(() => {
                const bookModules = [
                  {
                    id: "chapters",
                    key: "chapters",
                    title: "Chapters & Syllabus Units",
                    description: "Manage lessons, units, topics, and ordering",
                    path: "/dashboard/books/chapters",
                    icon: Layers,
                    iconBg: "bg-indigo-50 text-indigo-600 border-indigo-100",
                    isAction: false,
                  },
                  {
                    id: "flipbook",
                    key: "flipbooks",
                    title: "Digital Flipbook (Interactive Reader)",
                    description: "PDF e-reader with page-flipping digital animations",
                    path: "/dashboard/books/flipbook",
                    icon: BookOpen,
                    iconBg: "bg-blue-50 text-blue-600 border-blue-100",
                    isAction: false,
                  },
                  {
                    id: "videos",
                    key: "videos",
                    title: "Video Lectures & Multimedia",
                    description: "Curated video lessons, animations, and tutorials",
                    path: "/dashboard/books/videos",
                    icon: Video,
                    iconBg: "bg-rose-50 text-rose-600 border-rose-100",
                    isAction: false,
                  },
                  {
                    id: "worksheets",
                    key: "worksheets",
                    title: "Practice Worksheets",
                    description: "Printable exercise sheets and homework assessments",
                    path: "/dashboard/books/worksheets",
                    icon: FileText,
                    iconBg: "bg-emerald-50 text-emerald-600 border-emerald-100",
                    badge: viewingBook.worksheetUrl ? "PDF" : null,
                    badgeStyle: "bg-emerald-50 text-emerald-700 border-emerald-200",
                    externalUrl: viewingBook.worksheetUrl,
                    externalLabel: "Open Worksheet PDF",
                    isAction: false,
                  },
                  {
                    id: "teacher-manual",
                    key: "teacher_manuals",
                    title: "Teacher Manual",
                    description: "Pedagogical guidelines, answer keys, and notes",
                    path: "/dashboard/books/teacher-manual",
                    icon: GraduationCap,
                    iconBg: "bg-amber-50 text-amber-600 border-amber-100",
                    badge: viewingBook.teacherManualUrl ? "Manual" : null,
                    badgeStyle: "bg-amber-50 text-amber-700 border-amber-200",
                    externalUrl: viewingBook.teacherManualUrl,
                    externalLabel: "Open Teacher Manual",
                    isAction: false,
                  },
                  {
                    id: "lesson-planner",
                    key: "lesson_planners",
                    title: "Lesson Planner",
                    description: "Period schedules, learning objectives, and pacing",
                    path: "/dashboard/books/lesson-planner",
                    icon: Calendar,
                    iconBg: "bg-purple-50 text-purple-600 border-purple-100",
                    badge: viewingBook.lessonPlannerUrl ? "Plan" : null,
                    badgeStyle: "bg-purple-50 text-purple-700 border-purple-200",
                    externalUrl: viewingBook.lessonPlannerUrl,
                    externalLabel: "Open Lesson Planner",
                    isAction: false,
                  },
                  {
                    id: "qrcode",
                    key: "qr_code_management",
                    title: "Physical QR Code Sticker",
                    description: bookQrMap[String(getBookId(viewingBook))]
                      ? `Sticker (${bookQrMap[String(getBookId(viewingBook))].code}) • View, download or print`
                      : "Generate unique cryptographic QR label for physical textbook",
                    path: "/dashboard/qrcode",
                    icon: QrCode,
                    iconBg: "bg-indigo-100 text-indigo-700 border-indigo-200",
                    badge: bookQrMap[String(getBookId(viewingBook))] ? "Active" : "Generate",
                    badgeStyle: bookQrMap[String(getBookId(viewingBook))]
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-200",
                    isAction: true,
                    action: () => {
                      setIsViewDetailsOpen(false);
                      handleOpenBookQrModal(viewingBook);
                    },
                  },
                ];

                const visibleModules = bookModules.filter((mod) =>
                  canAccessModuleRoute(mod.path, mod.key)
                );

                return (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#505f76]">
                          Book Contents & Learning Modules
                        </h4>
                        <p className="text-[11px] text-[#505f76]">
                          Access syllabus, interactive reader, worksheets, multimedia & schedules
                        </p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#eaedff] text-[#004ac6]">
                        {visibleModules.length} Modules Available
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      {visibleModules.map((mod) => {
                        const Icon = mod.icon;

                        if (mod.isAction) {
                          return (
                            <div
                              key={mod.id}
                              onClick={mod.action}
                              className="group flex items-center justify-between p-3 rounded-xl bg-white hover:bg-indigo-50/40 border border-indigo-200/60 hover:border-indigo-400 shadow-2xs transition-all cursor-pointer"
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border group-hover:scale-105 transition-transform ${mod.iconBg}`}
                                >
                                  <Icon className="h-4.5 w-4.5" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <p className="text-xs font-bold text-indigo-950 group-hover:text-indigo-700 transition-colors">
                                      {mod.title}
                                    </p>
                                    {mod.badge && (
                                      <span
                                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${mod.badgeStyle}`}
                                      >
                                        {mod.badge}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-[#505f76]">{mod.description}</p>
                                </div>
                              </div>
                              <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                            </div>
                          );
                        }

                        return (
                          <div
                            key={mod.id}
                            className="group flex items-center justify-between p-3 rounded-xl bg-white hover:bg-[#faf8ff] border border-[#c3c6d7]/35 hover:border-[#004ac6]/40 hover:shadow-sm transition-all"
                          >
                            <Link
                              href={`${mod.path}?bookId=${getBookId(viewingBook)}`}
                              className="flex items-center gap-3 flex-1 min-w-0"
                            >
                              <div
                                className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border group-hover:scale-105 transition-transform ${mod.iconBg}`}
                              >
                                <Icon className="h-4.5 w-4.5" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="text-xs font-bold text-[#131b2e] group-hover:text-[#004ac6] transition-colors truncate">
                                    {mod.title}
                                  </p>
                                  {mod.badge && (
                                    <span
                                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${mod.badgeStyle}`}
                                    >
                                      {mod.badge}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-[#505f76] truncate">
                                  {mod.description}
                                </p>
                              </div>
                            </Link>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {mod.externalUrl && (
                                <a
                                  href={mod.externalUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`p-1.5 rounded-md border text-[10px] font-bold inline-flex items-center gap-1 ${mod.badgeStyle}`}
                                  title={mod.externalLabel}
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              )}
                              <Link href={`${mod.path}?bookId=${getBookId(viewingBook)}`}>
                                <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:text-[#004ac6] group-hover:translate-x-0.5 transition-all" />
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Drawer Sticky Footer */}
            <div className="p-3.5 bg-[#faf8ff] border-t border-[#c3c6d7]/30 flex items-center justify-between shrink-0">
              <Button
                variant="outline"
                onClick={() => setIsViewDetailsOpen(false)}
                className="border-[#c3c6d7] text-[#505f76] text-xs font-semibold cursor-pointer h-9 px-4"
              >
                Close Sidebar
              </Button>

              {isAdminOrTeacher && (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => {
                      setIsViewDetailsOpen(false);
                      handleOpenEditModal(viewingBook);
                    }}
                    className="bg-[#004ac6] hover:bg-[#003cb0] text-white text-xs font-semibold shadow-md cursor-pointer h-9 px-4 flex items-center gap-1.5"
                  >
                    <Edit3 className="h-3.5 w-3.5" /> Edit Book
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Delete Confirmation Modal */}
      {isDeleteOpen && bookToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-[#c3c6d7]/40 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 md:p-5 text-center space-y-3.5">
              <div className="h-12 w-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-[#131b2e]">Delete Book?</h3>
                <p className="text-xs text-[#505f76] mt-1 font-medium">
                  Are you sure you want to delete <strong className="text-[#131b2e]">"{bookToDelete.title}"</strong> ({bookToDelete.code})? This will permanently remove the record from the catalog.
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
                  onClick={handleDeleteBookConfirm}
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

      {/* MODAL 4: Book QR Code Preview & Generator Modal */}
      {selectedBookQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-[#c3c6d7]/40 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-4 py-3 border-b border-[#c3c6d7]/30 flex items-center justify-between bg-[#faf8ff]">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <QrCode className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#131b2e]">Book QR Code</h3>
                  <p className="text-[11px] text-[#505f76] truncate max-w-xs font-medium">
                    {selectedBookQr.book.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBookQr(null)}
                className="h-8 w-8 rounded-full hover:bg-slate-200/60 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-3.5">
              {selectedBookQr.qr ? (
                /* QR EXISTS: Show Preview & Download Options */
                <div className="space-y-4">
                  {/* QR Image & Code Display */}
                  <div className="flex flex-col items-center justify-center p-4 bg-[#f4f7ff]/70 rounded-2xl border border-[#004ac6]/15 text-center">
                    <div className="bg-white p-3 rounded-2xl shadow-sm border border-[#c3c6d7]/40 mb-3">
                      <img
                        src={qrApi.getImageUrl(selectedBookQr.qr.id, "png")}
                        alt={`QR Code ${selectedBookQr.qr.code}`}
                        className="w-44 h-44 object-contain rounded-lg"
                      />
                    </div>

                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-base font-black text-[#004ac6] tracking-wider bg-white px-3 py-1 rounded-lg border border-[#004ac6]/20 shadow-2xs">
                        {selectedBookQr.qr.code}
                      </span>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Active
                      </span>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                        📖 Textbook
                      </span>
                    </div>

                    <p className="text-[11px] text-[#505f76] mt-1 font-medium">
                      Scan this code to instantly open textbook materials, flipbooks, and worksheets.
                    </p>
                  </div>

                  {/* Book Context Card */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center gap-3">
                    <div className="h-12 w-9 rounded-md bg-white border border-[#c3c6d7]/40 overflow-hidden shrink-0 flex items-center justify-center">
                      {selectedBookQr.book.coverImage ? (
                        <img
                          src={selectedBookQr.book.coverImage}
                          alt={selectedBookQr.book.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <BookOpen className="h-5 w-5 text-[#004ac6]/40" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-extrabold text-[#131b2e] truncate">
                        {selectedBookQr.book.title}
                      </p>
                      <p className="text-[11px] text-[#505f76] truncate font-medium mt-0.5">
                        {selectedBookQr.book.class ? `Class: ${selectedBookQr.book.class}` : ""}
                        {selectedBookQr.book.subject ? ` | ${selectedBookQr.book.subject}` : ""}
                      </p>
                    </div>
                  </div>

                  {/* Public Link Box */}
                  <div className="flex items-center justify-between p-2.5 bg-slate-100 rounded-xl text-xs font-mono text-[#505f76] border border-slate-200">
                    <span className="truncate mr-2">/q/{selectedBookQr.qr.code}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyUrl(selectedBookQr.qr!.code)}
                      className="h-7 px-2 text-xs font-semibold text-[#004ac6] hover:bg-white cursor-pointer shrink-0"
                    >
                      {copiedCode === selectedBookQr.qr.code ? (
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
                      href={qrApi.getImageUrl(selectedBookQr.qr.id, "png", true)}
                      download={`Book-QR-${selectedBookQr.qr.code}.png`}
                      className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white border border-[#c3c6d7] text-xs font-bold text-[#131b2e] hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5 text-[#004ac6]" />
                      <span>PNG</span>
                    </a>

                    <a
                      href={qrApi.getImageUrl(selectedBookQr.qr.id, "svg", true)}
                      download={`Book-QR-${selectedBookQr.qr.code}.svg`}
                      className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white border border-[#c3c6d7] text-xs font-bold text-[#131b2e] hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5 text-purple-600" />
                      <span>SVG</span>
                    </a>

                    <Button
                      variant="outline"
                      onClick={() => handlePrintBookLabel(selectedBookQr.qr!, selectedBookQr.book)}
                      className="flex items-center justify-center gap-1.5 h-auto py-2.5 px-3 rounded-xl border-[#c3c6d7] text-xs font-bold text-[#131b2e] hover:bg-slate-50 shadow-2xs cursor-pointer"
                    >
                      <Printer className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Print</span>
                    </Button>
                  </div>

                  {/* Test Scan / Open Link */}
                  <div className="pt-2 text-center">
                    <a
                      href={`/q/${selectedBookQr.qr.code}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#004ac6] hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Test Scan Link (Open Student Portal)
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
                      No QR Code for this Book
                    </h4>
                    <p className="text-xs text-[#505f76] mt-1 max-w-sm mx-auto font-medium">
                      Generate a unique cryptographic QR sticker for <strong className="text-[#131b2e]">"{selectedBookQr.book.title}"</strong>.
                      Students and teachers can scan it to access textbook resources instantly.
                    </p>
                  </div>

                  {/* Book Preview Snippet */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-left flex items-center gap-3">
                    <div className="h-12 w-9 rounded-md bg-white border border-[#c3c6d7]/40 overflow-hidden shrink-0 flex items-center justify-center">
                      {selectedBookQr.book.coverImage ? (
                        <img
                          src={selectedBookQr.book.coverImage}
                          alt={selectedBookQr.book.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <BookOpen className="h-5 w-5 text-[#004ac6]/40" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-extrabold text-[#131b2e] truncate">
                        {selectedBookQr.book.title}
                      </p>
                      <p className="text-[11px] text-[#505f76] truncate font-medium mt-0.5">
                        {selectedBookQr.book.class ? `Class: ${selectedBookQr.book.class}` : ""}
                        {selectedBookQr.book.subject ? ` | ${selectedBookQr.book.subject}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      onClick={() => handleGenerateBookQr(selectedBookQr.book)}
                      disabled={isGeneratingQr}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md cursor-pointer gap-2"
                    >
                      {isGeneratingQr ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Generating Book QR...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" /> Generate Book QR Code
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
