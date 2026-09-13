"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  QrCode,
  Plus,
  Search,
  RefreshCw,
  Copy,
  Check,
  Eye,
  Link2,
  Unlink,
  ToggleLeft,
  ToggleRight,
  Download,
  Printer,
  X,
  AlertTriangle,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Filter,
  Layers,
  Sparkles,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import qrApi from "@/lib/api/qrcode";
import { QRCodeItem, QRCodeStatus, QRCodeType } from "@/types/qrcode";

interface BookOption {
  id: number | string;
  title: string;
  class?: string;
  subject?: string;
}

export default function QRListPage() {
  // Data state
  const [qrList, setQrList] = useState<QRCodeItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  // Filter states
  const [targetTypeFilter, setTargetTypeFilter] = useState<"ALL" | "BOOK" | "VIDEO">("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedQuery, setDebouncedQuery] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Copy state tracker
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modal States
  const [previewQr, setPreviewQr] = useState<QRCodeItem | null>(null);
  const [unmapQr, setUnmapQr] = useState<QRCodeItem | null>(null);
  const [isUnmapping, setIsUnmapping] = useState<boolean>(false);

  // Map/Remap Modal State
  const [mapQrItem, setMapQrItem] = useState<QRCodeItem | null>(null);
  const [booksList, setBooksList] = useState<BookOption[]>([]);
  const [isLoadingBooks, setIsLoadingBooks] = useState<boolean>(false);
  const [selectedBookId, setSelectedBookId] = useState<string>("");
  const [isMapping, setIsMapping] = useState<boolean>(false);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch QR Codes
  const fetchQRCodes = useCallback(
    async (showToast = false) => {
      try {
        if (showToast) setIsRefreshing(true);
        else setIsLoading(true);

        const params: any = {
          page: currentPage,
          limit: itemsPerPage,
        };

        if (targetTypeFilter !== "ALL") params.targetType = targetTypeFilter;
        if (debouncedQuery.trim()) params.search = debouncedQuery.trim();
        if (typeFilter !== "ALL") params.type = typeFilter;
        if (statusFilter !== "ALL") params.status = statusFilter;

        const res = await qrApi.getList(params);

        const rawData = res.data || [];
        setQrList(rawData);

        if (res.pagination) {
          setPagination({
            total: res.pagination.total || rawData.length,
            page: res.pagination.page || currentPage,
            limit: res.pagination.limit || itemsPerPage,
            totalPages: res.pagination.totalPages || 1,
          });
        } else {
          setPagination({
            total: rawData.length,
            page: currentPage,
            limit: itemsPerPage,
            totalPages: Math.ceil(rawData.length / itemsPerPage) || 1,
          });
        }

        if (showToast) toast.success("QR Codes refreshed successfully!");
      } catch (err: any) {
        console.error("Failed to fetch QR codes:", err);
        toast.error(err?.response?.data?.message || "Failed to load QR codes list");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [currentPage, itemsPerPage, debouncedQuery, typeFilter, statusFilter, targetTypeFilter]
  );

  useEffect(() => {
    fetchQRCodes();
  }, [fetchQRCodes]);

  // Copy code helper
  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Copied "${code}" to clipboard!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Copy URL helper
  const handleCopyUrl = (code: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const publicUrl = `${origin}/q/${code}`;
    navigator.clipboard.writeText(publicUrl);
    toast.success("Public QR scanner link copied!");
  };

  // Open Map/Remap Modal
  const handleOpenMapModal = async (item: QRCodeItem) => {
    setMapQrItem(item);
    setSelectedBookId(item.bookId ? String(item.bookId) : "");
    try {
      setIsLoadingBooks(true);
      const res = await api.get("/books", { params: { limit: 200 } }).catch(() =>
        api.get("/api/v1/books", { params: { limit: 200 } })
      );
      const dataArr = res.data?.data || (Array.isArray(res.data) ? res.data : []);
      setBooksList(
        dataArr.map((b: any) => ({
          id: b.id ?? b._id,
          title: b.title || "Untitled Book",
          class: b.class || b.className || "",
          subject: b.subject || b.subjectName || "",
        }))
      );
    } catch (err) {
      console.error("Error loading books:", err);
      toast.error("Failed to fetch books list");
    } finally {
      setIsLoadingBooks(false);
    }
  };

  // Submit Map/Remap
  const handleConfirmMap = async () => {
    if (!mapQrItem || !selectedBookId) {
      toast.error("Please select a book to map");
      return;
    }

    try {
      setIsMapping(true);
      if (mapQrItem.status === "ACTIVE" && mapQrItem.bookId) {
        await qrApi.remapToBook(mapQrItem.id, selectedBookId);
        toast.success(`QR code remapped to selected book successfully!`);
      } else {
        await qrApi.mapToBook(mapQrItem.id, selectedBookId);
        toast.success(`QR code mapped to book successfully!`);
      }
      setMapQrItem(null);
      fetchQRCodes();
    } catch (err: any) {
      console.error("Map error:", err);
      toast.error(err?.response?.data?.message || "Failed to map QR code to book");
    } finally {
      setIsMapping(false);
    }
  };

  // Submit Unmap
  const handleConfirmUnmap = async () => {
    if (!unmapQr) return;
    try {
      setIsUnmapping(true);
      await qrApi.unmap(unmapQr.id);
      toast.success(`Unmapped QR code ${unmapQr.code} successfully!`);
      setUnmapQr(null);
      fetchQRCodes();
    } catch (err: any) {
      console.error("Unmap error:", err);
      toast.error(err?.response?.data?.message || "Failed to unmap QR code");
    } finally {
      setIsUnmapping(false);
    }
  };

  // Toggle Status (ACTIVE <-> INACTIVE)
  const handleToggleStatus = async (item: QRCodeItem) => {
    const newStatus: QRCodeStatus = item.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await qrApi.updateStatus(item.id, newStatus);
      toast.success(`QR status updated to ${newStatus}`);
      fetchQRCodes();
    } catch (err: any) {
      console.error("Status update error:", err);
      toast.error(err?.response?.data?.message || "Failed to update status");
    }
  };

  // Print Label Handler
  const handlePrintLabel = (item: QRCodeItem) => {
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
          <title>Print QR Label - ${item.code}</title>
          <style>
            body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #fff; }
            .label { border: 2px dashed #004ac6; padding: 24px; text-align: center; border-radius: 12px; max-width: 320px; }
            .img-box { margin: 16px 0; }
            .img-box img { width: 180px; height: 180px; }
            .title { font-weight: bold; font-size: 16px; margin-bottom: 4px; color: #131b2e; }
            .sub { font-size: 12px; color: #505f76; margin-bottom: 12px; }
            .code { font-family: monospace; font-size: 14px; font-weight: bold; background: #eaedff; padding: 4px 8px; border-radius: 4px; color: #004ac6; }
            .url { font-size: 10px; color: #888; margin-top: 8px; word-break: break-all; }
          </style>
        </head>
        <body>
          <div class="label">
            <div class="title">${item.book?.title || "Textbook Material"}</div>
            <div class="sub">${item.book?.class ? `Class: ${item.book.class}` : ""} ${item.book?.subject ? `| Subject: ${item.book.subject}` : ""}</div>
            <div class="img-box">
              <img src="${imageUrl}" alt="QR Code" />
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

  // Metric counts derived
  const totalCount = pagination.total || qrList.length;
  const activeCount = qrList.filter((q) => q.status === "ACTIVE").length;
  const unmappedCount = qrList.filter((q) => q.status === "UNMAPPED").length;
  const inactiveCount = qrList.filter((q) => q.status === "INACTIVE").length;

  return (
    <div className="space-y-4 md:space-y-5">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 md:p-5 rounded-2xl border border-[#c3c6d7]/30 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#004ac6]/10 text-[#004ac6]">
              <QrCode className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold text-[#131b2e]">QR Code Management</h1>
          </div>
          <p className="text-xs text-[#505f76] mt-1 ml-11">
            Manage physical and generated QR codes for textbooks and digital materials
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/dashboard/qrcode/generate">
            <Button className="bg-[#004ac6] hover:bg-[#003899] text-white gap-2 font-semibold text-xs h-9 shadow-sm cursor-pointer">
              <Plus className="h-4 w-4" />
              Generate QR
            </Button>
          </Link>
          <Link href="/dashboard/qrcode/map">
            <Button
              variant="outline"
              className="border-[#004ac6]/30 text-[#004ac6] hover:bg-[#eaedff] gap-2 font-semibold text-xs h-9 cursor-pointer"
            >
              <Link2 className="h-4 w-4" />
              Map Existing QR
            </Button>
          </Link>
          <Link href="/dashboard/qrcode/bulk">
            <Button
              variant="outline"
              className="border-[#c3c6d7] text-[#131b2e] hover:bg-[#eaedff]/50 gap-2 font-semibold text-xs h-9 cursor-pointer"
            >
              <Layers className="h-4 w-4 text-purple-600" />
              Bulk Generate
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Metric Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#c3c6d7]/30 shadow-sm">
          <p className="text-xs font-semibold text-[#505f76]">Total QRs</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-[#131b2e]">{totalCount}</span>
            <span className="text-[10px] text-zinc-400 font-medium">Registered</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#c3c6d7]/30 shadow-sm">
          <p className="text-xs font-semibold text-emerald-600">Active QRs</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-emerald-700">{activeCount}</span>
            <span className="text-[10px] text-emerald-600/70 font-medium">Mapped & Ready</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-sm">
          <p className="text-xs font-semibold text-amber-700">Unmapped QRs</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-amber-800">{unmappedCount}</span>
            <span className="text-[10px] text-amber-600 font-medium">Needs Linking</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#c3c6d7]/30 shadow-sm">
          <p className="text-xs font-semibold text-rose-600">Inactive QRs</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-rose-700">{inactiveCount}</span>
            <span className="text-[10px] text-rose-600/70 font-medium">Disabled</span>
          </div>
        </div>
      </div>

      {/* 2.5 Target Tab Switcher (All | Books | Videos) */}
      <div className="flex items-center gap-2 border-b border-[#c3c6d7]/30 pb-2">
        <button
          onClick={() => {
            setTargetTypeFilter("ALL");
            setCurrentPage(1);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            targetTypeFilter === "ALL"
              ? "bg-[#004ac6] text-white shadow-xs"
              : "bg-white text-[#505f76] hover:bg-[#eaedff] hover:text-[#004ac6] border border-[#c3c6d7]/30"
          }`}
        >
          <QrCode className="h-4 w-4" />
          <span>All QR Codes</span>
        </button>

        <button
          onClick={() => {
            setTargetTypeFilter("BOOK");
            setCurrentPage(1);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            targetTypeFilter === "BOOK"
              ? "bg-[#004ac6] text-white shadow-xs"
              : "bg-white text-[#505f76] hover:bg-[#eaedff] hover:text-[#004ac6] border border-[#c3c6d7]/30"
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>Book QRs</span>
        </button>

        <button
          onClick={() => {
            setTargetTypeFilter("VIDEO");
            setCurrentPage(1);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            targetTypeFilter === "VIDEO"
              ? "bg-[#004ac6] text-white shadow-xs"
              : "bg-white text-[#505f76] hover:bg-[#eaedff] hover:text-[#004ac6] border border-[#c3c6d7]/30"
          }`}
        >
          <Video className="h-4 w-4" />
          <span>Video QRs</span>
        </button>
      </div>

      {/* 3. Search & Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#c3c6d7]/30 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by QR code or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-[#c3c6d7]/60 rounded-lg focus:outline-none focus:border-[#004ac6] bg-[#faf8ff]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Type Filter */}
          <div className="flex items-center gap-1.5 border border-[#c3c6d7]/60 rounded-lg px-2 py-1 bg-[#faf8ff]">
            <Filter className="h-3.5 w-3.5 text-zinc-400" />
            <span className="text-[11px] font-semibold text-[#505f76]">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs bg-transparent focus:outline-none font-semibold text-[#131b2e] cursor-pointer"
            >
              <option value="ALL">All Types</option>
              <option value="GENERATED">Generated</option>
              <option value="EXISTING">Existing Physical</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 border border-[#c3c6d7]/60 rounded-lg px-2 py-1 bg-[#faf8ff]">
            <span className="text-[11px] font-semibold text-[#505f76]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs bg-transparent focus:outline-none font-semibold text-[#131b2e] cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="UNMAPPED">Unmapped</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchQRCodes(true)}
            disabled={isRefreshing || isLoading}
            className="h-8 px-2.5 text-xs text-[#004ac6] hover:bg-[#eaedff] cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* 4. Data Table Section */}
      <div className="bg-white rounded-2xl border border-[#c3c6d7]/30 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#004ac6]" />
            <p className="text-xs font-semibold text-[#505f76]">Loading QR Codes catalog...</p>
          </div>
        ) : qrList.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <div className="p-3 rounded-full bg-[#eaedff] text-[#004ac6]">
              <QrCode className="h-8 w-8" />
            </div>
            <p className="text-sm font-bold text-[#131b2e]">No QR Codes Found</p>
            <p className="text-xs text-[#505f76] max-w-sm">
              No QR codes match your filter criteria or search query. Generate or map a new QR code to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#faf8ff] border-b border-[#c3c6d7]/30 text-[#505f76] font-semibold">
                  <th className="py-3 px-4">QR Code</th>
                  <th className="py-3 px-4">Target</th>
                  <th className="py-3 px-4">Mapped Item</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Mapped Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c3c6d7]/20 text-[#131b2e]">
                {qrList.map((item) => {
                  const isCopied = copiedCode === item.code;
                  const isVideo = item.targetType === "VIDEO" || Boolean(item.video) || Boolean(item.videoId);
                  return (
                    <tr key={item.id} className="hover:bg-[#eaedff]/30 transition-colors">
                      {/* Code */}
                      <td className="py-3.5 px-4 font-mono font-bold text-[#004ac6]">
                        <div className="flex items-center gap-2">
                          <span>{item.code}</span>
                          <button
                            onClick={() => handleCopy(item.code)}
                            className="p-1 rounded hover:bg-[#eaedff] text-zinc-400 hover:text-[#004ac6] transition-colors"
                            title="Copy code"
                          >
                            {isCopied ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Target Type Badge */}
                      <td className="py-3.5 px-4">
                        {isVideo ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            <Video className="h-3 w-3" />
                            Video
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#004ac6] bg-[#eaedff] px-2 py-0.5 rounded-full border border-[#004ac6]/20">
                            <BookOpen className="h-3 w-3" />
                            Book
                          </span>
                        )}
                      </td>

                      {/* Mapped Item */}
                      <td className="py-3.5 px-4">
                        {isVideo && item.video ? (
                          <div>
                            <p className="font-bold text-[#131b2e] leading-snug">{item.video.title}</p>
                            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                              {item.video.chapter?.title && (
                                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-semibold border border-emerald-200">
                                  Ch: {item.video.chapter.title}
                                </span>
                              )}
                              {item.video.book?.title && (
                                <span className="text-[10px] bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded font-semibold truncate max-w-[160px]">
                                  {item.video.book.title}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : item.book ? (
                          <div>
                            <p className="font-bold text-[#131b2e] leading-snug">{item.book.title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {item.book.class && (
                                <span className="text-[10px] bg-[#eaedff] text-[#004ac6] px-1.5 py-0.5 rounded font-semibold">
                                  {item.book.class}
                                </span>
                              )}
                              {item.book.subject && (
                                <span className="text-[10px] bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded font-semibold">
                                  {item.book.subject}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <AlertTriangle className="h-3 w-3" />
                            Unmapped
                          </span>
                        )}
                      </td>

                      {/* Type Badge */}
                      <td className="py-3.5 px-4">
                        {item.type === "GENERATED" ? (
                          <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                            GENERATED
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                            EXISTING
                          </span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4">
                        {item.status === "ACTIVE" ? (
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            ACTIVE
                          </span>
                        ) : item.status === "UNMAPPED" ? (
                          <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            UNMAPPED
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            INACTIVE
                          </span>
                        )}
                      </td>

                      {/* Mapped Date */}
                      <td className="py-3.5 px-4 text-zinc-500 font-medium">
                        {item.mappedAt
                          ? new Date(item.mappedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Preview Modal trigger */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPreviewQr(item)}
                            className="h-8 w-8 p-0 text-[#004ac6] hover:bg-[#eaedff] rounded-lg"
                            title="Preview / Download QR"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {/* Map / Remap Modal trigger */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenMapModal(item)}
                            className="h-8 w-8 p-0 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                            title={item.bookId ? "Remap Book" : "Map to Book"}
                          >
                            <Link2 className="h-4 w-4" />
                          </Button>

                          {/* Unmap Button */}
                          {item.bookId && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setUnmapQr(item)}
                              className="h-8 w-8 p-0 text-amber-600 hover:bg-amber-50 rounded-lg"
                              title="Unmap Book"
                            >
                              <Unlink className="h-4 w-4" />
                            </Button>
                          )}

                          {/* Toggle Active/Inactive */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(item)}
                            className={`h-8 w-8 p-0 rounded-lg ${
                              item.status === "ACTIVE"
                                ? "text-emerald-600 hover:bg-emerald-50"
                                : "text-zinc-400 hover:bg-zinc-100"
                            }`}
                            title={item.status === "ACTIVE" ? "Deactivate QR" : "Activate QR"}
                          >
                            {item.status === "ACTIVE" ? (
                              <ToggleRight className="h-5 w-5" />
                            ) : (
                              <ToggleLeft className="h-5 w-5" />
                            )}
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

        {/* Pagination Footer */}
        {!isLoading && qrList.length > 0 && (
          <div className="p-4 bg-[#faf8ff] border-t border-[#c3c6d7]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-[#505f76]">
              Showing <span className="font-bold text-[#131b2e]">{(pagination.page - 1) * pagination.limit + 1}</span> to{" "}
              <span className="font-bold text-[#131b2e]">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{" "}
              of <span className="font-bold text-[#131b2e]">{pagination.total}</span> QR codes
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                className="h-8 px-2.5 text-xs text-[#131b2e] cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <span className="text-xs font-bold text-[#131b2e] px-2">
                {currentPage} / {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= pagination.totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(pagination.totalPages, prev + 1))}
                className="h-8 px-2.5 text-xs text-[#131b2e] cursor-pointer"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 5. MODAL 1: QR Preview & Download Modal */}
      {previewQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-[#c3c6d7]/40 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-[#c3c6d7]/30 flex items-center justify-between bg-[#faf8ff]">
              <div className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-[#004ac6]" />
                <h3 className="text-sm font-bold text-[#131b2e]">QR Code Preview</h3>
              </div>
              <button
                onClick={() => setPreviewQr(null)}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 md:p-5 text-center space-y-3.5">
              {/* Visual QR Image */}
              <div className="inline-block p-4 bg-white rounded-2xl border-2 border-dashed border-[#004ac6]/30 shadow-inner">
                <img
                  src={qrApi.getImageUrl(previewQr.id, "png")}
                  alt={`QR Code ${previewQr.code}`}
                  className="w-48 h-48 object-contain mx-auto rounded-lg"
                  onError={(e) => {
                    // Fallback to client QR rendering or generic placeholder
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>

              <div>
                <span className="font-mono text-base font-black text-[#004ac6] bg-[#eaedff] px-3 py-1 rounded-lg">
                  {previewQr.code}
                </span>
              </div>

              {previewQr.book && (
                <div className="bg-[#faf8ff] p-3 rounded-xl border border-[#c3c6d7]/30 text-left">
                  <p className="text-xs font-bold text-[#131b2e]">{previewQr.book.title}</p>
                  <p className="text-[11px] text-[#505f76] mt-0.5">
                    {previewQr.book.class ? `Class: ${previewQr.book.class}` : ""}{" "}
                    {previewQr.book.subject ? `| Subject: ${previewQr.book.subject}` : ""}
                  </p>
                </div>
              )}

              {/* Public scanner link action */}
              <div className="flex items-center justify-between p-2.5 bg-zinc-50 rounded-lg text-xs border border-zinc-200">
                <span className="font-mono text-[11px] text-zinc-500 truncate mr-2">
                  /q/{previewQr.code}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyUrl(previewQr.code)}
                  className="h-7 text-xs text-[#004ac6] hover:bg-[#eaedff] font-semibold"
                >
                  <Copy className="h-3.5 w-3.5 mr-1" />
                  Copy Link
                </Button>
              </div>

              {/* Download / Print Actions */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                <a
                  href={qrApi.getImageUrl(previewQr.id, "png", true)}
                  download={`QR-${previewQr.code}.png`}
                  className="w-full"
                >
                  <Button
                    variant="outline"
                    className="w-full text-xs font-semibold border-[#004ac6]/30 text-[#004ac6] hover:bg-[#eaedff] h-9 gap-1.5"
                  >
                    <Download className="h-3.5 w-3.5" />
                    PNG
                  </Button>
                </a>

                <a
                  href={qrApi.getImageUrl(previewQr.id, "svg", true)}
                  download={`QR-${previewQr.code}.svg`}
                  className="w-full"
                >
                  <Button
                    variant="outline"
                    className="w-full text-xs font-semibold border-purple-300 text-purple-700 hover:bg-purple-50 h-9 gap-1.5"
                  >
                    <Download className="h-3.5 w-3.5" />
                    SVG
                  </Button>
                </a>

                <Button
                  onClick={() => handlePrintLabel(previewQr)}
                  className="w-full text-xs font-semibold bg-[#004ac6] hover:bg-[#003899] text-white h-9 gap-1.5 cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print Label
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL 2: Map / Remap Modal */}
      {mapQrItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-[#c3c6d7]/40 shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b border-[#c3c6d7]/30 flex items-center justify-between bg-[#faf8ff]">
              <div className="flex items-center gap-2">
                <Link2 className="h-5 w-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-[#131b2e]">
                  {mapQrItem.bookId ? "Remap QR Code" : "Map QR Code to Book"}
                </h3>
              </div>
              <button
                onClick={() => setMapQrItem(null)}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-3.5">
              <div className="bg-[#faf8ff] p-3 rounded-xl border border-[#c3c6d7]/30 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-[#505f76]">Selected QR Code</p>
                  <p className="font-mono text-sm font-bold text-[#004ac6]">{mapQrItem.code}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {mapQrItem.type}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#131b2e] mb-1">
                  Select Target Book
                </label>
                {isLoadingBooks ? (
                  <div className="flex items-center gap-2 py-3 text-xs text-[#505f76]">
                    <Loader2 className="h-4 w-4 animate-spin text-[#004ac6]" />
                    Loading available books...
                  </div>
                ) : (
                  <select
                    value={selectedBookId}
                    onChange={(e) => setSelectedBookId(e.target.value)}
                    className="w-full p-2.5 text-xs border border-[#c3c6d7] rounded-xl focus:outline-none focus:border-[#004ac6] bg-white font-semibold text-[#131b2e]"
                  >
                    <option value="">-- Choose a textbook --</option>
                    {booksList.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.title} {b.class ? `(${b.class})` : ""} {b.subject ? `- ${b.subject}` : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#c3c6d7]/20">
                <Button
                  variant="ghost"
                  onClick={() => setMapQrItem(null)}
                  className="text-xs font-semibold text-[#505f76]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmMap}
                  disabled={!selectedBookId || isMapping}
                  className="bg-[#004ac6] hover:bg-[#003899] text-white text-xs font-semibold gap-2 h-9 px-4 cursor-pointer"
                >
                  {isMapping ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Link2 className="h-4 w-4" />
                  )}
                  Save Mapping
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL 3: Unmap Confirmation Dialog */}
      {unmapQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-amber-200 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-amber-100 flex items-center gap-3 bg-amber-50/50">
              <div className="p-2 rounded-full bg-amber-100 text-amber-700">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#131b2e]">Unmap QR Code</h3>
                <p className="text-[11px] text-amber-700">Confirm dissociation from book</p>
              </div>
            </div>

            <div className="p-4 space-y-3">
              <p className="text-xs text-[#505f76] leading-relaxed">
                Are you sure you want to unmap QR code{" "}
                <span className="font-mono font-bold text-[#004ac6]">{unmapQr.code}</span> from Book{" "}
                <span className="font-bold text-[#131b2e]">"{unmapQr.book?.title || "Book"}"</span>?
              </p>
              <p className="text-[11px] text-zinc-400">
                The physical code will remain registered in the system as <span className="font-bold text-amber-600">UNMAPPED</span> and can be assigned to another textbook later.
              </p>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#c3c6d7]/20">
                <Button
                  variant="ghost"
                  onClick={() => setUnmapQr(null)}
                  className="text-xs font-semibold text-[#505f76]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmUnmap}
                  disabled={isUnmapping}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold gap-2 h-9 px-4 cursor-pointer"
                >
                  {isUnmapping ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Unlink className="h-4 w-4" />
                  )}
                  Confirm Unmap
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
