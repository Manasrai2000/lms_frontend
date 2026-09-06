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

interface FilterOption {
  id: number | string;
  name: string;
}

export default function BulkGenerateQRPage() {
  const router = useRouter();

  // Books list & state
  const [books, setBooks] = useState<BookCatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Master Filter Options
  const [classesList, setClassesList] = useState<FilterOption[]>([]);
  const [subjectsList, setSubjectsList] = useState<FilterOption[]>([]);
  const [languagesList, setLanguagesList] = useState<FilterOption[]>([]);

  // Filter selections
  const [selectedClassId, setSelectedClassId] = useState<string>("all");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("all");
  const [selectedLanguageId, setSelectedLanguageId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [onlyUnmapped, setOnlyUnmapped] = useState<boolean>(false);

  // Multi-selection state
  const [selectedBookIds, setSelectedBookIds] = useState<number[]>([]);

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
          qrApi.getList({ limit: 500, status: "ACTIVE" }),
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
            activeQrCode: activeQr ? activeQr.code : undefined,
          };
        });

        setBooks(mappedBooks);
        if (showToast) toast.success("Book catalog refreshed successfully!");
      } catch (err) {
        console.error("Failed to load catalog books:", err);
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

  // Filter books in view by "only unmapped" toggle
  const visibleBooks = books.filter((b) => {
    if (onlyUnmapped && b.hasActiveQr) return false;
    return true;
  });

  // Checkbox handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBookIds(visibleBooks.map((b) => b.id));
    } else {
      setSelectedBookIds([]);
    }
  };

  const handleToggleSelectBook = (id: number) => {
    setSelectedBookIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Bulk Generation Execution
  const handleExecuteBulkGenerate = async () => {
    if (selectedBookIds.length === 0) {
      toast.error("Please select at least one book to generate QR codes");
      return;
    }

    try {
      setIsProcessing(true);
      const res = await qrApi.bulkGenerate(selectedBookIds);
      const resultData = res.data || res;
      setBulkResults(resultData);
      toast.success(
        `Batch completed! Generated: ${resultData.generated}, Skipped: ${resultData.skipped}`
      );
      // Refresh list to update status badges
      fetchCatalogBooks();
    } catch (err: any) {
      console.error("Bulk generate error:", err);
      toast.error(err?.response?.data?.message || "Failed to execute bulk QR generation");
    } finally {
      setIsProcessing(false);
    }
  };

  const isAllSelected =
    visibleBooks.length > 0 && selectedBookIds.length === visibleBooks.length;

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#c3c6d7]/30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#131b2e]">Bulk QR Code Generator</h1>
            <p className="text-xs text-[#505f76] mt-0.5">
              Batch generate QR codes for multiple books at once with automatic duplicate prevention
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

          {/* Search Input */}
          <div>
            <label className="block text-[11px] font-bold text-[#505f76] mb-1">Book Title Search</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-[#c3c6d7] rounded-lg focus:outline-none focus:border-[#004ac6] bg-[#faf8ff]"
              />
            </div>
          </div>
        </div>

        {/* Toggle option */}
        <div className="flex flex-wrap items-center justify-between border-t border-[#c3c6d7]/20 pt-3 gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={onlyUnmapped}
              onChange={(e) => setOnlyUnmapped(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 text-[#004ac6] focus:ring-[#004ac6]"
            />
            <span className="text-xs font-semibold text-[#131b2e]">
              Show only books without an active QR code
            </span>
          </label>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchCatalogBooks(true)}
            disabled={isRefreshing || isLoading}
            className="h-8 px-2.5 text-xs text-[#004ac6] hover:bg-[#eaedff] cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh List
          </Button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-[#c3c6d7]/30 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#004ac6]" />
            <p className="text-xs font-semibold text-[#505f76]">Loading textbook catalog...</p>
          </div>
        ) : visibleBooks.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <BookOpen className="h-8 w-8 text-zinc-300" />
            <p className="text-sm font-bold text-[#131b2e]">No Books Found</p>
            <p className="text-xs text-[#505f76] max-w-sm">
              No books match the selected filters or search query. Try adjusting your filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#faf8ff] border-b border-[#c3c6d7]/30 text-[#505f76] font-semibold">
                  <th className="py-3 px-4 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="h-4 w-4 rounded border-zinc-300 text-[#004ac6] focus:ring-[#004ac6]"
                    />
                  </th>
                  <th className="py-3 px-4">Book Title</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">QR Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c3c6d7]/20 text-[#131b2e]">
                {visibleBooks.map((b) => {
                  const isChecked = selectedBookIds.includes(b.id);
                  return (
                    <tr
                      key={b.id}
                      onClick={() => handleToggleSelectBook(b.id)}
                      className={`cursor-pointer transition-colors ${
                        isChecked ? "bg-[#eaedff]/40" : "hover:bg-[#faf8ff]"
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelectBook(b.id)}
                          className="h-4 w-4 rounded border-zinc-300 text-[#004ac6] focus:ring-[#004ac6]"
                        />
                      </td>

                      <td className="py-3.5 px-4 font-bold text-[#131b2e]">
                        {b.title}
                      </td>

                      <td className="py-3.5 px-4 text-zinc-600 font-semibold">
                        {b.class || "—"}
                      </td>

                      <td className="py-3.5 px-4 text-zinc-600 font-semibold">
                        {b.subject || "—"}
                      </td>

                      <td className="py-3.5 px-4">
                        {b.hasActiveQr ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" />
                            Has QR ({b.activeQrCode})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
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

      {/* Sticky Selection & Execution Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#c3c6d7]/40 shadow-xl p-4 lg:pl-72 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-[#131b2e]">
            Selected: <span className="text-[#004ac6] text-sm font-black">{selectedBookIds.length}</span> books
          </span>
          {selectedBookIds.length > 0 && (
            <button
              onClick={() => setSelectedBookIds([])}
              className="text-[11px] font-semibold text-zinc-400 hover:text-zinc-600 underline"
            >
              Clear Selection
            </button>
          )}
        </div>

        <Button
          onClick={handleExecuteBulkGenerate}
          disabled={selectedBookIds.length === 0 || isProcessing}
          className="bg-[#004ac6] hover:bg-[#003899] text-white font-semibold text-xs h-10 px-6 rounded-xl gap-2 shadow-sm cursor-pointer"
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Generate QRs for {selectedBookIds.length} Selected Books
        </Button>
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
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-600"
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
                        <th className="py-2 px-3">Book Title</th>
                        <th className="py-2 px-3">Status</th>
                        <th className="py-2 px-3">Assigned Code</th>
                        <th className="py-2 px-3">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#c3c6d7]/20 text-[#131b2e]">
                      {bulkResults.results.map((r, idx) => (
                        <tr key={idx} className="hover:bg-[#faf8ff]">
                          <td className="py-2 px-3 font-semibold">{r.bookTitle}</td>
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
                className="bg-[#004ac6] hover:bg-[#003899] text-white text-xs font-semibold px-5 h-9 rounded-xl cursor-pointer"
              >
                Done / View in QR List
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
