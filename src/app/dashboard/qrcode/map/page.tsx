"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Link2,
  Search,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  BookOpen,
  ArrowRight,
  RefreshCw,
  PlusCircle,
  Check,
  ChevronLeft,
  Loader2,
  Copy,
  Printer,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import qrApi from "@/lib/api/qrcode";
import { QRCodeItem, QRCodeBook } from "@/types/qrcode";

interface BookOption {
  id: number | string;
  title: string;
  class?: string;
  subject?: string;
  coverImage?: string | null;
  description?: string | null;
}

export default function MapExistingQRPage() {
  const router = useRouter();

  // Step state: 1 = Lookup, 2 = Select Book & Map, 3 = Success Summary
  const [step, setStep] = useState<number>(1);

  // Input code
  const [qrCodeInput, setQrCodeInput] = useState<string>("");

  // Lookup result state
  const [isLookingUp, setIsLookingUp] = useState<boolean>(false);
  const [lookupOutcome, setLookupOutcome] = useState<
    "NOT_REGISTERED" | "UNMAPPED" | "ALREADY_ACTIVE" | null
  >(null);
  const [existingQrItem, setExistingQrItem] = useState<QRCodeItem | null>(null);

  // Auto-registration loading state
  const [isRegistering, setIsRegistering] = useState<boolean>(false);

  // Book Selection state
  const [booksList, setBooksList] = useState<BookOption[]>([]);
  const [isLoadingBooks, setIsLoadingBooks] = useState<boolean>(false);
  const [bookSearchQuery, setBookSearchQuery] = useState<string>("");
  const [selectedBook, setSelectedBook] = useState<BookOption | null>(null);

  // Mapping loading state
  const [isSubmittingMap, setIsSubmittingMap] = useState<boolean>(false);

  // Final success result state
  const [mappedResult, setMappedResult] = useState<QRCodeItem | null>(null);

  // Fetch available books on mount
  useEffect(() => {
    async function loadBooks() {
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
            coverImage: b.coverImage || null,
            description: b.description || null,
          }))
        );
      } catch (err) {
        console.error("Error loading books list:", err);
      } finally {
        setIsLoadingBooks(false);
      }
    }
    loadBooks();
  }, []);

  // 1. Step 1: Lookup QR Code
  const handleLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCode = qrCodeInput.trim();
    if (!cleanCode) {
      toast.error("Please enter or scan a physical QR code");
      return;
    }

    try {
      setIsLookingUp(true);
      setLookupOutcome(null);
      setExistingQrItem(null);

      // Verify QR Code
      let res;
      try {
        res = await qrApi.verify(cleanCode);
      } catch {
        // Fallback search in list
        const listRes = await qrApi.getList({ search: cleanCode, limit: 1 });
        const match = (listRes.data || []).find(
          (q) => q.code.toLowerCase() === cleanCode.toLowerCase()
        );
        if (match) {
          res = {
            valid: match.status === "ACTIVE",
            status: match.status,
            code: match.code,
            type: match.type,
            book: match.book || undefined,
          };
          setExistingQrItem(match);
        } else {
          res = { valid: false, status: "NOT_FOUND", reason: "QR_NOT_FOUND" };
        }
      }

      if (res.status === "NOT_FOUND" || res.reason === "QR_NOT_FOUND") {
        setLookupOutcome("NOT_REGISTERED");
      } else if (res.status === "UNMAPPED") {
        setLookupOutcome("UNMAPPED");
        if (!existingQrItem) {
          const itemRes = await qrApi.getList({ search: cleanCode, limit: 1 });
          if (itemRes.data && itemRes.data[0]) setExistingQrItem(itemRes.data[0]);
        }
        setStep(2);
      } else if (res.status === "ACTIVE") {
        setLookupOutcome("ALREADY_ACTIVE");
        if (!existingQrItem) {
          const itemRes = await qrApi.getList({ search: cleanCode, limit: 1 });
          if (itemRes.data && itemRes.data[0]) setExistingQrItem(itemRes.data[0]);
        }
      }
    } catch (err: any) {
      console.error("Lookup error:", err);
      toast.error("Failed to verify QR code status");
    } finally {
      setIsLookingUp(false);
    }
  };

  // 2. Case A: Register New Physical QR Code & Proceed to Step 2
  const handleRegisterAndContinue = async () => {
    const cleanCode = qrCodeInput.trim();
    try {
      setIsRegistering(true);
      const res = await qrApi.registerExisting(cleanCode, "EXISTING");
      const newItem = res.data || res;
      setExistingQrItem(newItem);
      toast.success(`Physical QR code "${cleanCode}" registered into system!`);
      setLookupOutcome("UNMAPPED");
      setStep(2);
    } catch (err: any) {
      console.error("Register error:", err);
      toast.error(err?.response?.data?.message || "Failed to register QR code");
    } finally {
      setIsRegistering(false);
    }
  };

  // 3. Step 2: Confirm Mapping
  const handleConfirmMapping = async () => {
    if (!existingQrItem && !qrCodeInput.trim()) {
      toast.error("Missing QR code record");
      return;
    }
    if (!selectedBook) {
      toast.error("Please select a book to map to this QR code");
      return;
    }

    try {
      setIsSubmittingMap(true);
      let targetId = existingQrItem?.id;

      // If somehow id is missing, fetch by code
      if (!targetId) {
        const itemRes = await qrApi.getList({ search: qrCodeInput.trim(), limit: 1 });
        if (itemRes.data && itemRes.data[0]) {
          targetId = itemRes.data[0].id;
        } else {
          toast.error("Could not locate registered QR ID");
          return;
        }
      }

      let res;
      if (lookupOutcome === "ALREADY_ACTIVE") {
        res = await qrApi.remapToBook(targetId, selectedBook.id);
        toast.success(`QR remapped to "${selectedBook.title}"!`);
      } else {
        res = await qrApi.mapToBook(targetId, selectedBook.id);
        toast.success(`QR code mapped to "${selectedBook.title}" successfully!`);
      }

      const finalData = res.data || res;
      setMappedResult(finalData);
      setStep(3);
    } catch (err: any) {
      console.error("Mapping error:", err);
      toast.error(err?.response?.data?.message || "Failed to map QR code to book");
    } finally {
      setIsSubmittingMap(false);
    }
  };

  // Reset form to map another QR
  const handleReset = () => {
    setStep(1);
    setQrCodeInput("");
    setLookupOutcome(null);
    setExistingQrItem(null);
    setSelectedBook(null);
    setMappedResult(null);
    setBookSearchQuery("");
  };

  // Filter books for selector
  const filteredBooks = booksList.filter((b) => {
    const q = bookSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      b.title.toLowerCase().includes(q) ||
      (b.class && b.class.toLowerCase().includes(q)) ||
      (b.subject && b.subject.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-[#c3c6d7]/30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Link2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#131b2e]">Map Existing Physical QR Code</h1>
            <p className="text-xs text-[#505f76] mt-0.5">
              Link physical stickers or printed book QR codes directly to textbook records
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

      {/* Progress Stepper */}
      <div className="bg-white p-4 rounded-xl border border-[#c3c6d7]/30 shadow-sm">
        <div className="flex items-center justify-between max-w-md mx-auto relative">
          {/* Step 1 Badge */}
          <div className="flex flex-col items-center gap-1 z-10">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${
                step >= 1
                  ? "bg-[#004ac6] text-white shadow-sm"
                  : "bg-zinc-100 text-zinc-400 border border-zinc-200"
              }`}
            >
              1
            </div>
            <span className="text-[11px] font-semibold text-[#131b2e]">Lookup Code</span>
          </div>

          {/* Line 1 */}
          <div
            className={`flex-1 h-0.5 mx-2 ${
              step >= 2 ? "bg-[#004ac6]" : "bg-zinc-200"
            }`}
          />

          {/* Step 2 Badge */}
          <div className="flex flex-col items-center gap-1 z-10">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${
                step >= 2
                  ? "bg-[#004ac6] text-white shadow-sm"
                  : "bg-zinc-100 text-zinc-400 border border-zinc-200"
              }`}
            >
              2
            </div>
            <span className="text-[11px] font-semibold text-[#131b2e]">Select Book</span>
          </div>

          {/* Line 2 */}
          <div
            className={`flex-1 h-0.5 mx-2 ${
              step >= 3 ? "bg-[#004ac6]" : "bg-zinc-200"
            }`}
          />

          {/* Step 3 Badge */}
          <div className="flex flex-col items-center gap-1 z-10">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${
                step === 3
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-zinc-100 text-zinc-400 border border-zinc-200"
              }`}
            >
              3
            </div>
            <span className="text-[11px] font-semibold text-[#131b2e]">Done</span>
          </div>
        </div>
      </div>

      {/* STEP 1: Enter / Scan QR Code */}
      {step === 1 && (
        <div className="bg-white p-6 rounded-2xl border border-[#c3c6d7]/30 shadow-sm space-y-6">
          <div>
            <h2 className="text-sm font-bold text-[#131b2e]">Step 1: Enter Physical QR Code</h2>
            <p className="text-xs text-[#505f76] mt-0.5">
              Enter the string printed under the physical QR sticker (or scan using your barcode reader).
            </p>
          </div>

          <form onSubmit={handleLookup} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#131b2e] mb-1">
                QR Code Payload / Sticker Text
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. BOOK-PHYSICAL-928374 or BK-8F72K91X"
                  value={qrCodeInput}
                  onChange={(e) => {
                    setQrCodeInput(e.target.value);
                    setLookupOutcome(null);
                  }}
                  className="w-full pl-10 pr-4 py-3 text-sm font-mono border border-[#c3c6d7] rounded-xl focus:outline-none focus:border-[#004ac6] bg-[#faf8ff]"
                  autoFocus
                />
                <QrCode className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
              </div>
            </div>

            <Button
              type="submit"
              disabled={!qrCodeInput.trim() || isLookingUp}
              className="bg-[#004ac6] hover:bg-[#003899] text-white font-semibold text-xs h-10 px-6 rounded-xl gap-2 shadow-sm cursor-pointer"
            >
              {isLookingUp ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Lookup QR Status
            </Button>
          </form>

          {/* Outcome Banners */}
          {lookupOutcome === "NOT_REGISTERED" && (
            <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-3 animate-in fade-in">
              <div className="flex items-start gap-3">
                <PlusCircle className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-indigo-900">QR Code Not Yet Registered</p>
                  <p className="text-[11px] text-indigo-700 mt-0.5">
                    This physical code "<span className="font-mono font-bold">{qrCodeInput.trim()}</span>" is not in the system registry yet.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-indigo-200/60 flex justify-end">
                <Button
                  onClick={handleRegisterAndContinue}
                  disabled={isRegistering}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-9 px-4 rounded-lg gap-2 cursor-pointer"
                >
                  {isRegistering ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                  Register Code & Select Book
                </Button>
              </div>
            </div>
          )}

          {lookupOutcome === "ALREADY_ACTIVE" && existingQrItem && (
            <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl space-y-3 animate-in fade-in">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-900">QR Already Mapped to a Book</p>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    This code is currently active and linked to:{" "}
                    <span className="font-bold text-[#131b2e]">"{existingQrItem.book?.title || "Book"}"</span>.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-amber-200/60 flex items-center justify-end gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setLookupOutcome(null)}
                  className="text-xs font-semibold text-amber-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => setStep(2)}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs h-9 px-4 rounded-lg gap-2 cursor-pointer"
                >
                  <RefreshCw className="h-4 w-4" />
                  Remap to Different Book
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: Select Book & Confirm Mapping */}
      {step === 2 && (
        <div className="bg-white p-6 rounded-2xl border border-[#c3c6d7]/30 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-[#c3c6d7]/20 pb-4">
            <div>
              <h2 className="text-sm font-bold text-[#131b2e]">Step 2: Select Book to Map</h2>
              <p className="text-xs text-[#505f76] mt-0.5">
                Mapping QR Code:{" "}
                <span className="font-mono font-bold text-[#004ac6]">
                  {existingQrItem?.code || qrCodeInput.trim()}
                </span>
              </p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep(1)}
              className="text-xs text-[#505f76] hover:text-[#131b2e]"
            >
              Change Code
            </Button>
          </div>

          {/* Book Search Combobox */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-[#131b2e]">
              Search & Select Book Catalog
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Filter by title, class, or subject..."
                value={bookSearchQuery}
                onChange={(e) => setBookSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-xs border border-[#c3c6d7] rounded-xl focus:outline-none focus:border-[#004ac6] bg-[#faf8ff]"
              />
            </div>

            {/* Book Selector List */}
            {isLoadingBooks ? (
              <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-[#004ac6]" />
                <p className="text-xs text-[#505f76]">Loading textbook catalog...</p>
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto border border-[#c3c6d7]/40 rounded-xl divide-y divide-[#c3c6d7]/20 custom-scrollbar">
                {filteredBooks.length === 0 ? (
                  <div className="p-4 text-center text-xs text-[#505f76]">
                    No books match your query. Try a different search.
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
                              {b.class ? `Class: ${b.class}` : ""}{" "}
                              {b.subject ? `| Subject: ${b.subject}` : ""}
                            </p>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="h-6 w-6 rounded-full bg-[#004ac6] text-white flex items-center justify-center shrink-0">
                            <Check className="h-3.5 w-3.5" />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Selected Book Preview Card */}
          {selectedBook && (
            <div className="bg-[#faf8ff] p-4 rounded-xl border border-[#004ac6]/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#004ac6] uppercase tracking-wider">
                  Selected Book
                </span>
                <p className="text-sm font-bold text-[#131b2e] mt-0.5">{selectedBook.title}</p>
                <p className="text-xs text-[#505f76]">
                  {selectedBook.class ? `Class ${selectedBook.class}` : ""}{" "}
                  {selectedBook.subject ? `• ${selectedBook.subject}` : ""}
                </p>
              </div>

              <Button
                onClick={handleConfirmMapping}
                disabled={isSubmittingMap}
                className="bg-[#004ac6] hover:bg-[#003899] text-white font-semibold text-xs h-10 px-6 rounded-xl gap-2 cursor-pointer shadow-sm"
              >
                {isSubmittingMap ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Confirm Mapping
              </Button>
            </div>
          )}
        </div>
      )}

      {/* STEP 3: Success Presentation */}
      {step === 3 && mappedResult && (
        <div className="bg-white p-8 rounded-2xl border border-emerald-200 shadow-sm text-center space-y-6 animate-in fade-in duration-200">
          <div className="inline-flex p-3 rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-[#131b2e]">Mapping Completed Successfully!</h2>
            <p className="text-xs text-[#505f76] mt-1">
              Physical QR Code is now linked to textbook material in the LMS.
            </p>
          </div>

          {/* Mapped Card Details */}
          <div className="max-w-md mx-auto bg-[#faf8ff] p-6 rounded-2xl border border-[#c3c6d7]/40 text-left space-y-4">
            <div className="flex items-center justify-between border-b border-[#c3c6d7]/30 pb-3">
              <div>
                <p className="text-[10px] font-bold text-[#505f76]">QR CODE</p>
                <p className="font-mono text-sm font-black text-[#004ac6]">{mappedResult.code}</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                ACTIVE
              </span>
            </div>

            <div>
              <p className="text-[10px] font-bold text-[#505f76]">MAPPED BOOK</p>
              <p className="text-sm font-bold text-[#131b2e] mt-0.5">
                {mappedResult.book?.title || selectedBook?.title || "Textbook"}
              </p>
              <p className="text-xs text-[#505f76] mt-0.5">
                {mappedResult.book?.class || selectedBook?.class ? `Class: ${mappedResult.book?.class || selectedBook?.class}` : ""}{" "}
                {mappedResult.book?.subject || selectedBook?.subject ? `| Subject: ${mappedResult.book?.subject || selectedBook?.subject}` : ""}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-[#c3c6d7]/20">
            <Button
              onClick={handleReset}
              className="bg-[#004ac6] hover:bg-[#003899] text-white font-semibold text-xs h-9 px-5 rounded-xl cursor-pointer"
            >
              Map Another Physical QR
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/qrcode")}
              className="border-[#c3c6d7] text-[#131b2e] hover:bg-[#eaedff]/50 font-semibold text-xs h-9 px-5 rounded-xl cursor-pointer"
            >
              Go to QR Codes List
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
