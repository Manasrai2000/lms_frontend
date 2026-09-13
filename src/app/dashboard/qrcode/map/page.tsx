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
  Video,
  Play,
  Layers,
  Film,
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

interface ChapterOption {
  id: number | string;
  title: string;
}

interface VideoOption {
  id: number | string;
  title: string;
  videoUrl: string;
  duration?: string | null;
  chapterId?: number | string | null;
  chapterTitle?: string | null;
}

export default function MapExistingQRPage() {
  const router = useRouter();

  // Step state: 1 = Lookup, 2 = Select Target & Map, 3 = Success Summary
  const [step, setStep] = useState<number>(1);

  // Target Type Toggle in Step 2: BOOK | VIDEO
  const [mapTargetType, setMapTargetType] = useState<"BOOK" | "VIDEO">("BOOK");

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

  // Book Selection state (Option A)
  const [booksList, setBooksList] = useState<BookOption[]>([]);
  const [isLoadingBooks, setIsLoadingBooks] = useState<boolean>(false);
  const [bookSearchQuery, setBookSearchQuery] = useState<string>("");
  const [selectedBook, setSelectedBook] = useState<BookOption | null>(null);

  // Video Selection state (Option B: Book -> Chapter -> Video)
  const [selectedVideoBook, setSelectedVideoBook] = useState<BookOption | null>(null);
  const [chaptersList, setChaptersList] = useState<ChapterOption[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<string>("all");
  const [videosList, setVideosList] = useState<VideoOption[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState<boolean>(false);
  const [videoSearchQuery, setVideoSearchQuery] = useState<string>("");
  const [selectedVideo, setSelectedVideo] = useState<VideoOption | null>(null);

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

  // When selectedVideoBook changes, fetch its chapters and videos
  useEffect(() => {
    const currentBook = selectedVideoBook;
    if (!currentBook) {
      setChaptersList([]);
      setVideosList([]);
      setSelectedVideo(null);
      return;
    }

    const targetBookId = currentBook.id;

    async function loadChaptersAndVideos() {
      try {
        setIsLoadingVideos(true);
        setSelectedVideo(null);
        setSelectedChapterId("all");

        const [chRes, vidRes] = await Promise.allSettled([
          api.get("/v1/chapters", { params: { bookId: targetBookId, limit: 200 } })
            .catch(() => api.get("/api/v1/chapters", { params: { bookId: targetBookId, limit: 200 } }))
            .catch(() => ({ data: [] })),
          api.get("/v1/videos", { params: { bookId: targetBookId, limit: 200 } })
            .catch(() => api.get("/api/v1/videos", { params: { bookId: targetBookId, limit: 200 } }))
            .catch(() => ({ data: [] })),
        ]);

        if (chRes.status === "fulfilled" && chRes.value?.data) {
          const arr = chRes.value.data.data || (Array.isArray(chRes.value.data) ? chRes.value.data : []);
          setChaptersList(arr.map((c: any) => ({
            id: c.id ?? c._id,
            title: c.title || "Chapter",
          })));
        }

        if (vidRes.status === "fulfilled" && vidRes.value?.data) {
          const arr = vidRes.value.data.data || vidRes.value.data.videos || (Array.isArray(vidRes.value.data) ? vidRes.value.data : []);
          setVideosList(arr.map((v: any) => ({
            id: v.id ?? v._id,
            title: v.title || "Untitled Video",
            videoUrl: v.videoUrl || "",
            duration: v.duration || null,
            chapterId: v.chapterId || null,
            chapterTitle: v.chapterTitle || null,
          })));
        }
      } catch (err) {
        console.error("Error loading video relations:", err);
      } finally {
        setIsLoadingVideos(false);
      }
    }

    loadChaptersAndVideos();
  }, [selectedVideoBook]);

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
            targetType: match.targetType,
            book: match.book || undefined,
            video: match.video || undefined,
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

    if (mapTargetType === "BOOK" && !selectedBook) {
      toast.error("Please select a book to map to this QR code");
      return;
    }

    if (mapTargetType === "VIDEO" && !selectedVideo) {
      toast.error("Please select a video to map to this QR code");
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
      if (mapTargetType === "BOOK") {
        if (lookupOutcome === "ALREADY_ACTIVE") {
          res = await qrApi.remapToBook(targetId, selectedBook!.id);
          toast.success(`QR remapped to "${selectedBook!.title}"!`);
        } else {
          res = await qrApi.mapToBook(targetId, selectedBook!.id);
          toast.success(`QR code mapped to "${selectedBook!.title}" successfully!`);
        }
      } else {
        // Option B: Map to Video
        res = await qrApi.mapToVideo(targetId, selectedVideo!.id);
        toast.success(`QR code mapped to video "${selectedVideo!.title}" successfully!`);
      }

      const finalData = res.data || res;
      setMappedResult(finalData);
      setStep(3);
    } catch (err: any) {
      console.error("Mapping error:", err);
      toast.error(err?.response?.data?.message || "Failed to map QR code");
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
    setSelectedVideoBook(null);
    setSelectedVideo(null);
    setMappedResult(null);
  };

  // Filtered books list for Option A
  const filteredBooks = booksList.filter((b) => {
    const q = bookSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      b.title.toLowerCase().includes(q) ||
      (b.class && b.class.toLowerCase().includes(q)) ||
      (b.subject && b.subject.toLowerCase().includes(q))
    );
  });

  // Filtered videos list for Option B
  const filteredVideos = videosList.filter((v) => {
    if (selectedChapterId !== "all" && String(v.chapterId) !== String(selectedChapterId)) {
      return false;
    }
    const q = videoSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return v.title.toLowerCase().includes(q);
  });

  return (
    <div className="max-w-3xl mx-auto space-y-4 md:space-y-5">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-white p-4 md:p-5 rounded-2xl border border-[#c3c6d7]/30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#004ac6]/10 text-[#004ac6]">
            <Link2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#131b2e]">Map Physical QR Code</h1>
            <p className="text-xs text-[#505f76] mt-0.5">
              Link a pre-printed physical QR sticker to a <b>Textbook</b> or direct <b>Video Lesson</b>
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

      {/* Stepper Wizard Indicator */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white rounded-xl border border-[#c3c6d7]/30 shadow-sm text-xs font-semibold">
        <div className="flex items-center gap-2">
          <span
            className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-xs ${
              step >= 1 ? "bg-[#004ac6] text-white" : "bg-zinc-100 text-zinc-500"
            }`}
          >
            1
          </span>
          <span className={step === 1 ? "text-[#004ac6] font-bold" : "text-[#505f76]"}>
            Lookup / Scan Code
          </span>
        </div>

        <div className="h-0.5 w-12 bg-zinc-200" />

        <div className="flex items-center gap-2">
          <span
            className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-xs ${
              step >= 2 ? "bg-[#004ac6] text-white" : "bg-zinc-100 text-zinc-500"
            }`}
          >
            2
          </span>
          <span className={step === 2 ? "text-[#004ac6] font-bold" : "text-[#505f76]"}>
            Select Target Item
          </span>
        </div>

        <div className="h-0.5 w-12 bg-zinc-200" />

        <div className="flex items-center gap-2">
          <span
            className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-xs ${
              step === 3 ? "bg-emerald-600 text-white" : "bg-zinc-100 text-zinc-500"
            }`}
          >
            3
          </span>
          <span className={step === 3 ? "text-emerald-700 font-bold" : "text-[#505f76]"}>
            Confirmation
          </span>
        </div>
      </div>

      {/* STEP 1: Enter / Scan QR Code */}
      {step === 1 && (
        <div className="bg-white p-4 md:p-5 rounded-2xl border border-[#c3c6d7]/30 shadow-sm space-y-4">
          <div>
            <h2 className="text-sm font-bold text-[#131b2e]">Step 1: Enter Physical QR Code</h2>
            <p className="text-xs text-[#505f76] mt-0.5">
              Enter the string printed under the physical QR sticker (or scan using your barcode reader).
            </p>
          </div>

          <form onSubmit={handleLookup} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#131b2e]">
                QR Code String <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <QrCode className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="e.g. BK-98127391 or VD-4F123C"
                  value={qrCodeInput}
                  onChange={(e) => setQrCodeInput(e.target.value.toUpperCase())}
                  className="w-full pl-11 pr-4 py-3 text-sm font-mono font-bold tracking-wider uppercase border border-[#c3c6d7] rounded-xl focus:outline-none focus:border-[#004ac6] bg-[#faf8ff]"
                  autoFocus
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLookingUp || !qrCodeInput.trim()}
              className="w-full bg-[#004ac6] hover:bg-[#003899] text-white font-semibold text-xs h-10 rounded-xl gap-2 cursor-pointer shadow-sm"
            >
              {isLookingUp ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying Code in Registry...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Check QR Code Status
                </>
              )}
            </Button>
          </form>

          {/* Lookup Outcomes Presentation */}
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
                  Register Code & Proceed to Map
                </Button>
              </div>
            </div>
          )}

          {lookupOutcome === "ALREADY_ACTIVE" && existingQrItem && (
            <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl space-y-3 animate-in fade-in">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-900">QR Already Active</p>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    This code is currently active and linked to:{" "}
                    <span className="font-bold text-[#131b2e]">
                      {existingQrItem.video?.title || existingQrItem.book?.title || "Existing Item"}
                    </span>.
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
                  Remap to Different Target
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: Select Target Item (Book or Video) */}
      {step === 2 && (
        <div className="bg-white p-4 md:p-5 rounded-2xl border border-[#c3c6d7]/30 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#c3c6d7]/20 pb-4">
            <div>
              <h2 className="text-sm font-bold text-[#131b2e]">Step 2: Select Item to Map</h2>
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
              className="text-xs text-[#505f76] hover:text-[#131b2e] cursor-pointer"
            >
              Change Code
            </Button>
          </div>

          {/* Option A / Option B Segment Toggle */}
          <div className="grid grid-cols-2 gap-3 p-1 bg-[#faf8ff] border border-[#c3c6d7]/40 rounded-xl">
            <button
              type="button"
              onClick={() => setMapTargetType("BOOK")}
              className={`py-2.5 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                mapTargetType === "BOOK"
                  ? "bg-[#004ac6] text-white shadow-xs"
                  : "text-[#505f76] hover:text-[#131b2e]"
              }`}
            >
              <BookOpen className="h-4 w-4" />
              <span>Option A: Map to Book</span>
            </button>

            <button
              type="button"
              onClick={() => setMapTargetType("VIDEO")}
              className={`py-2.5 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                mapTargetType === "VIDEO"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "text-[#505f76] hover:text-[#131b2e]"
              }`}
            >
              <Video className="h-4 w-4" />
              <span>Option B: Map to Video</span>
            </button>
          </div>

          {/* OPTION A: BOOK SELECTOR */}
          {mapTargetType === "BOOK" && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-[#131b2e]">
                Search & Select Textbook
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

              {isLoadingBooks ? (
                <div className="p-4 text-center flex flex-col items-center justify-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-[#004ac6]" />
                  <p className="text-xs text-[#505f76]">Loading textbook catalog...</p>
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto border border-[#c3c6d7]/40 rounded-xl divide-y divide-[#c3c6d7]/20 custom-scrollbar">
                  {filteredBooks.length === 0 ? (
                    <div className="p-4 text-center text-xs text-[#505f76]">
                      No matching books found.
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

              {/* Selected Book Preview */}
              {selectedBook && (
                <div className="bg-[#faf8ff] p-3.5 sm:p-4 rounded-xl border border-[#004ac6]/30 flex items-center justify-between mt-3">
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
                    className="bg-[#004ac6] hover:bg-[#003899] text-white font-semibold text-xs h-9 px-4 rounded-xl gap-2 cursor-pointer shadow-sm"
                  >
                    {isSubmittingMap ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Confirm Mapping
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* OPTION B: VIDEO SELECTOR */}
          {mapTargetType === "VIDEO" && (
            <div className="space-y-4">
              {/* Step 1: Select Book for Video */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#131b2e]">
                  1. Select Connected Textbook:
                </label>
                <select
                  value={selectedVideoBook?.id ? String(selectedVideoBook.id) : ""}
                  onChange={(e) => {
                    const match = booksList.find((b) => String(b.id) === e.target.value);
                    setSelectedVideoBook(match || null);
                  }}
                  className="w-full p-2.5 text-xs bg-[#faf8ff] border border-[#c3c6d7] rounded-xl focus:outline-none focus:border-[#004ac6] font-semibold text-[#131b2e] cursor-pointer"
                >
                  <option value="">-- Choose Book --</option>
                  {booksList.map((b) => (
                    <option key={b.id} value={String(b.id)}>
                      {b.title} {b.class ? `(${b.class})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Filter by Chapter */}
              {selectedVideoBook && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#131b2e]">
                    2. Chapter (Optional filter):
                  </label>
                  <select
                    value={selectedChapterId}
                    onChange={(e) => setSelectedChapterId(e.target.value)}
                    className="w-full p-2.5 text-xs bg-[#faf8ff] border border-[#c3c6d7] rounded-xl focus:outline-none focus:border-[#004ac6] font-semibold text-[#131b2e] cursor-pointer"
                  >
                    <option value="all">All Chapters</option>
                    {chaptersList.map((ch) => (
                      <option key={ch.id} value={String(ch.id)}>
                        {ch.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Step 3: Select Video */}
              {selectedVideoBook && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#131b2e]">
                    3. Select Video Lesson:
                  </label>

                  {isLoadingVideos ? (
                    <div className="p-4 text-center text-xs text-[#505f76]">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-[#004ac6] mb-1" />
                      Loading videos...
                    </div>
                  ) : filteredVideos.length === 0 ? (
                    <div className="p-4 text-center text-xs text-[#505f76] border border-dashed rounded-xl bg-zinc-50">
                      No video lectures found for this textbook.
                    </div>
                  ) : (
                    <div className="max-h-56 overflow-y-auto border border-[#c3c6d7]/40 rounded-xl divide-y divide-[#c3c6d7]/20 custom-scrollbar">
                      {filteredVideos.map((vid) => {
                        const isSelected = selectedVideo?.id === vid.id;
                        return (
                          <div
                            key={vid.id}
                            onClick={() => setSelectedVideo(vid)}
                            className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-rose-50 border-l-4 border-l-rose-600"
                                : "hover:bg-[#faf8ff]"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                                <Play className="h-4 w-4 fill-current" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-[#131b2e]">{vid.title}</p>
                                {vid.duration && (
                                  <p className="text-[10px] text-[#505f76]">Duration: {vid.duration}</p>
                                )}
                              </div>
                            </div>
                            {isSelected && (
                              <div className="h-6 w-6 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0">
                                <Check className="h-3.5 w-3.5" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Selected Video Preview */}
              {selectedVideo && (
                <div className="bg-rose-50/50 p-3.5 sm:p-4 rounded-xl border border-rose-200 flex items-center justify-between mt-3">
                  <div>
                    <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">
                      Selected Video
                    </span>
                    <p className="text-sm font-bold text-[#131b2e] mt-0.5">{selectedVideo.title}</p>
                    <p className="text-xs text-[#505f76]">{selectedVideoBook?.title}</p>
                  </div>

                  <Button
                    onClick={handleConfirmMapping}
                    disabled={isSubmittingMap}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs h-9 px-4 rounded-xl gap-2 cursor-pointer shadow-sm"
                  >
                    {isSubmittingMap ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Confirm Mapping
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* STEP 3: Success Presentation */}
      {step === 3 && mappedResult && (
        <div className="bg-white p-4 md:p-5 rounded-2xl border border-emerald-200 shadow-sm text-center space-y-4 md:space-y-5 animate-in fade-in duration-200">
          <div className="inline-flex p-2.5 rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-[#131b2e]">Mapping Completed Successfully!</h2>
            <p className="text-xs text-[#505f76] mt-1">
              Physical QR Code is now linked to {mapTargetType === "VIDEO" ? "video lecture" : "textbook material"} in the LMS.
            </p>
          </div>

          {/* Mapped Card Details */}
          <div className="max-w-md mx-auto bg-[#faf8ff] p-4 rounded-xl border border-[#c3c6d7]/40 text-left space-y-3.5">
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
              <p className="text-[10px] font-bold text-[#505f76]">
                MAPPED {mapTargetType === "VIDEO" ? "VIDEO LESSON" : "BOOK"}
              </p>
              <p className="text-sm font-bold text-[#131b2e] mt-0.5">
                {mapTargetType === "VIDEO"
                  ? (selectedVideo?.title || "Video Lesson")
                  : (mappedResult.book?.title || selectedBook?.title || "Textbook")}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleReset}
              className="border-[#c3c6d7] text-[#131b2e] text-xs font-semibold h-9 px-4 cursor-pointer"
            >
              Map Another QR
            </Button>
            <Link href="/dashboard/qrcode">
              <Button className="bg-[#004ac6] hover:bg-[#003899] text-white text-xs font-semibold h-9 px-4 cursor-pointer">
                View All QR Codes
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
