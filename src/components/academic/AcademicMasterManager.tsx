"use client";

import React, { useState, useEffect, useMemo } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Link as LinkIcon,
  CheckCircle2,
  XCircle,
  Loader2,
  Filter,
  BookOpen,
  X,
  AlertTriangle,
  BookMarked,
  Check,
  RefreshCw,
  Layers,
  Sparkles,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store/auth";

export interface AcademicItem {
  id: number | string;
  _id?: string;
  name: string;
  code?: string;
  description?: string;
  isActive?: boolean;
  status?: string;
  totalBooks?: number;
  booksCount?: number;
  books?: Array<{
    id?: number | string;
    _id?: number | string;
    title: string;
    subject?: string;
    class?: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface BookItem {
  id: number | string;
  _id?: number | string;
  title: string;
  code?: string;
  subject?: string;
  class?: string;
  language?: string;
  coverImage?: string;
}

interface AcademicMasterManagerProps {
  resourceType: "classes" | "subjects" | "languages";
  title: string;
  singularTitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  codePrefix: string;
  codePlaceholder: string;
  hideCreateBtn?: boolean;
}

export default function AcademicMasterManager({
  resourceType,
  title,
  singularTitle,
  description,
  icon: IconComponent,
  codePrefix,
  codePlaceholder,
  hideCreateBtn,
}: AcademicMasterManagerProps) {
  const user = useAuthStore((state) => state.user);
  const isTeacher = user?.role?.toLowerCase() === "teacher";
  const shouldHideCreate = isTeacher || hideCreateBtn;

  // State management
  const [items, setItems] = useState<AcademicItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Server-Side Pagination state
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

  // Modal states
  const [isCreateEditOpen, setIsCreateEditOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<AcademicItem | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Link Books modal state
  const [isLinkBooksOpen, setIsLinkBooksOpen] = useState<boolean>(false);
  const [activeItemForLinking, setActiveItemForLinking] = useState<AcademicItem | null>(null);
  const [availableBooks, setAvailableBooks] = useState<BookItem[]>([]);
  const [isLoadingBooks, setIsLoadingBooks] = useState<boolean>(false);
  const [bookSearchQuery, setBookSearchQuery] = useState<string>("");
  const [selectedBookIds, setSelectedBookIds] = useState<Set<string | number>>(new Set());
  const [isLinkingSubmitting, setIsLinkingSubmitting] = useState<boolean>(false);
  const [unlinkingBookId, setUnlinkingBookId] = useState<string | number | null>(null);

  // Delete modal state
  const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
  const [itemToDelete, setItemToDelete] = useState<AcademicItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Helper to extract clean ID
  const getItemId = (item: AcademicItem | BookItem): string | number => {
    return item.id ?? item._id ?? "";
  };

  // Helper for API endpoint path resolution
  const getResourcePath = (path: string) => {
    return `/v1/${resourceType}${path}`;
  };

  // Fetch Items list from backend API (with Server-Side Pagination & Filter params)
  const fetchItems = async (showRefreshToast = false) => {
    try {
      if (showRefreshToast) setIsRefreshing(true);
      else setIsLoading(true);

      const params: Record<string, any> = {
        page: currentPage,
        limit: itemsPerPage,
      };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (statusFilter === "active") params.isActive = true;
      if (statusFilter === "inactive") params.isActive = false;

      let responseData: any = null;
      try {
        const res = await api.get(getResourcePath(""), { params });
        responseData = res.data;
      } catch {
        // Fallback endpoint retry with /api prefix
        const res = await api.get(`/api/v1/${resourceType}`, { params });
        responseData = res.data;
      }

      // Handle standard response wrappers
      const dataArray = Array.isArray(responseData)
        ? responseData
        : responseData?.data || responseData?.result || responseData?.[resourceType] || [];

      // Extract pagination metadata
      const rawMeta = responseData?.meta || responseData?.pagination || {};
      const totalCount = rawMeta.total ?? responseData?.total ?? dataArray.length;
      const calcTotalPages = rawMeta.totalPages ?? Math.max(1, Math.ceil(totalCount / itemsPerPage));

      setMeta({
        total: totalCount,
        page: rawMeta.page ?? currentPage,
        limit: rawMeta.limit ?? itemsPerPage,
        totalPages: calcTotalPages,
        hasNextPage: rawMeta.hasNextPage ?? (currentPage < calcTotalPages),
        hasPrevPage: rawMeta.hasPrevPage ?? (currentPage > 1),
      });

      // Normalize items
      const normalizedItems: AcademicItem[] = dataArray.map((item: any) => ({
        id: item.id ?? item._id,
        name: item.name || "Untitled",
        code: item.code || `${codePrefix}-${item.id ?? item._id}`,
        description: item.description || "",
        isActive: item.isActive !== undefined ? item.isActive : item.status !== "inactive",
        totalBooks: item.totalBooks ?? item.booksCount ?? (Array.isArray(item.books) ? item.books.length : 0),
        books: item.books || [],
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }));

      setItems(normalizedItems);
      if (showRefreshToast) {
        toast.success(`${title} refreshed successfully!`);
      }
    } catch (err: any) {
      console.error(`Failed to fetch ${resourceType}:`, err);
      toast.error(err.response?.data?.message || `Failed to load ${resourceType} list.`);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [resourceType, currentPage, itemsPerPage, statusFilter]);

  // Handle Search Input Change with Debounce or Direct Fetch Reset
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // Re-fetch on Search Enter or Reset
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      fetchItems();
    }
  };

  // Fetch all books for the Link Books Modal
  const fetchBooksCatalog = async () => {
    try {
      setIsLoadingBooks(true);
      let booksRes: any = null;
      try {
        const res = await api.get("/v1/books", { params: { limit: 100 } });
        booksRes = res.data;
      } catch {
        const res = await api.get("/api/v1/books", { params: { limit: 100 } });
        booksRes = res.data;
      }

      const booksArray = Array.isArray(booksRes)
        ? booksRes
        : booksRes?.data || booksRes?.books || [];

      const normalizedBooks: BookItem[] = booksArray.map((b: any) => ({
        id: b.id ?? b._id,
        title: b.title || "Untitled Book",
        code: b.code || b.isbn || "",
        subject: b.subject || b.subjectName || "",
        class: b.class || b.className || "",
        language: b.language || b.languageName || "",
        coverImage: b.coverImage,
      }));

      setAvailableBooks(normalizedBooks);
    } catch (err: any) {
      console.error("Failed to fetch books catalog:", err);
      toast.error("Failed to load books catalog for selection.");
    } finally {
      setIsLoadingBooks(false);
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormData({
      name: "",
      code: "",
      description: "",
      isActive: true,
    });
    setIsCreateEditOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (item: AcademicItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name || "",
      code: item.code || "",
      description: item.description || "",
      isActive: item.isActive !== false,
    });
    setIsCreateEditOpen(true);
  };

  // Submit Create or Edit Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error(`${singularTitle} Name is required.`);
      return;
    }

    setIsSubmitting(true);
    const payload = {
      name: formData.name.trim(),
      code: formData.code.trim() || undefined,
      description: formData.description.trim() || undefined,
      isActive: formData.isActive,
    };

    try {
      if (editingItem) {
        const targetId = getItemId(editingItem);
        try {
          await api.put(getResourcePath(`/${targetId}`), payload);
        } catch {
          await api.put(`/api/v1/${resourceType}/${targetId}`, payload);
        }
        toast.success(`${singularTitle} updated successfully!`);
      } else {
        try {
          await api.post(getResourcePath(""), payload);
        } catch {
          await api.post(`/api/v1/${resourceType}`, payload);
        }
        toast.success(`${singularTitle} created successfully!`);
      }

      setIsCreateEditOpen(false);
      fetchItems();
    } catch (err: any) {
      console.error(`Failed to save ${singularTitle}:`, err);
      toast.error(err.response?.data?.message || `Failed to save ${singularTitle}.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Link Books Modal
  const handleOpenLinkBooksModal = (item: AcademicItem) => {
    setActiveItemForLinking(item);
    setBookSearchQuery("");
    
    // Extract currently linked book IDs
    const existingBookIds = new Set<string | number>();
    if (Array.isArray(item.books)) {
      item.books.forEach((b: any) => {
        const bId = b.id ?? b._id;
        if (bId !== undefined && bId !== null) {
          existingBookIds.add(bId);
        }
      });
    }
    setSelectedBookIds(existingBookIds);
    setIsLinkBooksOpen(true);
    fetchBooksCatalog();
  };

  // Toggle book selection in Link Books Modal
  const handleToggleBookSelect = (bookId: string | number) => {
    setSelectedBookIds((prev) => {
      const updated = new Set(prev);
      if (updated.has(bookId)) {
        updated.delete(bookId);
      } else {
        updated.add(bookId);
      }
      return updated;
    });
  };

  // Submit Link Books
  const handleSaveBookAssignments = async () => {
    if (!activeItemForLinking) return;
    setIsLinkingSubmitting(true);
    const targetId = getItemId(activeItemForLinking);
    const bookIdsArray = Array.from(selectedBookIds);

    try {
      try {
        await api.post(getResourcePath(`/${targetId}/books`), { bookIds: bookIdsArray });
      } catch {
        await api.post(`/api/v1/${resourceType}/${targetId}/books`, { bookIds: bookIdsArray });
      }

      toast.success(`Books assigned to ${activeItemForLinking.name} successfully!`);
      setIsLinkBooksOpen(false);
      fetchItems();
    } catch (err: any) {
      console.error("Failed to assign books:", err);
      toast.error(err.response?.data?.message || "Failed to assign books.");
    } finally {
      setIsLinkingSubmitting(false);
    }
  };

  // Unlink single book
  const handleUnlinkBook = async (bookId: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeItemForLinking) return;

    setUnlinkingBookId(bookId);
    const targetId = getItemId(activeItemForLinking);

    try {
      try {
        await api.delete(getResourcePath(`/${targetId}/books/${bookId}`));
      } catch {
        await api.delete(`/api/v1/${resourceType}/${targetId}/books/${bookId}`);
      }

      setSelectedBookIds((prev) => {
        const next = new Set(prev);
        next.delete(bookId);
        return next;
      });

      toast.success("Book unlinked successfully!");
      fetchItems();
    } catch (err: any) {
      console.error("Failed to unlink book:", err);
      toast.error(err.response?.data?.message || "Failed to unlink book.");
    } finally {
      setUnlinkingBookId(null);
    }
  };

  // Open Delete Confirmation Modal
  const handleOpenDeleteModal = (item: AcademicItem) => {
    setItemToDelete(item);
    setIsDeleteOpen(true);
  };

  // Submit Delete
  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    const targetId = getItemId(itemToDelete);

    try {
      try {
        await api.delete(getResourcePath(`/${targetId}`));
      } catch {
        await api.delete(`/api/v1/${resourceType}/${targetId}`);
      }

      toast.success(`${singularTitle} deleted successfully!`);
      setIsDeleteOpen(false);
      setItemToDelete(null);
      fetchItems();
    } catch (err: any) {
      console.error(`Failed to delete ${singularTitle}:`, err);
      toast.error(err.response?.data?.message || `Failed to delete ${singularTitle}.`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Statistics calculation
  const totalCount = meta.total || items.length;
  const activeCount = items.filter((i) => i.isActive).length;
  const inactiveCount = items.length - activeCount;
  const totalLinkedBooks = items.reduce((acc, i) => acc + (i.totalBooks || 0), 0);

  // Filtered available books for the selection modal
  const filteredAvailableBooks = useMemo(() => {
    return availableBooks.filter((book) => {
      const q = bookSearchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        book.title.toLowerCase().includes(q) ||
        (book.code && book.code.toLowerCase().includes(q)) ||
        (book.subject && book.subject.toLowerCase().includes(q)) ||
        (book.class && book.class.toLowerCase().includes(q))
      );
    });
  }, [availableBooks, bookSearchQuery]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 text-[#131b2e]">
      {/* Dynamic Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-white via-[#f0f4ff] to-[#e6eeff] p-6 sm:p-8 border border-[#c3c6d7]/40 shadow-sm backdrop-blur-md">
        <div className="absolute right-0 top-0 -mr-12 -mt-12 h-64 w-64 rounded-full bg-[#004ac6]/5 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-[#004ac6] text-white flex items-center justify-center shadow-lg shadow-[#004ac6]/20 shrink-0">
              <IconComponent className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#131b2e]">
                  {title}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#004ac6]/10 text-[#004ac6]">
                  Academic Master
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#505f76] font-medium mt-1 max-w-2xl">
                {description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="outline"
              onClick={() => fetchItems(true)}
              disabled={isRefreshing || isLoading}
              className="border-[#c3c6d7] text-[#505f76] hover:bg-[#eaedff]/50 cursor-pointer h-10 px-3"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin text-[#004ac6]" : ""}`} />
              Refresh
            </Button>
            {!shouldHideCreate && (
              <Button
                onClick={handleOpenCreateModal}
                className="bg-[#004ac6] hover:bg-[#003cb0] text-white font-semibold shadow-md shadow-[#004ac6]/20 cursor-pointer h-10 px-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New {singularTitle}
              </Button>
            )}
          </div>
        </div>

        {/* Quick Analytics Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-[#c3c6d7]/30">
          <div className="bg-white/80 backdrop-blur-sm p-3.5 rounded-xl border border-[#c3c6d7]/30 shadow-2xs">
            <p className="text-[11px] font-bold text-[#505f76] uppercase tracking-wider">Total {title}</p>
            <p className="text-xl font-black text-[#131b2e] mt-0.5">{totalCount}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm p-3.5 rounded-xl border border-emerald-200/60 shadow-2xs">
            <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Active (Page)</p>
            <p className="text-xl font-black text-emerald-600 mt-0.5">{activeCount}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm p-3.5 rounded-xl border border-amber-200/60 shadow-2xs">
            <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Inactive (Page)</p>
            <p className="text-xl font-black text-amber-600 mt-0.5">{inactiveCount}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm p-3.5 rounded-xl border border-[#004ac6]/20 shadow-2xs">
            <p className="text-[11px] font-bold text-[#004ac6] uppercase tracking-wider">Linked Books</p>
            <p className="text-xl font-black text-[#004ac6] mt-0.5">{totalLinkedBooks}</p>
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Status Filters */}
      <div className="bg-white rounded-2xl border border-[#c3c6d7]/40 p-4 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Search Bar */}
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder={`Search ${title.toLowerCase()} (Press Enter to search)...`}
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              className="w-full pl-10 pr-9 py-2.5 text-xs rounded-xl border border-[#c3c6d7]/60 focus:outline-none focus:border-[#004ac6] focus:ring-2 focus:ring-[#004ac6]/10 bg-[#faf8ff] font-medium transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setCurrentPage(1);
                  fetchItems();
                }}
                className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1.5 bg-[#faf8ff] p-1 rounded-xl border border-[#c3c6d7]/40 w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => {
                setStatusFilter("all");
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                statusFilter === "all"
                  ? "bg-[#004ac6] text-white shadow-sm"
                  : "text-[#505f76] hover:text-[#131b2e] hover:bg-white/60"
              }`}
            >
              All
            </button>
            <button
              onClick={() => {
                setStatusFilter("active");
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                statusFilter === "active"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-[#505f76] hover:text-emerald-700 hover:bg-white/60"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => {
                setStatusFilter("inactive");
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                statusFilter === "inactive"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-[#505f76] hover:text-amber-700 hover:bg-white/60"
              }`}
            >
              Inactive
            </button>
          </div>
        </div>

        {/* Active Filter Indicators */}
        {(searchQuery || statusFilter !== "all") && (
          <div className="flex items-center gap-2 pt-2 border-t border-[#c3c6d7]/20 text-xs font-semibold text-[#505f76]">
            <Filter className="h-3.5 w-3.5 text-[#004ac6]" />
            <span>Showing results for search/filters (Total: {meta.total})</span>
            <button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setCurrentPage(1);
              }}
              className="text-[#004ac6] hover:underline font-bold ml-2 cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Main Interactive Data Table */}
      <div className="bg-white rounded-2xl border border-[#c3c6d7]/40 shadow-sm overflow-hidden">
        {isLoading ? (
          /* Loading Skeletons */
          <div className="p-6 space-y-4">
            <div className="h-10 bg-zinc-100 animate-pulse rounded-xl" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((idx) => (
                <div key={idx} className="h-14 bg-zinc-50 animate-pulse rounded-xl border border-zinc-100 flex items-center justify-between px-4">
                  <div className="flex items-center gap-4 w-1/3">
                    <div className="h-6 w-16 bg-zinc-200 rounded-md" />
                    <div className="h-4 w-32 bg-zinc-200 rounded" />
                  </div>
                  <div className="h-4 w-24 bg-zinc-200 rounded" />
                  <div className="h-6 w-20 bg-zinc-200 rounded-full" />
                  <div className="h-8 w-24 bg-zinc-200 rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        ) : items.length === 0 ? (
          /* Empty State */
          <div className="py-16 px-6 text-center space-y-3">
            <div className="h-16 w-16 rounded-2xl bg-[#eaedff] text-[#004ac6] flex items-center justify-center mx-auto shadow-inner">
              <IconComponent className="h-8 w-8" />
            </div>
            <h3 className="text-base font-extrabold text-[#131b2e]">
              No {title} Found
            </h3>
            <p className="text-xs text-[#505f76] max-w-md mx-auto font-medium">
              {searchQuery || statusFilter !== "all"
                ? "No matching records found for your search filters. Try clearing the filters."
                : `There are currently no ${title.toLowerCase()} configured in the LMS.`}
            </p>
            <div className="pt-2">
              {searchQuery || statusFilter !== "all" ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                    setCurrentPage(1);
                  }}
                  className="border-[#c3c6d7] text-[#004ac6] font-semibold"
                >
                  Clear Filters
                </Button>
              ) : (
                <Button
                  onClick={handleOpenCreateModal}
                  className="bg-[#004ac6] hover:bg-[#003cb0] text-white font-semibold"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First {singularTitle}
                </Button>
              )}
            </div>
          </div>
        ) : (
          /* Responsive Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#faf8ff] border-b border-[#c3c6d7]/30 text-[11px] font-extrabold uppercase tracking-wider text-[#505f76]">
                  <th className="py-4 px-6">Code</th>
                  <th className="py-4 px-6">Name & Description</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Linked Books</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c3c6d7]/20 text-xs">
                {items.map((item) => {
                  const itemId = getItemId(item);
                  const booksCount = item.totalBooks ?? (Array.isArray(item.books) ? item.books.length : 0);

                  return (
                    <tr
                      key={itemId}
                      className="hover:bg-[#f4f7ff]/60 transition-colors group"
                    >
                      {/* Code Badge */}
                      <td className="py-4 px-6 font-mono font-bold">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-[#eaedff] text-[#004ac6] border border-[#004ac6]/20 shadow-2xs">
                          {item.code || `${codePrefix}-${itemId}`}
                        </span>
                      </td>

                      {/* Name & Description */}
                      <td className="py-4 px-6 max-w-sm">
                        <p className="font-extrabold text-[#131b2e] text-sm group-hover:text-[#004ac6] transition-colors">
                          {item.name}
                        </p>
                        {item.description ? (
                          <p className="text-xs text-[#505f76] truncate mt-0.5 font-medium">
                            {item.description}
                          </p>
                        ) : (
                          <span className="text-[11px] text-zinc-400 italic">No description</span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-6">
                        {item.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
                            <XCircle className="h-3.5 w-3.5 text-amber-600" />
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Linked Books Badge */}
                      <td className="py-4 px-6">
                        <button
                          onClick={() => handleOpenLinkBooksModal(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 hover:bg-[#004ac6]/10 text-[#131b2e] hover:text-[#004ac6] border border-slate-200/80 transition-all font-semibold cursor-pointer group/badge"
                          title="Click to view & assign linked books"
                        >
                          <BookOpen className="h-3.5 w-3.5 text-[#004ac6]" />
                          <span>{booksCount} {booksCount === 1 ? "Book" : "Books"} linked</span>
                        </button>
                      </td>

                      {/* Actions Buttons */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenLinkBooksModal(item)}
                            className="h-8 px-2.5 text-xs text-[#004ac6] hover:bg-[#eaedff] border border-transparent hover:border-[#004ac6]/20 font-semibold cursor-pointer"
                          >
                            <LinkIcon className="h-3.5 w-3.5 mr-1" />
                            Link Books
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEditModal(item)}
                            className="h-8 w-8 p-0 text-slate-600 hover:text-[#004ac6] hover:bg-slate-100 rounded-lg cursor-pointer"
                            title="Edit"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDeleteModal(item)}
                            className="h-8 w-8 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
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

      {/* Pagination Bar */}
      {items.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#c3c6d7]/40 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs text-[#505f76] font-semibold">
            <span>
              Showing <strong className="text-[#131b2e]">{(meta.page - 1) * meta.limit + 1}</strong> to{" "}
              <strong className="text-[#131b2e]">{Math.min(meta.page * meta.limit, meta.total)}</strong> of{" "}
              <strong className="text-[#004ac6]">{meta.total}</strong> items
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

      {/* MODAL 1: Create / Edit Modal */}
      {isCreateEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-[#c3c6d7]/40 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#c3c6d7]/30 bg-[#faf8ff]">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-[#004ac6]/10 text-[#004ac6] flex items-center justify-center font-bold">
                  <IconComponent className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-[#131b2e]">
                    {editingItem ? `Edit ${singularTitle}` : `Add New ${singularTitle}`}
                  </h2>
                  <p className="text-xs text-[#505f76]">
                    Fill in details to save this master entry.
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
            <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
              {/* Name (Required) */}
              <div>
                <label className="block text-xs font-bold text-[#131b2e] mb-1.5">
                  {singularTitle} Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={`e.g. ${codePrefix === "CLS" ? "Class 10" : codePrefix === "SUB" ? "Mathematics" : "English"}`}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#c3c6d7]/60 focus:outline-none focus:border-[#004ac6] focus:ring-2 focus:ring-[#004ac6]/10 font-medium bg-[#faf8ff]"
                />
              </div>

              {/* Code (Optional) */}
              <div>
                <label className="block text-xs font-bold text-[#131b2e] mb-1.5">
                  Code <span className="text-zinc-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder={`e.g. ${codePlaceholder}`}
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2.5 text-xs font-mono uppercase rounded-xl border border-[#c3c6d7]/60 focus:outline-none focus:border-[#004ac6] focus:ring-2 focus:ring-[#004ac6]/10 bg-[#faf8ff]"
                />
                <p className="text-[11px] text-zinc-400 mt-1">Leave empty for auto-generated code.</p>
              </div>

              {/* Description (Optional) */}
              <div>
                <label className="block text-xs font-bold text-[#131b2e] mb-1.5">
                  Description <span className="text-zinc-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder={`Provide a brief summary for this ${singularTitle.toLowerCase()}...`}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#c3c6d7]/60 focus:outline-none focus:border-[#004ac6] focus:ring-2 focus:ring-[#004ac6]/10 font-medium bg-[#faf8ff]"
                />
              </div>

              {/* Is Active Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#faf8ff] border border-[#c3c6d7]/30">
                <div>
                  <p className="text-xs font-bold text-[#131b2e]">Active Status</p>
                  <p className="text-[11px] text-[#505f76]">
                    Enable or disable availability across LMS modules.
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

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#c3c6d7]/30">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateEditOpen(false)}
                  className="border-[#c3c6d7] text-[#505f76] hover:bg-zinc-100 text-xs font-semibold cursor-pointer"
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
                  ) : editingItem ? (
                    "Update Record"
                  ) : (
                    "Create Record"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Link Books Modal */}
      {isLinkBooksOpen && activeItemForLinking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-[#c3c6d7]/40 shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#c3c6d7]/30 bg-[#faf8ff] shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#004ac6]/10 text-[#004ac6] flex items-center justify-center font-bold">
                  <BookMarked className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-extrabold text-[#131b2e]">
                      Link Books to {activeItemForLinking.name}
                    </h2>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#eaedff] text-[#004ac6]">
                      {activeItemForLinking.code}
                    </span>
                  </div>
                  <p className="text-xs text-[#505f76]">
                    Select books from the catalog to map them to this master record.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsLinkBooksOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 p-1.5 rounded-lg hover:bg-zinc-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
              {/* Live Search & Quick Tools */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search books by title, class, subject..."
                    value={bookSearchQuery}
                    onChange={(e) => setBookSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#c3c6d7]/60 focus:outline-none focus:border-[#004ac6] bg-[#faf8ff]"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const allIds = new Set(availableBooks.map(b => getItemId(b)));
                      setSelectedBookIds(allIds);
                    }}
                    className="text-xs text-[#004ac6] border-[#004ac6]/30 hover:bg-[#004ac6]/10"
                  >
                    <CheckSquare className="h-3.5 w-3.5 mr-1" /> Select All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedBookIds(new Set())}
                    className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                  >
                    <Square className="h-3.5 w-3.5 mr-1" /> Deselect All
                  </Button>
                </div>
              </div>

              {/* Books Selection Grid */}
              {isLoadingBooks ? (
                <div className="py-12 text-center space-y-2">
                  <Loader2 className="h-7 w-7 animate-spin mx-auto text-[#004ac6]" />
                  <p className="text-xs font-semibold text-[#505f76]">Loading catalog books...</p>
                </div>
              ) : filteredAvailableBooks.length === 0 ? (
                <div className="py-12 text-center bg-[#faf8ff] rounded-xl border border-dashed border-[#c3c6d7]/60 space-y-1">
                  <BookOpen className="h-8 w-8 text-zinc-300 mx-auto" />
                  <p className="text-xs font-bold text-[#131b2e]">No matching books found</p>
                  <p className="text-[11px] text-[#505f76]">Try adjusting your search criteria.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                  {filteredAvailableBooks.map((book) => {
                    const bId = getItemId(book);
                    const isSelected = selectedBookIds.has(bId);
                    const isUnlinking = unlinkingBookId === bId;

                    return (
                      <div
                        key={bId}
                        onClick={() => handleToggleBookSelect(bId)}
                        className={`p-3 rounded-xl border transition-all flex items-start justify-between gap-3 cursor-pointer select-none ${
                          isSelected
                            ? "bg-[#004ac6]/5 border-[#004ac6] shadow-2xs"
                            : "bg-white border-[#c3c6d7]/40 hover:bg-[#faf8ff]"
                        }`}
                      >
                        <div className="space-y-1 overflow-hidden">
                          <div className="flex items-center gap-1.5">
                            {book.class && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#004ac6]/10 text-[#004ac6]">
                                {book.class}
                              </span>
                            )}
                            {book.subject && (
                              <span className="text-[10px] font-semibold text-[#505f76]">
                                {book.subject}
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-extrabold text-[#131b2e] truncate">{book.title}</p>
                          {book.code && (
                            <p className="text-[10px] font-mono text-zinc-400">{book.code}</p>
                          )}
                        </div>

                        {/* Checkbox indicator & Unlink Option */}
                        <div className="flex items-center gap-1 shrink-0 pt-0.5">
                          {isSelected && (
                            <button
                              type="button"
                              onClick={(e) => handleUnlinkBook(bId, e)}
                              disabled={isUnlinking}
                              className="text-zinc-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 cursor-pointer"
                              title="Unlink book immediately"
                            >
                              {isUnlinking ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-600" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </button>
                          )}
                          <div
                            className={`h-5 w-5 rounded-md flex items-center justify-center transition-colors ${
                              isSelected
                                ? "bg-[#004ac6] text-white"
                                : "border border-[#c3c6d7] bg-white"
                            }`}
                          >
                            {isSelected && <Check className="h-3.5 w-3.5" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#c3c6d7]/30 bg-[#faf8ff] flex items-center justify-between shrink-0">
              <span className="text-xs font-semibold text-[#505f76]">
                <strong className="text-[#004ac6]">{selectedBookIds.size}</strong> books selected
              </span>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsLinkBooksOpen(false)}
                  className="border-[#c3c6d7] text-[#505f76] text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveBookAssignments}
                  disabled={isLinkingSubmitting}
                  className="bg-[#004ac6] hover:bg-[#003cb0] text-white text-xs font-semibold shadow-md cursor-pointer"
                >
                  {isLinkingSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    "Save Linked Books"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Delete Confirmation Modal */}
      {isDeleteOpen && itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-[#c3c6d7]/40 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-6 text-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-[#131b2e]">
                  Delete {singularTitle}?
                </h3>
                <p className="text-xs text-[#505f76] mt-1 font-medium">
                  Are you sure you want to delete <strong className="text-[#131b2e]">"{itemToDelete.name}"</strong> ({itemToDelete.code})? This action cannot be undone.
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
                  {isDeleting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto" />
                  ) : (
                    "Yes, Delete"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
