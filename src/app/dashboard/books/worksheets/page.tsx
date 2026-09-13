"use client";

import React, { useState, useEffect, useMemo } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import {
  FileText,
  Plus,
  Search,
  Filter,
  LayoutGrid,
  List,
  Edit3,
  Trash2,
  Eye,
  Download,
  Loader2,
  RefreshCw,
  X,
  GraduationCap,
  Globe,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  CheckCircle2,
  XCircle,
  FileDown,
  UploadCloud,
  FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store/auth";
import { getFullPdfUrl, downloadPdfFile } from "@/lib/pdfUtils";

export interface BookOption {
  id: number | string;
  _id?: number | string;
  title: string;
  code?: string;
  class?: string;
  className?: string;
  classId?: number | string;
  subject?: string;
  subjectName?: string;
  subjectId?: number | string;
}

export interface FilterOption {
  id: number | string;
  name: string;
  code?: string;
}

export interface WorksheetItem {
  id: number | string;
  _id?: number | string;
  title: string;
  code?: string;
  fileUrl?: string;
  downloadUrl?: string;
  fileName?: string;
  fileSize?: number;
  description?: string;
  isActive?: boolean;
  bookId?: number | string;
  book?: {
    id?: number | string;
    title?: string;
    class?: string;
    className?: string;
    classId?: number | string;
    subject?: string;
    subjectName?: string;
    subjectId?: number | string;
    coverImage?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export default function WorksheetsPage() {
  const { user } = useAuthStore();
  const role = user?.role?.toLowerCase() || "";
  const isAdmin = role === "admin" || role === "superadmin";
  const isTeacher = role === "teacher";
  const isStudent = role === "student";
  const canManage = isAdmin || isTeacher;

  // Data States
  const [worksheets, setWorksheets] = useState<WorksheetItem[]>([]);
  const [booksList, setBooksList] = useState<BookOption[]>([]);
  const [classesList, setClassesList] = useState<FilterOption[]>([]);
  const [subjectsList, setSubjectsList] = useState<FilterOption[]>([]);

  // Loading States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // View Mode
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Filters State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedClassId, setSelectedClassId] = useState<string>("all");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("all");
  const [selectedBookId, setSelectedBookId] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

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
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [editingWorksheet, setEditingWorksheet] = useState<WorksheetItem | null>(null);

  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [previewingItem, setPreviewingItem] = useState<WorksheetItem | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
  const [itemToDelete, setItemToDelete] = useState<WorksheetItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    code: "",
    bookId: "",
    description: "",
    isActive: true,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const getItemId = (item: WorksheetItem): string | number => {
    return item.id ?? item._id ?? "";
  };

  // 1. Fetch Dropdown Masters (Classes, Subjects, Books)
  const fetchFilterMasters = async () => {
    try {
      const [classRes, subRes, bookRes] = await Promise.allSettled([
        api.get("/v1/classes", { params: { limit: 100 } }).catch(() => api.get("/api/v1/classes", { params: { limit: 100 } })),
        api.get("/v1/subjects", { params: { limit: 100 } }).catch(() => api.get("/api/v1/subjects", { params: { limit: 100 } })),
        api.get("/books", { params: { limit: 100 } }).catch(() => api.get("/api/books", { params: { limit: 100 } })),
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

      if (bookRes.status === "fulfilled" && bookRes.value?.data) {
        const raw = bookRes.value.data;
        const arr = Array.isArray(raw) ? raw : raw.data || [];
        const mappedBooks = arr.map((b: any) => ({
          id: b.id ?? b._id,
          title: b.title || "Untitled Book",
          code: b.code,
          class: b.class || b.className,
          classId: b.classId,
          subject: b.subject || b.subjectName,
          subjectId: b.subjectId,
        }));
        setBooksList(mappedBooks);
        const queryBookId = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("bookId") : null;
        if (queryBookId && mappedBooks.some((b: any) => String(b.id) === String(queryBookId))) {
          setSelectedBookId(String(queryBookId));
        }
      }
    } catch (err) {
      console.error("Error fetching master dropdowns:", err);
    }
  };

  // 2. Fetch Worksheets List
  const fetchWorksheets = async (page = 1, showRefreshToast = false) => {
    if (showRefreshToast) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const params: Record<string, any> = {
        page,
        limit: itemsPerPage,
      };

      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (selectedClassId !== "all") params.classId = selectedClassId;
      if (selectedSubjectId !== "all") params.subjectId = selectedSubjectId;
      if (selectedBookId !== "all") params.bookId = selectedBookId;
      if (selectedStatus !== "all") params.isActive = selectedStatus === "active";

      let response;
      try {
        response = await api.get("/worksheets", { params });
      } catch (err) {
        try {
          response = await api.get("/v1/worksheets", { params });
        } catch (err2) {
          response = await api.get("/api/worksheets", { params });
        }
      }

      const resData = response.data;
      let list: WorksheetItem[] = [];
      let paginationMeta = {
        total: 0,
        page: 1,
        limit: itemsPerPage,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      };

      if (Array.isArray(resData)) {
        list = resData;
        paginationMeta.total = list.length;
      } else if (resData && Array.isArray(resData.data)) {
        list = resData.data;
        if (resData.meta) {
          paginationMeta = {
            total: resData.meta.total || list.length,
            page: resData.meta.page || page,
            limit: resData.meta.limit || itemsPerPage,
            totalPages: resData.meta.totalPages || Math.ceil((resData.meta.total || list.length) / itemsPerPage) || 1,
            hasNextPage: Boolean(resData.meta.hasNextPage),
            hasPrevPage: Boolean(resData.meta.hasPrevPage),
          };
        }
      }

      setWorksheets(list);
      setMeta(paginationMeta);
      setCurrentPage(paginationMeta.page);

      if (showRefreshToast) {
        toast.success("Worksheets refreshed");
      }
    } catch (error: any) {
      console.error("Error fetching worksheets:", error);
      toast.error(error?.response?.data?.message || "Failed to load worksheets");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFilterMasters();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchWorksheets(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedClassId, selectedSubjectId, selectedBookId, selectedStatus, itemsPerPage]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingWorksheet(null);
    setFormData({
      title: "",
      code: "",
      bookId: booksList.length > 0 ? String(booksList[0].id) : "",
      description: "",
      isActive: true,
    });
    setSelectedFile(null);
    setIsUploadModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (item: WorksheetItem) => {
    setEditingWorksheet(item);
    setFormData({
      title: item.title || "",
      code: item.code || "",
      bookId: item.bookId ? String(item.bookId) : item.book?.id ? String(item.book.id) : "",
      description: item.description || "",
      isActive: item.isActive !== false,
    });
    setSelectedFile(null);
    setIsUploadModalOpen(true);
  };

  // Handle Form Submit (Upload / Update)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Please enter a worksheet title");
      return;
    }

    if (!editingWorksheet && !formData.bookId) {
      toast.error("Please select a target book");
      return;
    }

    if (!editingWorksheet && !selectedFile) {
      toast.error("Please select a PDF file to upload");
      return;
    }

    try {
      setIsSubmitting(true);
      const submitData = new FormData();
      submitData.append("title", formData.title.trim());
      if (formData.code.trim()) submitData.append("code", formData.code.trim());
      if (formData.bookId) submitData.append("bookId", formData.bookId);
      if (formData.description.trim()) submitData.append("description", formData.description.trim());
      submitData.append("isActive", String(formData.isActive));
      if (selectedFile) submitData.append("file", selectedFile);

      if (editingWorksheet) {
        const id = getItemId(editingWorksheet);
        try {
          await api.put(`/worksheets/${id}`, submitData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        } catch (err) {
          await api.put(`/v1/worksheets/${id}`, submitData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        }
        toast.success("Worksheet updated successfully");
      } else {
        try {
          await api.post("/worksheets", submitData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        } catch (err) {
          await api.post("/v1/worksheets", submitData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        }
        toast.success("Worksheet uploaded successfully (1 Book = 1 Worksheet rule applied)");
      }

      setIsUploadModalOpen(false);
      fetchWorksheets(currentPage);
    } catch (error: any) {
      console.error("Error saving worksheet:", error);
      toast.error(error.response?.data?.message || "Failed to save worksheet");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Action
  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    try {
      setIsDeleting(true);
      const id = getItemId(itemToDelete);
      try {
        await api.delete(`/worksheets/${id}`);
      } catch (err) {
        await api.delete(`/v1/worksheets/${id}`);
      }
      toast.success("Worksheet deleted successfully");
      setIsDeleteOpen(false);
      setItemToDelete(null);
      fetchWorksheets(currentPage);
    } catch (error: any) {
      console.error("Delete failed:", error);
      toast.error(error.response?.data?.message || "Failed to delete worksheet");
    } finally {
      setIsDeleting(false);
    }
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedClassId("all");
    setSelectedSubjectId("all");
    setSelectedBookId("all");
    setSelectedStatus("all");
  };

  const hasActiveFilters =
    searchQuery || selectedClassId !== "all" || selectedSubjectId !== "all" || selectedBookId !== "all" || selectedStatus !== "all";

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "PDF File";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4 md:space-y-5 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 md:p-5 rounded-2xl border border-[#c3c6d7]/40 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#004ac6]/10 text-[#004ac6]">
              <FileText className="h-6 w-6" />
            </span>
            <h1 className="text-2xl font-bold text-[#131b2e] tracking-tight">Worksheets Library</h1>
          </div>
          <p className="text-sm text-[#505f76] mt-1 ml-10">
            {isStudent
              ? "View and download practice worksheets for your enrolled books."
              : "Manage chapter worksheets attached to books (1 Book = 1 Worksheet)."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => fetchWorksheets(currentPage, true)}
            disabled={isRefreshing}
            className="border-[#c3c6d7] text-[#505f76] hover:bg-[#eaedff] cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin text-[#004ac6]" : ""}`} />
            Refresh
          </Button>

          {canManage && (
            <Button
              onClick={handleOpenCreateModal}
              className="bg-[#004ac6] hover:bg-[#003cb0] text-white font-semibold shadow-md shadow-[#004ac6]/20 cursor-pointer"
            >
              <Plus className="h-4 w-4 mr-2" />
              Upload Worksheet
            </Button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#c3c6d7]/40 shadow-sm space-y-3.5">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search bar */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search worksheets or book title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#faf8ff] border border-[#c3c6d7]/60 rounded-xl text-sm font-medium focus:outline-none focus:border-[#004ac6] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-1.5 bg-[#faf8ff] p-1 border border-[#c3c6d7]/50 rounded-xl self-end lg:self-auto">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === "grid" ? "bg-white text-[#004ac6] shadow-sm" : "text-[#505f76] hover:text-[#131b2e]"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === "table" ? "bg-white text-[#004ac6] shadow-sm" : "text-[#505f76] hover:text-[#131b2e]"
              }`}
              title="Table View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Filters dropdown row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-[#c3c6d7]/30">
          {/* Class filter */}
          <div>
            <label className="text-xs font-semibold text-[#505f76] uppercase tracking-wider block mb-1">Class</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full bg-[#faf8ff] border border-[#c3c6d7]/60 rounded-xl px-3 py-2 text-xs font-semibold text-[#131b2e] focus:outline-none focus:border-[#004ac6]"
            >
              <option value="all">All Classes</option>
              {classesList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subject filter */}
          <div>
            <label className="text-xs font-semibold text-[#505f76] uppercase tracking-wider block mb-1">Subject</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full bg-[#faf8ff] border border-[#c3c6d7]/60 rounded-xl px-3 py-2 text-xs font-semibold text-[#131b2e] focus:outline-none focus:border-[#004ac6]"
            >
              <option value="all">All Subjects</option>
              {subjectsList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Book filter */}
          <div>
            <label className="text-xs font-semibold text-[#505f76] uppercase tracking-wider block mb-1">Book</label>
            <select
              value={selectedBookId}
              onChange={(e) => setSelectedBookId(e.target.value)}
              className="w-full bg-[#faf8ff] border border-[#c3c6d7]/60 rounded-xl px-3 py-2 text-xs font-semibold text-[#131b2e] focus:outline-none focus:border-[#004ac6]"
            >
              <option value="all">All Books</option>
              {booksList.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-xs font-semibold text-[#505f76] uppercase tracking-wider block mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-[#faf8ff] border border-[#c3c6d7]/60 rounded-xl px-3 py-2 text-xs font-semibold text-[#131b2e] focus:outline-none focus:border-[#004ac6]"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-[#505f76]">Active filters applied</span>
            <Button variant="ghost" size="sm" onClick={resetFilters} className="text-xs text-rose-600 hover:text-rose-700 h-7 px-2">
              <X className="h-3.5 w-3.5 mr-1" />
              Reset Filters
            </Button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-[#c3c6d7]/40">
          <Loader2 className="h-8 w-8 animate-spin text-[#004ac6] mb-3" />
          <p className="text-sm font-semibold text-[#505f76]">Loading worksheets...</p>
        </div>
      ) : worksheets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-[#c3c6d7]/40 text-center px-4">
          <div className="p-4 rounded-full bg-[#eaedff] text-[#004ac6] mb-4">
            <FileText className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-[#131b2e]">No Worksheets Found</h3>
          <p className="text-sm text-[#505f76] max-w-md mt-1 mb-6">
            {hasActiveFilters
              ? "No worksheets match your active filter criteria. Try resetting filters."
              : "No worksheets have been uploaded yet."}
          </p>

          {hasActiveFilters ? (
            <Button onClick={resetFilters} variant="outline" className="border-[#c3c6d7]">
              Clear Filters
            </Button>
          ) : (
            canManage && (
              <Button onClick={handleOpenCreateModal} className="bg-[#004ac6] hover:bg-[#003cb0]">
                <Plus className="h-4 w-4 mr-2" />
                Upload First Worksheet
              </Button>
            )
          )}
        </div>
      ) : viewMode === "grid" ? (
        /* Grid Layout */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {worksheets.map((item) => {
            const itemBookTitle = item.book?.title || "Attached Book";
            const itemClass = item.book?.class || item.book?.className || "General";
            const itemSubject = item.book?.subject || item.book?.subjectName || "General";

            return (
              <div
                key={getItemId(item)}
                className="bg-white rounded-2xl border border-[#c3c6d7]/40 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-3.5 sm:p-4 space-y-3">
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="p-3 rounded-xl bg-[#004ac6]/10 text-[#004ac6] group-hover:scale-105 transition-transform">
                      <FileCheck className="h-6 w-6" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                          item.isActive !== false ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-zinc-100 text-zinc-600"
                        }`}
                      >
                        {item.isActive !== false ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>

                  {/* Worksheet Info */}
                  <div>
                    <h3 className="font-bold text-[#131b2e] text-base line-clamp-1 group-hover:text-[#004ac6] transition-colors">
                      {item.title}
                    </h3>
                    {item.code && <p className="text-xs font-mono text-[#505f76] mt-0.5">Code: {item.code}</p>}
                  </div>

                  {/* Book & Class Context */}
                  <div className="p-3 rounded-xl bg-[#faf8ff] border border-[#c3c6d7]/30 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between font-semibold text-[#131b2e]">
                      <span className="truncate flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5 text-[#004ac6] shrink-0" />
                        {itemBookTitle}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[#505f76]">
                      <span>Class: {itemClass}</span>
                      <span>Subject: {itemSubject}</span>
                    </div>
                  </div>

                  {item.description && <p className="text-xs text-[#505f76] line-clamp-2">{item.description}</p>}
                </div>

                {/* Card Actions Footer */}
                <div className="px-5 py-3.5 bg-[#faf8ff] border-t border-[#c3c6d7]/30 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-[#505f76] font-medium">{formatFileSize(item.fileSize)}</div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setPreviewingItem(item);
                        setIsPreviewOpen(true);
                      }}
                      className="h-8 px-2.5 text-xs border-[#c3c6d7] text-[#505f76] hover:text-[#004ac6]"
                      title="Preview PDF"
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      View
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadPdfFile(item.downloadUrl, item.fileUrl, `${item.title || "worksheet"}.pdf`)}
                      className="h-8 px-2.5 text-xs border-[#c3c6d7] text-[#004ac6] hover:bg-[#eaedff]"
                      title="Download PDF"
                    >
                      <Download className="h-3.5 w-3.5 mr-1" />
                      Download
                    </Button>

                    {canManage && (
                      <>
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 text-zinc-500 hover:text-[#004ac6] hover:bg-white rounded-lg transition-colors"
                          title="Edit Worksheet"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => {
                            setItemToDelete(item);
                            setIsDeleteOpen(true);
                          }}
                          className="p-1.5 text-zinc-500 hover:text-rose-600 hover:bg-white rounded-lg transition-colors"
                          title="Delete Worksheet"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table Layout */
        <div className="bg-white rounded-2xl border border-[#c3c6d7]/40 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#faf8ff] border-b border-[#c3c6d7]/40 text-[11px] font-bold text-[#505f76] uppercase tracking-wider">
                  <th className="py-3.5 px-4">Title & Code</th>
                  <th className="py-3.5 px-4">Book Title</th>
                  <th className="py-3.5 px-4">Class / Subject</th>
                  <th className="py-3.5 px-4">File Info</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c3c6d7]/30 text-xs text-[#131b2e]">
                {worksheets.map((item) => {
                  const itemBookTitle = item.book?.title || "Attached Book";
                  const itemClass = item.book?.class || item.book?.className || "General";
                  const itemSubject = item.book?.subject || item.book?.subjectName || "General";

                  return (
                    <tr key={getItemId(item)} className="hover:bg-[#faf8ff]/60 transition-colors">
                      <td className="py-3.5 px-4 font-semibold">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-[#004ac6] shrink-0" />
                          <div>
                            <p className="font-bold text-[#131b2e]">{item.title}</p>
                            {item.code && <p className="text-[11px] text-[#505f76] font-mono">{item.code}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-[#505f76]">{itemBookTitle}</td>
                      <td className="py-3.5 px-4 text-[#505f76]">
                        {itemClass} / {itemSubject}
                      </td>
                      <td className="py-3.5 px-4 text-[#505f76]">{formatFileSize(item.fileSize)}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            item.isActive !== false ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          {item.isActive !== false ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setPreviewingItem(item);
                              setIsPreviewOpen(true);
                            }}
                            className="h-7 px-2 text-xs text-[#505f76] hover:text-[#004ac6]"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => downloadPdfFile(item.downloadUrl, item.fileUrl, `${item.title || "worksheet"}.pdf`)}
                            className="h-7 px-2 text-xs text-[#004ac6]"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                          {canManage && (
                            <>
                              <button
                                onClick={() => handleOpenEditModal(item)}
                                className="p-1.5 text-zinc-500 hover:text-[#004ac6] rounded"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setItemToDelete(item);
                                  setIsDeleteOpen(true);
                                }}
                                className="p-1.5 text-zinc-500 hover:text-rose-600 rounded"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
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

      {/* Pagination Footer */}
      {!isLoading && meta.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#c3c6d7]/40 shadow-sm text-xs">
          <span className="text-[#505f76]">
            Showing Page <strong className="text-[#131b2e]">{meta.page}</strong> of{" "}
            <strong className="text-[#131b2e]">{meta.totalPages}</strong> ({meta.total} total items)
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!meta.hasPrevPage}
              onClick={() => fetchWorksheets(currentPage - 1)}
              className="h-8 border-[#c3c6d7]"
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!meta.hasNextPage}
              onClick={() => fetchWorksheets(currentPage + 1)}
              className="h-8 border-[#c3c6d7]"
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Upload / Edit Worksheet Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 md:p-5 space-y-4 border border-[#c3c6d7]/50 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#c3c6d7]/30 pb-3">
              <h2 className="text-lg font-bold text-[#131b2e]">
                {editingWorksheet ? "Edit Worksheet" : "Upload Worksheet PDF"}
              </h2>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              {!editingWorksheet && (
                <div className="p-3 bg-[#eaedff]/60 rounded-xl border border-[#004ac6]/20 text-[#004ac6] flex items-start gap-2.5">
                  <BookOpen className="h-4 w-4 mt-0.5 shrink-0" />
                  <p>
                    <strong>1 Book = 1 Worksheet Rule</strong>: If the selected book already has an existing worksheet, it will be automatically replaced with this new file.
                  </p>
                </div>
              )}

              {/* Target Book Dropdown */}
              <div>
                <label className="font-semibold text-[#131b2e] block mb-1">Target Book *</label>
                <select
                  value={formData.bookId}
                  onChange={(e) => setFormData({ ...formData, bookId: e.target.value })}
                  disabled={Boolean(editingWorksheet)}
                  className="w-full bg-[#faf8ff] border border-[#c3c6d7]/60 rounded-xl p-2.5 font-medium focus:outline-none focus:border-[#004ac6]"
                >
                  <option value="">Select Target Book</option>
                  {booksList.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title} {b.class ? `(${b.class})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Worksheet Title */}
              <div>
                <label className="font-semibold text-[#131b2e] block mb-1">Worksheet Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Chapter 1 Practice Exercise"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-[#faf8ff] border border-[#c3c6d7]/60 rounded-xl p-2.5 font-medium focus:outline-none focus:border-[#004ac6]"
                />
              </div>

              {/* Code */}
              <div>
                <label className="font-semibold text-[#131b2e] block mb-1">Worksheet Code (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. WS-01"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full bg-[#faf8ff] border border-[#c3c6d7]/60 rounded-xl p-2.5 font-medium focus:outline-none focus:border-[#004ac6]"
                />
              </div>

              {/* PDF File Picker */}
              <div>
                <label className="font-semibold text-[#131b2e] block mb-1">
                  Upload PDF File {editingWorksheet ? "(Optional replacement)" : "*"}
                </label>
                <div className="border-2 border-dashed border-[#c3c6d7]/80 hover:border-[#004ac6] rounded-2xl p-4 text-center bg-[#faf8ff] transition-colors relative cursor-pointer">
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <UploadCloud className="h-8 w-8 text-[#004ac6] mx-auto mb-1" />
                  {selectedFile ? (
                    <div className="text-emerald-700 font-semibold">
                      Selected: {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                    </div>
                  ) : (
                    <div>
                      <p className="font-semibold text-[#131b2e]">Click or drag PDF file here</p>
                      <p className="text-[11px] text-[#505f76] mt-0.5">Maximum file size: 100MB</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="font-semibold text-[#131b2e] block mb-1">Description (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Additional notes for students or teachers..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-[#faf8ff] border border-[#c3c6d7]/60 rounded-xl p-2.5 font-medium focus:outline-none focus:border-[#004ac6]"
                />
              </div>

              {/* Status toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="wsStatus"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 text-[#004ac6] rounded border-gray-300"
                />
                <label htmlFor="wsStatus" className="font-semibold text-[#131b2e]">
                  Active Worksheet (Visible to Students)
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#c3c6d7]/30">
                <Button type="button" variant="outline" onClick={() => setIsUploadModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-[#004ac6] hover:bg-[#003cb0]">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : editingWorksheet ? (
                    "Update Worksheet"
                  ) : (
                    "Upload Worksheet"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PDF Preview Modal */}
      {isPreviewOpen && previewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-4xl w-full h-[85vh] flex flex-col overflow-hidden border border-[#c3c6d7]/50 shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-[#c3c6d7]/30 bg-[#faf8ff]">
              <div>
                <h3 className="font-bold text-[#131b2e] text-base">{previewingItem.title}</h3>
                <p className="text-xs text-[#505f76]">
                  Attached to: {previewingItem.book?.title || "Book"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() =>
                    downloadPdfFile(
                      previewingItem.downloadUrl,
                      previewingItem.fileUrl,
                      `${previewingItem.title || "worksheet"}.pdf`
                    )
                  }
                  className="bg-[#004ac6] hover:bg-[#003cb0] text-xs h-8"
                >
                  <Download className="h-3.5 w-3.5 mr-1" />
                  Download PDF
                </Button>
                <button onClick={() => setIsPreviewOpen(false)} className="text-zinc-400 hover:text-zinc-600 p-1">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-zinc-900 relative">
              {previewingItem.fileUrl ? (
                <iframe
                  src={getFullPdfUrl(previewingItem.fileUrl)}
                  className="w-full h-full border-0"
                  title="PDF Preview"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-white p-4 text-center">
                  <AlertTriangle className="h-10 w-10 text-amber-400 mb-2" />
                  <p>PDF URL is not available for preview.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteOpen && itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-4 md:p-5 space-y-3.5 border border-[#c3c6d7]/50 shadow-xl">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 rounded-xl bg-rose-100">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-[#131b2e]">Delete Worksheet</h3>
            </div>

            <p className="text-xs text-[#505f76] leading-relaxed">
              Are you sure you want to delete <strong>&quot;{itemToDelete.title}&quot;</strong>? This will permanently remove the worksheet database record and physical PDF file.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3">
              <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleDeleteItem} disabled={isDeleting} className="bg-rose-600 hover:bg-rose-700 text-white">
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Yes, Delete Worksheet"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
